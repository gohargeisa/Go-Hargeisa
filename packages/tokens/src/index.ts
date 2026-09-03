/**
 * @gohargeisa/tokens — the Go Hargeisa design tokens as plain JS.
 *
 * Mirrors `tailwind.config.ts` (the web source of truth). Consumed by:
 *   - the web Tailwind config (optional, later),
 *   - `apps/mobile/tailwind.config.js` (NativeWind), and
 *   - `apps/mobile/src/theme` for imperative styles.
 *
 * BRAND DIRECTION (locked): the native app's chrome — app shell, navigation,
 * headers, tab bar, splash/background, primary buttons — is NAVY + BLUE.
 * Amber (`palette.amber`) is used ONLY on partner/business-branded surfaces
 * (e.g. a partner storefront that has opted into its own accent). Amber is
 * NOT the Go Hargeisa primary on mobile.
 */

/** Raw palette — 1:1 with tailwind.config.ts's `theme.extend.colors`. */
export const palette = {
  // tailwind `primary` (amber). Kept for partner surfaces only on mobile.
  amber: {
    DEFAULT: "#F59E0B",
    50: "#FFF7E6",
    100: "#FDECC8",
    200: "#FBD38D",
    300: "#F8B84E",
    400: "#F6A623",
    500: "#F59E0B",
    600: "#D97706",
    700: "#B45309",
    800: "#92400E",
    900: "#78350F",
  },
  navy: {
    DEFAULT: "#0B1F3A",
    50: "#EDF3FA",
    100: "#D6E4F3",
    200: "#B3CAE8",
    300: "#7EA7D8",
    400: "#4C82C4",
    500: "#1F5FAE",
    600: "#0B3E78",
    700: "#0B2D57",
    800: "#081F3D",
    900: "#051427",
  },
  secondary: {
    DEFAULT: "#1F2937",
    100: "#F3F4F6",
    200: "#E5E7EB",
    300: "#D1D5DB",
    400: "#9CA3AF",
    500: "#6B7280",
    600: "#4B5563",
    700: "#374151",
    800: "#1F2937",
    900: "#111827",
  },
  accent: {
    DEFAULT: "#10B981",
    400: "#34D399",
    500: "#10B981",
    600: "#059669",
    700: "#047857",
  },
  sand: "#F8FAFC",
  ink: "#111827",
  white: "#FFFFFF",
  black: "#000000",
} as const;

/**
 * The Go Hargeisa brand blue used for interactive elements on mobile
 * (buttons, links, active tab, focus). Matches manifest.json `theme_color`
 * and the Android `colors.xml` `colorPrimary` (#0B5ED7).
 */
export const brand = {
  navy: palette.navy.DEFAULT, // headers, chrome
  navyDeep: palette.navy[900], // splash / cold-start background (#051427)
  blue: "#0B5ED7", // primary interactive
  blueDark: "#084BB0", // pressed / active
  blueTint: "#E7F0FD", // subtle backgrounds, chips
  accent: palette.accent.DEFAULT, // success / positive
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16, // tailwind `xl` (1rem)
  xl: 20, // tailwind `xl2` (1.25rem)
  "2xl": 24, // tailwind `2xl` (1.5rem)
  "3xl": 28, // tailwind `xl3` (1.75rem)
  pill: 999,
} as const;

/** iOS/Android shadow presets mirroring tailwind.config.ts's `boxShadow`. */
export const shadows = {
  soft: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
  card: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 40,
    elevation: 6,
  },
  premium: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 24 },
    shadowOpacity: 0.14,
    shadowRadius: 60,
    elevation: 10,
  },
} as const;

/** Stacking tiers — identical intent to tailwind.config.ts's `zIndex`. */
export const zIndex = {
  chrome: 40,
  overlay: 55,
  sheet: 60,
  drawer: 70,
  modal: 80,
  lightbox: 90,
  toast: 100,
  splash: 200,
} as const;

export const spacing = {
  screenX: 20, // matches the web container padding (1.25rem)
  gutter: 16,
  section: 24,
} as const;

export const typography = {
  display: "Fraunces", // headings — same face as the web (next/font)
  body: "PlusJakartaSans", // body — same face as the web
} as const;

/** Semantic light/dark tokens the native ThemeProvider (P1b) resolves. */
export const semanticLight = {
  background: palette.sand,
  surface: palette.white,
  text: palette.ink,
  textMuted: "rgba(17,24,39,0.60)",
  border: "rgba(17,24,39,0.08)",
  primary: brand.blue,
  primaryText: palette.white,
  chrome: brand.navy,
  chromeText: palette.white,
} as const;

export const semanticDark = {
  background: palette.navy[900],
  surface: "#0E1B2E",
  text: "#E9EEF6",
  textMuted: "rgba(233,238,246,0.60)",
  border: "rgba(255,255,255,0.10)",
  primary: "#4C82C4",
  primaryText: palette.white,
  chrome: palette.navy[900],
  chromeText: "#E9EEF6",
} as const;

/** The semantic token set — same keys in light + dark, `string` values so
 *  the two palettes are mutually assignable. */
export type SemanticTokens = Record<keyof typeof semanticLight, string>;
