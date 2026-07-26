// Bumping this version purges every previously-cached response for existing
// visitors (see the `activate` handler below) — required once, to clear out
// everything the old cache-first strategy had pinned indefinitely (auth
// state, profile/avatar data, listing pages) with no way for a normal
// reload to ever refresh it short of Ctrl+Shift+R.
const CACHE_NAME = "visit-hargeisa-v2";
const OFFLINE_URLS = ["/en", "/manifest.json"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for everything. The previous cache-first strategy for
// non-navigation requests (images, data fetches, etc.) meant that once a
// URL was cached, it was served forever — including per-user data like
// avatar images and Supabase API responses — with no expiry and no way to
// pick up a change short of a hard reload. Network-first always prefers a
// fresh response and only falls back to the cache when the network request
// itself fails (offline), which is the only case this cache actually needs
// to serve.
self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  event.respondWith(
    fetch(request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      })
      .catch(() =>
        caches.match(request).then((cached) => cached || (request.mode === "navigate" ? caches.match("/en") : undefined))
      )
  );
});
