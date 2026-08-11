import type { ProductCategory, ProductGender } from "@/types";

/**
 * Static label map for the fixed products.category vocabulary (a DB CHECK
 * constraint, not a managed CRUD table — Phase 4 design decision, same
 * pattern already used for city_service_category enum labels). Drives both
 * the owner-dashboard category picker and the public filter UI.
 */
export const PRODUCT_CATEGORY_LABELS: Record<ProductCategory, { en: string; ar: string; so: string }> = {
  perfume: { en: "Perfume", ar: "عطر", so: "Cadar" },
  oud: { en: "Oud", ar: "عود", so: "Cuud" },
  bakhoor: { en: "Bakhoor", ar: "بخور", so: "Uunsi" },
  attar: { en: "Attar", ar: "عطر زيتي", so: "Cadar Saliid ah" },
  body_mist: { en: "Body Mist", ar: "معطر الجسم", so: "Cadarka Jidhka" },
  cosmetics: { en: "Cosmetics", ar: "مستحضرات تجميل", so: "Alaabta Qurxinta" },
  makeup: { en: "Makeup", ar: "مكياج", so: "Meykap" },
  body_care: { en: "Body Care", ar: "العناية بالجسم", so: "Daryeelka Jidhka" },
  hair_care: { en: "Hair Care", ar: "العناية بالشعر", so: "Daryeelka Timaha" },
  gift_sets: { en: "Gift Sets", ar: "أطقم هدايا", so: "Xirmooyinka Hadyadaha" },
  accessories: { en: "Accessories", ar: "إكسسوارات", so: "Alaabta Dheeraadka ah" },
  skincare_creams: { en: "Skincare & Creams", ar: "العناية بالبشرة والكريمات", so: "Daryeelka Maqaarka iyo Kareemyada" },
  hair_extensions_wigs: { en: "Hair Extensions & Wigs", ar: "وصلات وشعر مستعار", so: "Dheerayn Timo iyo Wigs" },
  perfumes_fragrances: { en: "Perfumes & Fragrances", ar: "العطور", so: "Cadarrada iyo Udgoonka" },
  bath_body: { en: "Bath & Body", ar: "العناية بالحمام والجسم", so: "Daryeelka Qubaysta iyo Jidhka" },
  nail_care: { en: "Nail Care", ar: "العناية بالأظافر", so: "Daryeelka Ciddiyaha" },
  beauty_tools_accessories: { en: "Beauty Tools & Accessories", ar: "أدوات ومستلزمات التجميل", so: "Qalabka iyo Alaabta Qurxinta" },
  womens_personal_care: { en: "Women's Personal Care", ar: "العناية الشخصية للمرأة", so: "Daryeelka Shaqsiyeed ee Dumarka" },
  spare_parts: { en: "Spare Parts", ar: "قطع غيار", so: "Qaybaha Baabuurta" },
};

export const PRODUCT_CATEGORY_ORDER: ProductCategory[] = [
  "perfume", "oud", "bakhoor", "attar", "body_mist", "cosmetics",
  "makeup", "body_care", "hair_care", "gift_sets", "accessories",
  "skincare_creams", "hair_extensions_wigs", "perfumes_fragrances", "bath_body",
  "nail_care", "beauty_tools_accessories", "womens_personal_care",
  "spare_parts",
];

export const PRODUCT_GENDER_LABELS: Record<ProductGender, { en: string; ar: string; so: string }> = {
  men: { en: "Men", ar: "رجال", so: "Rag" },
  women: { en: "Women", ar: "نساء", so: "Dumar" },
  unisex: { en: "Unisex", ar: "للجنسين", so: "Labadaba" },
  kids: { en: "Kids", ar: "أطفال", so: "Carruur" },
};

export const PRODUCT_GENDER_ORDER: ProductGender[] = ["men", "women", "unisex", "kids"];

/** The subset of ProductCategory specific to Cosmetics & Women's Beauty
 * (excludes perfume/oud/bakhoor/attar/body_mist, which are Perfume &
 * Cosmetics shops' own vocabulary, and cosmetics/makeup/body_care/hair_care/
 * gift_sets/accessories/spare_parts, which are shared with other
 * categories) — used to let an owner declare intended specialties on the
 * /join form before their listing (and its real product catalog) exists.
 * No new labels: reuses PRODUCT_CATEGORY_LABELS as-is. */
export const COSMETICS_SPECIALTY_CATEGORIES: ProductCategory[] = [
  "skincare_creams", "hair_extensions_wigs", "perfumes_fragrances", "bath_body",
  "nail_care", "beauty_tools_accessories", "womens_personal_care",
];

/** The subset of ProductCategory specific to Perfume shops — the exact
 * vocabulary already reserved as "Perfume & Cosmetics shops' own vocabulary"
 * (see the comment above) but never actually surfaced as a declared-
 * specialties picker until now. Same reuse pattern as
 * COSMETICS_SPECIALTY_CATEGORIES: no new labels, reuses PRODUCT_CATEGORY_LABELS
 * as-is, stored in the same `service_tags` intake slot. */
export const PERFUME_SPECIALTY_CATEGORIES: ProductCategory[] = [
  "perfume", "oud", "bakhoor", "attar", "body_mist",
];

export function productCategoryLabel(category: ProductCategory | undefined, locale: string): string | undefined {
  if (!category) return undefined;
  const entry = PRODUCT_CATEGORY_LABELS[category];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

export function productGenderLabel(gender: ProductGender | undefined, locale: string): string | undefined {
  if (!gender) return undefined;
  const entry = PRODUCT_GENDER_LABELS[gender];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}
