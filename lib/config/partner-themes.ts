import type { CSSProperties } from "react";
import type { BusinessListingType } from "@/types";

/**
 * Go Hargeisa Partner Branding System — the reusable foundation.
 *
 * Concept: Go Hargeisa Core Theme (the site's default amber/navy design,
 * shared by every listing) → optional Partner Theme (applied only when a
 * partner has one configured below) → Partner Configuration (this file —
 * the actual colors/imagery for one specific partner).
 *
 * The page structure, shared components (HotelHeaderTop, HotelActionBar,
 * ProductsSection, buttons, tabs, cards, etc.) and CSS override rules (see
 * the "Partner Theme System" block in app/globals.css) are all
 * partner-agnostic — none of them mention "lavender" or hardcode purple
 * anywhere. Only this file knows about specific partners. Onboarding a new
 * one (any listing type: hotel, restaurant, cafe, salon, shop, clinic —
 * `city_service` covers the non-hotel/restaurant/cafe categories already,
 * see lib/config/categories) is: add a `PartnerTheme` object below, add one
 * entry to `PARTNER_THEMES`, done — no shared component or page file needs
 * to change. `getPartnerTheme` returns `null` for every listing without an
 * entry (or with `enabled: false`), and `PartnerThemeScope` renders a plain
 * fragment for `null` — that listing's page is then byte-for-byte identical
 * to the un-themed Go Hargeisa default. The theme is opt-in by construction:
 * there is no code path that turns it on without an explicit config entry.
 */
export interface PartnerTheme {
  slug: string;
  /** Master on/off switch — flip false to instantly revert a partner to the
   * default Go Hargeisa design without deleting its tuned config. */
  enabled: boolean;
  /** Display name used only by partner-scoped chrome that isn't already
   * fed by the listing row itself (the Partnership Footer's alt text /
   * "Go Hargeisa × {name}" — see partner-partnership-footer.tsx). The Hero
   * name/H1 etc. still come from the real listing row (cafe.name and
   * friends), not this — kept deliberately narrow to avoid the
   * "duplicated, can drift out of sync" risk noted below. */
  partnerName: string;
  /** Official partner logo — same rules as any other brand asset in this
   * project: never redrawn/recolored/AI-generated, used exactly as
   * supplied. A static `/public` path (once a real file exists) or an
   * absolute URL both work. Used only by the Partnership Footer. */
  partnerLogo: string;

  /** Deep brand color — replaces the site's amber "primary" token wherever
   * it appears inside the themed scope (buttons, active tabs, icons, borders). */
  primary: string;
  primaryRgb: string;
  /** Mid-tone shade — replaces primary-600 (ratings, badge gradient start). */
  primaryMid: string;
  primaryMidRgb: string;
  /** Strong shade — replaces primary-700 (solid button backgrounds, tag text). */
  primaryStrong: string;
  /** Deepest shade — replaces primary-800 (hover states, badge gradient end). */
  primaryDeep: string;
  /** Light tint — replaces primary-300, used only in dark-mode text. */
  primarySoft: string;
  /** Secondary brand color, used for new decorative partner-only elements
   * (hero eyebrow, dividers, featured-badge) — never substituted into the
   * site's own "primary" token, so it never affects contrast-sensitive CTAs. */
  accent: string;
  accentRgb: string;
  accentStrong: string;
  accentSoft: string;

  /** Hero image for PartnerHeroBanner. A static `/public` path (a manually
   * supplied brand asset, like Lavender's) or any absolute URL (e.g. a real
   * business photo already in Supabase Storage) both work — the component
   * just passes it to next/image. Omit entirely (leave unset) when the
   * partner has no genuine hero-worthy photo/graphic on file — the page
   * simply skips rendering PartnerHeroBanner in that case (see each page's
   * `{partnerTheme?.heroImage && <PartnerHeroBanner .../>}` gate) and falls
   * back to the color retint alone. Never fill this with an unrelated stock
   * or third-party product photo just to have *something* here — see
   * MAMA_BABY_CARE_THEME's own comment for why that matters. */
  heroImage?: string;
  /** "contain" — use for a pre-designed, self-contained hero graphic that
   * already has its own logo/wordmark/copy
   * baked in (like Lavender's): shown at full native aspect ratio, width
   * 100%, height auto, NEVER cropped, so no part of the artwork is ever
   * lost on any screen size. The "Featured Partner" badge renders as a
   * separate strip below it rather than overlaid on top, since the image
   * needs no darkening overlay and already fills its own frame.
   * "cover" — use for an ordinary photo (no baked-in text) that should
   * fill a full-bleed banner; gets a brand-color gradient wash for legibility
   * and the badge overlaid at the bottom. See `heroImagePosition`. */
  heroImageFit?: "cover" | "contain";
  /** "cover" fit only: Tailwind `object-[X%_Y%]` class(es) to art-direct
   * which part of the photo stays in frame from a near-square mobile crop
   * up to a very wide desktop one. Ignored (and unnecessary) for "contain". */
  heroImagePosition?: string;
  /** "contain" fit only: the image's real intrinsic pixel size, so
   * next/image can compute the correct aspect ratio for `width: 100%,
   * height: auto` layout — every partner's own artwork has its own native
   * size, so this lives per-partner here rather than a guess hardcoded in
   * the shared PartnerHeroBanner component. Ignored for "cover" (uses
   * `fill` instead). */
  heroImageWidth?: number;
  heroImageHeight?: number;

