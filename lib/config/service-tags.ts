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
};

/** Filters arbitrary stored strings down to known codes — same defensive
 * purpose as toAmenityCodes. */
export function toServiceTagCodes(values: string[] | null | undefined): ServiceTagCode[] {
  if (!values) return [];
  return values.filter((v): v is ServiceTagCode => (SERVICE_TAG_CODES as readonly string[]).includes(v));
}
