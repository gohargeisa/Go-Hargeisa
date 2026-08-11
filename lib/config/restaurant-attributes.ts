import type { Restaurant } from "@/types";

export type RestaurantType = NonNullable<Restaurant["restaurantType"]>;

export const RESTAURANT_TYPE_ORDER: RestaurantType[] = [
  "somali",
  "international",
  "fast_food",
  "cafe_restaurant",
  "family",
  "fine_dining",
  "buffet",
  "bakery_restaurant",
  "other",
];

export const RESTAURANT_TYPE_LABELS: Record<RestaurantType, { en: string; ar: string; so: string }> = {
  somali: { en: "Somali Restaurant", ar: "مطعم صومالي", so: "Makhaayad Soomaali ah" },
  international: { en: "International Restaurant", ar: "مطعم عالمي", so: "Makhaayad Caalami ah" },
  fast_food: { en: "Fast Food", ar: "طعام سريع", so: "Cunto Degdeg ah" },
  cafe_restaurant: { en: "Café & Restaurant", ar: "مقهى ومطعم", so: "Kafee & Makhaayad" },
  family: { en: "Family Restaurant", ar: "مطعم عائلي", so: "Makhaayad Qoyska" },
  fine_dining: { en: "Fine Dining", ar: "مطعم راقٍ", so: "Makhaayad Sare" },
  buffet: { en: "Buffet", ar: "بوفيه", so: "Buufeey" },
  bakery_restaurant: { en: "Bakery & Restaurant", ar: "مخبز ومطعم", so: "Furun & Makhaayad" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function restaurantTypeLabel(type: RestaurantType | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = RESTAURANT_TYPE_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

/** Cuisine / food-type checklist — multi-select, distinct from
 * RestaurantType (a restaurant's overall style vs. the specific cuisines it
 * serves). Codes are written as their English label into the existing
 * `restaurants.cuisine` free-text column on conversion, matching that
 * column's existing display-text convention (see business-requests.ts). */
export const CUISINE_ORDER = [
  "somali",
  "arabic",
  "african",
  "ethiopian",
  "indian",
  "pakistani",
  "italian",
  "turkish",
  "chinese",
  "fast_food",
  "seafood",
  "grilled",
  "bakery",
  "desserts",
  "other",
] as const;

export type CuisineCode = (typeof CUISINE_ORDER)[number];

export const CUISINE_LABELS: Record<CuisineCode, { en: string; ar: string; so: string }> = {
  somali: { en: "Somali", ar: "صومالي", so: "Soomaali" },
  arabic: { en: "Arabic", ar: "عربي", so: "Carabi" },
  african: { en: "African", ar: "أفريقي", so: "Afrikaan" },
  ethiopian: { en: "Ethiopian", ar: "إثيوبي", so: "Itoobiyaan" },
  indian: { en: "Indian", ar: "هندي", so: "Hindi" },
  pakistani: { en: "Pakistani", ar: "باكستاني", so: "Bakistaani" },
  italian: { en: "Italian", ar: "إيطالي", so: "Talyaani" },
  turkish: { en: "Turkish", ar: "تركي", so: "Turki" },
  chinese: { en: "Chinese", ar: "صيني", so: "Shiine" },
  fast_food: { en: "Fast Food", ar: "طعام سريع", so: "Cunto Degdeg ah" },
  seafood: { en: "Seafood", ar: "مأكولات بحرية", so: "Cunto Bad" },
  grilled: { en: "Grilled Food", ar: "مشاوي", so: "Cunto Dubaan" },
  bakery: { en: "Bakery", ar: "مخبوزات", so: "Furun" },
  desserts: { en: "Desserts", ar: "حلويات", so: "Macmacaan" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function cuisineLabel(code: CuisineCode, locale: string): string {
  const entry = CUISINE_LABELS[code];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}
