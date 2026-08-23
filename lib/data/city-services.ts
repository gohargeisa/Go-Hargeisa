import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapCityService, mapReview } from "./mappers";
import { getCategories } from "./categories";
import type { CityService, Category } from "@/types";

export interface CityServiceCategoryGroup {
  category: Category;
  items: CityService[];
}

/**
 * Fully dynamic — group membership comes entirely from `city_services.category_id`
 * joined against the `categories` table. Deliberately fetches the FULL,
 * unfiltered category list (not getCategories("city_services")) — a
 * category's own `target_table` reflects its nominal home page, but a real
 * city_services row can reference one whose target_table says "services"
 * instead (e.g. "Flower Shops": nominally target_table='services', yet the
 * real row — Lavender — lives in city_services and links to it via
 * category_id). Filtering the lookup to target_table='city_services' would
 * silently drop that category from the map, so a fully real, published row
 * simply vanishes from every group with no error — exactly what happened
 * here before this fix. See lib/data/featured-partner-showcase.ts's
 * categoryById for the identical fix applied to that same root cause.
 *
 * One fetch of every published row (regardless of category), grouped in JS
 * and sorted by real listing count, descending. A category with zero
 * published rows, or one that's been deactivated in the admin panel, simply
 * never appears in the result — no hardcoded category list gates this, and
 * no code change is ever needed when the first listing in a new category
 * goes live, the last one is removed, or an admin creates a brand-new City
 * Services category. Within a category, featured listings sort first, then
 * by sort_order/created_at.
 *
 * No mock-data fallback: unlike every other content type, this directory is
 * meant to ship empty until the owner adds real entries, so "not
 * configured" and "configured but empty" both correctly render as no
 * categories at all.
 */
export async function getCityServicesGroupedByCategory(locale?: string): Promise<CityServiceCategoryGroup[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createPublicClient();
  const [{ data, error }, allCategories] = await Promise.all([
    supabase
      .from("city_services")
      .select("*")
      .eq("status", "published")
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    getCategories(),
  ]);

  if (error) {
    if (process.env.NODE_ENV === "development") console.error("getCityServicesGroupedByCategory:", error.message);
    return [];
  }

  // Excludes only the single umbrella "City Services" nav-entry row
  // (slug === "city-services") — every other category groups its listings
  // here regardless of is_pinned, since a sub-category can also be pinned to
  // its own top-level nav entry (e.g. Perfumes — see the matching comment in
  // categoryHref()) while still being a real, filterable sub-category whose
  // listings must appear here. Excluding all is_pinned rows previously
  // dropped Perfumes' listings from these groups entirely, even though the
  // rows themselves were published and correctly categorized — this line
  // must stay in sync with categoryHref()'s own umbrella-row check.
  // getCategories() already filters to is_active=true, so a deactivated
  // category's listings are excluded even though the rows themselves are
  // still published.
  const categoryById = new Map(allCategories.filter((c) => !(c.isPinned && c.slug === "city-services")).map((c) => [c.id, c]));

  const byCategory = new Map<string, { category: Category; items: CityService[] }>();
  for (const row of data ?? []) {
    const category = categoryById.get(row.category_id);
    if (!category) continue;
    const service = mapCityService(row, [], locale);
    const group = byCategory.get(category.id);
    if (group) group.items.push(service);
    else byCategory.set(category.id, { category, items: [service] });
  }

  return Array.from(byCategory.values()).sort((a, b) => b.items.length - a.items.length);
}

/** Category + count only (no item details) — used wherever only the
 * "which categories are non-empty, and how many places in each" summary is
 * needed (homepage tiles), so callers that don't need full listing details
 * aren't forced to also fetch/pass them around. */
export async function getCityServiceCategoryCounts(): Promise<{ category: Category; count: number }[]> {
  const groups = await getCityServicesGroupedByCategory();
  return groups.map((g) => ({ category: g.category, count: g.items.length }));
}

async function _getCityServiceBySlug(slug: string, locale?: string): Promise<CityService | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createPublicClient();
  const { data: row, error } = await supabase.from("city_services").select("*").eq("slug", slug).single();
  if (error || !row) return null;

  const [{ data: reviewRows }, { data: matchingCafe }] = await Promise.all([
    supabase
      .from("reviews")
      .select("*, profiles(full_name)")
      .eq("listing_type", "city_service")
      .eq("listing_id", row.id)
      .eq("status", "published")
      .order("created_at", { ascending: false }),
    // A city_services row's own real add-on vocabulary, when this business
    // was split out from a `cafes` row sharing the same slug (the
    // documented Lavender Café → Lavender Flowers pattern — see
    // CityService.flowerAddons). Matched by slug only, never by name, so
    // this never affects any other city_services row; a plain "not found"
    // (the overwhelming majority of listings) just means no add-ons, not
    // an error.
    supabase.from("cafes").select("flower_addons").eq("slug", row.slug).maybeSingle(),
  ]);

  const reviews = (reviewRows ?? []).map((r: any) => mapReview(r, r.profiles?.full_name ?? "Guest"));
  const flowerAddons = Array.isArray(matchingCafe?.flower_addons)
    ? (matchingCafe.flower_addons as unknown as CityService["flowerAddons"])
    : undefined;
  return mapCityService(row, reviews, locale, flowerAddons);
}

/** Cached per-request: dedupes calls from generateMetadata + the page itself. */
export const getCityServiceBySlug = cache(_getCityServiceBySlug);

export async function getAllCityServiceSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createPublicClient();
  const { data } = await supabase.from("city_services").select("slug").eq("status", "published");
  return (data ?? []).map((row) => row.slug);
}