  /** Contact/social — same shape and same resolver (SocialLinks,
   * toWhatsAppHref) every hotel/restaurant/cafe/city_service detail page
   * already uses; nothing new invented for partner pages. All optional —
   * SocialLinks itself already renders nothing when a value is absent, so
   * omitting any of these here just hides that one icon, not a broken
   * button. Values may be real business data (once a real listing row
   * exists for a partner) or an explicitly-labeled placeholder pending
   * real data — see each partner's own config comment for which. */
  phone?: string;
  whatsapp?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;

  /**
   * Deliberately NOT part of this config yet (kept out to avoid dead,
   * unused fields until a real partner needs them):
   * - secondary / background / text color: every partner so far keeps
   *   backgrounds neutral (Go Hargeisa's existing sand/ink tokens) per the
   *   "don't make the whole page purple" brief — primary/primaryMid already
   *   cover the "secondary accent" role. Add real fields here the moment a
   *   partner actually needs an overridden background or text color.
   * - button style/shape: partners only ever need a color change, which
   *   primary/primaryStrong/primaryDeep already drive on the site's
   *   existing PrimaryButton/SecondaryButton/CTA components — no partner
   *   has asked for a different shape/variant.
   */
}

/**
 * Colors sampled directly from the real Lavender Flowers & Cakes logo
 * (deep purple ring/wordmark #583C89, gold leaf/subtitle #C3986D) — not
 * invented. Contrast-checked: white text on primaryStrong/primaryDeep is
 * 10.4:1 / 12.3:1 (WCAG AAA), matching or exceeding the site's own amber
 * button contrast bar. accent (gold) is only ever used for borders, icons,
 * and bold/large text — never as a solid CTA background with white text,
 * since gold-on-white alone doesn't clear 4.5:1.
 *
 * heroImage: the partner-supplied final hero banner, copied verbatim into
 * public/images/partners/lavender/hero.png (byte-identical, sha256-verified
 * against the source file at copy time each time it's replaced). Revision 2
 * (2026-08-17): the partner's own logo/wordmark only ("Lavender Flowers &
 * Cakes") plus bouquet/cake/coffee photography — no baked-in English
 * tagline/description text. Revision 1 (superseded, same path) had a full
 * English promotional tagline + description + feature-icon row baked into
 * the pixels, which stayed English even when the site was switched to
 * Arabic/Somali — that's why this component never adds its own baked-style
 * promotional copy either; the only text overlay is the "Featured Partner"
 * badge, which is real translated UI (td("featuredPartner")), not an image.
 * heroImageFit "contain" so the artwork is never cropped on any screen size.
 */
const LAVENDER_THEME: PartnerTheme = {
  slug: "lavender",
  enabled: true,
  partnerName: "Lavender Flowers & Cakes",
  // The real, already-live logo (Supabase Storage) — same file the site's
  // own HotelHeaderTop already renders for Lavender's page; reused here
  // rather than duplicated into /public.
  partnerLogo: "https://pvzuibidhfuizmaleznx.supabase.co/storage/v1/object/public/listing-images/cafes/logos/313ce245-44a8-4d38-9a00-f098834b4d91.jpeg",
  primary: "#583C89",
  primaryRgb: "88 60 137",
  primaryMid: "#71599B",
  primaryMidRgb: "113 89 155",
  primaryStrong: "#4B3374",
  primaryDeep: "#3E2A60",
  primarySoft: "#CDC5DC",
  accent: "#C3986D",
  accentRgb: "195 152 109",
  accentStrong: "#927252",
  accentSoft: "#E1CCB6",
  heroImage: "/images/partners/lavender/hero.png",
  heroImageFit: "contain",
  heroImageWidth: 1536,
  heroImageHeight: 1024,
};

