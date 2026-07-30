import { locales, type Locale } from "./config";

/**
 * Every page below the root layout was overriding `alternates.canonical`
 * without `languages` — since Next.js metadata replaces the whole
 * `alternates` object per segment rather than deep-merging it, this silently
 * dropped the root layout's hreflang tags (which were themselves wrong past
 * the homepage, always pointing at `/en`, `/ar`, `/so`). `path` is the
 * locale-agnostic part of the URL, e.g. `/hotels/${slug}`.
 */
export function localeAlternates(locale: Locale, path: string) {
  return {
    canonical: `/${locale}${path}`,
    languages: Object.fromEntries(locales.map((l) => [l, `/${l}${path}`])) as Record<Locale, string>,
  };
}
