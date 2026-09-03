import type { Product } from "@/types";

/**
 * Flormar Hargeisa — campaign hero model (config-driven).
 *
 * WHAT THIS IS: the source of truth for the full-bleed campaign carousel at
 * the top of the Flormar storefront (components/flormar/flormar-campaign-hero.tsx).
 * Each entry is ONE real campaign photograph the business owner supplied
 * (public/images/partners/flormar/campaign/campaign-0X.jpg — copied
 * byte-for-byte, nothing generated/stock), tied to the EXACT Flormar
 * product(s) the model is holding in that photo so the hero doubles as a
 * direct shopping entry point:
 *
 *   see model + product → read the product → "Shop this" → product detail
 *   modal → pick shade → add to cart
 *
 * WHY A CONFIG FILE, NOT A DB TABLE / ADMIN CMS: there is no existing
 * campaign CMS on the platform, and a bespoke admin builder for a single
 * partner's 5 hero slides is the kind of speculative system this codebase
 * has repeatedly chosen to defer until real content volume justifies it.
 * This file follows the exact same "typed, read-only, keyed-by-SKU" shape as
 * lib/config/flormar-product-details.ts / lib/config/flormar-category-overrides.ts.
 * The field set below is deliberately a 1:1 map of the future
 * `flormar_campaigns` table (supabase/migrations/*_flormar_campaigns.sql,
 * written but NOT applied) so swapping to a DB source later is a data-layer
 * change with no shape change here.
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
 *  - Every mapping below was verified against the product's own official
 *    Flormar pack shot (docs/flormar-product-catalog.json `imageUrls` /
 *    `officialProductUrl`), including a zoomed crop of the product in the
 *    model's hand for campaign-04 (Precious Curl Mascara — slim chrome tube,
 *    vertical "Precious CURL" wordmark, black collar).
 *
 * COPY: all strings are i18n keys under the `flormarPreview` namespace. The
 * English descriptions are derived from the real, flormar.com-verified
 * product copy already in FLORMAR_PRODUCT_DESCRIPTIONS — no invented claims,
 * prices, shade names or specifications.
 */
export interface FlormarCampaign {
  /** Stable slug — i18n key infix and React key. Never reused/renumbered. */
  id: string;
  /** Full-bleed desktop/base image. `/public` path. */
  image: string;
  /** Optional dedicated portrait crop for small screens. None exist yet —
   * the base images are already 720×1080 portrait, and the hero renders them
   * without cropping the model/product (blur-extend backdrop), so this stays
   * optional rather than a fabricated crop. */
  mobileImage?: string;
  /** `object-position` for the hero image on the DESKTOP crop (model occupies
   * the trailing ~64% of the frame at full height). Tuned per photo so the
   * face and the featured product stay in frame. Default "50% 18%". */
  focalPoint?: string;
  /** `object-position` on the MOBILE crop (model fills the top band of the
   * scene). A higher Y here shows the LOWER part of the frame, which lifts
   * the held product UP into the visible band so it lands in the blush
   * dissolve — part of the artwork — well above where the eyebrow/headline
   * begin. Falls back to `focalPoint`. */
  mobileFocalPoint?: string;
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
    image: "/images/partners/flormar/campaign/campaign-01.jpg",
    focalPoint: "50% 18%",
    mobileFocalPoint: "50% 40%",
    eyebrowKey: "campaign_silkMatteRedLip_eyebrow",
    titleKey: "campaign_silkMatteRedLip_title",
    subtitleKey: "campaign_silkMatteRedLip_subtitle",
    descriptionKey: "campaign_silkMatteRedLip_description",
    ctaKey: "campaign_silkMatteRedLip_cta",
    // Silk Matte Liquid Lipstick — clear barrel + red doe-foot in frame
    // matches the official pack shot exactly; real red shades in the
    // catalogue (007 Claret Red, 061 Red Kiss).
    productSkuPrefixes: ["33000021"],
    categoryFallback: "lips",
    displayOrder: 10,
    active: true,
  },
  {
    id: "perfect-coverage-foundation",
    image: "/images/partners/flormar/campaign/campaign-02.jpg",
    focalPoint: "50% 15%",
    mobileFocalPoint: "50% 44%",
    eyebrowKey: "campaign_perfectCoverageFoundation_eyebrow",
    titleKey: "campaign_perfectCoverageFoundation_title",
    subtitleKey: "campaign_perfectCoverageFoundation_subtitle",
    descriptionKey: "campaign_perfectCoverageFoundation_description",
    ctaKey: "campaign_perfectCoverageFoundation_cta",
    // "PERFECT COVERAGE" reads clearly on the bottle held to the model's
    // cheek; Perfect Coverage Foundation is the matching line stocked here.
    productSkuPrefixes: ["31000246"],
    categoryFallback: "face",
    displayOrder: 20,
    active: true,
  },
  {
    id: "perfect-coverage-concealer",
    image: "/images/partners/flormar/campaign/campaign-03.jpg",
    focalPoint: "50% 26%",
    mobileFocalPoint: "50% 30%",
    eyebrowKey: "campaign_perfectCoverageConcealer_eyebrow",
    titleKey: "campaign_perfectCoverageConcealer_title",
    subtitleKey: "campaign_perfectCoverageConcealer_subtitle",
    descriptionKey: "campaign_perfectCoverageConcealer_description",
    ctaKey: "campaign_perfectCoverageConcealer_cta",
    // Two tubes in frame — clear barrel + squared black cap matches the
    // Perfect Coverage Liquid Concealer pack shot exactly.
    productSkuPrefixes: ["31000274"],
    categoryFallback: "face",
    displayOrder: 30,
    active: true,
  },
  {
    id: "eye-define-mascara",
    image: "/images/partners/flormar/campaign/campaign-04.jpg",
    focalPoint: "50% 18%",
    mobileFocalPoint: "50% 42%",
    eyebrowKey: "campaign_eyeDefineMascara_eyebrow",
    titleKey: "campaign_eyeDefineMascara_title",
    subtitleKey: "campaign_eyeDefineMascara_subtitle",
    descriptionKey: "campaign_eyeDefineMascara_description",
    ctaKey: "campaign_eyeDefineMascara_cta",
    // Precious Curl Mascara — the slim chrome tube with the vertical
    // "Precious CURL / carbon black" wordmark and black collar matches the
    // official pack shot (the rose cast is warm studio light on chrome).
    // Both live SKU families are the same product line: 32000018 (Carbon
    // Black, in-catalogue with real copy in FLORMAR_PRODUCT_DESCRIPTIONS) and
    // 32000019 (LF71). Whichever is in stock resolves; `eyes` stays as the
    // safety fallback.
    productSkuPrefixes: ["32000018", "32000019"],
    categoryFallback: "eyes",
    displayOrder: 40,
    active: true,
  },
  {
    id: "bronzing-powder-glow",
    image: "/images/partners/flormar/campaign/campaign-05.jpg",
    focalPoint: "50% 24%",
    mobileFocalPoint: "50% 34%",
    eyebrowKey: "campaign_bronzingPowderGlow_eyebrow",
    titleKey: "campaign_bronzingPowderGlow_title",
    subtitleKey: "campaign_bronzingPowderGlow_subtitle",
    descriptionKey: "campaign_bronzingPowderGlow_description",
    ctaKey: "campaign_bronzingPowderGlow_cta",
    // Gold compact reading "BRONZING" + the flormar mark = Bronzing Powder.
    productSkuPrefixes: ["31000239"],
    categoryFallback: "face",
    displayOrder: 50,
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
