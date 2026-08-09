"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { accountVerifiedEmail } from "@/lib/email/templates";
import { logActivity } from "./activity";
import type { Locale } from "@/lib/i18n/config";
import type { BusinessListingType, OwnableListingType } from "@/types";

export interface BusinessClaimInput {
  listingType: BusinessListingType;
  listingId: string;
  fullName: string;
  email: string;
  phone?: string;
  message?: string;
}

/**
 * Public, anonymous-writable submission — see business_claims' "Anyone can
 * submit a business claim" INSERT policy (supabase/migrations/
 * 20260728000010_add_business_claims.sql). Captures the submitter's own
 * account (best-effort — claims can still be submitted signed out) so
 * approval has a real account to link to without an admin having to guess;
 * an admin can still resolve/override it manually at review time either way.
 */
export async function submitBusinessClaim(
  input: BusinessClaimInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.fullName.trim() || !input.email.trim()) {
    return { ok: false, error: "Name and email are required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("business_claims").insert({
    listing_type: input.listingType,
    listing_id: input.listingId,
    full_name: input.fullName.trim(),
    email: input.email.trim(),
    phone: input.phone?.trim() || null,
    message: input.message?.trim() || null,
    user_id: user?.id ?? null,
  } as never);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

const LISTING_TABLE: Record<OwnableListingType, "hotels" | "restaurants" | "cafes" | "services" | "city_services"> = {
  hotel: "hotels",
  restaurant: "restaurants",
  cafe: "cafes",
  service: "services",
  city_service: "city_services",
};

/** Only hotels/restaurants/cafes carry partner_status — services don't. */
const HAS_PARTNER_STATUS = new Set<BusinessListingType>(["hotel", "restaurant", "cafe"]);

async function assertOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "owner") throw new Error("Not authorized.");

  return { supabase, adminId: user.id };
}

export interface BusinessClaimRow {
  id: string;
  listingType: BusinessListingType;
  listingId: string;
  businessName: string;
  fullName: string;
  email: string;
  phone: string | null;
  message: string | null;
  status: "pending" | "approved" | "rejected";
  userId: string | null;
  createdAt: string;
  reviewedAt: string | null;
}

/** Admin-only. Resolves each claim's business name across the 4 listing
 * tables (a single claims row can point at any of them) in one batched
 * query per table rather than N+1. */
export async function getBusinessClaims(): Promise<BusinessClaimRow[]> {
  const { supabase } = await assertOwner();

  const { data: claims } = await supabase
    .from("business_claims")
    .select("*")
    .order("created_at", { ascending: false });

  const rows = (claims ?? []) as {
    id: string;
    listing_type: BusinessListingType;
    listing_id: string;
    full_name: string;
    email: string;
    phone: string | null;
    message: string | null;
    status: "pending" | "approved" | "rejected";
    user_id: string | null;
    created_at: string;
    reviewed_at: string | null;
  }[];

  const idsByTable = new Map<string, Set<string>>();
  for (const row of rows) {
    const table = LISTING_TABLE[row.listing_type];
    if (!idsByTable.has(table)) idsByTable.set(table, new Set());
    idsByTable.get(table)!.add(row.listing_id);
  }

  const namesById = new Map<string, string>();
  await Promise.all(
    Array.from(idsByTable.entries()).map(async ([table, ids]) => {
      const { data } = await supabase.from(table).select("id, name").in("id", Array.from(ids));
      for (const listing of (data ?? []) as { id: string; name: string }[]) {
        namesById.set(`${table}:${listing.id}`, listing.name);
      }
    })
  );

  return rows.map((row) => ({
    id: row.id,
    listingType: row.listing_type,
    listingId: row.listing_id,
    businessName: namesById.get(`${LISTING_TABLE[row.listing_type]}:${row.listing_id}`) ?? "Unknown listing",
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    message: row.message,
    status: row.status,
    userId: row.user_id,
    createdAt: row.created_at,
    reviewedAt: row.reviewed_at,
  }));
}

export interface UserSearchResult {
  id: string;
  email: string;
  fullName: string | null;
  role: "user" | "business_owner" | "owner";
}

/** Admin-only. `profiles` has no email column (it only lives in
 * auth.users), so matching/searching by email goes through the service-role
 * admin client. Fine at this project's user count — lists up to 200 users
 * and filters in memory rather than paginating. */
