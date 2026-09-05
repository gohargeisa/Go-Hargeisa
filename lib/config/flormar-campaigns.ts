import type { Product } from "@/types";

/**
 * Flormar Hargeisa — campaign hero model (config-driven).
 *
 * WHAT THIS IS: the source of truth for the campaign carousel at the top of
 * the Flormar storefront (components/flormar/flormar-campaign-hero.tsx).
 * Each entry is ONE campaign photo the business owner supplied
 * (public/images/partners/flormar/campaign/campaign-hero-*.png — copied
 * byte-for-byte from Desktop/Flormar/Hero, nothing generated/edited).
 *
 * 2026-09-05 — Hero folder was replaced with a new, simpler photo set: model
 * + the product she's using on the RIGHT, a clean/empty background on the
 * LEFT for the site's own text (no separate product cutout, no baked-in
 * text or logos). 3 ACTIVE slides use this new style: silk-matte-red-lip
 * (lipstick), eyes-collection (mascara), face-glow-collection (a blush/
 * bronzing-powder compact, new — wasn't represented before). The two older,
 * busier-composition photos (perfect-coverage-foundation's separate bottle
 * cutout, lips-collection's gloss+flowers) have NO replacement in the new
 * folder and are `active: false` — left in the array (not deleted) as the
 * historical record of their measurements/technique, in case a clean photo
 * for either is supplied later. `getActiveFlormarCampaigns()` filters them
 * out automatically.
 *
 * The hero is a full-bleed banner (no outer padding, no rounded card, no
 * white background anywhere) at each photo's real aspect ratio (no crop).
 * The product name/description/CTA sit directly on the photo — no card
 * behind them — at a spot measured (colour-variance scan, then the actual
 * average pixel colour of that zone) to be genuinely quiet background and
 * to tell whether dark or light text actually reads there; see each entry's
 * `overlayPosition`/`overlayTextColor` comments for the measurements.
 *
 * WHY A CONFIG FILE, NOT A DB TABLE / ADMIN CMS: there is no existing
 * campaign CMS on the platform, and a bespoke admin builder for a single
 * partner's handful of hero slides is the kind of speculative system this
 * codebase has repeatedly chosen to defer until real content volume
 * justifies it. This file follows the exact same "typed, read-only,
 * keyed-by-SKU" shape as lib/config/flormar-product-details.ts /
 * lib/config/flormar-category-overrides.ts.
 *
 * PRODUCT LINKING RULES (non-negotiable — see the storefront brief):
 *  - `productSkuPrefixes` are 8-char SKU family prefixes (the parent product,
 *    e.g. "33000021"), matched against `products.sku` the same way the
 *    storefront's own `base8` derivation does (flormar-storefront.tsx). Never
 *    a hard-coded UUID — those aren't stable across a catalogue re-import.
 *  - A slide's CTA opens the FIRST product that actually resolves from the
 *    live catalogue (in stock, has a real photo). If none resolve, the CTA
 *    falls back to the `categoryFallback` scroll — a campaign is NEVER wired
 *    to a guessed or unrelated product.
 *  - "silk-matte-red-lip" is confirmed against the live catalogue (the red
 *    lip-lacquer tube design matches SKU 33000021's own official pack
 *    shot). "eyes-collection", "face-glow-collection" (and the retired
 *    "lips-collection") are DELIBERATELY left with an EMPTY
 *    `productSkuPrefixes` — each photo's product prints only the plain
 *    "flormar" wordmark/mark, with no sub-product-line name, and no
 *    catalogue product's real packaging matches that exactly. Per the
 *    business owner's explicit instruction, these link to their category
 *    instead of a guessed product.
 *
 * COPY: all strings are i18n keys under the `flormarPreview` namespace. The
 * confirmed slide's English description is derived from the real,
 * flormar.com-verified product copy already in FLORMAR_PRODUCT_DESCRIPTIONS.
 * The category-fallback slides use generic, honest collection copy (no
 * invented product name, shade, or claim).
 */
