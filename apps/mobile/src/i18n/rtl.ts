/**
 * RTL handling. Only Arabic (`ar`) is RTL; English and Somali are LTR.
 *
 * React Native's layout direction is a NATIVE, process-wide setting
 * (`I18nManager`). Changing it only fully takes effect after an app reload,
 * so we:
 *   - set `I18nManager.forceRTL(...)` as early as possible (SplashGate, before
 *     first render), and
 *   - if it doesn't match the desired direction, ask for one reload via
 *     `expo-updates`-less `Updates`? No — we use `expo-router`'s remount plus
 *     a soft prompt. In practice the value is read at startup from the
 *     persisted locale, so a fresh launch is already correct.
 */
import { I18nManager } from "react-native";

import type { Locale } from "@gohargeisa/i18n";

export function isRtlLocale(locale: Locale): boolean {
  return locale === "ar";
}

/**
 * Align the native layout direction with `locale`. Returns `true` when a
 * change was applied that needs an app reload to fully render.
 */
export function applyLayoutDirection(locale: Locale): boolean {
  const wantRtl = isRtlLocale(locale);
  I18nManager.allowRTL(wantRtl);
  if (I18nManager.isRTL !== wantRtl) {
    I18nManager.forceRTL(wantRtl);
    return true;
  }
  return false;
}
