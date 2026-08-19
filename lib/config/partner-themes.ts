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

const PARTNER_THEMES: Partial<Record<BusinessListingType, Record<string, PartnerTheme>>> = {
  cafe: {
    lavender: LAVENDER_THEME,
  },
  city_service: {
    // Distinct object from the cafe entry above (see LAVENDER_FLOWERS_THEME's
    // own header for why) — same real brand, same real logo/colors, correct
    // "Lavender Flowers" identity and flower-only hero imagery.
    lavender: LAVENDER_FLOWERS_THEME,
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
