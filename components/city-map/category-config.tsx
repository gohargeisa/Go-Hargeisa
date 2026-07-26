import {
  Fuel,
  GraduationCap,
  Landmark,
  type LucideIcon,
  MoonStar,
  ParkingCircle,
  Pill,
  Plane,
  Shield,
  ShoppingCart,
  School,
  Stethoscope,
  Wallet,
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
  gas_station: { label: "Gas Stations", icon: Fuel, color: "#F97316" },
  atm: { label: "ATMs", icon: Wallet, color: "#14B8A6" },
  mosque: { label: "Mosques", icon: MoonStar, color: "#0D9488" },
  supermarket: { label: "Supermarkets", icon: ShoppingCart, color: "#8B5CF6" },
  police: { label: "Police Stations", icon: Shield, color: "#3B82F6" },
  government: { label: "Government Offices", icon: Landmark, color: "#6366F1" },
  school: { label: "Schools", icon: School, color: "#22C55E" },
  university: { label: "Universities", icon: GraduationCap, color: "#059669" },
  airport: { label: "Airport", icon: Plane, color: "#0EA5E9" },
  parking: { label: "Car Parking", icon: ParkingCircle, color: "#64748B" },
};

export const CATEGORY_ORDER = Object.keys(CATEGORY_CONFIG) as CityServiceCategory[];
