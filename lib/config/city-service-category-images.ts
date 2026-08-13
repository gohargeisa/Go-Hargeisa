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
 * `auto-repair` has no prepared filename yet — add one (suggested:
 * auto-repair.jpg) and a row here once it exists.
 *
 * "education" and "perfumes-cosmetics" are not real category slugs (there
 * is no `categories` row for either) — they're the purely-presentational
 * Schools+Universities and Perfumes+Cosmetics groupings built in
 * CityServicesPageClient, keyed here the same way so each gets the same
 * premium image treatment as every real category.
 */
export const CITY_SERVICE_CATEGORY_IMAGE_FILENAME: Record<string, string> = {
  hospital: "hospital.jpg",
  clinic: "clinic.jpg",
  school: "school.jpg",
  university: "universities.jpg",
  education: "education.jpg",
  pharmacy: "pharmacy.jpg",
  "perfume-shop": "perfumes.jpg",
  "perfumes-cosmetics": "perfumes.jpg",
  "kids-family": "kids-family.jpg",
  "men-barbershop": "mens-barbershops.jpg",
  "beauty-salon": "beauty-salons.jpg",
  "car-rental": "car-rental.jpg",
  "car-wash": "car-wash.jpg",
  "gym": "gym-sports-clubs.jpg",
  "park-playground": "parks-playgrounds.jpg",
  "taxi-service": "taxi-services.jpg",
  "cosmetics-beauty": "cosmetics-womens-beauty.jpg",
};

export function cityServiceCategoryImagePath(slug: string): string | undefined {
  const filename = CITY_SERVICE_CATEGORY_IMAGE_FILENAME[slug];
  return filename ? `/images/city-services/${filename}` : undefined;
}
