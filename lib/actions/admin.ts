"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "./activity";
import { upgradeToBusinessOwner } from "./claims";
import { hasAnyBusinessGrantPermission } from "@/lib/data/access-control";
import { validatePartnerListing } from "@/lib/validation/partner-quality";

const ALLOWED_TABLES = ["hotels", "restaurants", "cafes", "services", "attractions", "events", "articles"] as const;
export type AllowedTable = (typeof ALLOWED_TABLES)[number];

const TABLES_WITH_UPDATED_AT = new Set(["hotels", "restaurants", "cafes", "services", "attractions"]);

// Public detail-page path segment per table (articles live under /blog, not
// /articles). Used to also revalidate the individual listing's own detail
// page after a write — every admin form's revalidatePaths only ever listed
// the admin list + the public INDEX page, never the slug-specific detail
// page the write actually changed, so that page kept serving stale ISR
// content until its next scheduled revalidation.
// NOTE: services live at /services/{category-slug}/{slug} (nested — see
// lib/utils/service-categories.ts), not a flat /{segment}/{slug} like every
// other table here, so the revalidatePath calls below that use this map
// can't precisely target a service's live detail page. Its ISR cache still
// self-heals on the normal revalidate=3600 window; only the "revalidate
// instantly on save" behavior the other tables get is missing for services.
const TABLE_DETAIL_SEGMENT: Record<AllowedTable, string> = {
  hotels: "hotels",
  restaurants: "restaurants",
  cafes: "cafes",
  services: "services",
  attractions: "attractions",
  events: "events",
  articles: "blog",
};

// Every admin form builds revalidatePaths[0] as `/${locale}/admin/${table}`
// (verified across all 6 form components) — extracting it here means every
// caller gets the detail-page revalidation below for free, without having
// to remember to list it themselves.
function localeFromRevalidatePaths(revalidatePaths: string[]): string | null {
  return revalidatePaths[0]?.match(/^\/([a-z]{2})\//)?.[1] ?? null;
}

// Business owners may only ever touch these three tables — matches the
// "Owners manage their {hotels,restaurants,cafes}" RLS policies in
// supabase/schema.sql, which are UPDATE-only (no insert/delete) and
// scoped to rows where owner_id = auth.uid(). Attractions/events/articles
// and every table's create/delete stay owner-only.
const BUSINESS_OWNER_TABLES = new Set<AllowedTable>(["hotels", "restaurants", "cafes", "services"]);

// Only the three tables toggleListingVisibility's switch below actually
// writes to (services has no case there — a pre-existing gap, not touched
// here) — gated with the Partner Production Quality System's pre-publish
// check (lib/validation/partner-quality.ts) so a listing can't flip to
// 'published' with an empty name, no contact info, or obviously fake
// placeholder text. Draft/archived transitions are never gated — this only
// stops NEW problems from going live, never touches what's already published.
const QUALITY_GATED_TABLES = new Set<AllowedTable>(["hotels", "restaurants", "cafes"]);

async function assertOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single();

const userProfile = profile as { role: string } | null;

if (userProfile?.role !== "owner") {
  throw new Error("Not authorized.");
}


  return supabase;
}

/**
 * Same door as assertOwner, but also lets a business_owner (or a team
 * member granted businesses_edit) through for the tables they're allowed
 * to edit. This only decides whether the request is allowed to reach the
 * database — RLS (owner_id = auth.uid(), or has_business_permission(...,
 * 'businesses_edit') for a team member) is what actually stops anyone from
 * touching a listing they don't own or weren't granted, so it stays
 * authoritative even if this check is ever wrong. The team-member check is
 * deliberately coarse (any active businesses_edit grant, not this specific
 * row) for the exact same reason the business_owner check above is
 * role-only — this function has no listing id to check against yet.
 */
async function assertOwnerOrBusinessOwner(table: AllowedTable) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role;

  if (role === "owner") return { supabase, role };
  if (role === "business_owner" && BUSINESS_OWNER_TABLES.has(table)) return { supabase, role };

  if (BUSINESS_OWNER_TABLES.has(table) && (await hasAnyBusinessGrantPermission(user.id, "businesses_edit"))) {
    return { supabase, role: "team_member" as const };
  }

  throw new Error("Not authorized.");
}

