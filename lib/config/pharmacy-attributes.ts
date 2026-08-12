import { Truck, FileWarning, Home, type LucideIcon } from "lucide-react";
import type { CityService } from "@/types";

export type PharmacyType = NonNullable<CityService["pharmacyType"]>;

export const PHARMACY_TYPE_ORDER: PharmacyType[] = [
  "community",
  "hospital_pharmacy",
  "twenty_four_hour",
  "online",
  "specialty",
  "other",
];

export const PHARMACY_TYPE_LABELS: Record<PharmacyType, { en: string; ar: string; so: string }> = {
  community: { en: "Community Pharmacy", ar: "صيدلية مجتمعية", so: "Farmashiga Bulshada" },
  hospital_pharmacy: { en: "Hospital Pharmacy", ar: "صيدلية المستشفى", so: "Farmashiga Isbitaalka" },
  twenty_four_hour: { en: "24-Hour Pharmacy", ar: "صيدلية 24 ساعة", so: "Farmashi 24 Saacadood Furan" },
  online: { en: "Online Pharmacy", ar: "صيدلية إلكترونية", so: "Farmashi Online ah" },
  specialty: { en: "Specialty Pharmacy", ar: "صيدلية متخصصة", so: "Farmashi Takhasus ah" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function pharmacyTypeLabel(type: PharmacyType | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = PHARMACY_TYPE_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

/** Each code maps 1:1 to its own dedicated boolean column on `city_services`
 * (pharmacy_delivery_available, prescription_required, home_delivery). */
export const PHARMACY_FEATURE_ORDER = ["pharmacy_delivery_available", "prescription_required", "home_delivery"] as const;

export type PharmacyFeatureCode = (typeof PHARMACY_FEATURE_ORDER)[number];

export const PHARMACY_FEATURE_ICON: Record<PharmacyFeatureCode, LucideIcon> = {
  pharmacy_delivery_available: Truck,
  prescription_required: FileWarning,
  home_delivery: Home,
};

export const PHARMACY_FEATURE_LABELS: Record<PharmacyFeatureCode, { en: string; ar: string; so: string }> = {
  pharmacy_delivery_available: { en: "Delivery Available", ar: "التوصيل متاح", so: "Gaarsiin ayaa la heli karaa" },
  prescription_required: { en: "Prescription Required", ar: "يتطلب وصفة طبية", so: "Waxa loo baahan yahay Warqad Dhakhtar" },
  home_delivery: { en: "Home Delivery", ar: "التوصيل للمنزل", so: "Gaarsiinta Guriga" },
};

export function pharmacyFeatureLabel(code: PharmacyFeatureCode, locale: string): string {
  const entry = PHARMACY_FEATURE_LABELS[code];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}
