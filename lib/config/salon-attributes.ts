import type { CityService } from "@/types";

/** Women's Beauty Salons (women-only) + Men's Salons/Barbershops (men-only)
 * — two strictly separate categories, each already fully served by its own
 * `service_tags` vocabulary (lib/config/service-tags.ts). This file covers
 * only the small set of genuinely missing structured fields for each. There
 * is deliberately no "unisex" value anywhere below — gender exclusivity is
 * a property of the category itself (which category a business selects on
 * /join), not a field a business fills in. */

export type SalonType = NonNullable<CityService["salonType"]>;

export const SALON_TYPE_ORDER: SalonType[] = [
  "hair_salon",
  "nail_salon",
  "full_service",
  "spa_wellness",
  "bridal_studio",
  "mobile",
  "other",
];

export const SALON_TYPE_LABELS: Record<SalonType, { en: string; ar: string; so: string }> = {
  hair_salon: { en: "Hair Salon", ar: "صالون شعر", so: "Saloonka Timaha" },
  nail_salon: { en: "Nail Salon", ar: "صالون أظافر", so: "Saloonka Ciddiyaha" },
  full_service: { en: "Full-Service Beauty Salon", ar: "صالون تجميل شامل", so: "Saloon Qurux oo Buuxa" },
  spa_wellness: { en: "Spa & Wellness", ar: "سبا وعافية", so: "Spa & Caafimaad" },
  bridal_studio: { en: "Bridal Studio", ar: "استوديو عرائس", so: "Studio Aroosnimo" },
  mobile: { en: "Home-based / Mobile Salon", ar: "صالون منزلي / متنقل", so: "Saloon Guriga/Socda" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function salonTypeLabel(type: SalonType | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = SALON_TYPE_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

export type ShopType = NonNullable<CityService["shopType"]>;

export const SHOP_TYPE_ORDER: ShopType[] = ["traditional_barbershop", "modern_grooming", "barbershop_spa", "mobile", "other"];

export const SHOP_TYPE_LABELS: Record<ShopType, { en: string; ar: string; so: string }> = {
  traditional_barbershop: { en: "Traditional Barbershop", ar: "محل حلاقة تقليدي", so: "Xaladhka Dhaqameed" },
  modern_grooming: { en: "Modern Grooming Salon", ar: "صالون تهذيب حديث", so: "Saloon Casri ah" },
  barbershop_spa: { en: "Barbershop & Spa", ar: "محل حلاقة وسبا", so: "Xalaadh & Spa" },
  mobile: { en: "Home-based / Mobile Barber", ar: "حلاق منزلي / متنقل", so: "Xalaad Guriga/Socda" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function shopTypeLabel(type: ShopType | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = SHOP_TYPE_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}
