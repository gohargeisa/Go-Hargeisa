import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { getEnabledLoyaltyProgramForListing } from "@/lib/data/loyalty";
import type { LoyaltyStaffRole } from "@/lib/loyalty/types";

/**
 * Resolves whether the current user may operate a partner's loyalty counter,
 * for the /[locale]/rewards/staff/[slug] route. Authorization is the DB's:
 * `loyalty_is_staff()` / `loyalty_is_manager()` (platform owner OR the
 * listing's own owner_id OR an active loyalty_staff row) — this only calls
 * those SECURITY DEFINER helpers, it never re-implements the check.
 */

export type StaffProgramContext =
  | { state: "not_found" }
  | { state: "unauthenticated"; loginNext: string }
  | { state: "forbidden" }
  | {
      state: "ok";
      role: LoyaltyStaffRole;
      program: { id: string; name: string; currency: string; pointsPerCurrency: number };
      listing: { slug: string; name: string; logoUrl: string | null };
    };

export async function getStaffProgramContext(
  slug: string,
  locale: string
): Promise<StaffProgramContext> {
  if (!isSupabaseConfigured()) return { state: "not_found" };

  const pub = createPublicClient();
  const { data: listingRow } = await pub
    .from("city_services")
    .select("id, slug, name, logo_url, status")
    .eq("slug", slug)
    .maybeSingle();
  if (!listingRow || listingRow.status !== "published") return { state: "not_found" };

  const program = await getEnabledLoyaltyProgramForListing("city_service", listingRow.id as string);
  if (!program) return { state: "not_found" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { state: "unauthenticated", loginNext: `/${locale}/rewards/staff/${slug}` };
  }

  const [{ data: isStaff }, { data: isManager }] = await Promise.all([
    supabase.rpc("loyalty_is_staff", { p_program_id: program.id }),
    supabase.rpc("loyalty_is_manager", { p_program_id: program.id }),
  ]);

  if (isStaff !== true) return { state: "forbidden" };

  // "owner" vs "manager" isn't distinguished for gating (both pass
  // loyalty_is_manager) — surface "manager" for any elevated operator.
  const role: LoyaltyStaffRole = isManager === true ? "manager" : "staff";

  return {
    state: "ok",
    role,
    program: {
      id: program.id,
      name: program.name,
      currency: program.currency,
      pointsPerCurrency: program.pointsPerCurrency,
    },
    listing: {
      slug: listingRow.slug as string,
      name: listingRow.name as string,
      logoUrl: (listingRow.logo_url as string | null) ?? null,
    },
  };
}
