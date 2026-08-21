import { cache } from "react";
import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { SERVICES_PUBLIC_ENABLED, RESTAURANTS_PUBLIC_ENABLED, CAFES_PUBLIC_ENABLED, ATTRACTIONS_PUBLIC_ENABLED } from "@/lib/config/features";
import { applyCityServiceCategoryGroups } from "@/lib/config/city-service-category-groups";
import { mapCategory } from "./mappers";
import type { Category, CategoryTargetTable } from "@/types";

/** The one tag every category-mutating action (lib/actions/categories.ts)
 * revalidates on write — keeps the unstable_cache below fresh the moment an
 * admin creates/edits/reorders/hides a category, not just after it expires. */
export const CATEGORIES_CACHE_TAG = "categories";

/** Public, active-only categories — the navbar, homepage, submission form,
 * and search all read from this instead of a hardcoded per-vocabulary list.
 * Wrapped in unstable_cache (not just React's per-request cache()) since
 * this is genuinely "frequently used, rarely changing" data read on nearly
 * every request (the root layout fetches it for the navbar alone) — a
 * 5-minute safety-net revalidate plus tag-based invalidation from the admin
 * write side means visitors never wait on this query except right after
 * the cache is cold or an admin just changed something. */
async function _getCategories(targetTable?: CategoryTargetTable): Promise<Category[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createPublicClient();
  let query = supabase.from("categories").select("*").eq("is_active", true).order("sort_order", { ascending: true });
  if (targetTable) query = query.eq("target_table", targetTable);

  const { data, error } = await query;
  if (error) {
    if (process.env.NODE_ENV === "development") console.error("getCategories:", error.message);
    return [];
  }
  return (data ?? []).map(mapCategory);
}

const getCategoriesDurable = unstable_cache(_getCategories, ["categories-list"], {
  tags: [CATEGORIES_CACHE_TAG],
  revalidate: 300,
});

export const getCategories = cache(getCategoriesDurable);

/** getCategories(), minus whichever verticals are currently feature-flagged
 * off (lib/config/features.ts). City Services SUB-categories (Hospitals,
 * Pharmacies, Flowers & Gifts, English Language Institutes, ...) pass
 * through here too — they're discoverable both on their natural home,
 * /city-services, and as a shortcut in the site's "More" nav dropdown (see
 * NavMegaMenu), the same as every other non-pinned category. The single
 * pinned "City Services" umbrella row still passes through as its own
 * top-level nav entry, same as every other pinned top-level category. This
 * is the one filter the navbar and homepage "Browse by Category" grid both
 * apply, so a disabled vertical can't leak into either surface while still
 * existing (and manageable) in the DB. */
export async function getVisibleCategories(): Promise<Category[]> {
  const categories = await getCategories();
  return categories.filter((c) => {
    if (c.targetTable === "services") return SERVICES_PUBLIC_ENABLED;
    if (c.targetTable === "restaurants") return RESTAURANTS_PUBLIC_ENABLED;
    if (c.targetTable === "cafes") return CAFES_PUBLIC_ENABLED;
    // Keyed on slug, not targetTable — the live 'attractions' row's
    // target_table is currently corrupted to 'city_services' (see the
    // categories.target_table fix migration, not yet pushed), so this stays
    // effective regardless of whether that migration has been applied yet.
    if (c.slug === "attractions") return ATTRACTIONS_PUBLIC_ENABLED;
    return true;
  });
}

/** Every category the long-tail `services` vertical uses — its category
 * pages, submission form, search, sitemap, and admin dropdown all share
 * this one call instead of a static enum lookup. */
export function getServiceCategories(): Promise<Category[]> {
  return getCategories("services");
}

/** Every City Services sub-category (Hospitals, Banks, ...) — the grouping
 * used by /city-services and its admin form. Excludes the single is_pinned
 * row representing the "City Services" nav entry itself, which isn't a
 * grouping category. Replaces the hardcoded lib/config/city-service-categories.ts list. */
export async function getCityServiceCategories(): Promise<Category[]> {
  const categories = await getCategories("city_services");
  return categories.filter((c) => !c.isPinned);
}

async function _getCategoryBySlug(slug: string): Promise<Category | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createPublicClient();
  const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (error || !data) return null;
  return mapCategory(data);
}

const getCategoryBySlugDurable = unstable_cache(_getCategoryBySlug, ["category-by-slug"], {
  tags: [CATEGORIES_CACHE_TAG],
  revalidate: 300,
});

export const getCategoryBySlug = cache(getCategoryBySlugDurable);

/** Admin-only: every category regardless of is_active, for the management list. */
export async function getCategoriesForAdmin(): Promise<Category[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").order("sort_order", { ascending: true });
  if (error) {
    if (process.env.NODE_ENV === "development") console.error("getCategoriesForAdmin:", error.message);
    return [];
  }
  return (data ?? []).map(mapCategory);
}

export async function getCategoryById(id: string): Promise<Category | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").eq("id", id).maybeSingle();
  if (error || !data) return null;
  return mapCategory(data);
}

/** Active categories with `businessCount` populated from real published
 * listings — for the 5 core verticals (hotels/restaurants/cafes/attractions/
 * events) that's every published row in their own table; for every other
 * category it's published `services` rows whose category_id matches. */
export async function getCategoriesWithCounts(targetTable?: CategoryTargetTable): Promise<Category[]> {
  return attachBusinessCounts(await getCategories(targetTable));
}

