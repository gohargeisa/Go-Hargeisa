import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapCityService, mapReview } from "./mappers";
import type { CityService, EssentialServiceCategory } from "@/types";

export interface CityServiceCategoryGroup {
  category: EssentialServiceCategory;
  items: CityService[];
}

/**
 * Fully dynamic — this is the ONLY query City Services' public surfaces run:
 * one fetch of every published row (regardless of category), grouped in JS
 * and sorted by real listing count, descending. A category with zero
 * published rows simply never appears in the result — no hardcoded category
 * list gates this, and no code change is ever needed when the first listing
 * in a new category goes live or the last one is removed. Within a category,
 * featured listings sort first, then by sort_order/created_at.
 *
 * No mock-data fallback: unlike every other content type, this directory is
 * meant to ship empty until the owner adds real entries, so "not
 * configured" and "configured but empty" both correctly render as no
 * categories at all.
 */
export async function getCityServicesGroupedByCategory(locale?: string): Promise<CityServiceCategoryGroup[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("city_services")
    .select("*")
    .eq("status", "published")
    .order("featured", { ascending: false })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    if (process.env.NODE_ENV === "development") console.error("getCityServicesGroupedByCategory:", error.message);
    return [];
  }

  const byCategory = new Map<EssentialServiceCategory, CityService[]>();
  for (const row of data ?? []) {
    const service = mapCityService(row, [], locale);
    const list = byCategory.get(service.category);
    if (list) list.push(service);
    else byCategory.set(service.category, [service]);
  }

  return Array.from(byCategory.entries())
    .map(([category, items]) => ({ category, items }))
    .sort((a, b) => b.items.length - a.items.length);
}

/** Category + count only (no item details) — used wherever only the
 * "which categories are non-empty, and how many places in each" summary is
 * needed (homepage tiles), so callers that don't need full listing details
 * aren't forced to also fetch/pass them around. */
export async function getCityServiceCategoryCounts(): Promise<{ category: EssentialServiceCategory; count: number }[]> {
  const groups = await getCityServicesGroupedByCategory();
  return groups.map((g) => ({ category: g.category, count: g.items.length }));
}

async function _getCityServiceBySlug(slug: string, locale?: string): Promise<CityService | null> {
  if (!isSupabaseConfigured()) return null;

  const supabase = createPublicClient();
  const { data: row, error } = await supabase.from("city_services").select("*").eq("slug", slug).single();
  if (error || !row) return null;

  const { data: reviewRows } = await supabase
    .from("reviews")
    .select("*, profiles(full_name)")
    .eq("listing_type", "city_service")
    .eq("listing_id", row.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const reviews = (reviewRows ?? []).map((r: any) => mapReview(r, r.profiles?.full_name ?? "Guest"));
  return mapCityService(row, reviews, locale);
}

/** Cached per-request: dedupes calls from generateMetadata + the page itself. */
export const getCityServiceBySlug = cache(_getCityServiceBySlug);

export async function getAllCityServiceSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = createPublicClient();
  const { data } = await supabase.from("city_services").select("slug").eq("status", "published");
  return (data ?? []).map((row) => row.slug);
}
