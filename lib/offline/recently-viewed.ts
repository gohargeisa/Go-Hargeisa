import { idbGetAll, idbPut } from "@/lib/offline/db";
import { MAX_RECENTLY_VIEWED, RECENTLY_VIEWED_STORE } from "@/lib/offline/constants";

export type RecentlyViewedType = "hotels" | "restaurants" | "cafes" | "attractions" | "city-services";

export interface RecentlyViewedEntry {
  path: string; // full pathname, e.g. /en/hotels/oriental-hotel — also this store's keyPath
  type: RecentlyViewedType;
  slug: string;
  locale: string;
  title: string;
  image?: string;
  visitedAt: number;
}

/** Records a detail-page visit — only public page metadata (title, og:image,
 * path) already rendered by that page for social sharing; never anything
 * account-linked. Overwrites any existing entry for the same path, moving
 * it to the front on the next read (sorted by visitedAt). */
export async function recordVisit(entry: Omit<RecentlyViewedEntry, "visitedAt">): Promise<void> {
  await idbPut<RecentlyViewedEntry>(RECENTLY_VIEWED_STORE, { ...entry, visitedAt: Date.now() });
}

export async function getRecentlyViewed(): Promise<RecentlyViewedEntry[]> {
  const entries = await idbGetAll<RecentlyViewedEntry>(RECENTLY_VIEWED_STORE);
  return entries.sort((a, b) => b.visitedAt - a.visitedAt).slice(0, MAX_RECENTLY_VIEWED);
}