export async function searchUsersForLinking(query: string): Promise<UserSearchResult[]> {
  await assertOwner();
  const needle = query.trim().toLowerCase();
  if (!needle) return [];

  const supabase = await createClient();
  const admin = createAdminClient();

  const [{ data: authUsers }, { data: profiles }] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    supabase.from("profiles").select("id, full_name, role"),
  ]);

  const profileById = new Map(
    ((profiles ?? []) as { id: string; full_name: string | null; role: UserSearchResult["role"] }[]).map((p) => [p.id, p])
  );

  return (authUsers?.users ?? [])
    .map((u) => {
      const profile = profileById.get(u.id);
      return {
        id: u.id,
        email: u.email ?? "",
        fullName: profile?.full_name ?? null,
        role: profile?.role ?? "user",
      };
    })
    .filter((u) => u.email.toLowerCase().includes(needle) || (u.fullName ?? "").toLowerCase().includes(needle))
    .slice(0, 20);
}

/** Admin-only. Resolves one already-known user id's display name/email —
 * same admin-client email lookup as searchUsersForLinking, just for a
 * single id instead of a search. Used to show the currently-assigned owner
 * on a listing's edit form without re-running a search. */
export async function getUserDisplayInfo(userId: string): Promise<UserSearchResult | null> {
  await assertOwner();
  const supabase = await createClient();
  const admin = createAdminClient();

  const [{ data: authUser }, { data: profile }] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    supabase.from("profiles").select("full_name, role").eq("id", userId).single(),
  ]);
  if (!authUser?.user) return null;

  const p = profile as { full_name: string | null; role: UserSearchResult["role"] } | null;
  return { id: userId, email: authUser.user.email ?? "", fullName: p?.full_name ?? null, role: p?.role ?? "user" };
}

/** Shared by approve/transfer — upgrades a user to business_owner only if
 * they're currently a plain 'user' (never touches an existing 'owner'
 * site-admin, and leaves an already-business_owner account as is). Exported
 * so lib/actions/city-services.ts can reuse it when an admin assigns an
 * owner at creation time, rather than duplicating this rule. */
export async function upgradeToBusinessOwner(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  await supabase.from("profiles").update({ role: "business_owner" } as never).eq("id", userId).eq("role", "user");
}

/** Downgrades a former owner back to 'user' if this transfer/rejection just
 * took away their only remaining owned listing — otherwise they'd keep
 * business-dashboard access with nothing to manage. Never touches an
 * 'owner' site-admin account. */
async function downgradeIfNoListingsLeft(supabase: Awaited<ReturnType<typeof createClient>>, userId: string) {
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", userId).single();
  if ((profile as { role: string } | null)?.role !== "business_owner") return;

  const [{ count: hotels }, { count: restaurants }, { count: cafes }, { count: services }, { count: cityServices }] = await Promise.all([
    supabase.from("hotels").select("id", { count: "exact", head: true }).eq("owner_id", userId),
    supabase.from("restaurants").select("id", { count: "exact", head: true }).eq("owner_id", userId),
    supabase.from("cafes").select("id", { count: "exact", head: true }).eq("owner_id", userId),
    supabase.from("services").select("id", { count: "exact", head: true }).eq("owner_id", userId),
    supabase.from("city_services").select("id", { count: "exact", head: true }).eq("owner_id", userId),
  ]);

  const total = (hotels ?? 0) + (restaurants ?? 0) + (cafes ?? 0) + (services ?? 0) + (cityServices ?? 0);
  if (total === 0) {
    await supabase.from("profiles").update({ role: "user" } as never).eq("id", userId).eq("role", "business_owner");
  }
}

/**
 * Approves a claim: assigns owner_id on the listing, upgrades the linked
 * account to business_owner (RLS + assertCanManageListing then naturally
 * scope their dashboard to only this listing — see lib/actions/business.ts),
 * marks the claim approved, and notifies the claimant (in-app, via the
 * trg_notify_business_claim_decided trigger on this same UPDATE, plus a
 * best-effort "account verified" email).
 */
