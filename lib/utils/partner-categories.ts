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
  Presentation,
  BellRing,
  CreditCard,
  Banknote,
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
 * cafe (their own dedicated table + owner_id/claims workflow) or a
 * category="other" selection whose resolved category targets
 * city_services (categoryId present and resolved to target_table
 * 'city_services') — city_services still has a full admin CRUD
 * (/admin/city-services, lib/actions/city-services.ts) to convert into,
 * unlike the generic `services`-vertical long-tail categories (Real
 * Estate, Flower Shops, ...), which stay admin-reviewed leads since that
 * admin module was intentionally removed and has no create/delete/edit
 * surface left to manage a converted row through. A missing/unresolved
 * categoryId or any other target_table is never convertible — this
 * function must never guess; convertJoinRequest's own checks mirror this
 * exactly so the "Convert" button and what the server action will
 * actually accept can never disagree. */
export function isConvertibleCategory(
  category: JoinRequestCategory,
  categoryId: string | null,
  categoryTargetTable?: CategoryTargetTable | null
): boolean {
  if (category === "hotel" || category === "restaurant" || category === "cafe") return true;
  return category === "other" && Boolean(categoryId) && categoryTargetTable === "city_services";
}

/**
 * Amenity checklist per business type — deliberately only defined for the
 * 3 categories the spec gave an explicit list for. Every other category has
 * no Amenities section on the form rather than an invented one.
 */
/** Restaurant and Café deliberately have no entry here — both now use the
 * richer, already-trilingual AMENITIES_BY_LISTING_TYPE vocabulary
 * (lib/config/amenities.ts) directly in their own join-request-form.tsx
 * block instead of this small intake-only list, so their real amenities_v2
 * codes match what the created listing already knows how to render. Hotel
 * keeps this original small list untouched. */
export const PARTNER_AMENITIES: Partial<Record<JoinRequestCategory, string[]>> = {
  hotel: ["wifi", "parking", "restaurant", "pool", "gym", "breakfast", "airport_shuttle", "meeting_rooms", "room_service", "card_payment", "cash_accepted"],
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
  meeting_rooms: Presentation,
  room_service: BellRing,
  card_payment: CreditCard,
  cash_accepted: Banknote,
};