export interface FlormarCampaign {
  /** Stable slug — i18n key infix and React key. Never reused/renumbered. */
  id: string;
  /** The full campaign photo. `/public` path. Displayed at its own aspect
   * ratio with `object-fit: cover` inside a matching-ratio container — the
   * photo is already fully art-directed (model + product + a separate
   * product cutout, on its own background), so there is no crop, mask, or
   * canvas-blend applied at all; nothing about the image itself is altered. */
  image: string;
  /** The image's own width/height ratio (e.g. "1670 / 942"), used as the
   * CSS `aspect-ratio` of its container so `object-fit: cover` never crops
   * — the container is shaped to exactly match the source photo. */
  imageAspectRatio: string;
  /** Where the text overlay card sits ON TOP of the photo, as CSS percentages
   * of the image container (`top`/`left`/`width`, physical — NOT logical —
   * since the photo's own composition doesn't mirror in RTL, only the text
   * alignment inside the card does). Separate `mobile` and `desktop` (≥ the
   * `sm` breakpoint) values — NOT one shrunk to fit the other — because the
   * safe zone is the same physical spot on the photo at any size, but how
   * much a card can hold without wrapping badly is very different at ~340px
   * of actual on-screen width vs. ~700px+. Each was measured for genuinely
   * "quiet" (low local colour-variance, i.e. plain background, not the
   * model's face or the product) regions before picking these — see the
   * per-campaign comments below for exactly what's in each zone. */
  overlayPosition: {
    mobile: { top: string; left: string; width: string };
    desktop: { top: string; left: string; width: string };
  };
  /** true ⇒ the photo's quiet zone is small (a busier composition), so the
   * overlay card skips the subtitle line and shows only eyebrow + title +
   * CTA, to guarantee it never grows into the model, the product, or the
   * inset close-up photo beside them. */
  overlayCompact?: boolean;
  /** There is no white/frosted card behind the text any more (see the file
   * doc comment) — the copy sits directly on the photo, so its colour has to
   * actually suit that specific spot. Measured by averaging the real pixel
   * colour of each photo's own overlay zone (not assumed): "dark" where that
   * background reads light (lipstick's beige, lips' soft pink), "light"
   * where it reads mid-to-dark (foundation's grey studio backdrop, eyes'
   * dustier mauve). */
  overlayTextColor: "dark" | "light";
  /** Opt-in, one-slide-at-a-time exception to the normal "text sits directly
   * on the full photo" treatment above. When set, the photo is shown
   * CROPPED to its own left portion (via `object-fit: cover` +
   * `object-position: 0% center` inside a box narrower than the source
   * image — this crops the image ON SCREEN only; the source file itself is
   * never touched) so that a separate product cutout elsewhere in the frame
   * falls outside the visible crop, and the rest of the hero becomes a
   * solid-colour panel (sampled from the photo's own background right at
   * the crop edge, so the seam is unnoticeable) holding the text instead of
   * overlaying it on the photo. This is a deliberate exception, not the
   * default — see the per-campaign comment on the one entry that uses it
   * for why this specific photo needed it and the other three didn't. */
  splitLayout?: {
    /** The LEFT column's own crop ratio (e.g. "1052 / 942") — the exact
     * source-image region kept visible, measured then verified by actually
     * cropping and viewing it. */
    imageAspectRatio: string;
    /** The left (image) column's width as a fraction of the total hero
     * width, e.g. 0.55. Determines the hero's own overall aspect ratio
     * together with `imageAspectRatio` (computed in the component). */
    imageWidthFraction: number;
    /** Solid colour for the right (text) column/panel — sampled from the
     * real photo's own background pixels right at the crop boundary. */
    panelColor: string;
  };
  /** true ⇒ the overlay is vertically centred (top: 50% + a -50% transform)
   * instead of anchored at `overlayPosition`'s own `top`. Opt-in because it
   * only makes sense when the quiet zone runs the photo's FULL height (the
   * newer, cleaner "empty background beside her" photos) — the earlier,
   * busier compositions each had one specific safe band and stay anchored
   * there. */
  overlayVerticalCenter?: boolean;
  /** i18n keys (flormarPreview namespace). */
  eyebrowKey: string;
  titleKey: string;
  subtitleKey: string;
  /** Longer product line. English-only content is acceptable here — the
   * component falls back to `subtitleKey` on locales without a translation,
   * same gating rationale as `verifiedDescription` in flormar-storefront.tsx. */
  descriptionKey: string;
  ctaKey: string;
  /** 8-char parent-SKU prefixes of the product(s) shown in this photo.
   * Empty ⇒ this slide is category-only (see campaign-04). */
  productSkuPrefixes: string[];
  /** FLORMAR_PRIMARY_CATEGORY_GROUPS key to scroll to when no product
   * resolves (or as the secondary "browse the range" action). */
  categoryFallback: "face" | "eyes" | "lips" | "nails" | "skincare" | "accessories";
  displayOrder: number;
  active: boolean;
  /** Optional ISO date window. Omit for always-on. */
  startDate?: string;
  endDate?: string;
}

