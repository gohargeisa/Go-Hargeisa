/**
 * Shared tuning constants for the offline-caching feature. `public/sw.js` is
 * a plain static file the Next.js build never processes, so it can't import
 * this module — its own copies of these values are kept in sync by a
 * cross-reference comment there back to this file. Everything under
 * lib/offline/*.ts (page-context code) imports from here directly.
 */

export const OFFLINE_DB_NAME = "gohargeisa-offline";
export const OFFLINE_DB_VERSION = 1;

export const FAVORITES_STORE = "favorites";
export const RECENTLY_VIEWED_STORE = "recentlyViewed";

/** Cache Storage bucket names — must match public/sw.js exactly. */
export const SHELL_CACHE = "gh-shell-v1";
export const CONTENT_CACHE = "gh-content-v3";
export const IMAGES_CACHE = "gh-images-v1";
export const STATIC_CACHE = "gh-static-v1";
export const RUNTIME_CACHES = [CONTENT_CACHE, IMAGES_CACHE, STATIC_CACHE] as const;

/** Header the SW stamps onto every cached response so age can be swept from page context without a parallel IndexedDB metadata store. */
export const CACHED_AT_HEADER = "x-gh-cached-at";

export const MAX_CACHE_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
export const MAX_IMAGE_ENTRIES = 150;
export const MAX_RECENTLY_VIEWED = 20;

/** 24h throttle for the cache sweep — see lib/offline/cache-maintenance.ts. */
export const SWEEP_THROTTLE_MS = 24 * 60 * 60 * 1000;
export const LAST_SWEEP_STORAGE_KEY = "gh.offline.lastSweepAt";
