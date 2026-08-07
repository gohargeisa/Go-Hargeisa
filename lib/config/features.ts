import type { Hotel } from "@/types";

/**
 * Public-facing Services feature switch. Every public surface that shows or
 * links to Services — the nav, the homepage section, the Explore Hargeisa
 * cards, the /services routes, and the Interactive Map — reads this one
 * flag. Re-enabled so long-tail categories (Flower Shops, Travel Agencies,
 * Real Estate, ...) converted from /join business requests are publicly
 * discoverable immediately, matching every other category's behavior.
 */
export const SERVICES_PUBLIC_ENABLED = true;

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
 * Supermarket — a deliberately independent module (own future routes/data
 * layer, never the `categories`/`services` system — see
 * docs/supermarket-architecture.md). Currently only gates the static nav
 * link in site-header.tsx and the /supermarket placeholder page; there is
 * no listing data to filter yet.
 */
export const SUPERMARKET_ENABLED = true;