const FLORMAR_CAMPAIGNS: FlormarCampaign[] = [
  {
    id: "silk-matte-red-lip",
    // 2026-09-05: business owner replaced the whole Hero folder with a new,
    // simpler set of photos — model + the product she's using on the RIGHT,
    // a clean, empty pink background on the LEFT for the site's own text (no
    // separate product cutout, no baked-in text, matching their reference
    // exactly). This is the SAME product (identical red lip-lacquer tube) as
    // the previous photo, just re-shot in that cleaner style — SKU/category
    // below are unchanged.
    image: "/images/partners/flormar/campaign/campaign-hero-lipstick-clean.png",
    imageAspectRatio: "1672 / 941",
    // Measured (10x8 luminance-variance grid): columns 0–3 (x 0–40%) read
    // uniformly quiet (stdev mostly single digits) across ALL 8 rows — the
    // plain pink backdrop runs the photo's FULL height here, not just one
    // band, because she and the product sit entirely in the right ~60% of
    // the frame. `overlayVerticalCenter` centres the text in that space
    // instead of anchoring it to one measured band, since (unlike the
    // retired photos below) there's no busy content anywhere on the left to
    // dodge.
    overlayPosition: {
      mobile: { top: "0%", left: "5%", width: "50%" },
      desktop: { top: "0%", left: "6%", width: "34%" },
    },
    overlayVerticalCenter: true,
    // Light pink backdrop — dark text reads cleanly here with no card
    // behind it.
    overlayTextColor: "dark",
    eyebrowKey: "campaign_silkMatteRedLip_eyebrow",
    titleKey: "campaign_silkMatteRedLip_title",
    subtitleKey: "campaign_silkMatteRedLip_subtitle",
    descriptionKey: "campaign_silkMatteRedLip_description",
    ctaKey: "campaign_silkMatteRedLip_cta",
    // Silk Matte Liquid Lipstick — same clear-barrel duo applicator + red
    // doe-foot as the previous photo, matching the official pack shot.
    productSkuPrefixes: ["33000021"],
    categoryFallback: "lips",
    displayOrder: 10,
    active: true,
  },
  {
    id: "perfect-coverage-foundation",
    image: "/images/partners/flormar/campaign/campaign-hero-foundation.png",
    imageAspectRatio: "1669 / 942",
    // RETIRED 2026-09-05 (active:false): the business owner replaced the
    // Hero folder with 3 new clean photos (lipstick, mascara, a blush/powder
    // compact) and explicitly chose NOT to provide a replacement for this
    // one — this old photo's separate foundation-bottle cutout is exactly
    // the "extra product on the right" composition they've moved away from
    // everywhere else. Left in place (not deleted) as the historical record
    // of the splitLayout technique and the real measurements below, in case
    // a clean foundation photo is supplied later.
    splitLayout: {
      imageAspectRatio: "1052 / 942",
      imageWidthFraction: 0.55,
      panelColor: "#555451",
    },
    overlayPosition: {
      mobile: { top: "10%", left: "40%", width: "32%" },
      desktop: { top: "10%", left: "40%", width: "27%" },
    },
    overlayTextColor: "light",
    eyebrowKey: "campaign_perfectCoverageFoundation_eyebrow",
    titleKey: "campaign_perfectCoverageFoundation_title",
    subtitleKey: "campaign_perfectCoverageFoundation_subtitle",
    descriptionKey: "campaign_perfectCoverageFoundation_description",
    ctaKey: "campaign_perfectCoverageFoundation_cta",
    productSkuPrefixes: ["31000246"],
    categoryFallback: "face",
    displayOrder: 20,
    active: false,
  },
  {
    id: "eyes-collection",
    // 2026-09-05: same new-Hero-folder swap as silk-matte-red-lip above —
    // clean pink background on the left, no inset eye close-up photo, no
    // separate product cutout. Same mascara tube design as the retired
    // photo (still just the plain "flormar" wordmark, no sub-product-line
    // name — see productSkuPrefixes note below, unchanged).
    image: "/images/partners/flormar/campaign/campaign-hero-mascara-clean.png",
    imageAspectRatio: "1672 / 941",
    // Same variance-grid measurement as silk-matte-red-lip: x 0–40% reads
    // quiet the full height of the frame (this photo shares the exact same
    // composition style/background). No longer `overlayCompact` — that
    // existed only to survive the OLD photo's cramped inset-photo corner,
    // which doesn't exist in this one.
    overlayPosition: {
      mobile: { top: "0%", left: "5%", width: "50%" },
      desktop: { top: "0%", left: "6%", width: "34%" },
    },
    overlayVerticalCenter: true,
    overlayTextColor: "dark",
    eyebrowKey: "campaign_eyesCollection_eyebrow",
    titleKey: "campaign_eyesCollection_title",
    subtitleKey: "campaign_eyesCollection_subtitle",
    descriptionKey: "campaign_eyesCollection_description",
    ctaKey: "campaign_eyesCollection_cta",
    // FLAGGED FOR REVIEW (unchanged from the retired photo): the mascara
    // tube prints only the plain "flormar" wordmark — no sub-product-line
    // name. The closest real catalogue matches (Precious Curl Mascara, SKU
    // 32000018 silver / 32000019 purple) both print "Precious CURL mascara"
    // on their real packaging, which this photo doesn't show, so it is NOT
    // confidently matched — left empty rather than guessed. CTA falls back
    // to the Eyes category until the exact SKU is confirmed.
    productSkuPrefixes: [],
    categoryFallback: "eyes",
    displayOrder: 30,
    active: true,
  },
  {
    id: "lips-collection",
    image: "/images/partners/flormar/campaign/campaign-hero-lips.png",
    imageAspectRatio: "1669 / 942",
    // RETIRED 2026-09-05 (active:false): same reason as
    // perfect-coverage-foundation above — no replacement photo was provided
    // for this lip-gloss composition when the Hero folder was swapped to
    // the new clean-background style; the business owner confirmed 3 active
    // slides only (lipstick, mascara, blush — see face-glow-collection
    // below) rather than carrying this one over unchanged.
    overlayPosition: {
      mobile: { top: "10%", left: "2%", width: "18%" },
      desktop: { top: "10%", left: "2%", width: "16%" },
    },
    overlayTextColor: "dark",
    overlayCompact: true,
    eyebrowKey: "campaign_lipsCollection_eyebrow",
    titleKey: "campaign_lipsCollection_title",
    subtitleKey: "campaign_lipsCollection_subtitle",
    descriptionKey: "campaign_lipsCollection_description",
    ctaKey: "campaign_lipsCollection_cta",
    productSkuPrefixes: [],
    categoryFallback: "lips",
    displayOrder: 40,
    active: false,
  },
  {
    id: "face-glow-collection",
    // 2026-09-05: the third new photo in the Hero-folder swap — model
    // applying a pressed blush/bronzing powder from a square gold compact
    // (a white circular "f" mark on the lid, same generic-branding pattern
    // as the mascara/lip-gloss photos — no product-line name printed).
    image: "/images/partners/flormar/campaign/campaign-hero-blush.png",
    imageAspectRatio: "1672 / 941",
    // Same composition family as the other two active photos above (clean
    // pink background on the left), but her raised brush-holding hand comes
    // in noticeably earlier here. Fine-grained pixel sampling (0.5% steps)
    // across the title's actual vertical band found the real background/
    // brush boundary as close as x 39.5% (at the tightest row) — nowhere
    // near the "0–40%" figure that was fine for the lipstick/mascara photos.
    // 30% keeps the box's own right edge (left 5% + width 30% = 35%) a
    // genuine ~4.5-point margin inside that measured boundary, verified by
    // re-rendering the actual title/CTA copy in all 3 locales at this width
    // and confirming no overlap with the brush.
    overlayPosition: {
      mobile: { top: "0%", left: "5%", width: "30%" },
      desktop: { top: "0%", left: "6%", width: "34%" },
    },
    overlayVerticalCenter: true,
    overlayTextColor: "dark",
    eyebrowKey: "campaign_faceGlowCollection_eyebrow",
    titleKey: "campaign_faceGlowCollection_title",
    subtitleKey: "campaign_faceGlowCollection_subtitle",
    descriptionKey: "campaign_faceGlowCollection_description",
    ctaKey: "campaign_faceGlowCollection_cta",
    // NOT confidently matched: checked the real catalogue for square
    // compact blush/bronzer/powder products (Baked Blush-On SKU 31000243 is
    // the closest by shape — a square compact with a white circular "f"
    // mark on the lid too) but that real product's case is black, not this
    // photo's gold/orange — different colourway, and neither carries a
    // printed product-line name to confirm against. Left unmatched rather
    // than guessed; CTA falls back to the Face category.
    productSkuPrefixes: [],
    categoryFallback: "face",
    displayOrder: 15,
    active: true,
  },
];