export async function approveBusinessClaim(
  locale: string,
  claimId: string,
  manualUserId?: string
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, adminId } = await assertOwner();

  const { data: claim, error: claimError } = await supabase
    .from("business_claims")
    .select("*")
    .eq("id", claimId)
    .single();
  if (claimError || !claim) return { ok: false, error: "Claim not found." };

  const row = claim as {
    listing_type: BusinessListingType;
    listing_id: string;
    status: string;
    user_id: string | null;
    email: string;
  };
  if (row.status !== "pending") return { ok: false, error: "This claim has already been reviewed." };

  let targetUserId = manualUserId ?? row.user_id;
  if (!targetUserId) {
    const { data: authUsers } = await createAdminClient().auth.admin.listUsers({ page: 1, perPage: 200 });
    targetUserId = authUsers?.users.find((u) => u.email?.toLowerCase() === row.email.toLowerCase())?.id ?? null;
  }
  if (!targetUserId) {
    return { ok: false, error: "No matching account found for this email — pick a user manually to link this claim." };
  }

  const table = LISTING_TABLE[row.listing_type];
  const listingUpdate: Record<string, unknown> = { owner_id: targetUserId };
  if (HAS_PARTNER_STATUS.has(row.listing_type)) listingUpdate.partner_status = "official";

  const { data: listing, error: listingError } = await supabase
    .from(table)
    .update(listingUpdate as never)
    .eq("id", row.listing_id)
    .select("name")
    .single();
  if (listingError) return { ok: false, error: listingError.message };

  await upgradeToBusinessOwner(supabase, targetUserId);

  const { error: updateError } = await supabase
    .from("business_claims")
    .update({ status: "approved", user_id: targetUserId, reviewed_at: new Date().toISOString(), reviewed_by: adminId } as never)
    .eq("id", claimId);
  if (updateError) return { ok: false, error: updateError.message };

  const businessName = (listing as { name: string } | null)?.name ?? "your business";
  const { data: targetUser } = await createAdminClient().auth.admin.getUserById(targetUserId);
  if (targetUser?.user?.email) {
    const { subject, html } = accountVerifiedEmail(locale as Locale, businessName);
    await sendEmail({ to: targetUser.user.email, subject, html });
  }

  await logActivity("update", "business_claim", claimId, { status: "approved", listingType: row.listing_type, listingId: row.listing_id });
  revalidatePath(`/${locale}/admin/claims`);
  revalidatePath(`/${locale}/admin/partners`);
  return { ok: true };
}

/** Rejects a claim and notifies the claimant if we can resolve a real
 * account (their own submission, or an exact email match) — no error if we
 * can't, since a rejection doesn't require an account to exist. */
export async function rejectBusinessClaim(
  locale: string,
  claimId: string,
  manualUserId?: string
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, adminId } = await assertOwner();

  const { data: claim, error: claimError } = await supabase
    .from("business_claims")
    .select("*")
    .eq("id", claimId)
    .single();
  if (claimError || !claim) return { ok: false, error: "Claim not found." };

  const row = claim as { status: string; user_id: string | null; email: string };
  if (row.status !== "pending") return { ok: false, error: "This claim has already been reviewed." };

  let targetUserId = manualUserId ?? row.user_id;
  if (!targetUserId) {
    const { data: authUsers } = await createAdminClient().auth.admin.listUsers({ page: 1, perPage: 200 });
    targetUserId = authUsers?.users.find((u) => u.email?.toLowerCase() === row.email.toLowerCase())?.id ?? null;
  }

  const { error } = await supabase
    .from("business_claims")
    .update({ status: "rejected", user_id: targetUserId, reviewed_at: new Date().toISOString(), reviewed_by: adminId } as never)
    .eq("id", claimId);
  if (error) return { ok: false, error: error.message };

  await logActivity("update", "business_claim", claimId, { status: "rejected" });
  revalidatePath(`/${locale}/admin/claims`);
  return { ok: true };
}

export interface OwnedListingRow {
  listingType: OwnableListingType;
  listingId: string;
  name: string;
  ownerId: string;
  ownerEmail: string;
  ownerName: string | null;
}

/** Admin-only. Every hotel/restaurant/cafe/service/city_service with an
 * owner assigned — feeds the "Transfer Ownership" section, which isn't
 * limited to listings that came through a claim (an owner_id can be set
 * other ways too). */