/**
 * Lavender Flowers — the standalone flower-shop listing split out of the
 * café (see 20260828000001_lavender_flowers_cafe_split.sql). Same real
 * brand — same colors, same real logo file as LAVENDER_THEME above — but a
 * DISTINCT theme object, not a shared reference, for two reasons:
 *
 *  1. partnerName must read "Lavender Flowers" here, never "& Cakes" — the
 *     Flowers page's whole reason to exist is presenting the flower side of
 *     the business on its own terms. (Note: the underlying city_services
 *     row's own `name` column has since been edited back to "Lavender
 *     Flowers & Cakes" through the live admin dashboard, outside of any
 *     migration — this page deliberately does NOT read that column for its
 *     displayed identity, see FLOWERS_DISPLAY_NAME in the page file, so it
 *     stays correct regardless of what the raw listing row says.)
 *  2. heroImage (revision 2, 2026-08-19): the business owner supplied a new,
 *     dedicated hero composition for this page — bouquet + cake + baked-in
 *     "Lavender Flowers & Cakes" wordmark/tagline — copied verbatim from
 *     their Desktop into public/images/partners/lavender/hero-flowers.png
 *     (own file, NOT the café's public/images/partners/lavender/hero.png —
 *     different composition/revision, kept separate on purpose). This
 *     supersedes the earlier "cover"-mode product photo (a real image, just
 *     an ordinary photo the owner found blurry/low-impact as a hero) and
 *     deliberately reintroduces "& Cakes" branding onto this page — an
 *     explicit choice by the business owner, not a reversion by mistake.
 *     "contain" mode (same as LAVENDER_THEME) because this is a finished,
 *     self-contained graphic with its own logo/tagline/copy already baked
 *     in — never cropped, no overlay added on top of it.
 */
const LAVENDER_FLOWERS_THEME: PartnerTheme = {
  slug: "lavender",
  enabled: true,
  partnerName: "Lavender Flowers",
  partnerLogo: "https://pvzuibidhfuizmaleznx.supabase.co/storage/v1/object/public/listing-images/cafes/logos/313ce245-44a8-4d38-9a00-f098834b4d91.jpeg",
  primary: "#583C89",
  primaryRgb: "88 60 137",
  primaryMid: "#71599B",
  primaryMidRgb: "113 89 155",
  primaryStrong: "#4B3374",
  primaryDeep: "#3E2A60",
  primarySoft: "#CDC5DC",
  accent: "#C3986D",
  accentRgb: "195 152 109",
  accentStrong: "#927252",
  accentSoft: "#E1CCB6",
  heroImage: "/images/partners/lavender/hero-flowers.png",
  heroImageFit: "contain",
  heroImageWidth: 1536,
  heroImageHeight: 1024,
};

/**
 * Flormar Hargeisa — the platform's second partner theme, deliberately
 * built to prove this file (not the shared components) is the only thing
 * that changes when onboarding a new partner. A real `city_services` row +
 * real `products` rows now exist for this slug (status: 'draft', RLS-
 * invisible to the public site — see lib/data/flormar-preview.ts), used
 * only by the private preview at app/[locale]/preview/flormar. This entry
 * is what the theme/scoping machinery reads once that row is ever flipped
 * to `status: 'published'`, matching this exact slug.
 *
 * partnerLogo (revision 2, 2026-08-19): the business owner replaced the
 * earlier flat-background file with a new approved logo — same real
 * wordmark+icon+"hargeisa" lockup, copied verbatim (byte-identical, never
 * redrawn/recolored/regenerated) into public/images/partners/flormar/logo.png.
 * This one has a genuine alpha channel (colorType 6/RGBA, confirmed byte-
 * inspecting the PNG header) — it needs no white-card frame the way the
 * old opaque file did; every render site can place it directly over a
 * colored background.
 *
 * heroImage (2026-08-19): the business owner's first real hero photo —
 * copied verbatim into public/images/partners/flormar/hero.png (1747×900).
 * Deliberate composition: dark Burgundy negative space on the left third,
 * the product lineup lit on the right two-thirds — the storefront's hero
 * markup (components/flormar/flormar-storefront.tsx) positions the logo/
 * heading/CTAs over that left space and leaves the right side uncovered so
 * the products stay fully visible, rather than centering content over the
 * whole frame the way the generic "cover" hero treatment used to.
 *
 * primary/accent below are still an unverified placeholder palette (warm
 * rose + gold, generic to premium beauty branding) — explicitly NOT
 * asserted as Flormar's real brand colors, since those haven't been
 * supplied. Unrelated to the logo/hero assets above; left unchanged this
 * revision (out of scope — this pass only replaced the two image assets).
 * Replace with real values from official brand guidelines before this is
 * ever made public.
 */
