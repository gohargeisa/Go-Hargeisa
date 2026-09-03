/**
 * Small, category-data-free helpers for the /services vertical. The actual
 * category list (slugs, labels, icons, search keywords) lives in the
 * `categories` table — see lib/data/categories.ts — not here.
 */
/**
 * Where a legacy `services`-vertical listing links to.
 *
 * The standalone `/services/<category>/<slug>` route was retired
 * (SERVICES_PUBLIC_ENABLED = false; that page no longer exists, and
 * middleware.ts only redirects the bare `/services` index). Legacy `service`
 * rows still surface through favourites, saved trips, past reviews and the
 * city-map — those must not point at a dead URL, so every one now resolves
 * to the City Services hub (the same fallback `categoryHref()` uses for a
 * `target_table = 'services'` category). `?category=` is kept as a hint:
 * CityServicesPageClient ignores an unknown slug and just shows everything.
 */
export function serviceHref(categorySlug: string, _listingSlug: string): string {
  return categorySlug ? `/city-services?category=${categorySlug}` : `/city-services`;
}

/** "Hospitals" -> "Hospital", "Pharmacies" -> "Pharmacy". Good enough for the
 * handful of category names this app has; not a general English singularizer.
 * Compound names ("Flowers & Gifts") are left as-is — naively stripping the
 * trailing "s" only singularizes the last word, producing "Flowers & Gift". */
export function singularize(label: string): string {
  if (label.includes(" & ")) return label;
  if (label.endsWith("ies")) return `${label.slice(0, -3)}y`;
  if (label.endsWith("s")) return label.slice(0, -1);
  return label;
}
