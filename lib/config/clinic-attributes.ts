import type { CityService } from "@/types";

/** Clinic-level fields for the unified Clinics / Medical Clinics category —
 * deliberately separate from the existing per-doctor Medical Appointment
 * Engine (departments/doctors/appointments), which already covers
 * per-doctor specialty/bio/languages/booking. This file covers only the
 * clinic-as-a-whole registration info that engine doesn't model.
 *
 * Dental Clinic was previously its own top-level category (slug
 * "dental-clinic") with its own 5-value clinic type vocabulary. It has been
 * consolidated into this single Clinics category (slug "clinic") — "dental"
 * is now one value within the full vocabulary below rather than a separate
 * category. The dental-clinic category row still exists (deactivated, not
 * deleted) and its service-tags vocabulary (Root Canal, Teeth Whitening,
 * etc.) is reused here, shown only when clinicType === "dental". */

export type ClinicType = NonNullable<CityService["clinicType"]>;

export const CLINIC_TYPE_ORDER: ClinicType[] = [
  "general",
  "dental",
  "hijama",
  "veterinary",
  "eye",
  "dermatology",
  "pediatric",
  "womens_health",
  "mens_health",
  "physiotherapy",
  "ent",
  "laboratory_diagnostic",
  "other",
];

export const CLINIC_TYPE_LABELS: Record<ClinicType, { en: string; ar: string; so: string }> = {
  general: { en: "General Clinic", ar: "عيادة عامة", so: "Rug Caafimaad Guud" },
  dental: { en: "Dental Clinic", ar: "عيادة أسنان", so: "Rugta Ilkaha" },
  hijama: { en: "Hijama Clinic", ar: "عيادة حجامة", so: "Rugta Xijaamada" },
  veterinary: { en: "Veterinary Clinic", ar: "عيادة بيطرية", so: "Rugta Xayawaanka" },
  eye: { en: "Eye Clinic", ar: "عيادة عيون", so: "Rugta Indhaha" },
  dermatology: { en: "Dermatology Clinic", ar: "عيادة جلدية", so: "Rugta Cudurada Maqaarka" },
  pediatric: { en: "Pediatric Clinic", ar: "عيادة أطفال", so: "Rugta Caafimaadka Carruurta" },
  womens_health: { en: "Women's Health Clinic", ar: "عيادة صحة المرأة", so: "Rugta Caafimaadka Dumarka" },
  mens_health: { en: "Men's Health Clinic", ar: "عيادة صحة الرجل", so: "Rugta Caafimaadka Ragga" },
  physiotherapy: { en: "Physiotherapy Clinic", ar: "عيادة علاج طبيعي", so: "Rugta Dib-u-dhaqsiga Jidhka" },
  ent: { en: "ENT Clinic", ar: "عيادة أنف وأذن وحنجرة", so: "Rugta Sanka, Dhegta iyo Cunaha" },
  laboratory_diagnostic: { en: "Laboratory / Diagnostic Clinic", ar: "مختبر / عيادة تشخيصية", so: "Shaybaar / Rugta Baadhista" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function clinicTypeLabel(type: ClinicType | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = CLINIC_TYPE_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}
