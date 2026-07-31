import {
  Building2,
  UtensilsCrossed,
  Coffee,
  Map,
  Briefcase,
  Car,
  Building,
  Store,
  Cross,
  Pill,
  Dumbbell,
  Scissors,
  MoreHorizontal,
  Wifi,
  SquareParking,
  Waves,
  Sunrise,
  Plane,
  Laptop,
  Umbrella,
  Leaf,
  Cookie,
  ConciergeBell,
  Users,
  Truck,
  ShoppingBag,
  DoorClosed,
  type LucideIcon,
} from "lucide-react";
import type { JoinRequestCategory, ConvertibleJoinRequestCategory } from "@/types";

/** Every business type the /join form accepts, in the order they should be
 * offered as selectable cards. */
export const PARTNER_CATEGORIES: JoinRequestCategory[] = [
  "hotel",
  "restaurant",
  "cafe",
  "tour_company",
  "travel_agency",
  "car_rental",
  "apartment",
  "shopping_mall",
  "hospital",
  "pharmacy",
  "gym",
  "beauty_salon",
  "other",
];

export const PARTNER_CATEGORY_ICON: Record<JoinRequestCategory, LucideIcon> = {
  hotel: Building2,
  restaurant: UtensilsCrossed,
  cafe: Coffee,
  tour_company: Map,
  travel_agency: Briefcase,
  car_rental: Car,
  apartment: Building,
  shopping_mall: Store,
  hospital: Cross,
  pharmacy: Pill,
  gym: Dumbbell,
  beauty_salon: Scissors,
  other: MoreHorizontal,
};

const CONVERTIBLE_SET = new Set<ConvertibleJoinRequestCategory>(["hotel", "restaurant", "cafe"]);

/** Only hotel/restaurant/cafe requests can become a real listing row — the
 * other 10 categories have no matching listing table yet. */
export function isConvertibleCategory(category: JoinRequestCategory): category is ConvertibleJoinRequestCategory {
  return CONVERTIBLE_SET.has(category as ConvertibleJoinRequestCategory);
}

/**
 * Amenity checklist per business type — deliberately only defined for the
 * 3 categories the spec gave an explicit list for. Every other category has
 * no Amenities section on the form rather than an invented one.
 */
export const PARTNER_AMENITIES: Partial<Record<JoinRequestCategory, string[]>> = {
  hotel: ["wifi", "parking", "restaurant", "pool", "gym", "breakfast", "airport_shuttle"],
  cafe: ["wifi", "workspace", "outdoor_seating", "coffee", "tea", "desserts", "meeting_space"],
  restaurant: ["family", "delivery", "takeaway", "outdoor_seating", "private_dining", "parking"],
};

export const PARTNER_AMENITY_ICON: Record<string, LucideIcon> = {
  wifi: Wifi,
  parking: SquareParking,
  restaurant: UtensilsCrossed,
  pool: Waves,
  gym: Dumbbell,
  breakfast: Sunrise,
  airport_shuttle: Plane,
  workspace: Laptop,
  outdoor_seating: Umbrella,
  coffee: Coffee,
  tea: Leaf,
  desserts: Cookie,
  meeting_space: ConciergeBell,
  family: Users,
  delivery: Truck,
  takeaway: ShoppingBag,
  private_dining: DoorClosed,
};
