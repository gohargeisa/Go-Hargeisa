"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BusinessListingType, BusinessPermissions, PlatformPermissions } from "@/types";

/** Every write in this file is Owner-only — team members' own access is
 * granted BY the owner, never self-service. RLS on business_access_grants/
 * team_platform_permissions/honorary_members independently enforces the
 * same rule (only "Owners manage all …" policies allow INSERT/UPDATE), so
 * this check is belt-and-suspenders, not the only gate. */
async function assertIsOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as { role: string } | null)?.role !== "owner") throw new Error("Not authorized.");

  return { supabase, ownerId: user.id };
}

/** Create or update one team member's access to one business — the target
 * row is looked up by the (user, listing_type, listing_id) unique
 * constraint, so calling this again for the same pairing edits the
 * existing grant's permissions in place instead of creating a duplicate.
 * Passing an empty `permissions` object doesn't delete the grant — it
 * leaves the team member "visible but can do nothing" on that business;
 * use setBusinessAccessGrantActive to actually enable/revoke.
 *
 * Deliberately does NOT touch `is_active` when a grant already exists —
 * editing an existing (possibly disabled) grant's permission checkboxes
 * must never silently reactivate it. `is_active` is set to true only the
 * first time a grant is created; every change after that goes exclusively
 * through setBusinessAccessGrantActive, which is the one explicit,
 * intentional action for turning access on or off.
 */
export async function upsertBusinessAccessGrant(
  userId: string,
  listingType: BusinessListingType,
  listingId: string,
  permissions: BusinessPermissions,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, ownerId } = await assertIsOwner();

  const { data: existing } = await supabase
    .from("business_access_grants")
    .select("id")
    .eq("user_id", userId)
    .eq("listing_type", listingType)
    .eq("listing_id", listingId)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("business_access_grants")
        .update({ permissions, updated_at: new Date().toISOString() } as never)
        .eq("id", existing.id)
    : await supabase.from("business_access_grants").insert({
        user_id: userId,
        listing_type: listingType,
        listing_id: listingId,
        permissions,
        is_active: true,
        granted_by: ownerId,
      } as never);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

/** Disable (or re-enable) one existing grant without losing its permission
 * set or audit trail — the Owner's "remove access" / "restore access"
 * action. */
export async function setBusinessAccessGrantActive(
  grantId: string,
  isActive: boolean,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await assertIsOwner();

  const { error } = await supabase
    .from("business_access_grants")
    .update({ is_active: isActive, updated_at: new Date().toISOString() } as never)
    .eq("id", grantId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function deleteBusinessAccessGrant(grantId: string, revalidatePaths: string[]): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await assertIsOwner();

  const { error } = await supabase.from("business_access_grants").delete().eq("id", grantId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

/** One row per team member. Same reactivation-safety rule as
 * upsertBusinessAccessGrant above: editing an existing row's permissions
 * never touches `is_active` — only setTeamPlatformPermissionsActive does.
 * `is_active` is set true only when this creates the row for the first
 * time. */
export async function upsertTeamPlatformPermissions(
  userId: string,
  permissions: PlatformPermissions,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, ownerId } = await assertIsOwner();

  const { data: existing } = await supabase.from("team_platform_permissions").select("id").eq("user_id", userId).maybeSingle();

  const { error } = existing
    ? await supabase
        .from("team_platform_permissions")
        .update({ permissions, updated_at: new Date().toISOString() } as never)
        .eq("id", existing.id)
    : await supabase.from("team_platform_permissions").insert({
        user_id: userId,
        permissions,
        is_active: true,
        granted_by: ownerId,
      } as never);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function setTeamPlatformPermissionsActive(
  userId: string,
  isActive: boolean,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await assertIsOwner();

  const { error } = await supabase
    .from("team_platform_permissions")
    .update({ is_active: isActive, updated_at: new Date().toISOString() } as never)
    .eq("user_id", userId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

/** Recognition only — see honorary_members. Deliberately has no
 * `permissions` argument; this function cannot grant access no matter
 * what's passed to it, by construction. */
export async function upsertHonoraryMember(
  userId: string,
  titles: { titleEn: string; titleAr?: string; titleSo?: string },
  isPublic: boolean,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const { supabase, ownerId } = await assertIsOwner();
  if (!titles.titleEn.trim()) return { ok: false, error: "A title is required." };

  const { error } = await supabase.from("honorary_members").upsert(
    {
      user_id: userId,
      title_en: titles.titleEn.trim(),
      title_ar: titles.titleAr?.trim() || null,
      title_so: titles.titleSo?.trim() || null,
      is_public: isPublic,
      created_by: ownerId,
    } as never,
    { onConflict: "user_id" }
  );
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function removeHonoraryMember(userId: string, revalidatePaths: string[]): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await assertIsOwner();

  const { error } = await supabase.from("honorary_members").delete().eq("user_id", userId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}
