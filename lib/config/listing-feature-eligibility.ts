import type { EssentialServiceCategory } from "@/types";

/**
 * City Services categories excluded from the new detail-page features
 * (reviews, opening-hours badge, amenities, video gallery, social links) —
 * explicitly named by the user: medical/financial/civic essentials where
 * a review score, "Open Now" badge chase, or a social-media row would be
 * either irrelevant or actively inappropriate. This is a single shared
 * exclusion set across every new feature (not a per-feature allow-list) —
 * simpler, one source of truth, and matches the "no visual clutter" intent:
 * a hospital showing an empty Amenities section because it's "eligible but
 * has no data" is exactly the clutter this avoids.
 *
 * Deliberately separate from lib/config/gallery-eligibility.ts's photo
 * gallery allow-list, which is a narrower, independent decision made for
 * photos specifically (only 6 of 24 categories) — not reused here since the
 * user's instruction for this initiative was explicitly "exclude these 4
 * categories," not "only include these 6."
 */
const EXCLUDED_CITY_SERVICE_CATEGORIES = new Set<EssentialServiceCategory>(["hospital", "pharmacy", "mosque", "bank"]);

export function cityServiceCategorySupportsNewFeatures(category: EssentialServiceCategory): boolean {
  return !EXCLUDED_CITY_SERVICE_CATEGORIES.has(category);
}