export async function getOwnedListings(): Promise<OwnedListingRow[]> {
  const { supabase } = await assertOwner();

  const [{ data: hotels }, { data: restaurants }, { data: cafes }, { data: services }, { data: cityServices }] = await Promise.all([
    supabase.from("hotels").select("id, name, owner_id").not("owner_id", "is", null),
    supabase.from("restaurants").select("id, name, owner_id").not("owner_id", "is", null),
    supabase.from("cafes").select("id, name, owner_id").not("owner_id", "is", null),
    supabase.from("services").select("id, name, owner_id").not("owner_id", "is", null),
    supabase.from("city_services").select("id, name, owner_id").not("owner_id", "is", null),
  ]);

  const entries: { listingType: OwnableListingType; table: string; id: string; name: string; owner_id: string }[] = [
    ...((hotels ?? []) as { id: string; name: string; owner_id: string }[]).map((r) => ({ listingType: "hotel" as const, table: "hotels", ...r })),
    ...((restaurants ?? []) as { id: string; name: string; owner_id: string }[]).map((r) => ({ listingType: "restaurant" as const, table: "restaurants", ...r })),
    ...((cafes ?? []) as { id: string; name: string; owner_id: string }[]).map((r) => ({ listingType: "cafe" as const, table: "cafes", ...r })),
    ...((services ?? []) as { id: string; name: string; owner_id: string }[]).map((r) => ({ listingType: "service" as const, table: "services", ...r })),
    ...((cityServices ?? []) as { id: string; name: string; owner_id: string }[]).map((r) => ({ listingType: "city_service" as const, table: "city_services", ...r })),
  ];

  if (entries.length === 0) return [];

  const admin = createAdminClient();
  const { data: authUsers } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
  const { data: profiles } = await supabase.from("profiles").select("id, full_name");
  const emailById = new Map((authUsers?.users ?? []).map((u) => [u.id, u.email ?? ""]));
  const nameById = new Map(((profiles ?? []) as { id: string; full_name: string | null }[]).map((p) => [p.id, p.full_name]));

  return entries.map((e) => ({
    listingType: e.listingType,
    listingId: e.id,
    name: e.name,
    ownerId: e.owner_id,
    ownerEmail: emailById.get(e.owner_id) ?? "",
    ownerName: nameById.get(e.owner_id) ?? null,
  }));
}

/** Admin-only. Reassigns an already-owned listing to a different account —
 * upgrades the new owner, and downgrades the previous owner back to 'user'
 * if this was their last remaining listing. */
export async function transferOwnership(
  locale: string,
  listingType: OwnableListingType,
  listingId: string,
  newUserId: string
): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await assertOwner();
  const table = LISTING_TABLE[listingType];

  const { data: before } = await supabase.from(table).select("owner_id, name").eq("id", listingId).single();
  const previous = before as { owner_id: string | null; name: string } | null;
  if (!previous) return { ok: false, error: "Listing not found." };

  const { error } = await supabase.from(table).update({ owner_id: newUserId } as never).eq("id", listingId);
  if (error) return { ok: false, error: error.message };

  await upgradeToBusinessOwner(supabase, newUserId);
  if (previous.owner_id && previous.owner_id !== newUserId) {
    await downgradeIfNoListingsLeft(supabase, previous.owner_id);
  }

  const { error: notifyError } = await supabase.rpc("admin_notify_user", {
    p_user_id: newUserId,
    p_title: "You've been given ownership of a business",
    p_message: `You're now the owner of ${previous.name}.`,
    p_type: "success",
    p_action_url: "/business",
    p_category: "verification",
    p_data: { listingType, listingId },
  });
  if (notifyError && process.env.NODE_ENV === "development") console.warn("transferOwnership notify:", notifyError.message);

  await logActivity("update", "ownership_transfer", listingId, { listingType, newUserId });
  revalidatePath(`/${locale}/admin/claims`);
  revalidatePath(`/${locale}/admin/partners`);
  if (listingType === "city_service") revalidatePath(`/${locale}/admin/city-services`);
  return { ok: true };
}

/** Admin-only. Unassigns a listing's owner entirely (owner_id -> null) —
 * the one gap transferOwnership doesn't cover, since it always requires a
 * new account to hand the listing to. Downgrades the former owner back to
 * 'user' if this was their last remaining listing, same as a transfer away. */
export async function removeOwnership(
  locale: string,
  listingType: OwnableListingType,
  listingId: string
): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await assertOwner();
  const table = LISTING_TABLE[listingType];

  const { data: before } = await supabase.from(table).select("owner_id").eq("id", listingId).single();
  const previous = before as { owner_id: string | null } | null;
  if (!previous) return { ok: false, error: "Listing not found." };
  if (!previous.owner_id) return { ok: true };

  const { error } = await supabase.from(table).update({ owner_id: null } as never).eq("id", listingId);
  if (error) return { ok: false, error: error.message };

  await downgradeIfNoListingsLeft(supabase, previous.owner_id);

  await logActivity("update", "ownership_removed", listingId, { listingType });
  revalidatePath(`/${locale}/admin/claims`);
  if (listingType === "city_service") revalidatePath(`/${locale}/admin/city-services`);
  return { ok: true };
}
