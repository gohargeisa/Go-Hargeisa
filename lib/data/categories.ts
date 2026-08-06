import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapCategory } from "./mappers";
import type { Category, CategoryTargetTable } from "@/types";

/** Public, active-only categories — the navbar, homepage, submission form,
 * and search all read from this instead of a hardcoded per-vocabulary list.
 * Cached per-request since most pages that need one category also render
 * the full list (nav + page body). */
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

export const getCategories = cache(_getCategories);

/** Every category the long-tail `services` vertical uses — its category
 * pages, submission form, search, sitemap, and admin dropdown all share
 * this one call instead of a static enum lookup. */
export function getServiceCategories(): Promise<Category[]> {
  return getCategories("services");
}

async function _getCategoryBySlug(slug: string): Promise<Category | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createPublicClient();
  const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).eq("is_active", true).maybeSingle();
  if (error || !data) return null;
  return mapCategory(data);
}

export const getCategoryBySlug = cache(_getCategoryBySlug);

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

/** Shared by getCategoriesWithCounts (active-only) and the admin list (which
 * also needs counts for inactive categories) — takes whatever category list
 * the caller already has instead of re-fetching it. */
export async function attachBusinessCounts(categories: Category[]): Promise<Category[]> {
  if (categories.length === 0 || !isSupabaseConfigured()) return categories;

  const supabase = createPublicClient();
  const needsServiceCounts = categories.some((c) => c.targetTable === "services");
  const verticalTables = Array.from(
    new Set(categories.filter((c) => c.targetTable !== "services").map((c) => c.targetTable))
  );

  const [serviceRows, verticalCountEntries] = await Promise.all([
    needsServiceCounts
      ? supabase.from("services").select("category_id").eq("status", "published")
      : Promise.resolve({ data: [] as { category_id: string | null }[] }),
    Promise.all(
      verticalTables.map(async (table) => {
        const { count } = await supabase.from(table).select("id", { count: "exact", head: true }).eq("status", "published");
        return [table, count ?? 0] as const;
      })
    ),
  ]);

  const serviceCounts = new Map<string, number>();
  for (const row of serviceRows.data ?? []) {
    if (!row.category_id) continue;
    serviceCounts.set(row.category_id, (serviceCounts.get(row.category_id) ?? 0) + 1);
  }
  const verticalCounts = new Map(verticalCountEntries);

  return categories.map((c) => ({
    ...c,
    businessCount: c.targetTable === "services" ? (serviceCounts.get(c.id) ?? 0) : (verticalCounts.get(c.targetTable) ?? 0),
  }));
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