export async function deleteListing(
  table: AllowedTable,
  id: string,
  revalidate: string
) {
  if (!ALLOWED_TABLES.includes(table)) {
    throw new Error("Invalid table.");
  }

  const supabase = await assertOwner();

  // .delete() alone returns no error when RLS silently blocks the delete or
  // `id` doesn't match any row — it just deletes zero rows and reports
  // success. .select().single() forces PostgREST to return the deleted row,
  // which throws a real (surfaceable) error when nothing was actually
  // deleted, so callers stop getting a false "deleted" toast for a listing
  // that's still in the database.
  let error = null;
  let data: { id: string } | null = null;

  switch (table) {
    case "hotels":
      ({ data, error } = await supabase.from("hotels").delete().eq("id", id).select("id").single());
      break;
    case "restaurants":
      ({ data, error } = await supabase.from("restaurants").delete().eq("id", id).select("id").single());
      break;
    case "cafes":
      ({ data, error } = await supabase.from("cafes").delete().eq("id", id).select("id").single());
      break;
    case "attractions":
      ({ data, error } = await supabase.from("attractions").delete().eq("id", id).select("id").single());
      break;
    case "events":
      ({ data, error } = await supabase.from("events").delete().eq("id", id).select("id").single());
      break;
    case "articles":
      ({ data, error } = await supabase.from("articles").delete().eq("id", id).select("id").single());
      break;
  }

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Delete failed — the listing may already be gone or you may not have permission." };
  }

  await logActivity("delete", table, id);
  revalidatePath(revalidate);
  return { ok: true };
}

/**
 * Owner-only status control — sets a listing to 'draft', 'published', or
 * 'archived' without opening the full edit form. Archived (and draft) rows
 * keep every existing "Public can read published X" RLS policy denying
 * them (those policies check status = 'published'), so this is exactly as
 * effective at removing a listing from the public site as changing status
 * through the edit form always was — this just makes it a one-click action
 * from the list view instead. Originally a binary published/archived
 * toggle (see components/shared/hide-listing-button.tsx's replacement,
 * components/shared/listing-status-menu.tsx) — widened to a third state so
 * "draft" is actually reachable from the list view, not just possible in
 * the abstract type.
 */
export async function toggleListingVisibility(
  table: AllowedTable,
  id: string,
  nextStatus: "draft" | "published" | "archived",
  revalidate: string
): Promise<{ ok: boolean; error?: string }> {
  if (!ALLOWED_TABLES.includes(table)) {
    return { ok: false, error: "Invalid table." };
  }

  const supabase = await assertOwner();

  if (nextStatus === "published" && QUALITY_GATED_TABLES.has(table)) {
    const { data: row } = await supabase
      .from(table)
      .select("name, description, phone, cover_image, gallery, lat, lng")
      .eq("id", id)
      .single();
    if (row) {
      const { errors } = validatePartnerListing(row as never);
      if (errors.length > 0) {
        return { ok: false, error: `Can't publish yet: ${errors.map((e) => e.message).join(" ")}` };
      }
    }
  }

  let error = null;
  let data: { id: string } | null = null;

  switch (table) {
    case "hotels":
      ({ data, error } = await supabase.from("hotels").update({ status: nextStatus } as never).eq("id", id).select("id").single());
      break;
    case "restaurants":
      ({ data, error } = await supabase.from("restaurants").update({ status: nextStatus } as never).eq("id", id).select("id").single());
      break;
    case "cafes":
      ({ data, error } = await supabase.from("cafes").update({ status: nextStatus } as never).eq("id", id).select("id").single());
      break;
    case "attractions":
      ({ data, error } = await supabase.from("attractions").update({ status: nextStatus } as never).eq("id", id).select("id").single());
      break;
    case "events":
      ({ data, error } = await supabase.from("events").update({ status: nextStatus } as never).eq("id", id).select("id").single());
      break;
    case "articles":
      ({ data, error } = await supabase.from("articles").update({ status: nextStatus } as never).eq("id", id).select("id").single());
      break;
  }

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Could not update visibility." };
  }

  await logActivity(nextStatus === "published" ? "publish" : nextStatus === "archived" ? "archive" : "update", table, id, { status: nextStatus });
  revalidatePath(revalidate);
  return { ok: true };
}

