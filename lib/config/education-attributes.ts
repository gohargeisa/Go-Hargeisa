import {
  Library,
  Monitor,
  FlaskConical,
  Dumbbell,
  ToyBrick,
  Bus,
  UtensilsCrossed,
  Compass,
  HeartPulse,
  ShieldCheck,
  Video,
  Wifi,
  Snowflake,
  Accessibility,
  ParkingSquare,
  BedDouble,
  type LucideIcon,
} from "lucide-react";
import type { CityService } from "@/types";

/** Shared "education institution" attribute set for Schools + Universities —
 * both categories route through `categories.slug` ("school"/"university")
 * into the generic city_services table, but need fully-localized, bespoke
 * fields the English-only custom_fields_schema architecture can't provide.
 * One config file, reused by both categories, mirroring the Hotel pattern. */

export type SchoolType = NonNullable<CityService["schoolType"]>;

export const SCHOOL_TYPE_ORDER: SchoolType[] = [
  "primary",
  "secondary",
  "primary_secondary",
  "international",
  "private",
  "public",
  "vocational",
  "other",
];

export const SCHOOL_TYPE_LABELS: Record<SchoolType, { en: string; ar: string; so: string }> = {
  primary: { en: "Primary School", ar: "مدرسة أولية", so: "Dugsi Hoose" },
  secondary: { en: "Secondary School", ar: "مدرسة ثانوية", so: "Dugsi Sare" },
  primary_secondary: { en: "Primary & Secondary School", ar: "مدرسة أولية وثانوية", so: "Dugsi Hoose iyo Sare" },
  international: { en: "International School", ar: "مدرسة دولية", so: "Dugsi Caalami ah" },
  private: { en: "Private School", ar: "مدرسة خاصة", so: "Dugsi Gaar ah" },
  public: { en: "Public School", ar: "مدرسة عامة", so: "Dugsi Dawladeed" },
  vocational: { en: "Vocational School", ar: "مدرسة مهنية", so: "Dugsi Xirfad" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function schoolTypeLabel(type: SchoolType | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = SCHOOL_TYPE_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

export type Curriculum = NonNullable<CityService["curriculum"]>;

export const CURRICULUM_ORDER: Curriculum[] = ["somaliland", "cambridge", "international", "arabic", "islamic", "other"];

export const CURRICULUM_LABELS: Record<Curriculum, { en: string; ar: string; so: string }> = {
  somaliland: { en: "Somaliland Curriculum", ar: "منهج صوماليلاند", so: "Manhajka Somaliland" },
  cambridge: { en: "Cambridge", ar: "كامبريدج", so: "Cambridge" },
  international: { en: "International", ar: "منهج دولي", so: "Manhaj Caalami ah" },
  arabic: { en: "Arabic Curriculum", ar: "منهج عربي", so: "Manhajka Carabiga" },
  islamic: { en: "Islamic Curriculum", ar: "منهج إسلامي", so: "Manhajka Islaamka" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function curriculumLabel(value: Curriculum | undefined, locale: string): string | undefined {
  if (!value) return undefined;
  const entry = CURRICULUM_LABELS[value];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

export const EDUCATION_LEVEL_ORDER = ["kindergarten", "primary", "intermediate", "secondary", "vocational_technical", "other"] as const;
export type EducationLevel = (typeof EDUCATION_LEVEL_ORDER)[number];

export const EDUCATION_LEVEL_LABELS: Record<EducationLevel, { en: string; ar: string; so: string }> = {
  kindergarten: { en: "Kindergarten", ar: "روضة أطفال", so: "Xanaanada Carruurta" },
  primary: { en: "Primary", ar: "المرحلة الأولية", so: "Heerka Hoose" },
  intermediate: { en: "Intermediate", ar: "المرحلة المتوسطة", so: "Heerka Dhexe" },
  secondary: { en: "Secondary", ar: "المرحلة الثانوية", so: "Heerka Sare" },
  vocational_technical: { en: "Vocational / Technical", ar: "مهني / تقني", so: "Xirfad / Farsamo" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function educationLevelLabel(value: EducationLevel, locale: string): string {
  const entry = EDUCATION_LEVEL_LABELS[value];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

export type UniversityType = NonNullable<CityService["universityType"]>;

export const UNIVERSITY_TYPE_ORDER: UniversityType[] = ["public", "private", "community_college", "vocational_institute", "other"];

export const UNIVERSITY_TYPE_LABELS: Record<UniversityType, { en: string; ar: string; so: string }> = {
  public: { en: "Public University", ar: "جامعة عامة", so: "Jaamacad Dawladeed" },
  private: { en: "Private University", ar: "جامعة خاصة", so: "Jaamacad Gaar ah" },
  community_college: { en: "Community College", ar: "كلية مجتمع", so: "Kuleej Bulsheed" },
  vocational_institute: { en: "Technical / Vocational Institute", ar: "معهد تقني / مهني", so: "Machad Farsamo/Xirfad" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function universityTypeLabel(type: UniversityType | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = UNIVERSITY_TYPE_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

export const DEGREE_LEVEL_ORDER = ["diploma", "bachelors", "masters", "phd", "certificate"] as const;
export type DegreeLevel = (typeof DEGREE_LEVEL_ORDER)[number];

export const DEGREE_LEVEL_LABELS: Record<DegreeLevel, { en: string; ar: string; so: string }> = {
  diploma: { en: "Diploma", ar: "دبلوم", so: "Diploma" },
  bachelors: { en: "Bachelor's", ar: "بكالوريوس", so: "Shahaadada Koowaad" },
  masters: { en: "Master's", ar: "ماجستير", so: "Shahaadada Sare" },
  phd: { en: "PhD", ar: "دكتوراه", so: "Dhaqtarnimo" },
  certificate: { en: "Certificate", ar: "شهادة", so: "Shahaado" },
};

export function degreeLevelLabel(value: DegreeLevel, locale: string): string {
  const entry = DEGREE_LEVEL_LABELS[value];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

export const FACULTY_ORDER = ["medicine", "engineering", "business", "it", "law", "education", "islamic_studies", "other"] as const;
export type Faculty = (typeof FACULTY_ORDER)[number];

export const FACULTY_LABELS: Record<Faculty, { en: string; ar: string; so: string }> = {
  medicine: { en: "Medicine", ar: "الطب", so: "Caafimaadka" },
  engineering: { en: "Engineering", ar: "الهندسة", so: "Injineernimada" },
  business: { en: "Business", ar: "إدارة الأعمال", so: "Ganacsiga" },
  it: { en: "Information Technology", ar: "تقنية المعلومات", so: "Tignoolajiyada Macluumaadka" },
  law: { en: "Law", ar: "القانون", so: "Sharciga" },
  education: { en: "Education", ar: "التربية والتعليم", so: "Waxbarashada" },
  islamic_studies: { en: "Islamic Studies", ar: "الدراسات الإسلامية", so: "Cilmiga Islaamka" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function facultyLabel(value: Faculty, locale: string): string {
  const entry = FACULTY_LABELS[value];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

/** Shared facilities vocabulary — Schools get everything except `dormitory`;
 * Universities get the full list including `dormitory`, the one
 * university-only addition. One column (`education_facilities`), one
 * config, per-category subset — same pattern as AMENITIES_BY_LISTING_TYPE. */
export const EDUCATION_FACILITY_ORDER = [
  "library",
  "computer_lab",
  "science_lab",
  "sports_facilities",
  "playground",
  "school_bus",
  "cafeteria",
  "prayer_room",
  "medical_first_aid",
  "security",
  "cctv",
  "wifi",
  "air_conditioning",
  "wheelchair_accessible",
  "student_parking",
  "dormitory",
] as const;

export type EducationFacility = (typeof EDUCATION_FACILITY_ORDER)[number];

export const SCHOOL_FACILITY_CODES: EducationFacility[] = EDUCATION_FACILITY_ORDER.filter((f) => f !== "dormitory");
export const UNIVERSITY_FACILITY_CODES: EducationFacility[] = [...EDUCATION_FACILITY_ORDER];

export const EDUCATION_FACILITY_ICON: Record<EducationFacility, LucideIcon> = {
  library: Library,
  computer_lab: Monitor,
  science_lab: FlaskConical,
  sports_facilities: Dumbbell,
  playground: ToyBrick,
  school_bus: Bus,
  cafeteria: UtensilsCrossed,
  prayer_room: Compass,
  medical_first_aid: HeartPulse,
  security: ShieldCheck,
  cctv: Video,
  wifi: Wifi,
  air_conditioning: Snowflake,
  wheelchair_accessible: Accessibility,
  student_parking: ParkingSquare,
  dormitory: BedDouble,
};

export const EDUCATION_FACILITY_LABELS: Record<EducationFacility, { en: string; ar: string; so: string }> = {
  library: { en: "Library", ar: "مكتبة", so: "Maktabad" },
  computer_lab: { en: "Computer Lab", ar: "معمل حاسوب", so: "Shaybaarka Kombiyuutarka" },
  science_lab: { en: "Science Lab", ar: "معمل علوم", so: "Shaybaarka Sayniska" },
  sports_facilities: { en: "Sports Facilities", ar: "مرافق رياضية", so: "Xarumaha Ciyaaraha" },
  playground: { en: "Playground", ar: "ملعب أطفال", so: "Goobta Ciyaarta" },
  school_bus: { en: "School Bus", ar: "حافلة مدرسية", so: "Baska Dugsiga" },
  cafeteria: { en: "Cafeteria", ar: "كافتيريا", so: "Kafateeriya" },
  prayer_room: { en: "Prayer Room", ar: "غرفة صلاة", so: "Qol Tukasho" },
  medical_first_aid: { en: "Medical / First Aid", ar: "إسعافات أولية", so: "Caawimaad Degdeg ah" },
  security: { en: "Security", ar: "أمن", so: "Ilaalin" },
  cctv: { en: "CCTV", ar: "كاميرات مراقبة", so: "Kaameradaha Ilaalinta" },
  wifi: { en: "Internet / Wi-Fi", ar: "إنترنت / واي فاي", so: "Internet / Wifi" },
  air_conditioning: { en: "Air Conditioning", ar: "تكييف", so: "Qaboojiye" },
  wheelchair_accessible: { en: "Accessible Facilities", ar: "مرافق لذوي الاحتياجات الخاصة", so: "Xarumo u Fudud dadka Naafada ah" },
  student_parking: { en: "Student Parking", ar: "موقف سيارات للطلاب", so: "Meesha Baabuurta Ardayda" },
  dormitory: { en: "Dormitory / Student Housing", ar: "سكن الطلاب", so: "Hoyga Ardayda" },
};

export function educationFacilityLabel(code: EducationFacility, locale: string): string {
  const entry = EDUCATION_FACILITY_LABELS[code];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}
