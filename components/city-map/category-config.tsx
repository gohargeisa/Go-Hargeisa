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

export const CATEGORY_CONFIG: Record<CityServiceCategory, CategoryMeta> = {
  hospital: { label: "Hospitals", icon: Stethoscope, color: "#EF4444" },
  pharmacy: { label: "Pharmacies", icon: Pill, color: "#EC4899" },
  dental_clinic: { label: "Dental Clinics", icon: Smile, color: "#F43F5E" },
  bank: { label: "Banks", icon: Building2, color: "#2563EB" },
  atm: { label: "ATMs", icon: Wallet, color: "#14B8A6" },
  currency_exchange: { label: "Currency Exchange", icon: CreditCard, color: "#CA8A04" },
  gas_station: { label: "Gas Stations", icon: Fuel, color: "#F97316" },
  car_rental: { label: "Car Rentals", icon: Car, color: "#7C3AED" },
  mosque: { label: "Mosques", icon: MoonStar, color: "#0D9488" },
  supermarket: { label: "Supermarkets", icon: ShoppingCart, color: "#8B5CF6" },
  police: { label: "Police Stations", icon: Shield, color: "#3B82F6" },
  government: { label: "Government Offices", icon: Landmark, color: "#6366F1" },
  school: { label: "Schools", icon: School, color: "#22C55E" },
  university: { label: "Universities", icon: GraduationCap, color: "#059669" },
  airport: { label: "Airport", icon: Plane, color: "#0EA5E9" },
  parking: { label: "Car Parking", icon: ParkingCircle, color: "#64748B" },
  gym: { label: "Gyms", icon: Dumbbell, color: "#DC2626" },
  tour_company: { label: "Tour Companies", icon: Map, color: "#0891B2" },
  apartment: { label: "Apartments", icon: Building, color: "#9333EA" },
  clinic: { label: "Clinics", icon: HeartPulse, color: "#F472B6" },
  government_office: { label: "Government Offices", icon: Briefcase, color: "#4F46E5" },
};

export const CATEGORY_ORDER = Object.keys(CATEGORY_CONFIG) as CityServiceCategory[];