const FLORMAR_THEME: PartnerTheme = {
  slug: "flormar-hargeisa",
  enabled: true,
  partnerName: "Flormar Hargeisa",
  partnerLogo: "/images/partners/flormar/logo.png",
  primary: "#A63A50",
  primaryRgb: "166 58 80",
  primaryMid: "#BD6478",
  primaryMidRgb: "189 100 120",
  primaryStrong: "#8A2F42",
  primaryDeep: "#6B1F30",
  primarySoft: "#E9C7CE",
  accent: "#C9A227",
  accentRgb: "201 162 39",
  accentStrong: "#9C7D1D",
  accentSoft: "#E9D48C",
  heroImage: "/images/partners/flormar/hero.png",
  heroImageFit: "cover",
  // Placeholder contact/social (2026-08-19) — Flormar Hargeisa has no real
  // business listing row yet (see this file's own header comment), so
  // there is no real phone/social data to read from anywhere in the
  // project. These are explicitly NOT the business's real details —
  // plausible-format placeholders only, so the Contact section's buttons
  // are genuinely clickable/functional (tel:, wa.me, real platform URL
  // shapes) instead of dead links, while the storefront's own "private
  // preview" framing keeps them from ever being presented as verified.
  // Replace with the real values the moment the business supplies them —
  // every consumer (SocialLinks) already handles that with no other change.
  phone: "+252634000000",
  whatsapp: "+252634000000",
  instagram: "https://instagram.com/flormar.hargeisa",
  facebook: "https://facebook.com/flormarhargeisa",
  tiktok: "https://tiktok.com/@flormar.hargeisa",
};

/**
 * Mama Baby Care (`city-services/mama-baby-care`) — a real, live, published
 * partner (`is_partner: true`). Colors sampled directly from the real logo
 * (`logo_url` on the listing — solid magenta/pink card, white "m"/parent-
 * and-child mark, "Mama & Baby Care" wordmark), not invented: corner pixels
 * sampled at #CC1A75, contrast-checked at 5.2:1 white-on-primary (clears
 * WCAG AA for normal text). `accent` is a neutral warm gold paired for
 * visual variety only — same role Lavender's and Flormar's accents play —
 * not asserted as a verified second brand color, since the logo itself only
 * uses pink/white.
 *
 * Deliberately has NO `heroImage`: this listing's 34 gallery photos turned
 * out, on inspection, to be third-party supplier/wholesale catalog images
 * (other brands' own product photography — e.g. a UK pharmacy brand's boxed
 * product shot, a shoe brand's studio photo with a foreign price baked into
 * the pixels) rather than the shop's own documentary photography, and its
 * `image`/`cover_image` column is actually a second copy of the logo (same
 * known-bug shape as Lavender's, see [[partner_theme_system]]). Using any of
 * those as this partner's "hero" would misrepresent what the business
 * itself looks like or sells. Omitting `heroImage` means the page simply
 * skips `PartnerHeroBanner` and relies on the color retint alone for a
 * premium feel — see each themed page's `{partnerTheme?.heroImage && ...}`
 * gate. Replace with a real storefront/product photo the moment the owner
 * supplies one.
 */
const MAMA_BABY_CARE_THEME: PartnerTheme = {
  slug: "mama-baby-care",
  enabled: true,
  partnerName: "Mama Baby Care",
  partnerLogo: "https://pvzuibidhfuizmaleznx.supabase.co/storage/v1/object/public/listing-images/city-services/logos/1a0e84a0-822c-493d-865a-1051063bb94c.jpeg",
  primary: "#CC1A75",
  primaryRgb: "204 26 117",
  primaryMid: "#DB5F9E",
  primaryMidRgb: "219 95 158",
  primaryStrong: "#AD1663",
  primaryDeep: "#8F1252",
  primarySoft: "#F0BAD6",
  accent: "#D4A24E",
  accentRgb: "212 162 78",
  accentStrong: "#A87D34",
  accentSoft: "#EDD2A0",
};