/** target_table values whose listings table has its own `category_id`
 * column — every category sharing one of these tables needs a per-category
 * grouped tally, not a table-wide head-count (unlike hotels/restaurants/
 * cafes/attractions/events, which each have exactly one implicit category). */
const GROUPED_COUNT_TABLES = ["services", "city_services"] as const;
type GroupedCountTable = (typeof GROUPED_COUNT_TABLES)[number];
function isGroupedCountTable(table: CategoryTargetTable): table is GroupedCountTable {
  return (GROUPED_COUNT_TABLES as readonly string[]).includes(table);
}

/** Shared by getCategoriesWithCounts (active-only) and the admin list (which
 * also needs counts for inactive categories) — takes whatever category list
 * the caller already has instead of re-fetching it. */
export async function attachBusinessCounts(categories: Category[]): Promise<Category[]> {
  if (categories.length === 0 || !isSupabaseConfigured()) return categories;

  const supabase = createPublicClient();
  const groupedTables = Array.from(new Set(categories.map((c) => c.targetTable).filter(isGroupedCountTable)));
  const verticalTables = Array.from(new Set(categories.map((c) => c.targetTable).filter((t) => !isGroupedCountTable(t))));

  const [groupedResultEntries, verticalCountEntries] = await Promise.all([
    Promise.all(
      groupedTables.map(async (table) => {
        const { data } = await supabase.from(table).select("category_id").eq("status", "published");
        const rows = (data ?? []) as { category_id: string | null }[];
        const counts = new Map<string, number>();
        for (const row of rows) {
          if (!row.category_id) continue;
          counts.set(row.category_id, (counts.get(row.category_id) ?? 0) + 1);
        }
        return [table, { counts, total: rows.length }] as const;
      })
    ),
    Promise.all(
      verticalTables.map(async (table) => {
        const { count } = await supabase.from(table).select("id", { count: "exact", head: true }).eq("status", "published");
        return [table, count ?? 0] as const;
      })
    ),
  ]);

  const groupedByTable = new Map(groupedResultEntries);
  const verticalCounts = new Map(verticalCountEntries);

  return categories.map((c) => {
    if (!isGroupedCountTable(c.targetTable)) {
      return { ...c, businessCount: verticalCounts.get(c.targetTable) ?? 0 };
    }
    const group = groupedByTable.get(c.targetTable);
    // A pinned row inside a grouped table (e.g. the single "City Services"
    // nav-entry row) represents the WHOLE vertical, not one sub-grouping
    // within it — no listing's category_id ever points at the umbrella row
    // itself, so a per-id tally would always read 0 for it. Its count is
    // every published row in the table instead.
    const businessCount = c.isPinned ? (group?.total ?? 0) : (group?.counts.get(c.id) ?? 0);
    return { ...c, businessCount };
  });
}

/** getVisibleCategories() with businessCount populated, filtered to
 * categories that actually have at least one published listing — what the
 * navbar and homepage category grid render. A category with zero listings
 * (never published anything yet, or just had its last listing removed) is
 * automatically excluded here with no code change ever needed elsewhere.
 * City Services member categories (Hospitals/Clinics/Pharmacies, Schools/
 * Universities/English Language Institutes, ...) are additionally collapsed
 * into their merged parent entry (see applyCityServiceCategoryGroups) —
 * the same grouping /city-services itself already shows — so the "More" nav
 * menu, which reads this list, never leaks an individual member category as
 * its own flat item. Cached (short TTL, not just React's per-request
 * cache()) since this now runs on every single page via the navbar — see
 * CATEGORIES_CACHE_TAG. */
const _getVisibleCategoriesWithCountsDurable = unstable_cache(
  async () => attachBusinessCounts(await getVisibleCategories()),
  ["visible-categories-with-counts"],
  { tags: [CATEGORIES_CACHE_TAG], revalidate: 60 }
);
const getVisibleCategoriesWithCountsCached = cache(_getVisibleCategoriesWithCountsDurable);

export async function getVisibleCategoriesWithCounts(): Promise<Category[]> {
  const categories = await getVisibleCategoriesWithCountsCached();
  // Every category — pinned primary sections (Hotels, Restaurants, Cafes,
  // City Services, Perfumes, ...) included — hides itself the moment it has
  // zero published listings, and reappears automatically the moment it has
  // one again. No category is ever force-shown regardless of real data.
  // Supermarket is deliberately NOT part of this: it isn't a `categories`
  // row at all (see SUPERMARKET_ENABLED in lib/config/features.ts and its
  // own hardcoded nav entry in site-header.tsx) — its "Coming Soon" nav
  // link and placeholder page are unaffected by this filter either way.
  return applyCityServiceCategoryGroups(categories.filter((c) => (c.businessCount ?? 0) > 0));
}

/** Resolves a free-text search query to a category when the query is really
 * a category name ("Hospital", "ATM", "Gas Station") rather than a business
 * name — used so search surfaces the whole category instead of relying on
 * literal name matches in listing rows. */
export async function matchCategoryFromQuery(query: string, targetTable: CategoryTargetTable = "services"): Promise<Category | null> {
  const needle = query.trim().toLowerCase();
  if (!needle) return null;

  const categories = await getCategories(targetTable);
  for (const category of categories) {
    if (category.name.toLowerCase() === needle) return category;
    for (const keyword of category.searchKeywords) {
      const kw = keyword.toLowerCase();
      if (kw === needle || needle.includes(kw) || kw.includes(needle)) return category;
    }
  }
  return null;
}
