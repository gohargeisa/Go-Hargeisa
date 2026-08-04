import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapService, mapReview } from "./mappers";
import { services as mockServices } from "@/lib/mock-data";
import { matchCategoryFromQuery } from "@/lib/utils/service-categories";
import type { Service, ServiceCategory } from "@/types";

export async function getServices(options?: {
  category?: ServiceCategory;
  q?: string;
  featuredOnly?: boolean;
  limit?: number;
}): Promise<Service[]> {
  const { category, q, featuredOnly, limit } = options ?? {};
  // A query like "Hospital" or "ATM" is a category name, not a business
  // name — resolve it to a category filter so results aren't limited to
  // businesses whose literal name happens to contain that word. Only
  // applies when no explicit category is already set (i.e. the /services
  // hub, not a /services/[category] sub-page which is already scoped).
  const categoryFromQuery = !category && q ? matchCategoryFromQuery(q) : null;

  if (!isSupabaseConfigured()) {
    let results = mockServices;
    if (category) results = results.filter((s) => s.category === category);
    if (featuredOnly) results = results.filter((s) => s.featured);
    if (categoryFromQuery) {
      results = results.filter((s) => s.category === categoryFromQuery);
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
  if (category) query = query.eq("category", category);
  if (featuredOnly) query = query.eq("featured", true);
  if (categoryFromQuery) {
    query = query.eq("category", categoryFromQuery);
  } else if (q) {
    query = query.or(`name.ilike.%${q}%,short_description.ilike.%${q}%,address.ilike.%${q}%`);
  }
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    if (process.env.NODE_ENV === "development") console.error("getServices:", error.message);
    return [];
  }
  return (data ?? []).map((row) => mapService(row));
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
  return mapService(service, reviews);
}

/** Cached per-request: dedupes calls from generateMetadata + the page itself. */
export const getServiceBySlug = cache(_getServiceBySlug);

export async function getAllServiceSlugs(): Promise<{ slug: string; category: ServiceCategory }[]> {
  if (!isSupabaseConfigured()) return mockServices.map((s) => ({ slug: s.slug, category: s.category }));
  const supabase = createPublicClient();
  const { data } = await supabase.from("services").select("slug, category").eq("status", "published");
  return (data ?? []).map((row) => ({ slug: row.slug, category: row.category as ServiceCategory }));
}
