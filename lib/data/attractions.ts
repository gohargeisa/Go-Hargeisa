import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapAttraction, mapReview } from "./mappers";
import { attractions as mockAttractions } from "@/lib/mock-data";
import type { Attraction } from "@/types";

export async function getAttractions(options?: { q?: string; category?: string }): Promise<Attraction[]> {
  const { q, category } = options ?? {};

  if (!isSupabaseConfigured()) {
    let results = mockAttractions;
    if (category) results = results.filter((a) => a.category === category);
    if (q) {
      const needle = q.toLowerCase();
      results = results.filter(
        (a) => a.name.toLowerCase().includes(needle) || a.shortDescription.toLowerCase().includes(needle)
      );
    }
    return results;
  }

  const supabase = createPublicClient();
  let query = supabase
    .from("attractions")
    .select("*")
    .eq("status", "published")
    .order("featured", { ascending: false });
  if (category) query = query.eq("category", category as any);
  if (q) query = query.or(`name.ilike.%${q}%,short_description.ilike.%${q}%,address.ilike.%${q}%`);

  const { data, error } = await query;
  if (error) {
    console.error("getAttractions:", error.message);
    return [];
  }
  return (data ?? []).map((row) => mapAttraction(row));
}

async function _getAttractionBySlug(slug: string): Promise<Attraction | null> {
  if (!isSupabaseConfigured()) {
    return mockAttractions.find((a) => a.slug === slug) ?? null;
  }

  const supabase = createPublicClient();
  const { data: attraction, error } = await supabase.from("attractions").select("*").eq("slug", slug).single();
  if (error || !attraction) return null;

  const { data: reviewRows } = await supabase
    .from("reviews")
    .select("*, profiles(full_name)")
    .eq("listing_type", "attraction")
    .eq("listing_id", attraction.id)
    .order("created_at", { ascending: false });

  const reviews = (reviewRows ?? []).map((r: any) => mapReview(r, r.profiles?.full_name ?? "Guest"));
  return mapAttraction(attraction, reviews);
}

/** Cached per-request: dedupes calls from generateMetadata + the page itself. */
export const getAttractionBySlug = cache(_getAttractionBySlug);

export async function getNearbyForAttraction(attractionId: string) {
  const { restaurants: mockRestaurants, hotels: mockHotels } = await import("@/lib/mock-data");
  const { mapRestaurant, mapHotel } = await import("./mappers");

  if (!isSupabaseConfigured()) {
    const attraction = mockAttractions.find((a) => a.id === attractionId);
    return {
      restaurants: mockRestaurants.filter((r) => attraction?.nearbyRestaurantIds.includes(r.id)),
      hotels: mockHotels.filter((h) => attraction?.nearbyHotelIds.includes(h.id)),
    };
  }

  const supabase = createPublicClient();
  const [{ data: restaurantLinks }, { data: hotelLinks }] = await Promise.all([
    supabase.from("attraction_nearby_restaurants" as any).select("restaurant_id").eq("attraction_id", attractionId),
    supabase.from("attraction_nearby_hotels" as any).select("hotel_id").eq("attraction_id", attractionId),
  ]);

  const restaurantIds = (restaurantLinks ?? []).map((l: any) => l.restaurant_id);
  const hotelIds = (hotelLinks ?? []).map((l: any) => l.hotel_id);

  const [{ data: restaurantRows }, { data: hotelRows }] = await Promise.all([
    restaurantIds.length ? supabase.from("restaurants").select("*").in("id", restaurantIds) : { data: [] },
    hotelIds.length ? supabase.from("hotels").select("*").in("id", hotelIds) : { data: [] },
  ]);

  return {
    restaurants: (restaurantRows ?? []).map((row) => mapRestaurant(row)),
    hotels: (hotelRows ?? []).map((row) => mapHotel(row)),
  };
}

export async function getAllAttractionSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) return mockAttractions.map((a) => a.slug);
  const supabase = createPublicClient();
  const { data } = await supabase.from("attractions").select("slug").eq("status", "published");
  return (data ?? []).map((row) => row.slug);
}
