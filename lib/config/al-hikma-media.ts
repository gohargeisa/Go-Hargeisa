import type { GalleryImage } from "@/types";

/**
 * Illustrative imagery for the Al-Hikma Hijama & Wellness Centre storefront.
 *
 * The clinic has supplied no photography of its own yet — its `city_services`
 * row has `image`, `logo_url`, `gallery` and `videos` all empty. Until it
 * does, these licensed stock photos stand in as ATMOSPHERIC / ILLUSTRATIVE
 * imagery of Hijama, cupping and calm treatment settings. They are never
 * captioned or presented as the actual Al-Hikma premises, and no depicted
 * person is presented as Al-Hikma's staff or as endorsing the clinic — the
 * storefront shows a visible "photos are illustrative" line wherever they
 * appear (alHikmaStorefront.illustrativeNote).
 *
 * Source: Pexels (https://www.pexels.com) — Pexels License: free for
 * commercial and personal use, no attribution required, modification
 * allowed; may not be sold unaltered and may not imply endorsement by an
 * identifiable person. Original photo IDs are recorded per entry. Files were
 * downloaded, resized and re-compressed into public/images/partners/al-hikma/photos/
 * (self-hosted — the page never hotlinks images.pexels.com).
 *
 * The storefront prefers the clinic's own `service.gallery` rows the moment
 * any are uploaded through Admin → City Services — see al-hikma-storefront.tsx,
 * which only falls back to this set when `service.gallery` is empty.
 */

const BASE = "/images/partners/al-hikma/photos";

/** Wide, warm treatment-room shot — the storefront hero background. Pexels #6560308. */
export const AL_HIKMA_HERO_IMAGE = `${BASE}/treatment-room-2.jpg`;

/** Practitioner laying out sterile cups before a session — the overview band. Pexels #11581415. */
export const AL_HIKMA_OVERVIEW_IMAGE = `${BASE}/cupping-prep.jpg`;

/** Per-service card thumbnails. */
export const AL_HIKMA_SERVICE_IMAGES = {
  hijama: `${BASE}/cupping-application.jpg`, // Pexels #8312866
  wet: `${BASE}/cupping-session.jpg`, // Pexels #8312822
  dry: `${BASE}/cupping-cups.jpg`, // Pexels #8312789
  massage: `${BASE}/massage.jpg`, // Pexels #7235064
} as const;

/**
 * Gallery set (first entry is the large lead image). `alt` text is generic
 * and never claims the photo is Al-Hikma's own room or staff.
 */
export const AL_HIKMA_ILLUSTRATIVE_GALLERY: GalleryImage[] = [
  { url: `${BASE}/cupping-application.jpg`, alt: "A practitioner applying cups during a Hijama session", category: "treatments" }, // #8312866
  { url: `${BASE}/treatment-room-2.jpg`, alt: "A warm, private treatment room prepared for a session", category: "space" }, // #6560308
  { url: `${BASE}/cupping-overhead.jpg`, alt: "Cups placed along the upper back during a cupping session", category: "treatments" }, // #8312856
  { url: `${BASE}/cupping-prep.jpg`, alt: "Sterile cupping equipment laid out before a session", category: "treatments" }, // #11581415
  { url: `${BASE}/treatment-room-1.jpg`, alt: "A calm treatment space with soft, natural light", category: "space" }, // #36837604
  { url: `${BASE}/cupping-session.jpg`, alt: "A cupping session in a calm, candlelit room", category: "treatments" }, // #8312822
  { url: `${BASE}/cupping-cups.jpg`, alt: "A glass cupping cup held before treatment", category: "treatments" }, // #8312789
  { url: `${BASE}/massage.jpg`, alt: "A relaxing back-and-shoulder massage", category: "treatments" }, // #7235064
  { url: `${BASE}/detail-towel.jpg`, alt: "Fresh towels and greenery in a calm treatment room", category: "space" }, // #36837602
];
