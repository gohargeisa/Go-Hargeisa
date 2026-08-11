import type { CityService } from "@/types";

export type GarageType = NonNullable<CityService["garageType"]>;

export const GARAGE_TYPE_ORDER: GarageType[] = ["general_repair", "specialized", "dealership_affiliated", "mobile_repair", "other"];

export const GARAGE_TYPE_LABELS: Record<GarageType, { en: string; ar: string; so: string }> = {
  general_repair: { en: "General Repair Shop", ar: "ورشة تصليح عامة", so: "Garaash Dayactir Guud" },
  specialized: { en: "Specialized Shop", ar: "ورشة متخصصة", so: "Garaash Takhasus ah" },
  dealership_affiliated: { en: "Dealership-Affiliated", ar: "تابعة لوكالة سيارات", so: "La Xiriira Wakiilka Baabuurta" },
  mobile_repair: { en: "Mobile Repair Service", ar: "خدمة تصليح متنقلة", so: "Adeeg Dayactir Socda" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function garageTypeLabel(type: GarageType | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = GARAGE_TYPE_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}
