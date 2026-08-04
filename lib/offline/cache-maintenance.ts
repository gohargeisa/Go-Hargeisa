import { idbDelete, idbGetAll } from "@/lib/offline/db";
import {
  CACHED_AT_HEADER,
  IMAGES_CACHE,
  LAST_SWEEP_STORAGE_KEY,
  MAX_CACHE_AGE_MS,
  MAX_IMAGE_ENTRIES,
  MAX_RECENTLY_VIEWED,
  RECENTLY_VIEWED_STORE,
  RUNTIME_CACHES,
  SWEEP_THROTTLE_MS,
} from "@/lib/offline/constants";
import type { RecentlyViewedEntry } from "@/lib/offline/recently-viewed";

/** Browser/WebView-only module — every export no-ops safely if called
 * somewhere `caches`/`indexedDB`/`localStorage` don't exist (defensive
 * only; callers are all client components). */

function isSweepDue(): boolean {
  if (typeof window === "undefined" || !window.localStorage) return false;
  try {
    const last = Number(window.localStorage.getItem(LAST_SWEEP_STORAGE_KEY) ?? 0);
    return Date.now() - last >= SWEEP_THROTTLE_MS;
  } catch {
    return false;
  }
}

function markSwept(): void {
  try {
    window.localStorage.setItem(LAST_SWEEP_STORAGE_KEY, String(Date.now()));
  } catch {
    // Best-effort — a failed write just means the next call re-sweeps sooner.
  }
}

async function cachedAtOf(cache: Cache, request: Request): Promise<number | null> {
  const response = await cache.match(request);
  const value = response?.headers.get(CACHED_AT_HEADER);
  return value ? Number(value) : null;
}

/** Deletes entries older than MAX_CACHE_AGE_MS. Entries with no
 * X-GH-Cached-At header at all (e.g. the install-time shell precache,
 * which never goes through the SW's withCachedAtHeader()) are left alone —
 * this only ages out what this feature itself stamped. */
async function sweepAgeFromCache(cacheName: string): Promise<void> {
  if (typeof caches === "undefined") return;
  const cache = await caches.open(cacheName);
  const requests = await cache.keys();
  const cutoff = Date.now() - MAX_CACHE_AGE_MS;

  await Promise.all(
    requests.map(async (request) => {
      const cachedAt = await cachedAtOf(cache, request);
      if (cachedAt !== null && cachedAt < cutoff) await cache.delete(request);
    })
  );
}

/** Trims gh-images-v1 down to MAX_IMAGE_ENTRIES, oldest-by-timestamp first. */
async function sweepImageCountCap(): Promise<void> {
  if (typeof caches === "undefined") return;
  const cache = await caches.open(IMAGES_CACHE);
  const requests = await cache.keys();
  if (requests.length <= MAX_IMAGE_ENTRIES) return;

  const withTimestamps = await Promise.all(
    requests.map(async (request) => ({ request, cachedAt: (await cachedAtOf(cache, request)) ?? 0 }))
  );
  withTimestamps.sort((a, b) => a.cachedAt - b.cachedAt);
  const excess = withTimestamps.length - MAX_IMAGE_ENTRIES;
  await Promise.all(withTimestamps.slice(0, excess).map(({ request }) => cache.delete(request)));
}

/** Trims the recentlyViewed IDB store to MAX_RECENTLY_VIEWED, newest kept. */
async function pruneRecentlyViewed(): Promise<void> {
  const entries = await idbGetAll<RecentlyViewedEntry>(RECENTLY_VIEWED_STORE);
  if (entries.length <= MAX_RECENTLY_VIEWED) return;
  const excess = [...entries].sort((a, b) => b.visitedAt - a.visitedAt).slice(MAX_RECENTLY_VIEWED);
  await Promise.all(excess.map((entry) => idbDelete(RECENTLY_VIEWED_STORE, entry.path)));
}

/**
 * 24h-throttled cache + IndexedDB sweep — enforces the 30-day age cap
 * (all runtime caches) and the 150-entry image count cap. Called from
 * NetworkSyncController on mount and on every reconnect (both throttle-
 * gated here, so cheap regardless of call frequency). Deliberately not run
 * from the service worker's `activate` handler — that only fires on
 * deploy-tied version bumps, not a real 30-day cadence.
 */
export async function runCacheSweepIfDue(): Promise<void> {
  if (!isSweepDue()) return;

  await Promise.all(RUNTIME_CACHES.map((name) => sweepAgeFromCache(name)));
  await sweepImageCountCap();
  await pruneRecentlyViewed();

  markSwept();
}