// Feature/Pin apply to every table that carries `featured` and `is_pinned`
// columns — confirmed directly against the schema for all six (hotels,
// restaurants, cafes, attractions, city_services, services); events/
// articles use a different, simpler row shape and have neither column.
const FEATURABLE_TABLES = ["hotels", "restaurants", "cafes", "attractions", "city_services", "services"] as const;
export type FeaturableTable = (typeof FEATURABLE_TABLES)[number];

/** Owner-only one-click "Feature" toggle — the column already existed and
 * was editable in the full edit form; this just makes it reachable from
 * the list view too, same shape as toggleListingVisibility above. */
export async function toggleListingFeatured(
  table: FeaturableTable,
  id: string,
  featured: boolean,
  revalidate: string
): Promise<{ ok: boolean; error?: string }> {
  if (!FEATURABLE_TABLES.includes(table)) return { ok: false, error: "Invalid table." };

  const supabase = await assertOwner();
  const { data, error } = await supabase.from(table).update({ featured } as never).eq("id", id).select("id").single();

  if (error || !data) return { ok: false, error: error?.message ?? "Could not update." };

  await logActivity("update", table, id, { featured });
  revalidatePath(revalidate);
  return { ok: true };
}

/** Owner-only one-click "Pin" toggle. Pinned listings sort ahead of merely
 * featured ones on their public listing page (see lib/data/hotels.ts and
 * siblings' getHotels-style query ordering). */
export async function toggleListingPinned(
  table: FeaturableTable,
  id: string,
  pinned: boolean,
  revalidate: string
): Promise<{ ok: boolean; error?: string }> {
  if (!FEATURABLE_TABLES.includes(table)) return { ok: false, error: "Invalid table." };

  const supabase = await assertOwner();
  const { data, error } = await supabase.from(table).update({ is_pinned: pinned } as never).eq("id", id).select("id").single();

  if (error || !data) return { ok: false, error: error?.message ?? "Could not update." };

  await logActivity("update", table, id, { pinned });
  revalidatePath(revalidate);
  return { ok: true };
}

/**
 * Generic insert used by every admin "create" form. `data` must already be
 * in snake_case matching the table's columns (see supabase/schema.sql) —
 * each entity's action wrapper (createHotel, createRestaurant, ...) is
 * responsible for that mapping so this function stays table-agnostic.
 */
export async function createRecord(
  table: AllowedTable,
  data: Record<string, unknown>,
  revalidatePaths: string[],
  redirectTo: string
) {
  if (!ALLOWED_TABLES.includes(table)) {
    throw new Error("Invalid table.");
  }

  const supabase = await assertOwner();

  const payload = {
    ...data,
    status: "published",
  };

  // .insert() alone doesn't error just because RLS silently rejected the
  // row — .select().single() forces the insert's RETURNING result back,
  // which fails loudly (instead of reporting success for a row that was
  // never created) if RLS blocked it.
  let error = null;
  let inserted: { slug?: string } | null = null;

  switch (table) {
    case "hotels":
      ({ data: inserted, error } = await supabase.from("hotels").insert(payload as never).select("slug").single());
      break;
    case "restaurants":
      ({ data: inserted, error } = await supabase.from("restaurants").insert(payload as never).select("slug").single());
      break;
    case "cafes":
      ({ data: inserted, error } = await supabase.from("cafes").insert(payload as never).select("slug").single());
      break;
    case "attractions":
      ({ data: inserted, error } = await supabase.from("attractions").insert(payload as never).select("slug").single());
      break;
    case "events":
      ({ data: inserted, error } = await supabase.from("events").insert(payload as never).select("slug").single());
      break;
    case "articles":
      ({ data: inserted, error } = await supabase.from("articles").insert(payload as never).select("slug").single());
      break;
  }

  if (error || !inserted) {
    return { ok: false, error: error?.message ?? "Create failed — the record was not saved." };
  }

  // Assigning an owner at creation time (hotels/restaurants/cafes' admin
  // forms, via AssignedOwnerField) needs the same role bump
  // transferOwnership already gives an existing listing's new owner —
  // otherwise the account would have owner_id set on a row but no
  // 'business_owner' role, and requireListingsAccess would still bounce
  // them from /business.
  const assignedOwnerId = (payload as { owner_id?: string | null }).owner_id;
  if (assignedOwnerId) {
    await upgradeToBusinessOwner(supabase, assignedOwnerId);
  }

  for (const path of revalidatePaths) {
    revalidatePath(path);
  }

  const locale = localeFromRevalidatePaths(revalidatePaths);
  if (locale && inserted.slug) {
    revalidatePath(`/${locale}/${TABLE_DETAIL_SEGMENT[table]}/${inserted.slug}`);
  }

  await logActivity("create", table, inserted.slug);
  redirect(redirectTo);
}

