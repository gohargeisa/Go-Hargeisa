import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapRestaurant, mapReview } from "./mappers";
import { restaurants as mockRestaurants } from "@/lib/mock-data";
import type { Restaurant } from "@/types";

export async function getRestaurants(options?: { q?: string; featuredOnly?: boolean }): Promise<Restaurant[]> {
  const { q, featuredOnly } = options ?? {};

  if (!isSupabaseConfigured()) {
    let results = mockRestaurants;
    if (featuredOnly) results = results.filter((r) => r.featured);
    if (q) {
      const needle = q.toLowerCase();
      results = results.filter(
        (r) =>
          r.name.toLowerCase().includes(needle) ||
          r.shortDescription.toLowerCase().includes(needle) ||
          r.cuisine.some((c) => c.toLowerCase().includes(needle))
      );
    }
    return results;
  }

  const supabase = createPublicClient();
  let query = supabase
    .from("restaurants")
    .select("*")
    .eq("status", "published")
    .order("featured", { ascending: false });
  if (featuredOnly) query = query.eq("featured", true);
  if (q) query = query.or(`name.ilike.%${q}%,short_description.ilike.%${q}%,address.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) {
    if (process.env.NODE_ENV === "development") console.error("getRestaurants:", error.message);
    return [];
  }
  return (data ?? []).map((row) => mapRestaurant(row));
}

async function _getRestaurantBySlug(slug: string): Promise<Restaurant | null> {
  if (!isSupabaseConfigured()) {
    return mockRestaurants.find((r) => r.slug === slug) ?? null;
  }

  const supabase = createPublicClient();
  const { data: restaurant, error } = await supabase.from("restaurants").select("*").eq("slug", slug).single();
  if (error || !restaurant) return null;

  const { data: reviewRows } = await supabase
    .from("reviews")
    .select("*, profiles(full_name)")
    .eq("listing_type", "restaurant")
    .eq("listing_id", restaurant.id)
    .order("created_at", { ascending: false });

  const reviews = (reviewRows ?? []).map((r: any) => mapReview(r, r.profiles?.full_name ?? "Guest"));
  return mapRestaurant(restaurant, reviews);
}

/** Cached per-request: dedupes calls from generateMetadata + the page itself. */
export const getRestaurantBySlug = cache(_getRestaurantBySlug);

export async function getAllRestaurantSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) return mockRestaurants.map((r) => r.slug);
  const supabase = createPublicClient();
  const { data } = await supabase.from("restaurants").select("slug").eq("status", "published");
  return (data ?? []).map((row) => row.slug);
}
