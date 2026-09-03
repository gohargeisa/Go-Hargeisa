/**
 * `SplashGate` — holds the native splash screen until the app's startup work
 * is done, then reveals the UI:
 *   1. resolve the persisted locale + device locale
 *   2. align the native layout direction (RTL for `ar`)
 *   3. init i18next with the shared message catalogues
 *   4. load the Fraunces + Plus Jakarta Sans fonts
 *
 * Only after all four does `SplashScreen.hideAsync()` run and children mount.
 */
import { useEffect, useState, type ReactNode } from "react";
import { View } from "react-native";
import * as SplashScreen from "expo-splash-screen";

import { brand } from "@/theme";
import { initI18n } from "@/i18n";
import { applyLayoutDirection } from "@/i18n/rtl";
import { resolveInitialLocale } from "@/i18n/use-locale";
import { useAppFonts } from "@/theme/fonts";

void SplashScreen.preventAutoHideAsync();

export function SplashGate({ children }: { children: ReactNode }) {
  const { loaded: fontsLoaded, error: fontError } = useAppFonts();
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    (async () => {
      const locale = await resolveInitialLocale();
      applyLayoutDirection(locale);
      await initI18n(locale);
      setI18nReady(true);
    })();
  }, []);

  const ready = i18nReady && (fontsLoaded || Boolean(fontError));

  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) {
    // The native splash is still up; this matches its ground colour so the
    // hand-off is seamless if it clears a frame early.
    return <View style={{ flex: 1, backgroundColor: brand.navyDeep }} />;
  }

  return <>{children}</>;
}