/**
 * Grand Haadi Hotel & Resort (`hotels/grand-haadi-hotel`) — a real, live,
 * published listing, and currently the ONE hotel the whole public site shows
 * (see `HOTELS_PRESENTATION_MODE` in lib/config/features.ts) — the platform's
 * hotel showcase. Colors sampled directly from the hotel's own real logo
 * (`logo_url` — dark green shield background, gold kudu/laurel crest, "GRAND
 * HAADI HOTEL & RESORT" wordmark): primary #0B3A26 sampled from the logo's
 * background field (contrast-checked ~12.7:1 white-on-primary, WCAG AAA),
 * accent #B2A55F sampled from the gold laurel leaves. `partnerName` is the
 * hotel's official full name exactly as it appears on the real logo and
 * matches independently (Facebook page title, Tripadvisor listing title
 * found via web search) — the underlying `hotels.name` DB column stays
 * "Grand Haadi Hotel" (no column change), since every booking/breadcrumb/
 * search path already reads that exact string; this is display-only, same
 * pattern as LAVENDER_FLOWERS_THEME's `partnerName` vs. its own listing row.
 *
 * heroImage is a REAL photo (`hotels/gallery/b059c5b5-...jpg` — the hotel's
 * own exterior shot with its rooftop signage visible, verified by viewing
 * the image directly), not the logo — this hotel actually has genuine
 * documentary photography unlike some other partners, so `heroImageFit:
 * "cover"` is used as intended (full-bleed photo + gradient wash), not the
 * "contain" fallback. Same file the listing's own `cover_image` column now
 * points to — that column previously
 * duplicated the logo file, corrected as part of this build).
 */
const GRAND_HAADI_THEME: PartnerTheme = {
  slug: "grand-haadi-hotel",
  enabled: true,
  partnerName: "Grand Haadi Hotel & Resort",
  partnerLogo: "https://pvzuibidhfuizmaleznx.supabase.co/storage/v1/object/public/listing-images/hotels/logos/4f4573b0-bced-4932-9e11-252219555f89.jpg",
  primary: "#0B3A26",
  primaryRgb: "11 58 38",
  primaryMid: "#476B5C",
  primaryMidRgb: "71 107 92",
  primaryStrong: "#093120",
  primaryDeep: "#002B19",
  primarySoft: "#B5C4BE",
  accent: "#B2A55F",
  accentRgb: "178 165 95",
  accentStrong: "#8E844C",
  accentSoft: "#D2C99F",
  heroImage: "https://pvzuibidhfuizmaleznx.supabase.co/storage/v1/object/public/listing-images/hotels/gallery/b059c5b5-7bd5-414f-98a9-e0be5f2c9604.jpg",
  heroImageFit: "cover",
  heroImagePosition: "object-[50%_35%]",
  phone: "+252634622117",
};

const PARTNER_THEMES: Partial<Record<BusinessListingType, Record<string, PartnerTheme>>> = {
  cafe: {
    lavender: LAVENDER_THEME,
  },
  city_service: {
    // Distinct object from the cafe entry above (see LAVENDER_FLOWERS_THEME's
    // own header for why) — same real brand, same real logo/colors, correct
    // "Lavender Flowers" identity and flower-only hero imagery.
    lavender: LAVENDER_FLOWERS_THEME,
    "flormar-hargeisa": FLORMAR_THEME,
    "mama-baby-care": MAMA_BABY_CARE_THEME,
  },
  hotel: {
    "grand-haadi-hotel": GRAND_HAADI_THEME,
  },
};

export function getPartnerTheme(listingType: BusinessListingType, slug: string): PartnerTheme | null {
  const theme = PARTNER_THEMES[listingType]?.[slug];
  return theme?.enabled ? theme : null;
}

/** CSS custom properties consumed by the override rules in app/globals.css. */
export function partnerThemeStyle(theme: PartnerTheme): CSSProperties {
  return {
    "--pt-primary": theme.primary,
    "--pt-primary-rgb": theme.primaryRgb,
    "--pt-primary-mid": theme.primaryMid,
    "--pt-primary-mid-rgb": theme.primaryMidRgb,
    "--pt-primary-strong": theme.primaryStrong,
    "--pt-primary-deep": theme.primaryDeep,
    "--pt-primary-soft": theme.primarySoft,
    "--pt-accent": theme.accent,
    "--pt-accent-rgb": theme.accentRgb,
    "--pt-accent-strong": theme.accentStrong,
    "--pt-accent-soft": theme.accentSoft,
  } as CSSProperties;
}
