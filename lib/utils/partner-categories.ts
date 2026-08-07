import {
  UtensilsCrossed,
  Coffee,
  Dumbbell,
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
import type { CategoryTargetTable, JoinRequestCategory } from "@/types";

/** The 3 owner-claimable core tables with a fixed-card treatment on /join —
 * a small, justified structural constant (which *tables* have their own
 * dedicated listing type + ownership/claims workflow), not a hardcoded
 * category name/icon/label list — every card's label/icon comes live from
 * that table's `categories` row (see app/[locale]/join/page.tsx). Every
 * other business type is sourced live from the `categories` table (see
 * getServiceCategories in lib/data/categories.ts) and submitted with
 * category="other" + a categoryId, not from this list. */
export const CORE_JOIN_TARGET_TABLES: Array<"hotels" | "restaurants" | "cafes"> = ["hotels", "restaurants", "cafes"];

/** "hotels" -> "hotel" — CategoryTargetTable (plural, DB) to
 * JoinRequestCategory (singular, the /join form's own submission enum). */
const TARGET_TABLE_TO_JOIN_CATEGORY: Record<"hotels" | "restaurants" | "cafes", "hotel" | "restaurant" | "cafe"> = {
  hotels: "hotel",
  restaurants: "restaurant",
  cafes: "cafe",
};

export function targetTableToJoinCategory(targetTable: CategoryTargetTable): "hotel" | "restaurant" | "cafe" {
  return TARGET_TABLE_TO_JOIN_CATEGORY[targetTable as "hotels" | "restaurants" | "cafes"];
}

/** A request is convertible into a real listing iff it's hotel/restaurant/
 * cafe — the only categories with their own dedicated table + owner_id/
 * claims workflow to convert into. Every "other" selection (long-tail
 * `services` categories and City Services categories alike) stays an
 * admin-reviewed lead, surfaced as "Verified Partner" once approved, since
 * there is no admin Services module to convert into anymore. `categoryId`/
 * `categoryTargetTable` are unused now but kept in the signature so every
 * call site (which still resolves and passes them) doesn't need to change. */
export function isConvertibleCategory(
  category: JoinRequestCategory,
  _categoryId: string | null,
  _categoryTargetTable?: CategoryTargetTable | null
): boolean {
  return category === "hotel" || category === "restaurant" || category === "cafe";
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
