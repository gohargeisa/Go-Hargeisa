import type { CityService } from "@/types";

/** Clinic-level fields for Dental Clinics — deliberately separate from the
 * existing per-doctor Medical Appointment Engine (departments/doctors/
 * appointments), which already covers per-doctor specialty/bio/languages/
 * booking. This file covers only the clinic-as-a-whole registration info
 * that engine doesn't model. */

export type ClinicType = NonNullable<CityService["clinicType"]>;

export const CLINIC_TYPE_ORDER: ClinicType[] = ["general_dentistry", "orthodontics", "pediatric_dentistry", "multi_specialty", "other"];

export const CLINIC_TYPE_LABELS: Record<ClinicType, { en: string; ar: string; so: string }> = {
  general_dentistry: { en: "General Dentistry", ar: "طب الأسنان العام", so: "Caafimaadka Ilkaha Guud" },
  orthodontics: { en: "Orthodontics Specialist", ar: "أخصائي تقويم الأسنان", so: "Takhasuska Toosinta Ilkaha" },
  pediatric_dentistry: { en: "Pediatric Dentistry", ar: "طب أسنان الأطفال", so: "Caafimaadka Ilkaha Carruurta" },
  multi_specialty: { en: "Multi-Specialty Clinic", ar: "عيادة متعددة التخصصات", so: "Rugta Takhasusyada Badan" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function clinicTypeLabel(type: ClinicType | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = CLINIC_TYPE_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}
