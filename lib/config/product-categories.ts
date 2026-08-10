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
};

export const PRODUCT_CATEGORY_ORDER: ProductCategory[] = [
  "perfume", "oud", "bakhoor", "attar", "body_mist", "cosmetics",
  "makeup", "body_care", "hair_care", "gift_sets", "accessories",
];

export const PRODUCT_GENDER_LABELS: Record<ProductGender, { en: string; ar: string; so: string }> = {
  men: { en: "Men", ar: "رجال", so: "Rag" },
  women: { en: "Women", ar: "نساء", so: "Dumar" },
  unisex: { en: "Unisex", ar: "للجنسين", so: "Labadaba" },
  kids: { en: "Kids", ar: "أطفال", so: "Carruur" },
};

export const PRODUCT_GENDER_ORDER: ProductGender[] = ["men", "women", "unisex", "kids"];

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
