export const locales = ["en", "ar", "so"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

interface LocaleMeta {
  label: string;
  dir: "ltr" | "rtl";
  /** Emoji flag, when Unicode has a correct one for this locale's flag. */
  flagEmoji?: string;
  /** Path to an image asset, used when no correct emoji flag exists (e.g.
   *  Somaliland, which Unicode doesn't support — its flag must never be
   *  substituted with Somalia's flag). */
  flagSrc?: string;
}

export const localeConfig: Record<Locale, LocaleMeta> = {
  en: {
    label: "English",
    dir: "ltr",
    flagSrc: "/flags/uk.png",
  },
  ar: {
    label: "العربية",
    dir: "rtl",
    flagSrc: "/flags/uae.png",
  },
  so: {
    label: "Somaliland",
    dir: "ltr",
    flagSrc: "/flags/somaliland.png",
  },
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
