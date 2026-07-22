import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, defaultLocale, type Locale } from "./config";
import enMessages from "../../messages/en.json";
import arMessages from "../../messages/ar.json";
import soMessages from "../../messages/so.json";

// Keep the locale catalogues as explicit imports. A template-literal import in
// this request config creates a Webpack context module beneath app/[locale],
// which can leave App Router boundary chunks unavailable to the dev server.
const messagesByLocale = {
  en: enMessages,
  ar: arMessages,
  so: soMessages,
} as const;

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = await requestLocale;

  const currentLocale =
    locale && locales.includes(locale as Locale)
      ? (locale as Locale)
      : defaultLocale;

  if (!locales.includes(currentLocale)) {
    notFound();
  }

  return {
    locale: currentLocale,
    messages: messagesByLocale[currentLocale],
  };
});
