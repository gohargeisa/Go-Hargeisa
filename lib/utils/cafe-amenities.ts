import {
  Coffee,
  Leaf,
  GlassWater,
  Cookie,
  UtensilsCrossed,
  Wifi,
  Sofa,
  Umbrella,
  Laptop,
  ShoppingBag,
  CreditCard,
  type LucideIcon,
} from "lucide-react";

/**
 * Fixed vocabulary for the cafe "Amenities" chip list, shared between the
 * admin form's checklist and the public detail page's display so both read
 * from one source of truth. Icons resolved from this string key (not passed
 * as a prop) so this stays safe to import from both server and client
 * components — see the RSC serialization note in the premium design system
 * rollout notes about passing icon components across the server/client
 * boundary.
 */
export const CAFE_AMENITY_CODES = [
  "specialty_coffee",
  "tea",
  "cold_drinks",
  "desserts",
  "light_meals",
  "wifi",
  "indoor_seating",
  "outdoor_seating",
  "work_friendly",
  "takeaway",
  "card_payments",
] as const;

export type CafeAmenityCode = (typeof CAFE_AMENITY_CODES)[number];

export const CAFE_AMENITY_ICON: Record<CafeAmenityCode, LucideIcon> = {
  specialty_coffee: Coffee,
  tea: Leaf,
  cold_drinks: GlassWater,
  desserts: Cookie,
  light_meals: UtensilsCrossed,
  wifi: Wifi,
  indoor_seating: Sofa,
  outdoor_seating: Umbrella,
  work_friendly: Laptop,
  takeaway: ShoppingBag,
  card_payments: CreditCard,
};
