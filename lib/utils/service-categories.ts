/**
 * Small, category-data-free helpers for the /services vertical. The actual
 * category list (slugs, labels, icons, search keywords) lives in the
 * `categories` table — see lib/data/categories.ts — not here.
 */
export function serviceHref(categorySlug: string, listingSlug: string): string {
  return `/services/${categorySlug}/${listingSlug}`;
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
