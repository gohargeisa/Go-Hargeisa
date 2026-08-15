import type { GalleryImage } from "@/types";

/** Tags that unambiguously mean location/interior/lifestyle photography —
 * always keeps the existing cover-style presentation regardless of the
 * business's category, even for a product-oriented business photographing
 * its own storefront. Spans every existing per-type gallery vocabulary (see
 * lib/utils/gallery-categories.ts) since a caller only ever needs to check
 * against whichever tags its own images could actually carry. */
const LOCATION_TAGS = new Set([
  "exterior", "interior", "lobby", "rooms", "suites", "bathrooms",
  "dining_area", "kitchen", "outdoor_seating", "indoor_seating", "atmosphere",
  "staff", "pool", "gym", "conference_hall", "garden", "outdoor",
  "coffee", "food", "drinks", "desserts",
]);

/** Explicitly tagged as a product photo — see the "product" option added to
 * SERVICE_GALLERY_CATEGORIES. */
const PRODUCT_TAGS = new Set(["product"]);

export type GalleryImageFit = "cover" | "contain";

/**
 * Per-image "contain vs cover" decision for the hero gallery slider
 * (components/shared/hotel-gallery-slider.tsx) — an explicit per-image
 * category tag always wins; an untagged image falls back to the category-
 * level `supports_products` signal, the exact same flag already used
 * everywhere else in the app (Products catalog, Order Now) to mean "this
 * category sells physical products". That means existing untagged photos on
 * a product-category business (Cosmetics & Women's Beauty, Perfume Shops,
 * Flower Shops, ...) automatically get the safe "preserve the whole
 * product" treatment with zero manual re-tagging, while a non-product
 * category (or hotels/restaurants/cafes, which never pass
 * categorySupportsProducts at all) keeps the existing cover treatment
 * exactly as before.
 */
export function getGalleryImageFit(
  image: Pick<GalleryImage, "category"> | undefined,
  categorySupportsProducts: boolean
): GalleryImageFit {
  const category = image?.category;
  if (category && PRODUCT_TAGS.has(category)) return "contain";
  if (category && LOCATION_TAGS.has(category)) return "cover";
  return categorySupportsProducts ? "contain" : "cover";
}
