import type { Hotel } from "@/types";

/**
 * Temporary kill switch for the public-facing Services feature (Phase 2).
 * Every public surface that shows or links to Services — the nav, the
 * homepage section, the Explore Hargeisa cards, the /services routes, and
 * the Interactive Map — reads this one flag, so re-enabling the feature is
 * a single-line flip back to `true`. Nothing about the underlying data,
 * schema, or components changes: the business dashboard, admin tools, and
 * the `services` table are untouched and keep working normally.
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
 * Temporary kill switches for the public-facing Restaurants and Cafes
 * listings, alongside Services above. The dedicated /restaurants and /cafes
 * pages stay reachable and show a "Coming Soon" section instead of 404ing
 * (unlike Services) — see components/shared/coming-soon-section.tsx. Data,
 * schema, and the admin dashboard are untouched; flip back to `true` to
 * fully restore both listings everywhere.
 */
export const RESTAURANTS_PUBLIC_ENABLED = false;
export const CAFES_PUBLIC_ENABLED = false;
