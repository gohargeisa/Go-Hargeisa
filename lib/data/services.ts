import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapService, mapReview } from "./mappers";
import { services as mockServices } from "@/lib/mock-data";
import { getServiceCategories, matchCategoryFromQuery } from "@/lib/data/categories";
import { sanitizeSearchQuery } from "@/lib/utils/sanitize-search-query";
import type { Service, Category } from "@/types";

/** Every `services`-vertical category, keyed by id — resolved once per
 * request and reused by every mapService() call so category display data
 * (slug/label/icon/color) never needs a per-row query. */
const getServiceCategoryMap = cache(async (): Promise<Map<string, Category>> => {
  const categories = await getServiceCategories();
  return new Map(categories.map((c) => [c.id, c]));
});

export async function getServices(options?: {
  categoryId?: string;
  q?: string;
  featuredOnly?: boolean;
  limit?: number;
}): Promise<Service[]> {
  const { categoryId, q, featuredOnly, limit } = options ?? {};
  // A query like "Hospital" or "ATM" is a category name, not a business
  // name — resolve it to a category filter so results aren't limited to
  // businesses whose literal name happens to contain that word. Only
  // applies when no explicit category is already set (i.e. the /services
  // hub, not a /services/[category] sub-page which is already scoped).
  const categoryFromQuery = !categoryId && q ? await matchCategoryFromQuery(q) : null;

  if (!isSupabaseConfigured()) {
    // Categories only exist in the database, so without Supabase configured
    // there's no id to filter mock services by category — mock mode only
    // supports the unscoped /services hub, not /services/[category].
    let results = mockServices;
    if (featuredOnly) results = results.filter((s) => s.featured);
    if (categoryFromQuery) {
      results = results.filter((s) => s.categorySlug === categoryFromQuery.slug);
    } else if (q) {
      const needle = q.toLowerCase();
      results = results.filter(
        (s) =>
          s.name.toLowerCase().includes(needle) ||
          s.shortDescription.toLowerCase().includes(needle) ||
          s.services.some((item) => item.toLowerCase().includes(needle))
      );
    }
    return limit ? results.slice(0, limit) : results;
  }

  const supabase = createPublicClient();
  let query = supabase
    .from("services")
    .select("*")
    .eq("status", "published")
    .order("featured", { ascending: false });
  if (categoryId) query = query.eq("category_id", categoryId);
  if (featuredOnly) query = query.eq("featured", true);
  if (categoryFromQuery) {
    query = query.eq("category_id", categoryFromQuery.id);
  } else if (q) {
    const safeQ = sanitizeSearchQuery(q);
    if (safeQ) query = query.or(`name.ilike.%${safeQ}%,short_description.ilike.%${safeQ}%,address.ilike.%${safeQ}%`);
  }
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    if (process.env.NODE_ENV === "development") console.error("getServices:", error.message);
    return [];
  }
  const categoryMap = await getServiceCategoryMap();
  return (data ?? []).map((row) => mapService(row, [], row.category_id ? categoryMap.get(row.category_id) : undefined));
}

async function _getServiceBySlug(slug: string): Promise<Service | null> {
  if (!isSupabaseConfigured()) {
    return mockServices.find((s) => s.slug === slug) ?? null;
  }

  const supabase = createPublicClient();
  const { data: service, error } = await supabase.from("services").select("*").eq("slug", slug).single();
  if (error || !service) return null;

  const { data: reviewRows } = await supabase
    .from("reviews")
    .select("*, profiles(full_name)")
    .eq("listing_type", "service")
    .eq("listing_id", service.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const reviews = (reviewRows ?? []).map((r: any) => mapReview(r, r.profiles?.full_name ?? "Guest"));
  const categoryMap = await getServiceCategoryMap();
  return mapService(service, reviews, service.category_id ? categoryMap.get(service.category_id) : undefined);
}

/** Cached per-request: dedupes calls from generateMetadata + the page itself. */
export const getServiceBySlug = cache(_getServiceBySlug);

export async function getAllServiceSlugs(): Promise<{ slug: string; categorySlug: string }[]> {
  if (!isSupabaseConfigured()) return mockServices.map((s) => ({ slug: s.slug, categorySlug: s.categorySlug }));
  const supabase = createPublicClient();
  const { data } = await supabase.from("services").select("slug, category_id").eq("status", "published");
  const categoryMap = await getServiceCategoryMap();
  return (data ?? [])
    .map((row) => {
      const category = row.category_id ? categoryMap.get(row.category_id) : undefined;
      return category ? { slug: row.slug, categorySlug: category.slug } : null;
    })
    .filter((row): row is { slug: string; categorySlug: string } => row !== null);
}
