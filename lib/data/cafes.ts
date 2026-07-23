import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapCafe, mapReview } from "./mappers";
import { cafes as mockCafes } from "@/lib/mock-data";
import type { Cafe } from "@/types";

export async function getCafes(options?: { q?: string; featuredOnly?: boolean }): Promise<Cafe[]> {
  const { q, featuredOnly } = options ?? {};

  if (!isSupabaseConfigured()) {
    let results = mockCafes;
    if (featuredOnly) results = results.filter((c) => c.featured);
    if (q) {
      const needle = q.toLowerCase();
      results = results.filter(
        (c) => c.name.toLowerCase().includes(needle) || c.shortDescription.toLowerCase().includes(needle)
      );
    }
    return results;
  }

  const supabase = createPublicClient();
  let query = supabase.from("cafes").select("*").eq("status", "published").order("featured", { ascending: false });
  if (featuredOnly) query = query.eq("featured", true);
  if (q) query = query.or(`name.ilike.%${q}%,short_description.ilike.%${q}%,address.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) {
    if (process.env.NODE_ENV === "development") console.error("getCafes:", error.message);
    return [];
  }
  return (data ?? []).map((row) => mapCafe(row));
}

async function _getCafeBySlug(slug: string): Promise<Cafe | null> {
  if (!isSupabaseConfigured()) {
    return mockCafes.find((c) => c.slug === slug) ?? null;
  }

  const supabase = createPublicClient();
  const { data: cafe, error } = await supabase.from("cafes").select("*").eq("slug", slug).single();
  if (error || !cafe) return null;

  const { data: reviewRows } = await supabase
    .from("reviews")
    .select("*, profiles(full_name)")
    .eq("listing_type", "cafe")
    .eq("listing_id", cafe.id)
    .order("created_at", { ascending: false });

  const reviews = (reviewRows ?? []).map((r: any) => mapReview(r, r.profiles?.full_name ?? "Guest"));
  return mapCafe(cafe, reviews);
}

/** Cached per-request: dedupes calls from generateMetadata + the page itself. */
export const getCafeBySlug = cache(_getCafeBySlug);

export async function getAllCafeSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) return mockCafes.map((c) => c.slug);
  const supabase = createPublicClient();
  const { data } = await supabase.from("cafes").select("slug").eq("status", "published");
  return (data ?? []).map((row) => row.slug);
}
