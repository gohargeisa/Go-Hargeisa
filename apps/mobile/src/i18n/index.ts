/**
 * i18next, fed the EXACT `messages/{en,ar,so}.json` the website ships (via
 * `@gohargeisa/i18n` — no re-translation, no divergence).
 *
 * next-intl (web) uses ICU `{var}` / `{count, plural, …}` syntax. i18next's
 * default interpolation is `{{var}}`, so we switch the delimiters to `{`/`}`
 * for simple substitution. Full ICU (plural/select) is added with
 * `i18next-icu` in P1d if a screen needs it — the foundation only needs
 * simple keys + interpolation, which this covers.
 *
 * Locale + writing direction: only `ar` is RTL. `so` is LTR Latin. The
 * persisted choice and the RTL flip live in `./use-locale` + `./rtl`.
 */
// The default export is the shared i18next instance; its `.use()` / `.init()`
// / `.changeLanguage()` are instance methods (not the module's named exports).
/* eslint-disable import/no-named-as-default-member */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import "intl-pluralrules";

import {
  defaultLocale,
  isLocale,
  locales,
  messageResources,
  type Locale,
} from "@gohargeisa/i18n";

// Native-app-only strings (app chrome, screens that have no web equivalent).
// Kept OUT of the shared web `messages/*` so the production website's i18n
// files are never touched. Partial ar/so — missing keys fall back to en.
import appEn from "./strings/en.json";
import appAr from "./strings/ar.json";
import appSo from "./strings/so.json";

const appResources = { en: appEn, ar: appAr, so: appSo } as const;

let activeLocale: Locale = defaultLocale;

export function getActiveLocale(): Locale {
  return activeLocale;
}

export async function initI18n(initialLocale: Locale): Promise<typeof i18n> {
  activeLocale = isLocale(initialLocale) ? initialLocale : defaultLocale;

  if (!i18n.isInitialized) {
    await i18n.use(initReactI18next).init({
      resources: Object.fromEntries(
        locales.map((l) => [
          l,
          { app: appResources[l], translation: messageResources[l] },
        ]),
      ),
      lng: activeLocale,
      fallbackLng: defaultLocale,
      supportedLngs: [...locales],
      // Look up native keys first, then fall through to the shared web
      // catalogue (categories, common actions, weekdays, …).
      defaultNS: ["app", "translation"],
      fallbackNS: "translation",
      // next-intl nests namespaces with "." — keep the dotted path as one key.
      keySeparator: ".",
      nsSeparator: false,
      interpolation: {
        escapeValue: false,
        prefix: "{",
        suffix: "}",
      },
      returnNull: false,
      react: { useSuspense: false },
    });
  } else if (i18n.language !== activeLocale) {
    await i18n.changeLanguage(activeLocale);
  }

  return i18n;
}

export async function setActiveLocale(locale: Locale): Promise<void> {
  activeLocale = locale;
  await i18n.changeLanguage(locale);
}

export { i18n };