/** The single accessor every consumer uses — active + inside its date window,
 * ordered by `displayOrder`. */
export function getActiveFlormarCampaigns(now: Date = new Date()): FlormarCampaign[] {
  const ts = now.getTime();
  return FLORMAR_CAMPAIGNS.filter((c) => {
    if (!c.active) return false;
    if (c.startDate && ts < Date.parse(c.startDate)) return false;
    if (c.endDate && ts > Date.parse(c.endDate)) return false;
    return true;
  }).sort((a, b) => a.displayOrder - b.displayOrder);
}

/** 8-char parent-SKU family of a product row, matching flormar-storefront's
 * own `base8` derivation. */
function skuFamily(sku: string | null | undefined): string {
  return (sku ?? "").split("-")[0]?.slice(0, 8) ?? "";
}

/**
 * Resolve a campaign to the REAL, in-catalogue products it promotes. Returns
 * shoppable rows only (available, with a real photo), de-duplicated by
 * product id, in the order the prefixes are listed. Empty ⇒ the caller
 * should fall back to `categoryFallback` (the hero CTA does exactly this).
 */
export function resolveCampaignProducts<T extends Pick<Product, "id" | "sku" | "image" | "isAvailable">>(
  campaign: Pick<FlormarCampaign, "productSkuPrefixes">,
  products: T[]
): T[] {
  if (campaign.productSkuPrefixes.length === 0) return [];
  const seen = new Set<string>();
  const out: T[] = [];
  for (const prefix of campaign.productSkuPrefixes) {
    for (const p of products) {
      if (skuFamily(p.sku) !== prefix) continue;
      if (seen.has(p.id)) continue;
      if (!p.isAvailable || !p.image) continue;
      seen.add(p.id);
      out.push(p);
    }
  }
  return out;
}
