/**
 * The Village Hargeisa — curated real photography for the restaurant page.
 * Village-only; every path points at a real photo of this restaurant already
 * committed under public/images/partners/the-village/atmosphere/ (18 photos
 * were supplied and inspected; the strongest 8 were kept — see the report.
 * Rejected: back-of-house, prominent identifiable-guest frames, a
 * phone-in-hand shot, and redundant lamp close-ups).
 *
 * The Hero and the visual-story order live here (not hard-coded in the
 * components) so the selection can be re-curated without touching layout
 * code. `objectPosition` is tuned per photo because the source frames are
 * phone-portrait and every layout crops them differently.
 */
const BASE = "/images/partners/the-village/atmosphere";

/** Chosen as Hero: the open-air terrace at golden hour — tiled tables under
 *  cream parasols, a planted bed, adobe arch, and a warm sunset sky that
 *  leaves clean space for the hero text. Strongest single frame for a
 *  full-width cinematic background. */
export const THE_VILLAGE_HERO = {
  src: `${BASE}/hero-terrace-golden-hour.jpg`,
} as const;

export type VillageStoryRole = "feature" | "split" | "band" | "detail" | "closer";

export interface VillageStoryPhoto {
  /** i18n key stem under `theVillage`: expects `story_<key>_title`, `story_<key>_body`, `photoAlt_<key>` */
  key: string;
  src: string;
  role: VillageStoryRole;
  objectPosition: string;
}

/** Ordered — the section renders them in this sequence with the layout each
 *  `role` implies (feature → alternating splits → cinematic band → detail
 *  trio → closer). 8 photos; food photography is handled separately by the
 *  Signature Selection section above it. The detail trio deliberately runs
 *  dark → light → dark for tonal contrast. */
export const THE_VILLAGE_STORY_PHOTOS: VillageStoryPhoto[] = [
  { key: "diningRoom", src: `${BASE}/dining-terrace-wide.jpg`, role: "feature", objectPosition: "50% 52%" },
  { key: "outdoor", src: `${BASE}/outdoor-terrace-day.jpg`, role: "split", objectPosition: "50% 62%" },
  { key: "evening", src: `${BASE}/dining-hall-evening.jpg`, role: "split", objectPosition: "50% 28%" },
  { key: "lamplight", src: `${BASE}/ceiling-lamplight.jpg`, role: "band", objectPosition: "50% 62%" },
  { key: "featureWall", src: `${BASE}/sculpted-feature-wall.jpg`, role: "detail", objectPosition: "50% 55%" },
  { key: "archMirror", src: `${BASE}/arch-sunburst-mirror.jpg`, role: "detail", objectPosition: "50% 68%" },
  { key: "pendant", src: `${BASE}/woven-pendant-detail.jpg`, role: "detail", objectPosition: "50% 42%" },
  { key: "arrival", src: `${BASE}/entrance-sign-night.jpg`, role: "closer", objectPosition: "50% 46%" },
];
