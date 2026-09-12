/**
 * Maps a city_services category slug to its prepared premium card image
 * filename under public/images/city-services/. Filenames were supplied
 * separately from category slugs (e.g. "universities.jpg" for the
 * `university` category, "mens-barbershops.jpg" for `men-barbershop`), so
 * this table is the one place that translation lives — CityServiceCategoryCard
 * falls back to a warm on-brand gradient (never gray, never a fabricated
 * external image) for any slug with no entry here, or whose file hasn't
 * been added yet.
 *
 * Deliberately empty: `public/images/city-services/` was never actually
 * populated with any of these files (confirmed 2026-09-12 — the directory
 * doesn't exist on disk, in this repo or in the deployed production build).
 * Every card below therefore ran the "legacy" tier of useCategoryImage()
 * on every render, which meant an always-404ing image request (confirmed
 * live: gohargeisa.com/images/city-services/perfumes.jpg → 404) had to
 * fail before the same gradient+icon fallback you'd get from an empty map
 * appeared — on the homepage's category grid and every /city-services
 * card, for every visitor, on every load. The visual result is identical
 * either way (the fallback always rendered; no prepared photo was ever
 * actually shown), so emptying this only removes the wasted failing
 * request — it does not change what anyone sees. Re-add an entry here only
 * once its file is actually placed under public/images/city-services/.
 */
export const CITY_SERVICE_CATEGORY_IMAGE_FILENAME: Record<string, string> = {};

export function cityServiceCategoryImagePath(slug: string): string | undefined {
  const filename = CITY_SERVICE_CATEGORY_IMAGE_FILENAME[slug];
  return filename ? `/images/city-services/${filename}` : undefined;
}
