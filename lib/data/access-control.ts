import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { mapBusinessAccessGrant, mapTeamPlatformPermissions, mapHonoraryMember } from "./mappers";
import type { BusinessListingType, BusinessPermissionKey, PlatformPermissionKey, BusinessAccessGrant, TeamPlatformPermissionsGrant, HonoraryMember } from "@/types";

/**
 * The one place assertCanManageListing (lib/actions/business.ts) and
 * assertCanManageAppointment (lib/actions/appointments.ts) both ask "does
 * this signed-in user have this specific permission on this specific
 * business, via an active team grant". Mirrors exactly what the
 * has_business_permission() RLS function checks at the database layer —
 * this is the server-action-layer twin of that function, not a
 * replacement for it (RLS stays the authoritative backstop either way).
 */
export async function hasBusinessGrantPermission(
  userId: string,
  listingType: BusinessListingType,
  listingId: string,
  permission: BusinessPermissionKey
): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_access_grants")
    .select("permissions")
    .eq("user_id", userId)
    .eq("listing_type", listingType)
    .eq("listing_id", listingId)
    .eq("is_active", true)
    .maybeSingle();
  const permissions = (data?.permissions ?? {}) as Partial<Record<BusinessPermissionKey, boolean>>;
  return permissions[permission] === true;
}

/**
 * Coarse version of hasBusinessGrantPermission — "does this user have this
 * permission on ANY business at all", not a specific one. Used only where
 * the caller doesn't know the specific listing id up front (e.g.
 * lib/actions/admin.ts's updateRecord, which is generic across every
 * hotel/restaurant/cafe/service a team member might be editing) and
 * genuinely relies on RLS as the row-specific gate — exactly the same
 * pattern that function already uses for the `business_owner` role (its
 * own JS-layer check is role-only too; `owner_id = auth.uid()` in RLS is
 * what actually stops them touching a listing they don't own).
 */
export async function hasAnyBusinessGrantPermission(userId: string, permission: BusinessPermissionKey): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase.from("business_access_grants").select("permissions").eq("user_id", userId).eq("is_active", true);
  return (data ?? []).some((row) => ((row.permissions ?? {}) as Partial<Record<BusinessPermissionKey, boolean>>)[permission] === true);
}

/** Platform-wide twin of hasBusinessGrantPermission — used by admin-section
 * guards (Partners, Content, Reports, Analytics, Requests) to let a team
 * member in without role = 'owner'. */
export async function hasPlatformPermission(userId: string, permission: PlatformPermissionKey): Promise<boolean> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("team_platform_permissions")
    .select("permissions")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  const permissions = (data?.permissions ?? {}) as Partial<Record<PlatformPermissionKey, boolean>>;
  return permissions[permission] === true;
}

/** Every grant a specific user holds (active or not — the Owner's team
 * management UI needs to show revoked grants too, to re-enable them
 * without re-creating). */
export async function getBusinessAccessGrantsForUser(userId: string): Promise<BusinessAccessGrant[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("business_access_grants").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  return (data ?? []).map(mapBusinessAccessGrant);
}

/** Every grant that targets one specific business — "who has access to
 * this business" for the Owner's per-business team view. */
export async function getBusinessAccessGrantsForListing(listingType: BusinessListingType, listingId: string): Promise<BusinessAccessGrant[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_access_grants")
    .select("*")
    .eq("listing_type", listingType)
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });
  return (data ?? []).map(mapBusinessAccessGrant);
}

export async function getTeamPlatformPermissionsForUser(userId: string): Promise<TeamPlatformPermissionsGrant | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("team_platform_permissions").select("*").eq("user_id", userId).maybeSingle();
  return data ? mapTeamPlatformPermissions(data) : null;
}

export async function getHonoraryStatus(userId: string): Promise<HonoraryMember | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("honorary_members").select("*").eq("user_id", userId).maybeSingle();
  return data ? mapHonoraryMember(data) : null;
}

export interface TeamMemberOverviewRow {
  userId: string;
  fullName: string;
  email: string;
  businessGrants: BusinessAccessGrant[];
  platformPermissions: TeamPlatformPermissionsGrant | null;
}

/**
 * Every user who has at least one business_access_grants row or a
 * team_platform_permissions row — the Owner's /admin/team-access roster.
 * Small platform (family-run business), so this is a plain fan-out, not a
 * paginated query — matches the scale every other admin list in this app
 * already assumes (partners, requests, etc. all load in full).
 */
