import { Siren, HeartPulse, Pill, FlaskConical, Radiation, Ambulance, Baby, PersonStanding, type LucideIcon } from "lucide-react";
import type { CityService } from "@/types";

export type HospitalType = NonNullable<CityService["hospitalType"]>;

export const HOSPITAL_TYPE_ORDER: HospitalType[] = [
  "general",
  "private",
  "public",
  "specialist",
  "maternity",
  "childrens",
  "surgical",
  "emergency",
  "medical_center",
  "other",
];

export const HOSPITAL_TYPE_LABELS: Record<HospitalType, { en: string; ar: string; so: string }> = {
  general: { en: "General Hospital", ar: "مستشفى عام", so: "Isbitaal Guud" },
  private: { en: "Private Hospital", ar: "مستشفى خاص", so: "Isbitaal Gaar ah" },
  public: { en: "Public Hospital", ar: "مستشفى حكومي", so: "Isbitaal Dawladeed" },
  specialist: { en: "Specialist Hospital", ar: "مستشفى تخصصي", so: "Isbitaal Takhasus ah" },
  maternity: { en: "Maternity Hospital", ar: "مستشفى ولادة", so: "Isbitaalka Umulinta" },
  childrens: { en: "Children's Hospital", ar: "مستشفى أطفال", so: "Isbitaalka Carruurta" },
  surgical: { en: "Surgical Hospital", ar: "مستشفى جراحي", so: "Isbitaalka Qalliinka" },
  emergency: { en: "Emergency Hospital", ar: "مستشفى طوارئ", so: "Isbitaalka Degdegga ah" },
  medical_center: { en: "Medical Center", ar: "مركز طبي", so: "Xarunta Caafimaadka" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function hospitalTypeLabel(type: HospitalType | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = HOSPITAL_TYPE_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

/** Each code maps 1:1 to its own dedicated boolean column on `city_services`
 * (emergency_department, icu_available, ...). */
export const HOSPITAL_FACILITY_ORDER = [
  "emergency_department",
  "icu_available",
  "pharmacy_onsite",
  "laboratory_onsite",
  "radiology_onsite",
  "ambulance_available",
  "maternity_department",
  "pediatric_department",
] as const;

export type HospitalFacilityCode = (typeof HOSPITAL_FACILITY_ORDER)[number];

export const HOSPITAL_FACILITY_ICON: Record<HospitalFacilityCode, LucideIcon> = {
  emergency_department: Siren,
  icu_available: HeartPulse,
  pharmacy_onsite: Pill,
  laboratory_onsite: FlaskConical,
  radiology_onsite: Radiation,
  ambulance_available: Ambulance,
  maternity_department: Baby,
  pediatric_department: PersonStanding,
};

export const HOSPITAL_FACILITY_LABELS: Record<HospitalFacilityCode, { en: string; ar: string; so: string }> = {
  emergency_department: { en: "Emergency Department", ar: "قسم الطوارئ", so: "Waaxda Degdegga" },
  icu_available: { en: "ICU", ar: "وحدة العناية المركزة", so: "Xarunta Daryeelka Gaarka ah (ICU)" },
  pharmacy_onsite: { en: "Pharmacy", ar: "صيدلية", so: "Farmashi" },
  laboratory_onsite: { en: "Laboratory", ar: "مختبر", so: "Shaybaar" },
  radiology_onsite: { en: "Radiology", ar: "الأشعة", so: "Sawirrada Dhaqtarnimada" },
  ambulance_available: { en: "Ambulance", ar: "سيارة إسعاف", so: "Ambalaas" },
  maternity_department: { en: "Maternity", ar: "قسم الولادة", so: "Waaxda Umulinta" },
  pediatric_department: { en: "Pediatric Department", ar: "قسم الأطفال", so: "Waaxda Carruurta" },
};

export function hospitalFacilityLabel(code: HospitalFacilityCode, locale: string): string {
  const entry = HOSPITAL_FACILITY_LABELS[code];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

/** Suggested department names for the owner-managed `departments` table
 * (see the Medical Appointment Engine) — a datalist of common examples, not
 * a fixed enum, since departments stay fully free-form per hospital/clinic. */
export const DEPARTMENT_SUGGESTIONS: { en: string; ar: string; so: string }[] = [
  { en: "General Medicine", ar: "الطب العام", so: "Caafimaadka Guud" },
  { en: "Cardiology", ar: "أمراض القلب", so: "Cudurada Wadnaha" },
  { en: "Dermatology", ar: "الأمراض الجلدية", so: "Cudurada Maqaarka" },
  { en: "Pediatrics", ar: "طب الأطفال", so: "Caafimaadka Carruurta" },
  { en: "Gynecology", ar: "أمراض النساء", so: "Cudurada Dumarka" },
  { en: "Obstetrics", ar: "التوليد", so: "Umulinta" },
  { en: "Orthopedics", ar: "جراحة العظام", so: "Cudurada Lafaha" },
  { en: "Surgery", ar: "الجراحة", so: "Qalliinka" },
  { en: "ENT", ar: "الأنف والأذن والحنجرة", so: "Sanka, Dhagaha iyo Hunguriga" },
  { en: "Ophthalmology", ar: "طب العيون", so: "Caafimaadka Indhaha" },
  { en: "Dentistry", ar: "طب الأسنان", so: "Caafimaadka Ilkaha" },
  { en: "Physiotherapy", ar: "العلاج الطبيعي", so: "Dawaynta Jireed" },
  { en: "Internal Medicine", ar: "الطب الباطني", so: "Caafimaadka Gudaha" },
  { en: "Emergency", ar: "الطوارئ", so: "Degdegga" },
  { en: "Laboratory", ar: "المختبر", so: "Shaybaarka" },
  { en: "Radiology", ar: "الأشعة", so: "Sawirrada Dhaqtarnimada (Radiology)" },
  { en: "Other", ar: "أخرى", so: "Kale" },
];
