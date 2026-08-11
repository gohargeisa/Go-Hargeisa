import type { CityService } from "@/types";

/** Shared retail-store attribute — Cosmetics & Women's Beauty and Perfume
 * shops both need the same "what kind of store is this" classifier and a
 * free-text brands-carried list. One config, one pair of columns
 * (`store_type`/`brands`), reused by both categories rather than duplicated. */

export type StoreType = NonNullable<CityService["storeType"]>;

export const STORE_TYPE_ORDER: StoreType[] = ["boutique", "multi_brand", "kiosk", "online_and_physical", "other"];

export const STORE_TYPE_LABELS: Record<StoreType, { en: string; ar: string; so: string }> = {
  boutique: { en: "Boutique", ar: "متجر بوتيك", so: "Dukaan Butiik ah" },
  multi_brand: { en: "Multi-Brand Store", ar: "متجر متعدد الماركات", so: "Dukaan Calaamado Badan" },
  kiosk: { en: "Kiosk", ar: "كشك", so: "Kiyoosk" },
  online_and_physical: { en: "Online + Physical Store", ar: "متجر إلكتروني وفعلي", so: "Dukaan Online iyo Dhab ah" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function storeTypeLabel(type: StoreType | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = STORE_TYPE_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}
