/**
 * Imagery for the Mama & Baby Care storefront.
 *
 * Product/hero/gallery images below are the shop's OWN real product
 * photography (public/images/partners/mama-baby-care/, prepared by
 * scripts/prepare-mama-baby-care-images.mjs from the 42 photos supplied on
 * the owner's desktop, Sept 2026). This shop's own photos are flat-lay/
 * studio product shots only — no photos of children wearing the clothes or
 * in-store moments — so the hero stays a clean editorial arrangement of
 * real product photos rather than a fabricated "family moment" scene.
 *
 * The two MAMA_BABY_CARE_LIFESTYLE_IMAGES below are the one deliberate
 * exception: licensed stock (Pexels, prepared by
 * scripts/prepare-mama-baby-care-lifestyle-images.mjs), used ONLY in the
 * storefront's "Little moments, beautifully cared for" band, and always
 * shown with a visible "photos are illustrative" caption
 * (mamaBabyCareStorefront.lifestyleIllustrativeNote) — never presented as
 * this shop's own customers, staff, or premises. Source: Pexels
 * (https://www.pexels.com) — Pexels License: free for commercial and
 * personal use, no attribution required, modification allowed; may not be
 * sold unaltered and may not imply endorsement by an identifiable person.
 * Same sourcing pattern already used for Al-Hikma's illustrative gallery
 * (see lib/config/al-hikma-media.ts) — self-hosted, original photo IDs
 * recorded per entry, never hotlinked from images.pexels.com.
 *
 * If the owner later supplies real lifestyle photography of their own
 * (children wearing the clothes, in-store moments), swap these constants
 * for that — every other part of the storefront is unaffected.
 */

const BASE = "/images/partners/mama-baby-care";

/** Hero: a small curated collage, not one single photo standing in for the
 * whole shop. All three carry real garments already in the catalog. */
export const MAMA_BABY_CARE_HERO_IMAGES = {
  primary: `${BASE}/kids-clothing/mint-seashell-print-dress.jpg`,
  secondary: `${BASE}/kids-clothing/floral-tiered-maxi-dress.jpg`,
  tertiary: `${BASE}/baby-clothing/giraffe-dungaree-set.jpg`,
} as const;

/** "Little moments, beautifully cared for" band — licensed Pexels stock,
 * always paired with the illustrative-note caption in the UI. */
export const MAMA_BABY_CARE_LIFESTYLE_IMAGES = {
  /** A warm mother-and-newborn embrace. Pexels #34566653, photographer Eric Moura. */
  primary: `${BASE}/lifestyle/mother-and-newborn-embrace.jpg`,
  /** Elegant children's fashion, studio pastel styling. Pexels #5893841, photographer Shkraba Anthony. */
  secondary: `${BASE}/lifestyle/girls-pastel-fashion-studio.jpg`,
} as const;

/** Gallery — lead image first, a curated cross-section of the catalog
 * (not a repetitive wall of 38 near-duplicate flat-lays). */
export const MAMA_BABY_CARE_GALLERY_IMAGES: { url: string; alt: string }[] = [
  { url: `${BASE}/kids-clothing/mint-seashell-print-dress.jpg`, alt: "Mint seashell and starfish print dress" },
  { url: `${BASE}/kids-clothing/floral-tiered-maxi-dress.jpg`, alt: "Floral tiered maxi dress" },
  { url: `${BASE}/baby-clothing/giraffe-dungaree-set.jpg`, alt: "Giraffe-applique dungaree and t-shirt set" },
  { url: `${BASE}/kids-clothing/boys-palm-print-shirt-shorts-set.jpg`, alt: "Boys' palm-print shirt and shorts set" },
  { url: `${BASE}/shoes/strappy-sandals-multicolor.jpg`, alt: "Strappy sandals in multiple colours" },
  { url: `${BASE}/accessories/purple-flower-headband.jpg`, alt: "Purple flower headband" },
  { url: `${BASE}/kids-clothing/pink-striped-bow-dress.jpg`, alt: "Pink striped dress with bow detail" },
  { url: `${BASE}/kids-clothing/mint-linen-belted-dress.jpg`, alt: "Mint linen belted dress" },
  { url: `${BASE}/baby-essentials/tommee-tippee-bottles.jpg`, alt: "Baby feeding bottle set" },
];
