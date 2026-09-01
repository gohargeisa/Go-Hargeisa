import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { LOYALTY_ACTIVITY_PAGE_SIZE } from "@/lib/loyalty/constants";
import {
  mapLoyaltyProgram,
  mapLoyaltyTier,
  mapLoyaltyMember,
  mapLoyaltyTransaction,
  mapLoyaltyReward,
  mapLoyaltyOffer,
  mapLoyaltyRedemption,
} from "@/lib/loyalty/mappers";
import { resolveTierProgress } from "@/lib/loyalty/helpers";
import type {
  LoyaltyContext,
  LoyaltyListingType,
  LoyaltyProgram,
  LoyaltyTier,
} from "@/lib/loyalty/types";

/**
 * Loyalty data layer — reusable across every partner. A program is addressed
 * by the platform's polymorphic (listing_type, listing_id); the customer
 * route resolves a listing SLUG to that pair. Today the only slugs that
 * resolve are `city_services` rows (that's where Flormar lives); adding
 * hotel/cafe/etc. support later is a change to `resolveListingBySlug` only.
 *
 * RLS does the gating: the anon-readable policies only expose a program (and
 * its tiers/rewards/offers) when `enabled = true`, so a disabled partner is
 * invisible here without any extra check.
 */

interface ListingIdentity {
  id: string;
  listingType: LoyaltyListingType;
  slug: string;
  name: string;
  logoUrl: string | null;
}

async function resolveListingBySlug(slug: string): Promise<ListingIdentity | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("city_services")
    .select("id, slug, name, logo_url, status")
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data || data.status !== "published") return null;
  return {
    id: data.id as string,
    listingType: "city_service",
    slug: data.slug as string,
    name: data.name as string,
    logoUrl: (data.logo_url as string | null) ?? null,
  };
}

async function fetchListingById(
  listingType: LoyaltyListingType,
  listingId: string
): Promise<ListingIdentity | null> {
  if (listingType !== "city_service") return null;
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("city_services")
    .select("id, slug, name, logo_url")
    .eq("id", listingId)
    .maybeSingle();
  if (!data) return null;
  return {
    id: data.id as string,
    listingType,
    slug: data.slug as string,
    name: data.name as string,
    logoUrl: (data.logo_url as string | null) ?? null,
  };
}

/** The enabled program for one listing, or null. Safe for anon callers. */
export async function getEnabledLoyaltyProgramForListing(
  listingType: LoyaltyListingType,
  listingId: string
): Promise<LoyaltyProgram | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("loyalty_programs")
    .select("*")
    .eq("listing_type", listingType)
    .eq("listing_id", listingId)
    .maybeSingle();
  if (error || !data) return null;
  const program = mapLoyaltyProgram(data);
  return program.enabled ? program : null;
}

async function getProgramTiers(programId: string): Promise<LoyaltyTier[]> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("loyalty_tiers")
    .select("*")
    .eq("program_id", programId)
    .eq("active", true)
    .order("sort_order", { ascending: true });
  return (data ?? []).map(mapLoyaltyTier).sort((a, b) => a.minPoints - b.minPoints);
}

/**
 * Everything the customer Rewards experience needs for one program, resolved
 * from a listing slug. Returns null when there is no ENABLED program for that
 * slug (route should 404). Member-specific fields are null/empty for a
 * signed-out visitor or someone who hasn't joined.
 */
export const getLoyaltyContextBySlug = cache(_getLoyaltyContextBySlug);

