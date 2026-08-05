import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapCafe, mapReview } from "./mappers";
import { cafes as mockCafes } from "@/lib/mock-data";
import { sanitizeSearchQuery } from "@/lib/utils/sanitize-search-query";
import type { Cafe } from "@/types";

export async function getCafes(options?: {
  q?: string;
  featuredOnly?: boolean;
  limit?: number;
  locale?: string;
}): Promise<Cafe[]> {
  const { q, featuredOnly, limit, locale } = options ?? {};

  if (!isSupabaseConfigured()) {
    let results = mockCafes;
    if (featuredOnly) results = results.filter((c) => c.featured);
    if (q) {
      const needle = q.toLowerCase();
      results = results.filter(
        (c) => c.name.toLowerCase().includes(needle) || c.shortDescription.toLowerCase().includes(needle)
      );
    }
    results = limit ? results.slice(0, limit) : results;
    return results.map((c) => ({
      ...c,
      description: (locale === "ar" && c.descriptionAr) || (locale === "so" && c.descriptionSo) || c.description,
    }));
  }

  const supabase = createPublicClient();
  let query = supabase
    .from("cafes")
    .select("*")
    .eq("status", "published")
    .order("is_pinned", { ascending: false })
    .order("featured", { ascending: false });
  if (featuredOnly) query = query.eq("featured", true);
  if (q) {
    const safeQ = sanitizeSearchQuery(q);
    if (safeQ) query = query.or(`name.ilike.%${safeQ}%,short_description.ilike.%${safeQ}%,address.ilike.%${safeQ}%`);
  }
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) {
    if (process.env.NODE_ENV === "development") console.error("getCafes:", error.message);
    return [];
  }
  return (data ?? []).map((row) => mapCafe(row, [], locale));
}

async function _getCafeBySlug(slug: string, locale?: string): Promise<Cafe | null> {
  if (!isSupabaseConfigured()) {
    const cafe = mockCafes.find((c) => c.slug === slug);
    if (!cafe) return null;
    return {
      ...cafe,
      description:
        (locale === "ar" && cafe.descriptionAr) || (locale === "so" && cafe.descriptionSo) || cafe.description,
    };
  }

  const supabase = createPublicClient();
  const { data: cafe, error } = await supabase.from("cafes").select("*").eq("slug", slug).single();
  if (error || !cafe) return null;

  const { data: reviewRows } = await supabase
    .from("reviews")
    .select("*, profiles(full_name)")
    .eq("listing_type", "cafe")
    .eq("listing_id", cafe.id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const reviews = (reviewRows ?? []).map((r: any) => mapReview(r, r.profiles?.full_name ?? "Guest"));
  return mapCafe(cafe, reviews, locale);
}

/** Cached per-request: dedupes calls from generateMetadata + the page itself. */
export const getCafeBySlug = cache(_getCafeBySlug);

export async function getAllCafeSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) return mockCafes.map((c) => c.slug);
  const supabase = createPublicClient();
  const { data } = await supabase.from("cafes").select("slug").eq("status", "published");
  return (data ?? []).map((row) => row.slug);
}
