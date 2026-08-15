import {
  Scissors,
  Palette,
  Hand,
  Droplet,
  Flame,
  Gem,
  Eye,
  Waves,
  Brush,
  Wind,
  Paintbrush2,
  Droplets,
  Sparkle,
  Sparkles,
  Flower2,
  Baby,
  Gift,
  Wrench,
  Cog,
  Zap,
  Disc,
  Ban,
  Snowflake,
  BatteryCharging,
  SprayCan,
  Settings,
  CircleDot,
  LifeBuoy,
  Stethoscope,
  Syringe,
  Smile,
  SmilePlus,
  AlertCircle,
  Pill,
  PillBottle,
  Package,
  Truck,
  PackageCheck,
  HeartPulse,
  Activity,
  Sun,
  Radio,
  Brain,
  Apple,
  MessageCircle,
  Leaf,
  BookOpen,
  Flower,
  Cake,
  type LucideIcon,
} from "lucide-react";

/**
 * "Services offered" vocabulary for City Services categories whose real
 * subcategories are services a business performs, not products it sells
 * (contrast with Cosmetics & Women's Beauty / Perfume & Cosmetics shops,
 * where the equivalent concept is a product's `category` — see
 * lib/config/product-categories.ts and the Products Engine). Same shape as
 * lib/config/amenities.ts (fixed codes + icon map + a per-key allow-list),
 * just keyed by `categories.slug` instead of listing type, since these
 * three categories' vocabularies don't overlap at all.
 *
 * Stored on `city_services.service_tags` (text[]) and
 * `business_join_requests.service_tags` (text[], carried through to the
 * listing on conversion) — labels come from next-intl's "serviceTags"
 * namespace, same pattern as AMENITY_CODES + the "amenities" namespace.
 */
export const SERVICE_TAG_CODES = [
  // Beauty Salons
  "hair_services",
  "makeup",
  "nail_services",
  "skincare_facials",
  "hair_removal",
  "bridal_beauty",
  "eyelashes_eyebrows",
  "spa_body_care",
  "henna_services",
  // Men's Barbershops
  "haircuts",
  "beard_shaving",
  "hair_styling",
  "hair_coloring",
  "hair_treatments",
  "facials_skincare",
  "head_massage",
  "beard_styling",
  "kids_haircuts",
  "grooming_packages",
  // Auto Repair & Services
  "general_car_repair",
  "engine_repair",
  "electrical_diagnostics",
  "oil_change_filters",
  "tire_services",
  "brake_services",
  "ac_cooling_system",
  "battery_services",
  "car_wash_detailing",
  "body_repair_painting",
  "transmission_repair",
  "suspension_steering",
  "roadside_assistance",
  // Dental Clinics
  "general_checkups",
  "teeth_cleaning",
  "fillings",
  "root_canal",
  "teeth_whitening",
  "orthodontics_braces",
  "dental_implants",
  "tooth_extraction",
  "pediatric_dentistry",
  "emergency_dental_care",
  // Pharmacies
  "prescription_medicines",
  "otc_medicines",
  "vitamins_supplements",
  "medical_supplies",
  "baby_products",
  "personal_care",
  "cosmetics",
  "home_delivery",
  "prescription_delivery",
  "blood_pressure_check",
  "blood_sugar_check",
  // Clinics (general — holistic/multi-discipline practices)
  "medical_consultation",
  "physiotherapy",
  "red_light_therapy",
  "frequency_therapy",
  "brain_tap_therapy",
  "nutritional_coaching",
  "medical_massage",
  "speech_language_therapy",
  "herbal_therapy",
  "supplements_minerals",
  "quranic_spiritual_healing",
  // Flowers & Gifts
  "fresh_flowers",
  "bouquets",
  "floral_arrangements",
  "occasion_gifts",
  "cakes",
] as const;

export type ServiceTagCode = (typeof SERVICE_TAG_CODES)[number];

