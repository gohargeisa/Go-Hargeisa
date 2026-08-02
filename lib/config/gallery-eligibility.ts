import type { EssentialServiceCategory, ServiceCategory } from "@/types";

/**
 * Which City Services categories get the premium photo gallery (multi-image
 * upload, thumbnail strip, click-to-open lightbox) vs. a single cover photo
 * only. Hotels/Restaurants/Cafes/Attractions/the `services` table's own
 * detail pages already get the full gallery unconditionally — this gate is
 * specifically for the mixed-bag city_services category set, where medical/
 * financial/civic/utility categories don't benefit from a photo gallery the
 * way leisure/tourism ones do. Single source of truth for both the admin
 * form (whether to show gallery management) and the public card (whether a
 * multi-photo listing opens a lightbox).
 */
const GALLERY_ELIGIBLE_CITY_SERVICE_CATEGORIES = new Set<EssentialServiceCategory>([
  "park_playground",
  "kids_family",
  "sports_club",
  "car_rental",
  "car_wash",
  "gym",
]);

export function cityServiceCategorySupportsGallery(category: EssentialServiceCategory): boolean {
  return GALLERY_ELIGIBLE_CITY_SERVICE_CATEGORIES.has(category);
}

/** Same gate for the richer `services` table's own (differently-shaped)
 * category enum — tour_company/car_rental/gym are the clear tourism/leisure
 * fits, apartment joins them since real-estate listings are inherently
 * photo-driven. Everything else in that enum is medical/financial/civic/
 * utility, matching the same spirit as the City Services exclusions. */
const GALLERY_ELIGIBLE_SERVICE_CATEGORIES = new Set<ServiceCategory>(["car_rental", "gym", "tour_company", "apartment"]);

export function serviceCategorySupportsGallery(category: ServiceCategory): boolean {
  return GALLERY_ELIGIBLE_SERVICE_CATEGORIES.has(category);
}
