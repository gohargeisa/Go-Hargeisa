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
   * just passes it to next/image. */
  heroImage: string;
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
  heroImageFit: "cover" | "contain";
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

  /**
   * Deliberately NOT part of this config yet (kept out to avoid dead,
   * unused fields until a real partner needs them):
   * - name / logo: already sourced reliably from the listing's own DB row
   *   (cafe.name / cafe.logo) — duplicating them here would risk drifting
   *   out of sync whenever a business updates its listing.
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

const PARTNER_THEMES: Partial<Record<BusinessListingType, Record<string, PartnerTheme>>> = {
  cafe: {
    lavender: LAVENDER_THEME,
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
