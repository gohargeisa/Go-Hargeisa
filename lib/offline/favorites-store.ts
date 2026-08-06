import { idbClear, idbGetAll, idbPut } from "@/lib/offline/db";
import { FAVORITES_STORE } from "@/lib/offline/constants";
import type { FavoriteEntry } from "@/components/dashboard/dashboard-tabs";

/** Only public listing-summary fields already visible on cards everywhere —
 * never email/phone/session/auth data. */
export interface OfflineFavorite {
  id: string; // `${kind}:${itemId}` — matches the favorites store's keyPath
  kind: FavoriteEntry["kind"];
  itemId: string;
  slug: string;
  name: string;
  address: string;
  image: string;
  rating: number;
  reviewCount: number;
  categorySlug?: string;
  locale: string;
  syncedAt: number;
}

/** Mirrors the current /dashboard favorites list into IndexedDB. Called
 * from DashboardTabs whenever its `favorites` prop changes — the only
 * point in the app where favorites data reaches the client today. Clears
 * and rewrites rather than diffing, since the incoming list is already the
 * full, authoritative set for this user. */
export async function syncFavorites(entries: FavoriteEntry[], locale: string): Promise<void> {
  await idbClear(FAVORITES_STORE);
  const now = Date.now();
  await Promise.all(
    entries.map((entry) =>
      idbPut<OfflineFavorite>(FAVORITES_STORE, {
        id: `${entry.kind}:${entry.item.id}`,
        kind: entry.kind,
        itemId: entry.item.id,
        slug: entry.item.slug,
        name: entry.item.name,
        address: entry.item.address,
        image: entry.item.coverImage,
        rating: entry.item.rating,
        reviewCount: entry.item.reviewCount,
        categorySlug: entry.item.categorySlug,
        locale,
        syncedAt: now,
      })
    )
  );
}

export async function getOfflineFavorites(): Promise<OfflineFavorite[]> {
  const favorites = await idbGetAll<OfflineFavorite>(FAVORITES_STORE);
  return favorites.sort((a, b) => a.name.localeCompare(b.name));
}

/** Called on sign-out so a previous user's saved businesses aren't readable
 * via the offline sheet on a shared device afterward. */
export async function clearOfflineFavorites(): Promise<void> {
  await idbClear(FAVORITES_STORE);
}
