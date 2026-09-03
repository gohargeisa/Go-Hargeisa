/**
 * The app uses the SAME two typefaces as the website:
 *   - Fraunces           → display / headings   (`font-display` in NativeWind)
 *   - Plus Jakarta Sans  → body / UI            (`font-body`)
 *
 * Loaded from the `@expo-google-fonts/*` packages (bundled .ttf, no network).
 * `useAppFonts()` is awaited by the SplashGate before the UI is shown.
 */
import {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from "@expo-google-fonts/fraunces";
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
} from "@expo-google-fonts/plus-jakarta-sans";
import { useFonts } from "expo-font";

export const fontMap = {
  Fraunces_400Regular,
  Fraunces_500Medium,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
};

/** NativeWind `fontFamily` keys → the loaded font names. */
export const fontFamily = {
  display: "Fraunces_600SemiBold",
  displayBold: "Fraunces_700Bold",
  body: "PlusJakartaSans_400Regular",
  bodyMedium: "PlusJakartaSans_500Medium",
  bodySemibold: "PlusJakartaSans_600SemiBold",
  bodyBold: "PlusJakartaSans_700Bold",
} as const;

export function useAppFonts(): { loaded: boolean; error: Error | null } {
  const [loaded, error] = useFonts(fontMap);
  return { loaded, error: error ?? null };
}
