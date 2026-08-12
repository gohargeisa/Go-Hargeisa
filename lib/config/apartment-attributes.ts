import {
  SquareParking,
  Wifi,
  Snowflake,
  CookingPot,
  Zap,
  Droplet,
  BatteryCharging,
  ShieldCheck,
  ArrowUpDown,
  Waves,
  WashingMachine,
  UsersRound,
  type LucideIcon,
} from "lucide-react";
import type { Service } from "@/types";

export type ApartmentType = NonNullable<Service["apartmentType"]>;

export const APARTMENT_TYPE_ORDER: ApartmentType[] = [
  "furnished",
  "unfurnished",
  "serviced",
  "studio",
  "family",
  "luxury",
  "short_term_rental",
  "long_term_rental",
  "other",
];

export const APARTMENT_TYPE_LABELS: Record<ApartmentType, { en: string; ar: string; so: string }> = {
  furnished: { en: "Furnished Apartment", ar: "شقة مفروشة", so: "Guri Alaabo leh" },
  unfurnished: { en: "Unfurnished Apartment", ar: "شقة غير مفروشة", so: "Guri Alaabo aan lahayn" },
  serviced: { en: "Serviced Apartment", ar: "شقة مخدومة", so: "Guri Adeeg leh" },
  studio: { en: "Studio Apartment", ar: "شقة استوديو", so: "Guri Studio ah" },
  family: { en: "Family Apartment", ar: "شقة عائلية", so: "Guri Qoys" },
  luxury: { en: "Luxury Apartment", ar: "شقة فاخرة", so: "Guri Raaxo leh" },
  short_term_rental: { en: "Short-Term Rental", ar: "إيجار قصير الأجل", so: "Kiro Muddo Gaaban" },
  long_term_rental: { en: "Long-Term Rental", ar: "إيجار طويل الأجل", so: "Kiro Muddo Dheer" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function apartmentTypeLabel(type: ApartmentType | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = APARTMENT_TYPE_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

export type PetPolicy = NonNullable<Service["petPolicy"]>;

export const PET_POLICY_ORDER: PetPolicy[] = ["allowed", "not_allowed", "case_by_case", "other"];

export const PET_POLICY_LABELS: Record<PetPolicy, { en: string; ar: string; so: string }> = {
  allowed: { en: "Pets Allowed", ar: "يسمح بالحيوانات الأليفة", so: "Xayawaanka Guriga la Ogol Yahay" },
  not_allowed: { en: "No Pets Allowed", ar: "لا يسمح بالحيوانات الأليفة", so: "Xayawaanka Guriga lama Ogolla" },
  case_by_case: { en: "Case by Case", ar: "حسب الحالة", so: "Xaalad kasta si gaar ah ayaa loo eegaa" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function petPolicyLabel(type: PetPolicy | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = PET_POLICY_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

/** Each code below maps 1:1 to its own dedicated boolean column on
 * `services` (parking_available, wifi_available, ...) — represented here as
 * one checklist for a clean UI, converted back to individual booleans only
 * at submission time (same pattern as TRAVEL_SERVICE_ORDER). */
export const APARTMENT_FEATURE_ORDER = [
  "parking_available",
  "wifi_available",
  "air_conditioning",
  "kitchen_available",
  "electricity_included",
  "water_included",
  "generator_available",
  "security_available",
  "elevator_available",
  "swimming_pool",
  "laundry_available",
  "family_friendly",
] as const;

export type ApartmentFeatureCode = (typeof APARTMENT_FEATURE_ORDER)[number];

export const APARTMENT_FEATURE_ICON: Record<ApartmentFeatureCode, LucideIcon> = {
  parking_available: SquareParking,
  wifi_available: Wifi,
  air_conditioning: Snowflake,
  kitchen_available: CookingPot,
  electricity_included: Zap,
  water_included: Droplet,
  generator_available: BatteryCharging,
  security_available: ShieldCheck,
  elevator_available: ArrowUpDown,
  swimming_pool: Waves,
  laundry_available: WashingMachine,
  family_friendly: UsersRound,
};

export const APARTMENT_FEATURE_LABELS: Record<ApartmentFeatureCode, { en: string; ar: string; so: string }> = {
  parking_available: { en: "Parking Available", ar: "موقف سيارات متاح", so: "Meel Baabuur la Dhigto" },
  wifi_available: { en: "Wi-Fi Available", ar: "واي فاي متاح", so: "Wi-Fi ayaa la heli karaa" },
  air_conditioning: { en: "Air Conditioning", ar: "تكييف هواء", so: "Qaboojiye Hawo" },
  kitchen_available: { en: "Kitchen", ar: "مطبخ", so: "Jiko" },
  electricity_included: { en: "Electricity Included", ar: "الكهرباء مشمولة", so: "Korontadu waa ku jirtaa" },
  water_included: { en: "Water Included", ar: "الماء مشمول", so: "Biyuhu waa ku jiraan" },
  generator_available: { en: "Generator", ar: "مولد كهرباء", so: "Jeneretar" },
  security_available: { en: "Security", ar: "أمن", so: "Ilaalin" },
  elevator_available: { en: "Elevator", ar: "مصعد", so: "Wiish (Elevator)" },
  swimming_pool: { en: "Swimming Pool", ar: "مسبح", so: "Barkadda Dabaasha" },
  laundry_available: { en: "Laundry", ar: "غسيل ملابس", so: "Dhaqid Dharka" },
  family_friendly: { en: "Family Friendly", ar: "مناسب للعائلات", so: "Ku Habboon Qoysaska" },
};

export function apartmentFeatureLabel(code: ApartmentFeatureCode, locale: string): string {
  const entry = APARTMENT_FEATURE_LABELS[code];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

/** Suggested "services / facilities" chips for the shared `services` text[]
 * column (see services.ts reuse — Apartments has no dedicated services
 * column of its own, same free-text array every services-vertical category
 * already has). Purely a UI convenience list, not a DB constraint. */
export const APARTMENT_SERVICE_SUGGESTIONS: { en: string; ar: string; so: string }[] = [
  { en: "24/7 Security", ar: "أمن على مدار الساعة", so: "Ilaalin 24/7 ah" },
  { en: "Housekeeping", ar: "خدمة تنظيف المنازل", so: "Adeegga Nadaafadda" },
  { en: "Maintenance Service", ar: "خدمة الصيانة", so: "Adeegga Dayactirka" },
  { en: "Backup Generator", ar: "مولد كهرباء احتياطي", so: "Jeneretar Kaydin ah" },
  { en: "CCTV Cameras", ar: "كاميرات مراقبة", so: "Kaameradaha Ilaalinta" },
  { en: "Furnished Options", ar: "خيارات مفروشة", so: "Doorashooyin Alaabo leh" },
];