export const SERVICE_TAG_ICON: Record<ServiceTagCode, LucideIcon> = {
  hair_services: Scissors,
  makeup: Palette,
  nail_services: Hand,
  skincare_facials: Droplet,
  hair_removal: Flame,
  bridal_beauty: Gem,
  eyelashes_eyebrows: Eye,
  spa_body_care: Waves,
  henna_services: Flower2,

  haircuts: Scissors,
  beard_shaving: Brush,
  hair_styling: Wind,
  hair_coloring: Paintbrush2,
  hair_treatments: Droplets,
  facials_skincare: Sparkle,
  head_massage: Hand,
  beard_styling: Sparkles,
  kids_haircuts: Baby,
  grooming_packages: Gift,

  general_car_repair: Wrench,
  engine_repair: Cog,
  electrical_diagnostics: Zap,
  oil_change_filters: Droplet,
  tire_services: Disc,
  brake_services: Ban,
  ac_cooling_system: Snowflake,
  battery_services: BatteryCharging,
  car_wash_detailing: SprayCan,
  body_repair_painting: Paintbrush2,
  transmission_repair: Settings,
  suspension_steering: CircleDot,
  roadside_assistance: LifeBuoy,

  general_checkups: Stethoscope,
  teeth_cleaning: Sparkles,
  fillings: Syringe,
  root_canal: Zap,
  teeth_whitening: Smile,
  orthodontics_braces: SmilePlus,
  dental_implants: Wrench,
  tooth_extraction: Scissors,
  pediatric_dentistry: Baby,
  emergency_dental_care: AlertCircle,

  prescription_medicines: Pill,
  otc_medicines: PillBottle,
  vitamins_supplements: Sparkle,
  medical_supplies: Package,
  baby_products: Baby,
  personal_care: Droplet,
  cosmetics: SprayCan,
  home_delivery: Truck,
  prescription_delivery: PackageCheck,
  blood_pressure_check: HeartPulse,
  blood_sugar_check: Droplets,

  medical_consultation: Stethoscope,
  physiotherapy: Activity,
  red_light_therapy: Sun,
  frequency_therapy: Radio,
  brain_tap_therapy: Brain,
  nutritional_coaching: Apple,
  medical_massage: Hand,
  speech_language_therapy: MessageCircle,
  herbal_therapy: Leaf,
  supplements_minerals: Pill,
  quranic_spiritual_healing: BookOpen,

  fresh_flowers: Flower2,
  bouquets: Flower,
  floral_arrangements: Sparkles,
  occasion_gifts: Gift,
  cakes: Cake,
};

/** Which codes are offered as choices for a given City Services category —
 * keyed by `categories.slug`, not listing type, since Beauty Salons/Men's
 * Barbershops/Auto Repair & Services each have an entirely distinct,
 * non-overlapping vocabulary. Categories with no entry here simply get no
 * picker/filter/display — same "renders nothing when not applicable" rule
 * as amenities. */
export const SERVICE_TAGS_BY_CATEGORY_SLUG: Record<string, ServiceTagCode[]> = {
  "beauty-salon": ["hair_services", "makeup", "nail_services", "skincare_facials", "hair_removal", "bridal_beauty", "eyelashes_eyebrows", "spa_body_care", "henna_services"],
  "men-barbershop": [
    "haircuts", "beard_shaving", "hair_styling", "hair_coloring", "hair_treatments",
    "facials_skincare", "head_massage", "beard_styling", "kids_haircuts", "grooming_packages",
  ],
  "auto-repair": [
    "general_car_repair", "engine_repair", "electrical_diagnostics", "oil_change_filters", "tire_services",
    "brake_services", "ac_cooling_system", "battery_services", "car_wash_detailing", "body_repair_painting",
    "transmission_repair", "suspension_steering", "roadside_assistance",
  ],
  "dental-clinic": [
    "general_checkups", "teeth_cleaning", "fillings", "root_canal", "teeth_whitening",
    "orthodontics_braces", "dental_implants", "tooth_extraction", "pediatric_dentistry", "emergency_dental_care",
  ],
  pharmacy: [
    "prescription_medicines", "otc_medicines", "vitamins_supplements", "medical_supplies",
    "baby_products", "personal_care", "cosmetics", "home_delivery", "prescription_delivery",
    "blood_pressure_check", "blood_sugar_check",
  ],
  // General Clinics (clinicType other than "dental", which keeps its own
  // vocabulary above via the "dental-clinic" key, reused when clinicType is
  // "dental" — see components/shared/join-request-form.tsx). Any clinic can
  // use this vocabulary, not just Holistic Health Center.
  clinic: [
    "medical_consultation", "physiotherapy", "red_light_therapy", "frequency_therapy",
    "brain_tap_therapy", "nutritional_coaching", "medical_massage", "speech_language_therapy",
    "herbal_therapy", "supplements_minerals", "quranic_spiritual_healing",
  ],
  // Flowers & Gifts (city_services — moved from the standalone `services`
  // vertical). Any Flowers & Gifts business can use this vocabulary, not
  // just Lavender Flowers.
  "flower-shops": ["fresh_flowers", "bouquets", "floral_arrangements", "occasion_gifts", "cakes"],
};

/** Filters arbitrary stored strings down to known codes — same defensive
 * purpose as toAmenityCodes. */
export function toServiceTagCodes(values: string[] | null | undefined): ServiceTagCode[] {
  if (!values) return [];
  return values.filter((v): v is ServiceTagCode => (SERVICE_TAG_CODES as readonly string[]).includes(v));
}
