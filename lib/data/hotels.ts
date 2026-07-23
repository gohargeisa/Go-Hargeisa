import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapHotel, mapReview } from "./mappers";
import { hotels as mockHotels } from "@/lib/mock-data";
import type { Hotel } from "@/types";

export async function getHotels(options?: { q?: string; featuredOnly?: boolean }): Promise<Hotel[]> {
  const { q, featuredOnly } = options ?? {};

  if (!isSupabaseConfigured()) {
    let results = mockHotels;
    if (featuredOnly) results = results.filter((h) => h.featured);
    if (q) {
      const needle = q.toLowerCase();
      results = results.filter(
        (h) =>
          h.name.toLowerCase().includes(needle) ||
          h.shortDescription.toLowerCase().includes(needle)
      );
    }
    return results;
  }

  const supabase = createPublicClient();
  let query = supabase
    .from("hotels")
    .select("*")
    .eq("status", "published")
    .order("featured", { ascending: false });

  if (featuredOnly) query = query.eq("featured", true);
  if (q)
    query = query.or(
      `name.ilike.%${q}%,short_description.ilike.%${q}%,address.ilike.%${q}%`
    );

  const { data, error } = await query;

  if (error) {
    if (process.env.NODE_ENV === "development") console.error("getHotels:", error.message);
    return mockHotels;
  }

  if (!data || data.length === 0) {
    return mockHotels;
  }

  return data.map((row) => mapHotel(row));
}

async function _getHotelBySlug(slug: string): Promise<Hotel | null> {
  if (!isSupabaseConfigured()) {
    return mockHotels.find((h) => h.slug === slug) ?? null;
  }

  const supabase = createPublicClient();
  const { data: hotel, error } = await supabase
    .from("hotels")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !hotel) {
    return mockHotels.find((h) => h.slug === slug) ?? null;
  }

  const { data: reviewRows } = await supabase
    .from("reviews")
    .select("*, profiles(full_name)")
    .eq("listing_type", "hotel")
    .eq("listing_id", hotel.id)
    .order("created_at", { ascending: false });

  const reviews = (reviewRows ?? []).map((r: any) =>
    mapReview(r, r.profiles?.full_name ?? "Guest")
  );

  return mapHotel(hotel, reviews);
}

/** Cached per-request: dedupes calls from generateMetadata + the page itself. */
export const getHotelBySlug = cache(_getHotelBySlug);

export async function getNearbyAttractionsForHotel(hotelId: string) {
  const { attractions: mockAttractions } = await import("@/lib/mock-data");
  const { mapAttraction } = await import("./mappers");

  if (!isSupabaseConfigured()) {
    const hotel = mockHotels.find((h) => h.id === hotelId);
    return mockAttractions.filter((a) =>
      hotel?.nearbyAttractionIds.includes(a.id)
    );
  }

  const supabase = createPublicClient();
  const { data: links } = await supabase
    .from("hotel_nearby_attractions" as any)
    .select("attraction_id")
    .eq("hotel_id", hotelId);

  const ids = (links ?? []).map((l: any) => l.attraction_id);

  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("attractions")
    .select("*")
    .in("id", ids);

  return (data ?? []).map((row) => mapAttraction(row));
}

export async function getAllHotelSlugs(): Promise<string[]> {
  if (!isSupabaseConfigured()) {
    return mockHotels.map((h) => h.slug);
  }

  const supabase = createPublicClient();
  const { data } = await supabase
    .from("hotels")
    .select("slug")
    .eq("status", "published");

  if (!data || data.length === 0) {
    return mockHotels.map((h) => h.slug);
  }

  return data.map((row) => row.slug);
}