async function _getLoyaltyContextBySlug(
  slug: string,
  locale: string
): Promise<LoyaltyContext | null> {
  if (!isSupabaseConfigured()) return null;

  const listing = await resolveListingBySlug(slug);
  if (!listing) return null;

  const pub = createPublicClient();
  const program = await getEnabledLoyaltyProgramForListing(listing.listingType, listing.id);
  if (!program) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [tiers, rewardsRes, offersRes] = await Promise.all([
    getProgramTiers(program.id),
    pub
      .from("loyalty_rewards")
      .select("*")
      .eq("program_id", program.id)
      .eq("active", true)
      .order("sort_order", { ascending: true }),
    pub
      .from("loyalty_offers")
      .select("*")
      .eq("program_id", program.id)
      .eq("active", true)
      .order("sort_order", { ascending: true }),
  ]);

  const rewards = (rewardsRes.data ?? []).map(mapLoyaltyReward);
  const offers = (offersRes.data ?? []).map(mapLoyaltyOffer);

  let member = null;
  let transactions: LoyaltyContext["transactions"] = [];
  let hasMoreTransactions = false;
  let redemptions: LoyaltyContext["redemptions"] = [];

  if (user) {
    const { data: memberRow } = await supabase
      .from("loyalty_members")
      .select("*")
      .eq("program_id", program.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (memberRow) {
      member = mapLoyaltyMember(memberRow);
      const [txRes, redRes] = await Promise.all([
        supabase
          .from("loyalty_transactions")
          .select("*")
          .eq("member_id", member.id)
          .order("created_at", { ascending: false })
          .limit(LOYALTY_ACTIVITY_PAGE_SIZE + 1),
        supabase
          .from("loyalty_redemptions")
          .select("*")
          .eq("member_id", member.id)
          .order("created_at", { ascending: false })
          .limit(25),
      ]);
      const txRows = (txRes.data ?? []).map(mapLoyaltyTransaction);
      hasMoreTransactions = txRows.length > LOYALTY_ACTIVITY_PAGE_SIZE;
      transactions = txRows.slice(0, LOYALTY_ACTIVITY_PAGE_SIZE);
      redemptions = (redRes.data ?? []).map(mapLoyaltyRedemption);
    }
  }

  const lifetime = member?.lifetimePoints ?? 0;
  const { current, next } = resolveTierProgress(tiers, lifetime);

  return {
    program,
    listing: { slug: listing.slug, name: listing.name, logoUrl: listing.logoUrl },
    tiers,
    rewards,
    offers,
    member,
    currentTier: current,
    nextTier: next,
    transactions,
    hasMoreTransactions,
    redemptions,
  };
}

/** More activity rows for the "load more" control on the Rewards home. */
export async function getMemberTransactionsPage(
  memberId: string,
  offset: number,
  limit = LOYALTY_ACTIVITY_PAGE_SIZE
) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("loyalty_transactions")
    .select("*")
    .eq("member_id", memberId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  return (data ?? []).map(mapLoyaltyTransaction);
}

/**
 * Every loyalty membership the signed-in user holds, for the customer
 * dashboard tile. Only ENABLED programs (RLS-enforced on the program read).
 * Returns [] for a signed-out user.
 */
export async function getMyLoyaltyMemberships(): Promise<
  {
    member: ReturnType<typeof mapLoyaltyMember>;
    program: LoyaltyProgram;
    listing: ListingIdentity;
    currentTier: LoyaltyTier | null;
  }[]
> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: memberRows } = await supabase
    .from("loyalty_members")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active");

  const members = (memberRows ?? []).map(mapLoyaltyMember);
  if (members.length === 0) return [];

  const pub = createPublicClient();
  const { data: programRows } = await pub
    .from("loyalty_programs")
    .select("*")
    .in(
      "id",
      members.map((m) => m.programId)
    );
  const programs = (programRows ?? []).map(mapLoyaltyProgram).filter((p) => p.enabled);

  const out: {
    member: ReturnType<typeof mapLoyaltyMember>;
    program: LoyaltyProgram;
    listing: ListingIdentity;
    currentTier: LoyaltyTier | null;
  }[] = [];

  for (const program of programs) {
    const member = members.find((m) => m.programId === program.id);
    if (!member) continue;
    const listing = await fetchListingById(program.listingType, program.listingId);
    if (!listing) continue;
    let currentTier: LoyaltyTier | null = null;
    if (member.tierId) {
      const tiers = await getProgramTiers(program.id);
      currentTier = tiers.find((t) => t.id === member.tierId) ?? null;
    }
    out.push({ member, program, listing, currentTier });
  }
  return out;
}
