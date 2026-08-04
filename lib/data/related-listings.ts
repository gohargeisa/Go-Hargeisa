import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapHotel, mapRestaurant, mapCafe, mapAttraction } from "./mappers";
import { filterHotelsForPresentation } from "@/lib/config/features";
import type { Hotel, Restaurant, Cafe, Attraction } from "@/types";

type RelatedListingType = "hotel" | "restaurant" | "cafe" | "attraction";

/**
 * Same-category "you may also like" recommendations — consolidates what
 * every detail page previously did inline (fetch every row in the table
 * via getHotels()/getRestaurants()/getCafes()/getAttractions(), then
 * `.filter(x => x.id !== current).slice(0, limit)` in JS). Replaced with a
 * direct query that excludes the current listing and limits at the
 * database level — the old approach fetched the entire table just to throw
 * away all but 4 rows. Answers a different question than
 * lib/data/nearby.ts's cross-category, real-distance "Nearby Places" — this
 * is same-category similarity, not proximity.
 */
export async function getRelatedListings<T extends RelatedListingType>(
  type: T,
  currentId: string,
  limit = 4
): Promise<T extends "hotel" ? Hotel[] : T extends "restaurant" ? Restaurant[] : T extends "cafe" ? Cafe[] : Attraction[]> {
  if (!isSupabaseConfigured()) return [] as never;

  const supabase = createPublicClient();
  const table = type === "hotel" ? "hotels" : type === "restaurant" ? "restaurants" : type === "cafe" ? "cafes" : "attractions";

  // Hotel presentation mode restricts the public site to one hotel, so a
  // plain LIMIT would often return zero once the excluded/filtered rows are
  // removed — over-fetch a bit and let filterHotelsForPresentation trim it,
  // same safety margin the rest of this app already uses for that flag.
  const fetchLimit = type === "hotel" ? limit + 20 : limit + 4;

  const { data } = await supabase
    .from(table)
    .select("*")
    .eq("status", "published")
    .neq("id", currentId)
    .order("rating", { ascending: false })
    .limit(fetchLimit);

  const rows = data ?? [];

  if (type === "hotel") {
    const hotels = filterHotelsForPresentation((rows as never[]).map((r) => mapHotel(r as never))).slice(0, limit);
    return hotels as never;
  }
  if (type === "restaurant") return (rows as never[]).map((r) => mapRestaurant(r as never)).slice(0, limit) as never;
  if (type === "cafe") return (rows as never[]).map((r) => mapCafe(r as never)).slice(0, limit) as never;
  return (rows as never[]).map((r) => mapAttraction(r as never)).slice(0, limit) as never;
}
