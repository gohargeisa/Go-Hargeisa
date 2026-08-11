/**
 * Fixed vocabulary for a hotel's self-declared classification — same "Phase 4
 * design decision" as lib/config/product-categories.ts: a DB CHECK
 * constraint value space, not a managed CRUD table, so labels live here as a
 * static trilingual map rather than in next-intl (which has no per-value
 * translation for admin-created rows anyway — see categoryDisplayName's own
 * comment on why categories work that way).
 *
 * Deliberately distinct from `hotels.rating` (a guest-review-derived score)
 * — star_rating here is the hotel's own claimed classification, shown
 * alongside but never confused with the review rating.
 */
import type { Hotel } from "@/types";

export type HotelType = NonNullable<Hotel["hotelType"]>;

export const HOTEL_TYPE_ORDER: HotelType[] = ["hotel", "boutique", "resort", "guesthouse", "hostel", "apartment_hotel"];

export const HOTEL_TYPE_LABELS: Record<HotelType, { en: string; ar: string; so: string }> = {
  hotel: { en: "Hotel", ar: "فندق", so: "Hudheel" },
  boutique: { en: "Boutique Hotel", ar: "فندق بوتيك", so: "Hudheel Butiik ah" },
  resort: { en: "Resort", ar: "منتجع", so: "Xarun Nasasho" },
  guesthouse: { en: "Guesthouse", ar: "بيت ضيافة", so: "Guriga Martida" },
  hostel: { en: "Hostel", ar: "نُزُل", so: "Hostel" },
  apartment_hotel: { en: "Apartment Hotel", ar: "شقق فندقية", so: "Guryo Hudheel ah" },
};

export function hotelTypeLabel(type: HotelType | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = HOTEL_TYPE_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

/** Matches the exact stored values already used by the admin hotel form's
 * `LANGUAGE_SUGGESTIONS` free-text tag input (components/admin/hotel-form.tsx)
 * — reusing the same plain-English values keeps intake and admin-set data
 * consistent in `hotels.languages`/`business_join_requests.languages`; only
 * the *displayed* label is locale-aware. */
export const LANGUAGE_SPOKEN_OPTIONS = ["English", "Somali", "Arabic"] as const;

export const LANGUAGE_SPOKEN_LABELS: Record<string, { en: string; ar: string; so: string }> = {
  English: { en: "English", ar: "الإنجليزية", so: "Ingiriisi" },
  Somali: { en: "Somali", ar: "الصومالية", so: "Soomaali" },
  Arabic: { en: "Arabic", ar: "العربية", so: "Carabi" },
};

export function languageSpokenLabel(value: string, locale: string): string {
  const entry = LANGUAGE_SPOKEN_LABELS[value];
  if (!entry) return value;
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

export const STAR_RATING_OPTIONS = [1, 2, 3, 4, 5] as const;

/** "4-Star" / "4 نجوم" / "4 Xiddig" — a simple templated label since the
 * only variable is the number itself, not worth a 5-entry lookup map. */
export function starRatingLabel(stars: number | undefined, locale: string): string | undefined {
  if (!stars) return undefined;
  if (locale === "ar") return `${stars} نجوم`;
  if (locale === "so") return `${stars} Xiddig`;
  return `${stars}-Star`;
}
