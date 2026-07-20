import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapHotel, mapRestaurant, mapCafe, mapAttraction } from "./mappers";
import type { Hotel, Restaurant, Cafe, Attraction } from "@/types";

type FavoriteEntry =
  | { kind: "hotel"; item: Hotel }
  | { kind: "restaurant"; item: Restaurant }
  | { kind: "cafe"; item: Cafe }
  | { kind: "attraction"; item: Attraction };

/**
 * Returns the signed-in user's favorited listings, resolved to full
 * objects across all four listing types. Returns an empty array when
 * Supabase isn't configured or nobody is signed in — the dashboard page
 * handles that state with its own auth guard before calling this.
 */
export async function getFavoritesForUser(userId: string): Promise<FavoriteEntry[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = await createClient();
  const { data: favorites, error } = await supabase.from("favorites").select("*").eq("user_id", userId);
  if (error || !favorites?.length) return [];

  const idsByType = {
    hotel: favorites.filter((f) => f.listing_type === "hotel").map((f) => f.listing_id),
    restaurant: favorites.filter((f) => f.listing_type === "restaurant").map((f) => f.listing_id),
    cafe: favorites.filter((f) => f.listing_type === "cafe").map((f) => f.listing_id),
    attraction: favorites.filter((f) => f.listing_type === "attraction").map((f) => f.listing_id),
  };

  const [hotelRows, restaurantRows, cafeRows, attractionRows] = await Promise.all([
    idsByType.hotel.length ? supabase.from("hotels").select("*").in("id", idsByType.hotel) : { data: [] },
    idsByType.restaurant.length
      ? supabase.from("restaurants").select("*").in("id", idsByType.restaurant)
      : { data: [] },
    idsByType.cafe.length ? supabase.from("cafes").select("*").in("id", idsByType.cafe) : { data: [] },
    idsByType.attraction.length
      ? supabase.from("attractions").select("*").in("id", idsByType.attraction)
      : { data: [] },
  ]);

  return [
    ...(hotelRows.data ?? []).map((row) => ({ kind: "hotel" as const, item: mapHotel(row) })),
    ...(restaurantRows.data ?? []).map((row) => ({ kind: "restaurant" as const, item: mapRestaurant(row) })),
    ...(cafeRows.data ?? []).map((row) => ({ kind: "cafe" as const, item: mapCafe(row) })),
    ...(attractionRows.data ?? []).map((row) => ({ kind: "attraction" as const, item: mapAttraction(row) })),
  ];
}
