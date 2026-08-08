// Go Hargeisa service worker — intelligent offline caching (not a fully
// offline app). Four cache buckets, replacing the single network-first
// "visit-hargeisa-v2" cache this file used to have:
//   - gh-shell-v1:   install-time precache, last-resort fallback only
//   - gh-content-v3: navigations + Next.js RSC differential fetches — Network-First, cache is a fallback only
//   - gh-images-v1:  /_next/image + <img>/<Image> requests — Cache-First + background revalidate
//   - gh-static-v1:  /_next/static/* hashed build assets — Cache-First
//
// This file is a static asset the Next.js build never processes, so it
// can't import lib/offline/constants.ts — the values below are kept in
// sync with that file by hand; bump every *_CACHE name there together with
// the ones here if either changes.
//
// Bumping any cache name purges it for existing visitors on the next
// `activate` (see below) — the same one-time mechanism the old v1→v2 bump
// used to clear out indefinitely-pinned auth/profile data. gh-content
// bumped v1->v2 for exactly this class of incident once already: a deploy
// changed the shape of server-rendered data for a stale-while-revalidate'd
// page (City Services' category grouping, enum string -> full category
// object) without this cache version changing, so any visitor whose
// browser served a pre-deploy cached response paired it with post-deploy
// client JS that expected the new shape, e.g. `group.category.id` reads on
// a plain string. A one-time version bump only fixes the visitors affected
// at that moment — it does nothing to prevent the same class recurring on
// the next deploy, which is exactly what happened again (reported as a
// white/blank screen on desktop browsers that self-corrected only once
// navigation hit a URL not already in this cache, e.g. switching locale).
// gh-content bumped v2->v3 here alongside the real fix: navigations/RSC
// fetches are no longer served stale-first at all (see networkFirst below)
// — an online visitor now always gets the document that matches the
// currently-deployed build, and the cache is purely an offline fallback,
// never a source of truth while online. The version bump just clears out
// every stale v2 entry already sitting in returning visitors' caches so
// they don't have to wait for that entry to individually get overwritten.

const SHELL_CACHE = "gh-shell-v1";
const CONTENT_CACHE = "gh-content-v3";
const IMAGES_CACHE = "gh-images-v1";
const STATIC_CACHE = "gh-static-v1";
const ALL_CACHES = [SHELL_CACHE, CONTENT_CACHE, IMAGES_CACHE, STATIC_CACHE];

const OFFLINE_URLS = ["/en", "/manifest.json"];
const CACHED_AT_HEADER = "x-gh-cached-at";

// Never intercepted — Server Actions are POST (filtered before any of this
// runs), and the entire authenticated surface plus API routes are excluded
// here so a shared device can never be served another signed-in user's
// cached page body. Locale prefix (/en, /ar, /so) is stripped before
// testing so this matches /en/dashboard, /so/admin/x, /ar/business, etc.
const EXCLUDED_PATH_RE = /^\/(dashboard|admin|business|auth)(\/|$)/;
const API_PATH_RE = /^\/api\//;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(OFFLINE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !ALL_CACHES.includes(k)).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function localeStrippedPathname(pathname) {
  return pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "");
}

function isExcludedPath(pathname) {
  if (API_PATH_RE.test(pathname)) return true;
  return EXCLUDED_PATH_RE.test(localeStrippedPathname(pathname));
}

function isImageRequest(request, url) {
  return request.destination === "image" || url.pathname.startsWith("/_next/image");
}

function isStaticAsset(url) {
  return url.pathname.startsWith("/_next/static/");
}

/** Re-wraps a response with a same-value body, stamping the header used to
 * track cache age from page context (see lib/offline/cache-maintenance.ts)
 * without a parallel IndexedDB metadata store. */
function withCachedAtHeader(response) {
  const headers = new Headers(response.headers);
  headers.set(CACHED_AT_HEADER, String(Date.now()));
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

/** Cheap "did this actually change" heuristic (Content-Length/Last-Modified)
 * so open tabs only get told to silently refresh when there's a real reason
 * to, not on every background revalidation. */
function notifyClientsIfChanged(url, previousResponse, nextResponse) {
  const changed =
    !previousResponse ||
    previousResponse.headers.get("content-length") !== nextResponse.headers.get("content-length") ||
    previousResponse.headers.get("last-modified") !== nextResponse.headers.get("last-modified");
  if (!changed) return;

  self.clients.matchAll({ type: "window" }).then((clients) => {
    for (const client of clients) client.postMessage({ type: "GH_CONTENT_UPDATED", url });
  });
}

/** Navigations + RSC fetches: always try the network first, so an online
 * visitor's document always matches the currently-deployed build — never
 * served from a cache that could be one or more deploys behind. The cache
 * is written only as an offline fallback (and to feed
 * notifyClientsIfChanged, unchanged from before) and is only ever *read*
 * back when the network fetch itself fails, e.g. genuinely offline. */
function networkFirst(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    fetch(request)
      .then((response) => {
        if (!response || !response.ok) return response;
        const stamped = withCachedAtHeader(response.clone());
        return cache.match(request).then((previouslyCached) => {
          notifyClientsIfChanged(request.url, previouslyCached, stamped);
          cache.put(request, stamped);
          return response;
        });
      })
      .catch(() =>
        cache.match(request).then((cached) => cached || (request.mode === "navigate" ? caches.match("/en") : undefined))
      )
  );
}

function cacheFirst(request, cacheName) {
  return caches.open(cacheName).then((cache) =>
    cache.match(request).then((cached) => {
      if (cached) {
        // Serve instantly; refresh in the background so the next request
        // for this exact URL sees updated bytes — this is what "refresh
        // images on reconnect" means, with no separate reconnect-side code.
        fetch(request)
          .then((response) => {
            if (response && response.ok) cache.put(request, withCachedAtHeader(response.clone()));
          })
          .catch(() => {});
        return cached;
      }

      return fetch(request).then((response) => {
        if (response && response.ok) cache.put(request, withCachedAtHeader(response.clone()));
        return response;
      });
    })
  );
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return; // Server Actions and any other mutation are untouched

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // Supabase/any cross-origin call — untouched
  if (isExcludedPath(url.pathname)) return; // auth-gated surface + /api/* — network-only, untouched

  if (isImageRequest(request, url)) {
    event.respondWith(cacheFirst(request, IMAGES_CACHE));
  } else if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE));
  } else {
    // Covers Home, Hotels, Restaurants, Cafes, Attractions, City Services,
    // and every business detail page with one rule — none of their
    // pathnames match isExcludedPath, so they all land here automatically.
    event.respondWith(networkFirst(request, CONTENT_CACHE));
  }
});

// Android/Chrome-only enhancement — the Background Sync API has no iOS
// WKWebView support, so this listener simply never fires there (a normal
// no-op, not an error). Registered from components/shared/network-sync-
// controller.tsx on reconnect when supported. Kept deliberately small and
// bounded (just the shell precache) rather than duplicating the page's own
// "refresh current route" logic here, which the SW has no reliable way to
// know regardless.
self.addEventListener("sync", (event) => {
  if (event.tag !== "gh-reconnect-sync") return;
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) =>
      Promise.all(
        OFFLINE_URLS.map((url) =>
          fetch(url)
            .then((response) => {
              if (response && response.ok) cache.put(url, withCachedAtHeader(response.clone()));
            })
            .catch(() => {})
        )
      )
    )
  );
});