/** Generic update used by every admin "edit" form — same contract as createRecord. */
export async function updateRecord(
  table: AllowedTable,
  id: string,
  data: Record<string, unknown>,
  revalidatePaths: string[],
  redirectTo: string
) {
  if (!ALLOWED_TABLES.includes(table)) {
    throw new Error("Invalid table.");
  }

  const { supabase, role } = await assertOwnerOrBusinessOwner(table);

  // Captured before the write so the OLD slug's detail page can also be
  // revalidated below if this update changes the slug — otherwise the
  // listing's previous URL would keep serving stale ISR content forever
  // (nothing else ever revalidates a slug that no longer exists on the row).
  const { data: existing } = await supabase.from(table).select("slug").eq("id", id).single();
  const previousSlug = (existing as { slug?: string } | null)?.slug;

  // Homepage featuring is the platform owner's call, not a business
  // owner's — the edit forms already hide this checkbox for them
  // (HotelForm/RestaurantForm/CafeForm's `canFeature` prop), but a Server
  // Action is a real network endpoint any client can call directly with
  // an arbitrary payload, so the actual authorization boundary has to be
  // here, not just in the UI.
  const { featured: _ignoredFeatured, ...restData } = data;
  const sanitizedData = role === "owner" ? data : restData;

  const payload = TABLES_WITH_UPDATED_AT.has(table)
    ? {
        ...sanitizedData,
        updated_at: new Date().toISOString(),
      }
    : sanitizedData;

  // .update() alone doesn't error when RLS silently blocks the write or
  // `id` doesn't match any row — it just affects zero rows and reports
  // success. .select().single() forces PostgREST to return the updated
  // row, which fails loudly instead of letting a no-op look like success.
  let error = null;
  let updated: { slug?: string } | null = null;

  switch (table) {
    case "hotels":
      ({ data: updated, error } = await supabase.from("hotels").update(payload as never).eq("id", id).select("slug").single());
      break;
    case "restaurants":
      ({ data: updated, error } = await supabase.from("restaurants").update(payload as never).eq("id", id).select("slug").single());
      break;
    case "cafes":
      ({ data: updated, error } = await supabase.from("cafes").update(payload as never).eq("id", id).select("slug").single());
      break;
    case "attractions":
      ({ data: updated, error } = await supabase.from("attractions").update(payload as never).eq("id", id).select("slug").single());
      break;
    case "events":
      ({ data: updated, error } = await supabase.from("events").update(payload as never).eq("id", id).select("slug").single());
      break;
    case "articles":
      ({ data: updated, error } = await supabase.from("articles").update(payload as never).eq("id", id).select("slug").single());
      break;
    case "services":
      ({ data: updated, error } = await supabase.from("services").update(payload as never).eq("id", id).select("slug").single());
      break;
  }

  if (error || !updated) {
    return {
      ok: false,
      error: error?.message ?? "Update failed — no matching record was updated. You may not have permission to edit this listing.",
    };
  }

  for (const path of revalidatePaths) {
    revalidatePath(path);
  }

  const locale = localeFromRevalidatePaths(revalidatePaths);
  if (locale) {
    const segment = TABLE_DETAIL_SEGMENT[table];
    if (updated.slug) revalidatePath(`/${locale}/${segment}/${updated.slug}`);
    if (previousSlug && previousSlug !== updated.slug) revalidatePath(`/${locale}/${segment}/${previousSlug}`);
  }

  await logActivity("update", table, id);
  redirect(redirectTo);
}
