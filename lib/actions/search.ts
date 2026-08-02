"use server";

import { searchAllListings, type SearchResults } from "@/lib/data/global-search";

/** Callable directly from the client search dropdown (components/shared/global-search.tsx). */
export async function searchGlobal(q: string, locale: string): Promise<SearchResults> {
  return searchAllListings(q, locale, 5);
}
