import { getHotels } from "./hotels";
import { getRestaurants } from "./restaurants";
import { getCafes } from "./cafes";
import { getAttractions } from "./attractions";
import { filterHotelsForPresentation, RESTAURANTS_PUBLIC_ENABLED, CAFES_PUBLIC_ENABLED } from "@/lib/config/features";

export type SearchResultType = "hotel" | "restaurant" | "cafe" | "attraction";

export interface SearchResultItem {
  type: SearchResultType;
  id: string;
  name: string;
  subtitle: string;
  image: string;
  href: string;
  rating: number;
  reviewCount: number;
}

export interface SearchResults {
  hotels: SearchResultItem[];
  restaurants: SearchResultItem[];
  cafes: SearchResultItem[];
  attractions: SearchResultItem[];
  total: number;
}

const EMPTY: SearchResults = { hotels: [], restaurants: [], cafes: [], attractions: [], total: 0 };

/**
 * Cross-category search — hotels, restaurants, cafes, and attractions in
 * parallel. Deliberately excludes the `services` table (SERVICES_PUBLIC_ENABLED
 * is false site-wide, same rule every other public surface follows — see
 * lib/config/features.ts) and city_services (no individual detail page to
 * link a result to). Respects HOTELS_PRESENTATION_MODE the same way the
 * /hotels listing page does, so search never surfaces a hotel the rest of
 * the site is hiding.
 */
export async function searchAllListings(q: string, locale: string, limitPerType = 6): Promise<SearchResults> {
  const trimmed = q.trim();
  if (!trimmed) return EMPTY;

  const [hotelsRaw, restaurantsRaw, cafesRaw, attractionsRaw] = await Promise.all([
    getHotels({ q: trimmed, limit: limitPerType + 10 }),
    RESTAURANTS_PUBLIC_ENABLED ? getRestaurants({ q: trimmed, limit: limitPerType }) : Promise.resolve([]),
    CAFES_PUBLIC_ENABLED ? getCafes({ q: trimmed, limit: limitPerType, locale }) : Promise.resolve([]),
    getAttractions({ q: trimmed }),
  ]);

  const hotels = filterHotelsForPresentation(hotelsRaw)
    .slice(0, limitPerType)
    .map((h) => ({
      type: "hotel" as const, id: h.id, name: h.name, subtitle: h.address, image: h.coverImage,
      href: `/hotels/${h.slug}`, rating: h.rating, reviewCount: h.reviewCount,
    }));

  const restaurants = restaurantsRaw
    .slice(0, limitPerType)
    .map((r) => ({
      type: "restaurant" as const, id: r.id, name: r.name, subtitle: r.address, image: r.coverImage,
      href: `/restaurants/${r.slug}`, rating: r.rating, reviewCount: r.reviewCount,
    }));

  const cafes = cafesRaw
    .slice(0, limitPerType)
    .map((c) => ({
      type: "cafe" as const, id: c.id, name: c.name, subtitle: c.address, image: c.coverImage,
      href: `/cafes/${c.slug}`, rating: c.rating, reviewCount: c.reviewCount,
    }));

  const attractions = attractionsRaw
    .slice(0, limitPerType)
    .map((a) => ({
      type: "attraction" as const, id: a.id, name: a.name, subtitle: a.address, image: a.coverImage,
      href: `/attractions/${a.slug}`, rating: a.rating, reviewCount: a.reviewCount,
    }));

  return {
    hotels,
    restaurants,
    cafes,
    attractions,
    total: hotels.length + restaurants.length + cafes.length + attractions.length,
  };
}
