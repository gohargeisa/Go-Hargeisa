import type { Cafe } from "@/types";

export type CafeType = NonNullable<Cafe["cafeType"]>;

export const CAFE_TYPE_ORDER: CafeType[] = [
  "coffee_shop",
  "dessert_cafe",
  "study_cafe",
  "rooftop_cafe",
  "tea_house",
  "other",
];

export const CAFE_TYPE_LABELS: Record<CafeType, { en: string; ar: string; so: string }> = {
  coffee_shop: { en: "Coffee Shop", ar: "مقهى قهوة", so: "Kafeega Bunka" },
  dessert_cafe: { en: "Dessert Café", ar: "مقهى حلويات", so: "Kafeega Macmacaanka" },
  study_cafe: { en: "Study / Internet Café", ar: "مقهى للدراسة والإنترنت", so: "Kafeega Wax-barashada" },
  rooftop_cafe: { en: "Rooftop Café", ar: "مقهى على السطح", so: "Kafeega Saqafka Sare" },
  tea_house: { en: "Traditional Tea House", ar: "بيت شاي تقليدي", so: "Guriga Shaaha ee Dhaqameed" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function cafeTypeLabel(type: CafeType | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = CAFE_TYPE_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}
