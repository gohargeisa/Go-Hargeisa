/**
 * Go Hargeisa brand logo assets — the single source of truth.
 *
 * These files live at fixed paths under `public/images/` and are *replaced
 * in place* whenever the brand is revised (they were last replaced by
 * PR #3, "feat(brand): new Go Hargeisa wordmark logo"). Because the paths
 * don't change, and `next.config.mjs` sets `images.minimumCacheTTL` to
 * ~31 days, Vercel's Image Optimization edge cache can keep serving a stale
 * optimized variant of the OLD file long after a deploy. The `?v=` suffix
 * below is part of the optimizer's cache key, so bumping `LOGO_VERSION`
 * forces every client to fetch the new asset immediately — a safe,
 * non-breaking cache-bust that doesn't rename or move any file.
 *
 * When you replace any `public/images/logo*` or `og-image.png` file:
 *   → bump LOGO_VERSION here. Nothing else to change.
 */
const LOGO_VERSION = "2";

const v = (path: string) => `${path}?v=${LOGO_VERSION}`;

export const BRAND_LOGO = {
  /** Full-colour wordmark — use on light / white surfaces. */
  light: v("/images/logo-web.png"),
  /** White knockout wordmark — use on dark / hero / photo surfaces. */
  dark: v("/images/logo-web-dark.png"),
  /** Compact mark (wordmark, no tagline) — splash overlay / tight lockups. */
  mark: v("/images/logo-mark.png"),
  /** Master logo — Open Graph / social card, print, large canvases. */
  master: v("/images/logo.png"),
} as const;

/** The pre-rendered social-share card, `public/images/og-image.png`. */
export const BRAND_OG_IMAGE = v("/images/og-image.png");
