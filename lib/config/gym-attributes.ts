import {
  Dumbbell,
  Music,
  Swords,
  Bike,
  PersonStanding,
  HeartPulse,
  Sparkles,
  Lock,
  ShowerHead,
  Flame,
  Waves,
  SquareParking,
  Accessibility,
  ShieldCheck,
  Video,
  CreditCard,
  Banknote,
  type LucideIcon,
} from "lucide-react";
import type { CityService } from "@/types";

export type GymType = NonNullable<CityService["gymType"]>;

export const GYM_TYPE_ORDER: GymType[] = ["mens_gym", "womens_gym", "mixed_gym", "fitness_center", "crossfit", "personal_training", "other"];

export const GYM_TYPE_LABELS: Record<GymType, { en: string; ar: string; so: string }> = {
  mens_gym: { en: "Men's Gym", ar: "صالة رياضية للرجال", so: "Jimicsiga Ragga" },
  womens_gym: { en: "Women's Gym", ar: "صالة رياضية للنساء", so: "Jimicsiga Dumarka" },
  mixed_gym: { en: "Mixed Gym", ar: "صالة رياضية مشتركة", so: "Jimicsi Labadaba" },
  fitness_center: { en: "Fitness Center", ar: "مركز اللياقة البدنية", so: "Xarunta Jimicsiga" },
  crossfit: { en: "CrossFit", ar: "كروسفت", so: "CrossFit" },
  personal_training: { en: "Personal Training", ar: "تدريب شخصي", so: "Tababbarid Shakhsi ah" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function gymTypeLabel(type: GymType | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = GYM_TYPE_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

export const CLASS_OFFERED_ORDER = [
  "yoga",
  "zumba",
  "boxing",
  "spinning",
  "crossfit_classes",
  "pilates",
  "aerobics",
  "weightlifting",
  "martial_arts",
  "other",
] as const;

export type ClassOffered = (typeof CLASS_OFFERED_ORDER)[number];

export const CLASS_OFFERED_ICON: Record<ClassOffered, LucideIcon> = {
  yoga: PersonStanding,
  zumba: Music,
  boxing: Swords,
  spinning: Bike,
  crossfit_classes: Dumbbell,
  pilates: HeartPulse,
  aerobics: Flame,
  weightlifting: Dumbbell,
  martial_arts: Swords,
  other: Sparkles,
};

export const CLASS_OFFERED_LABELS: Record<ClassOffered, { en: string; ar: string; so: string }> = {
  yoga: { en: "Yoga", ar: "يوغا", so: "Yoga" },
  zumba: { en: "Zumba", ar: "زومبا", so: "Zumba" },
  boxing: { en: "Boxing", ar: "ملاكمة", so: "Fed-feedid" },
  spinning: { en: "Spinning / Cycling", ar: "دراجات ثابتة", so: "Baaskiil-jiifka" },
  crossfit_classes: { en: "CrossFit Classes", ar: "حصص كروسفت", so: "Fasallada CrossFit" },
  pilates: { en: "Pilates", ar: "بيلاتس", so: "Pilates" },
  aerobics: { en: "Aerobics", ar: "تمارين الأيروبيك", so: "Aerobics" },
  weightlifting: { en: "Weightlifting", ar: "رفع الأوزان", so: "Qaadista Miisaanka" },
  martial_arts: { en: "Martial Arts", ar: "فنون الدفاع عن النفس", so: "Farsamada Isdifaaca" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function classOfferedLabel(code: ClassOffered, locale: string): string {
  const entry = CLASS_OFFERED_LABELS[code];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

/** Gym-only facilities vocabulary — kept as its own column/config rather
 * than the shared city_services amenities_v2 bucket, so these codes can
 * never leak onto hospitals, banks, or any other city_services category
 * that shares that bucket (same reasoning as education_facilities). */
export const GYM_FACILITY_ORDER = [
  "locker_rooms",
  "showers",
  "sauna_steam_room",
  "swimming_pool",
  "parking",
  "wheelchair_accessible",
  "security",
  "cctv",
  "card_payment",
  "cash_accepted",
] as const;

export type GymFacility = (typeof GYM_FACILITY_ORDER)[number];

export const GYM_FACILITY_ICON: Record<GymFacility, LucideIcon> = {
  locker_rooms: Lock,
  showers: ShowerHead,
  sauna_steam_room: Flame,
  swimming_pool: Waves,
  parking: SquareParking,
  wheelchair_accessible: Accessibility,
  security: ShieldCheck,
  cctv: Video,
  card_payment: CreditCard,
  cash_accepted: Banknote,
};

export const GYM_FACILITY_LABELS: Record<GymFacility, { en: string; ar: string; so: string }> = {
  locker_rooms: { en: "Locker Rooms", ar: "غرف خزائن", so: "Qolalka Kabidyada" },
  showers: { en: "Showers", ar: "دشات", so: "Qubeyska" },
  sauna_steam_room: { en: "Sauna / Steam Room", ar: "ساونا / غرفة بخار", so: "Sauna / Qolka Uumiga" },
  swimming_pool: { en: "Swimming Pool", ar: "مسبح", so: "Barkadda Dabaasha" },
  parking: { en: "Parking Available", ar: "موقف سيارات", so: "Meel Baabuur la Dhigto" },
  wheelchair_accessible: { en: "Accessible Facilities", ar: "مرافق لذوي الاحتياجات الخاصة", so: "Xarumo u Fudud dadka Naafada ah" },
  security: { en: "Security", ar: "أمن", so: "Ilaalin" },
  cctv: { en: "CCTV", ar: "كاميرات مراقبة", so: "Kaameradaha Ilaalinta" },
  card_payment: { en: "Card Payment", ar: "الدفع بالبطاقة", so: "Lacag-bixinta Kaadhka" },
  cash_accepted: { en: "Cash Accepted", ar: "الدفع النقدي", so: "Lacagta Caddaanka ah" },
};

export function gymFacilityLabel(code: GymFacility, locale: string): string {
  const entry = GYM_FACILITY_LABELS[code];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}
