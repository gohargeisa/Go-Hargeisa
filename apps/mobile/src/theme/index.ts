/**
 * Imperative design tokens for the native app.
 *
 * The single source of truth is `@gohargeisa/tokens` (which mirrors the web
 * `tailwind.config.ts`). NativeWind classes cover most styling; this module
 * is for the cases that need real values — navigation theming, MapLibre,
 * StatusBar, shadows, gradients.
 *
 * BRAND RULE: the app chrome is navy + blue. Amber (`palette.amber`) is only
 * for partner-branded surfaces.
 */
import { useColorScheme } from "react-native";

import {
  brand,
  palette,
  radii,
  semanticDark,
  semanticLight,
  shadows,
  spacing,
  type SemanticTokens,
} from "@gohargeisa/tokens";

export { brand, palette, radii, shadows, spacing };
export type { SemanticTokens };

export type ThemeName = "light" | "dark";

export interface Theme {
  name: ThemeName;
  colors: SemanticTokens;
  radii: typeof radii;
  spacing: typeof spacing;
  shadows: typeof shadows;
}

export const lightTheme: Theme = {
  name: "light",
  colors: semanticLight,
  radii,
  spacing,
  shadows,
};

export const darkTheme: Theme = {
  name: "dark",
  colors: semanticDark,
  radii,
  spacing,
  shadows,
};

/** Resolve the active theme from the OS setting. A user override is layered
 *  on in `providers/theme-provider.tsx`. */
export function useSystemTheme(): Theme {
  return useColorScheme() === "dark" ? darkTheme : lightTheme;
}

/** React Navigation theme derived from ours (used by expo-router's Stack). */
export function toNavigationTheme(theme: Theme) {
  return {
    dark: theme.name === "dark",
    colors: {
      primary: theme.colors.primary,
      background: theme.colors.background,
      card: theme.colors.chrome,
      text: theme.colors.chromeText,
      border: theme.colors.border,
      notification: brand.blue,
    },
    fonts: navigationFonts,
  };
}

const navigationFonts = {
  regular: { fontFamily: "PlusJakartaSans_400Regular", fontWeight: "400" },
  medium: { fontFamily: "PlusJakartaSans_500Medium", fontWeight: "500" },
  bold: { fontFamily: "PlusJakartaSans_700Bold", fontWeight: "700" },
  heavy: { fontFamily: "PlusJakartaSans_700Bold", fontWeight: "700" },
} as const;
