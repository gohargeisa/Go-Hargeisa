import type { CityService } from "@/types";

export type RentalType = NonNullable<CityService["rentalType"]>;

export const RENTAL_TYPE_ORDER: RentalType[] = ["self_drive", "with_driver", "both", "other"];

export const RENTAL_TYPE_LABELS: Record<RentalType, { en: string; ar: string; so: string }> = {
  self_drive: { en: "Self-Drive", ar: "قيادة ذاتية", so: "Isu-wadid" },
  with_driver: { en: "With Driver", ar: "مع سائق", so: "Wadaha oo la socda" },
  both: { en: "Both Options Available", ar: "كلا الخيارين متوفران", so: "Labadaba way heli kartaa" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function rentalTypeLabel(type: RentalType | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = RENTAL_TYPE_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

export const VEHICLE_TYPE_ORDER = ["sedan", "suv", "van", "minibus", "pickup", "luxury", "other"] as const;
export type VehicleType = (typeof VEHICLE_TYPE_ORDER)[number];

export const VEHICLE_TYPE_LABELS: Record<VehicleType, { en: string; ar: string; so: string }> = {
  sedan: { en: "Sedan", ar: "سيدان", so: "Sedan" },
  suv: { en: "SUV", ar: "دفع رباعي", so: "SUV" },
  van: { en: "Van", ar: "فان", so: "Faan" },
  minibus: { en: "Minibus", ar: "حافلة صغيرة", so: "Bas Yar" },
  pickup: { en: "Pickup Truck", ar: "شاحنة صغيرة", so: "Piikab" },
  luxury: { en: "Luxury Car", ar: "سيارة فاخرة", so: "Baabuur Qaali ah" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function vehicleTypeLabel(type: VehicleType, locale: string): string {
  const entry = VEHICLE_TYPE_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}
