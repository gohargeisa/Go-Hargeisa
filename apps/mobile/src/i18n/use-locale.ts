/**
 * The active UI locale, persisted so the choice survives restarts.
 *
 * Resolution order at startup:
 *   1. the value the user previously picked (AsyncStorage)
 *   2. the device locale, if it is one we support
 *   3. `defaultLocale` ("en")
 */
import { useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import { useTranslation } from "react-i18next";

import { defaultLocale, isLocale, type Locale } from "@gohargeisa/i18n";
import { setActiveLocale } from "@/i18n";
import { applyLayoutDirection, isRtlLocale } from "@/i18n/rtl";

const STORAGE_KEY = "gohargeisa.locale";

export async function resolveInitialLocale(): Promise<Locale> {
  try {
    const saved = await AsyncStorage.getItem(STORAGE_KEY);
    if (saved && isLocale(saved)) return saved;
  } catch {
    // ignore — fall through to device locale
  }
  const device = Localization.getLocales()[0]?.languageCode ?? "";
  return isLocale(device) ? device : defaultLocale;
}

export interface UseLocale {
  locale: Locale;
  isRtl: boolean;
  /** Persist + apply. Returns `true` if an app reload is needed (RTL flip). */
  setLocale: (next: Locale) => Promise<boolean>;
}

export function useLocale(): UseLocale {
  const { i18n } = useTranslation();
  const locale = (isLocale(i18n.language) ? i18n.language : defaultLocale) as Locale;

  const setLocale = useCallback(async (next: Locale) => {
    await AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
    await setActiveLocale(next);
    return applyLayoutDirection(next);
  }, []);

  return { locale, isRtl: isRtlLocale(locale), setLocale };
}
