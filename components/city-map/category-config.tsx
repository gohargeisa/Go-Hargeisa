import {
  Car,
  Dumbbell,
  GraduationCap,
  type LucideIcon,
  MoonStar,
  ParkingCircle,
  Pill,
  Plane,
  ShoppingCart,
  School,
  Smile,
  Stethoscope,
  Building,
  Map,
  Wrench,
} from "lucide-react";
import type { CityServiceCategory } from "@/types";

export interface CategoryMeta {
  label: string;
  icon: LucideIcon;
  color: string;
}

// Colors are the darkest Tailwind shade in each hue that still clears
// WCAG AA's 4.5:1 for white text — the active filter chip and its count
// badge render white-on-this-color (axe color-contrast).
export const CATEGORY_CONFIG: Record<CityServiceCategory, CategoryMeta> = {
  hospital: { label: "Hospitals", icon: Stethoscope, color: "#B91C1C" },
  pharmacy: { label: "Pharmacies", icon: Pill, color: "#DB2777" },
  dental_clinic: { label: "Dental Clinics", icon: Smile, color: "#E11D48" },
  car_rental: { label: "Car Rentals", icon: Car, color: "#7C3AED" },
  mosque: { label: "Mosques", icon: MoonStar, color: "#115E59" },
  supermarket: { label: "Supermarkets", icon: ShoppingCart, color: "#6D28D9" },
  school: { label: "Schools", icon: School, color: "#15803D" },
  university: { label: "Universities", icon: GraduationCap, color: "#047857" },
  airport: { label: "Airport", icon: Plane, color: "#0369A1" },
  parking: { label: "Car Parking", icon: ParkingCircle, color: "#64748B" },
  gym: { label: "Gyms", icon: Dumbbell, color: "#DC2626" },
  tour_company: { label: "Tour Companies", icon: Map, color: "#0E7490" },
  apartment: { label: "Apartments", icon: Building, color: "#9333EA" },
  auto_repair: { label: "Auto Repair & Car Services", icon: Wrench, color: "#475569" },
};

export const CATEGORY_ORDER = Object.keys(CATEGORY_CONFIG) as CityServiceCategory[];
