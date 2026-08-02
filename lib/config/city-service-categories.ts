import {
  Baby,
  BatteryCharging,
  Briefcase,
  Building2,
  CarTaxiFront,
  Car,
  Droplet,
  FileCheck,
  Flame,
  Fuel,
  GraduationCap,
  type LucideIcon,
  Mail,
  MoonStar,
  Pill,
  School,
  Shield,
  ShoppingCart,
  SprayCan,
  Stethoscope,
  Trees,
  Trophy,
  Wifi,
  Zap,
  Dumbbell,
} from "lucide-react";
import type { EssentialServiceCategory } from "@/types";

/**
 * Single source of truth for every City Services category — icon + the
 * `cityServices.categoryLabel_{category}` translation key. Every category
 * listed here is a candidate for display; whether it actually renders
 * anywhere depends entirely on whether at least one published listing
 * exists for it (see lib/data/city-services.ts) — this file never gates
 * visibility itself.
 */
export const CITY_SERVICE_CATEGORIES: {
  key: EssentialServiceCategory;
  icon: LucideIcon;
  titleKey: `categoryLabel_${EssentialServiceCategory}`;
}[] = [
  { key: "hospital", icon: Stethoscope, titleKey: "categoryLabel_hospital" },
  { key: "pharmacy", icon: Pill, titleKey: "categoryLabel_pharmacy" },
  { key: "gas_station", icon: Fuel, titleKey: "categoryLabel_gas_station" },
  { key: "bank", icon: Building2, titleKey: "categoryLabel_bank" },
  { key: "mosque", icon: MoonStar, titleKey: "categoryLabel_mosque" },
  { key: "park_playground", icon: Trees, titleKey: "categoryLabel_park_playground" },
  { key: "kids_family", icon: Baby, titleKey: "categoryLabel_kids_family" },
  { key: "supermarket", icon: ShoppingCart, titleKey: "categoryLabel_supermarket" },
  { key: "taxi_service", icon: CarTaxiFront, titleKey: "categoryLabel_taxi_service" },
  { key: "police_station", icon: Shield, titleKey: "categoryLabel_police_station" },
  { key: "fire_station", icon: Flame, titleKey: "categoryLabel_fire_station" },
  { key: "electricity_service", icon: Zap, titleKey: "categoryLabel_electricity_service" },
  { key: "water_service", icon: Droplet, titleKey: "categoryLabel_water_service" },
  { key: "post_office", icon: Mail, titleKey: "categoryLabel_post_office" },
  { key: "school", icon: School, titleKey: "categoryLabel_school" },
  { key: "university", icon: GraduationCap, titleKey: "categoryLabel_university" },
  { key: "sports_club", icon: Trophy, titleKey: "categoryLabel_sports_club" },
  { key: "gym", icon: Dumbbell, titleKey: "categoryLabel_gym" },
  { key: "car_rental", icon: Car, titleKey: "categoryLabel_car_rental" },
  { key: "car_wash", icon: SprayCan, titleKey: "categoryLabel_car_wash" },
  { key: "ev_charging", icon: BatteryCharging, titleKey: "categoryLabel_ev_charging" },
  { key: "government_office", icon: Briefcase, titleKey: "categoryLabel_government_office" },
  { key: "visa_immigration", icon: FileCheck, titleKey: "categoryLabel_visa_immigration" },
  { key: "internet_telecom", icon: Wifi, titleKey: "categoryLabel_internet_telecom" },
];

export function cityServiceCategoryMeta(category: EssentialServiceCategory) {
  return CITY_SERVICE_CATEGORIES.find((c) => c.key === category)!;
}
