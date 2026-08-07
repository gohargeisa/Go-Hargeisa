import {
  Briefcase,
  Building2,
  Car,
  CreditCard,
  Dumbbell,
  Fuel,
  GraduationCap,
  HeartPulse,
  Landmark,
  type LucideIcon,
  MoonStar,
  ParkingCircle,
  Pill,
  Plane,
  Shield,
  ShoppingCart,
  School,
  Smile,
  Stethoscope,
  Wallet,
  Building,
  Map,
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
  bank: { label: "Banks", icon: Building2, color: "#2563EB" },
  atm: { label: "ATMs", icon: Wallet, color: "#0F766E" },
  currency_exchange: { label: "Currency Exchange", icon: CreditCard, color: "#A16207" },
  gas_station: { label: "Gas Stations", icon: Fuel, color: "#C2410C" },
  car_rental: { label: "Car Rentals", icon: Car, color: "#7C3AED" },
  mosque: { label: "Mosques", icon: MoonStar, color: "#115E59" },
  supermarket: { label: "Supermarkets", icon: ShoppingCart, color: "#6D28D9" },
  police: { label: "Police Stations", icon: Shield, color: "#1D4ED8" },
  government: { label: "Government Offices", icon: Landmark, color: "#4338CA" },
  school: { label: "Schools", icon: School, color: "#15803D" },
  university: { label: "Universities", icon: GraduationCap, color: "#047857" },
  airport: { label: "Airport", icon: Plane, color: "#0369A1" },
  parking: { label: "Car Parking", icon: ParkingCircle, color: "#64748B" },
  gym: { label: "Gyms", icon: Dumbbell, color: "#DC2626" },
  tour_company: { label: "Tour Companies", icon: Map, color: "#0E7490" },
  apartment: { label: "Apartments", icon: Building, color: "#9333EA" },
  clinic: { label: "Clinics", icon: HeartPulse, color: "#BE185D" },
  government_office: { label: "Government Offices", icon: Briefcase, color: "#4F46E5" },
};

export const CATEGORY_ORDER = Object.keys(CATEGORY_CONFIG) as CityServiceCategory[];
