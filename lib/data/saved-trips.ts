import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";

export interface SavedTripItem {
  id: string;
  listingType: "hotel" | "restaurant" | "cafe" | "attraction";
  listingId: string;
  name: string;
  image: string;
  href: string;
}

export interface SavedTrip {
  id: string;
  title: string;
  notes: string | null;
  createdAt: string;
  items: SavedTripItem[];
}

const HREF_SEGMENT: Record<SavedTripItem["listingType"], string> = {
  hotel: "hotels",
  restaurant: "restaurants",
  cafe: "cafes",
  attraction: "attractions",
};

export async function getSavedTripsForUser(userId: string): Promise<SavedTrip[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data: trips, error } = await supabase
    .from("saved_trips")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error || !trips?.length) return [];

  const { data: items } = await supabase
    .from("saved_trip_items")
    .select("*")
    .in(
      "trip_id",
      trips.map((t) => t.id)
    );

  const idsByType: Record<SavedTripItem["listingType"], string[]> = {
    hotel: [],
    restaurant: [],
    cafe: [],
    attraction: [],
  };
  for (const item of items ?? []) idsByType[item.listing_type as SavedTripItem["listingType"]].push(item.listing_id);

  const [hotelRows, restaurantRows, cafeRows, attractionRows] = await Promise.all([
    idsByType.hotel.length ? supabase.from("hotels").select("id, name, cover_image, slug").in("id", idsByType.hotel) : { data: [] },
    idsByType.restaurant.length
      ? supabase.from("restaurants").select("id, name, cover_image, slug").in("id", idsByType.restaurant)
      : { data: [] },
    idsByType.cafe.length ? supabase.from("cafes").select("id, name, cover_image, slug").in("id", idsByType.cafe) : { data: [] },
    idsByType.attraction.length
      ? supabase.from("attractions").select("id, name, cover_image, slug").in("id", idsByType.attraction)
      : { data: [] },
  ]);

  const lookup = new Map<string, { name: string; image: string; slug: string }>();
  for (const [rows] of [
    [hotelRows.data ?? []],
    [restaurantRows.data ?? []],
    [cafeRows.data ?? []],
    [attractionRows.data ?? []],
  ] as const) {
    for (const row of rows) lookup.set(row.id, { name: row.name, image: row.cover_image, slug: row.slug });
  }

  return trips.map((trip) => ({
    id: trip.id,
    title: trip.title,
    notes: trip.notes,
    createdAt: trip.created_at,
    items: (items ?? [])
      .filter((item) => item.trip_id === trip.id)
      .map((item) => {
        const listingType = item.listing_type as SavedTripItem["listingType"];
        const found = lookup.get(item.listing_id);
        return {
          id: item.id,
          listingType,
          listingId: item.listing_id,
          name: found?.name ?? "Removed listing",
          image: found?.image ?? "",
          href: found ? `/${HREF_SEGMENT[listingType]}/${found.slug}` : "#",
        };
      }),
  }));
}
