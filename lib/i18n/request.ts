import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { locales, defaultLocale, type Locale } from "./config";

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
    messages: (
      await import(`../../messages/${currentLocale}.json`)
    ).default,
  };
});