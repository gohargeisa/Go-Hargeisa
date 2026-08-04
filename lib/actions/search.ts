"use server";

import { searchAllListings, getPopularListings, type SearchResults } from "@/lib/data/global-search";
import { getDestinations } from "@/lib/data/destinations";
import type { Destination } from "@/types";

/** Callable directly from the client search dropdown (components/shared/global-search.tsx). */
export async function searchGlobal(q: string, locale: string): Promise<SearchResults> {
  return searchAllListings(q, locale, 5);
}

/** The mobile search takeover's empty-query state ("Popular Hotels/Restaurants/Cafes/Attractions"). */
export async function getPopularListingsAction(locale: string): Promise<SearchResults> {
  return getPopularListings(locale, 4);
}

/** "Suggested Neighborhoods" in the search takeover's empty state — reuses
 * the /explore page's own destinations data (lib/data/destinations.ts);
 * this is a single-city app, so there's no real "suggested cities" list to
 * show instead. */
export async function getSuggestedNeighborhoods(limit = 6): Promise<Destination[]> {
  const all = await getDestinations();
  return all.slice(0, limit);
}
