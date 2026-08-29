import type { Hotel } from "@/types";

/**
 * The generic `services` vertical (Travel Agencies, Apartments, Real
 * Estate, Electronics, Transportation, Flower Shops — target_table=
 * 'services' in the categories table) has been retired: its routes, data
 * layer, and /join conversion path were removed in favor of City Services
 * as the one public category system. This flag stays permanently `false`
 * — a handful of remaining consumers (lib/data/categories.ts's nav
 * visibility filter, lib/data/map-points.ts's city-map query,
 * lib/data/owner-dashboard.ts's platform-status list) key off it rather
 * than each hardcoding their own `false`. The `services` table and its
 * category rows are untouched — this only keeps them from surfacing
 * anywhere in the public app.
 */
export const SERVICES_PUBLIC_ENABLED = false;

/**
 * Hotel presentation mode — temporarily restricts the public site to a
 * single hotel while every other hotel is filtered out of every public
 * listing/search/carousel surface. Nothing is deleted: all hotels remain in
 * the database and fully visible in the admin dashboard (admin pages read
 * hotels directly, not through `filterHotelsForPresentation`). Flip
 * `HOTELS_PRESENTATION_MODE` back to `false` to restore every hotel
 * everywhere — no other change needed.
 */
export const HOTELS_PRESENTATION_MODE = true;
export const PRESENTATION_HOTEL_SLUG = "grand-haadi-hotel";

/** Applied by every PUBLIC page/section that lists hotels — never by admin pages. */
export function filterHotelsForPresentation<T extends Pick<Hotel, "slug">>(hotels: T[]): T[] {
  if (!HOTELS_PRESENTATION_MODE) return hotels;
  return hotels.filter((h) => h.slug === PRESENTATION_HOTEL_SLUG);
}

/**
 * Restaurants were re-enabled on 2026-07-31 alongside the platform-wide
 * restructure to only showcase official partners: every restaurant row was
 * removed (none were real partners yet), and /restaurants now shows
 * components/shared/restaurants-empty-state.tsx — a "be our first partner"
 * invite, not the generic components/shared/coming-soon-section.tsx — for
 * as long as the table stays empty. The moment a real restaurant is added,
 * the page automatically switches to the normal listing/search UI.
 */
export const RESTAURANTS_PUBLIC_ENABLED = true;
export const CAFES_PUBLIC_ENABLED = true;

/**
 * Tourist Attractions — removed from the main nav/mega-menu, homepage
 * "Browse by Category" grid, and footer "Explore" links per explicit
 * request (2026-08-08). Nothing is deleted: the `attractions` table, its
 * rows, /[locale]/attractions routes, and the admin CRUD are all untouched
 * — this only gates the categories-table-driven nav surfaces (see
 * getVisibleCategories in lib/data/categories.ts), same mechanism as
 * SERVICES_PUBLIC_ENABLED above. Flip back to `true` to restore the nav
 * entry — no other change needed.
 */
export const ATTRACTIONS_PUBLIC_ENABLED = false;

/**
 * Supermarket — a deliberately independent module (own future routes/data
 * layer, never the `categories`/`services` system — see
 * docs/supermarket-architecture.md). Currently only gates the static nav
 * link in site-header.tsx and the /supermarket placeholder page; there is
 * no listing data to filter yet.
 */
export const SUPERMARKET_ENABLED = true;

/**
 * Official Go Hargeisa Google Play listing — live as of 2026-08-29 (Early
 * Access). The homepage app-promotion section
 * (components/home/app-promotion-section.tsx) links its "Download on Google
 * Play" CTA straight to this URL. Never set this to a placeholder/guessed
 * URL — an unpublished app must never claim to be downloadable.
 */
export const GOOGLE_PLAY_URL = "https://play.google.com/store/apps/details?id=com.gohargeisa.app";