export const getTeamMembersOverview = cache(async function _getTeamMembersOverview(): Promise<TeamMemberOverviewRow[]> {
  const supabase = await createClient();
  const [{ data: grants }, { data: platformGrants }] = await Promise.all([
    supabase.from("business_access_grants").select("*").order("created_at", { ascending: false }),
    supabase.from("team_platform_permissions").select("*").order("created_at", { ascending: false }),
  ]);

  const userIds = new Set<string>();
  for (const g of grants ?? []) userIds.add(g.user_id);
  for (const p of platformGrants ?? []) userIds.add(p.user_id);
  if (userIds.size === 0) return [];

  const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", Array.from(userIds));
  const nameById = new Map((profiles ?? []).map((p) => [p.id, p.full_name ?? "—"]));

  const grantsByUser = new Map<string, BusinessAccessGrant[]>();
  for (const g of grants ?? []) {
    const mapped = mapBusinessAccessGrant(g);
    grantsByUser.set(mapped.userId, [...(grantsByUser.get(mapped.userId) ?? []), mapped]);
  }
  const platformByUser = new Map((platformGrants ?? []).map((p) => mapTeamPlatformPermissions(p)).map((p) => [p.userId, p]));

  return Array.from(userIds).map((userId) => ({
    userId,
    fullName: nameById.get(userId) ?? "—",
    email: "",
    businessGrants: grantsByUser.get(userId) ?? [],
    platformPermissions: platformByUser.get(userId) ?? null,
  }));
});

/** Every honorary member, newest first — the Owner's management list AND
 * (filtered to is_public) a public About/Team page, if one is ever built.
 * Never consulted by any authorization check. */
export async function getAllHonoraryMembers(): Promise<HonoraryMember[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("honorary_members").select("*").order("created_at", { ascending: false });
  return (data ?? []).map(mapHonoraryMember);
}

export interface AccessPickerProfile {
  id: string;
  fullName: string;
}

/** Every signed-up profile, name + id only — the Owner's "who am I
 * granting access to" picker. Same underlying query
 * app/[locale]/admin/users/page.tsx already runs (all profiles, newest
 * first); kept as its own narrow select here rather than reusing that
 * page's full-row query, since this only ever needs id + name. */
export async function getAllProfilesForPicker(): Promise<AccessPickerProfile[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("profiles").select("id, full_name").order("full_name", { ascending: true });
  return (data ?? []).map((p) => ({ id: p.id, fullName: p.full_name || "—" }));
}

export interface AccessPickerBusiness {
  listingType: BusinessListingType;
  id: string;
  name: string;
}

// Same 5-table union app/[locale]/admin/partners/page.tsx's PARTNER_TABLES
// already establishes as "every category-agnostic business table" — reused
// here rather than redefined, so a new listing type only ever needs adding
// in one place.
const ACCESS_PICKER_TABLES: { table: "hotels" | "restaurants" | "cafes" | "city_services" | "services"; listingType: BusinessListingType }[] = [
  { table: "hotels", listingType: "hotel" },
  { table: "restaurants", listingType: "restaurant" },
  { table: "cafes", listingType: "cafe" },
  { table: "city_services", listingType: "city_service" },
  { table: "services", listingType: "service" },
];

/** Every business a Team Member could plausibly be granted access to —
 * every official (or owned) listing, across all 5 tables, name + id only.
 * Powers the "grant access to…" business picker in the Owner's
 * /admin/team-access page. */
export const getAllBusinessesForAccessPicker = cache(async function _getAllBusinessesForAccessPicker(): Promise<AccessPickerBusiness[]> {
  const supabase = await createClient();
  const results = await Promise.all(
    ACCESS_PICKER_TABLES.map(({ table }) => supabase.from(table).select("id, name").or("owner_id.not.is.null,partner_status.eq.official"))
  );

  const out: AccessPickerBusiness[] = [];
  results.forEach(({ data }, i) => {
    const { listingType } = ACCESS_PICKER_TABLES[i];
    for (const row of (data ?? []) as { id: string; name: string }[]) out.push({ listingType, id: row.id, name: row.name });
  });
  return out.sort((a, b) => a.name.localeCompare(b.name));
});
