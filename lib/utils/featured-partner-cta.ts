import { getRestaurantOrderCta } from "@/lib/utils/restaurant-cta";
import { getPrimaryActionGroup } from "@/lib/utils/business-primary-action";
import { isMedicalAppointmentCategory } from "@/lib/utils/appointment-domain";
import type { Restaurant, Cafe, Category, PolymorphicListingType } from "@/types";

/**
 * What the Featured Partner card's CTA button says AND what it promises —
 * every kind here maps to a real, already-working action reachable from the
 * listing's own detail page (the card always just links there; see
 * lib/data/featured-partner-showcase.ts). Never invents a capability a
 * business doesn't actually have — "order_now"/"book_appointment" only ever
 * come back when the underlying flag/category genuinely supports it, same
 * discipline as getRestaurantOrderCta and getPrimaryActionGroup already
 * apply elsewhere.
 */
export type FeaturedPartnerCtaKind =
  | "book_now"
  | "reserve_table"
  | "order_now"
  | "shop_now"
  | "view_menu"
  | "book_appointment"
  | "learn_more"
  | "view_business";

/**
 * Also drives which promo-text template a service/city_service partner
 * gets (see lib/data/featured-partner-showcase.ts) — kept distinct from
 * FeaturedPartnerCtaKind because two different templates ("flowerShop" vs
 * "cosmetics") can legitimately share the same CTA ("shop_now"/"order_now").
 */
export type FeaturedPartnerTemplateKey =
  | "hotel"
  | "restaurant"
  | "cafe"
  | "flowerShop"
  | "cosmetics"
  | "salon"
  | "clinic"
  | "education"
  | "shop"
  | "generalBusiness";

const COSMETICS_CATEGORY_SLUG = "cosmetics-beauty";
const FLOWER_SHOP_CATEGORY_SLUG = "flower-shops";

/** Hotels always have a working "Book Now" — every hotel has a booking mode
 * (Go Hargeisa's own request flow at minimum, see getHotelBookingCta), so
 * this is never conditional. */
export function getFeaturedPartnerCtaForHotel(): FeaturedPartnerCtaKind {
  return "book_now";
}

export function getFeaturedPartnerCtaForRestaurant(
  restaurant: Pick<Restaurant, "reservable" | "onlineOrderingEnabled" | "onlineOrderUrl" | "phoneOrderingEnabled" | "phone">
): FeaturedPartnerCtaKind {
  if (restaurant.reservable) return "reserve_table";
  if (getRestaurantOrderCta(restaurant)) return "order_now";
  return "view_menu";
}

export function getFeaturedPartnerCtaForCafe(cafe: Pick<Cafe, "orderingEnabled">): FeaturedPartnerCtaKind {
  return cafe.orderingEnabled ? "order_now" : "view_menu";
}

/** Shared by `services` and `city_services` partners — both resolve through
 * the same category-driven capability flags (supportsAppointments,
 * supportsProducts), never through a hardcoded per-business list. */
export function getFeaturedPartnerTemplateForCategory(
  category: Pick<Category, "slug" | "supportsProducts" | "supportsAppointments"> | null
): { cta: FeaturedPartnerCtaKind; template: FeaturedPartnerTemplateKey } {
  if (!category) return { cta: "view_business", template: "generalBusiness" };

  if (category.supportsAppointments) {
    return {
      cta: "book_appointment",
      template: isMedicalAppointmentCategory(category.slug) ? "clinic" : "salon",
    };
  }

  const group = getPrimaryActionGroup(category.slug, category.supportsProducts);

  if (group === "product_order") {
    if (category.slug === FLOWER_SHOP_CATEGORY_SLUG) return { cta: "order_now", template: "flowerShop" };
    if (category.slug === COSMETICS_CATEGORY_SLUG) return { cta: "shop_now", template: "cosmetics" };
    return { cta: "shop_now", template: "shop" };
  }

  if (group === "education") return { cta: "learn_more", template: "education" };

  // car_service / travel / property_viewing / contact — no dedicated CTA
  // copy requested for these in the Smart Featured Partners spec; a plain
  // "View Business" is always true regardless of category.
  return { cta: "view_business", template: "generalBusiness" };
}

export function getFeaturedPartnerTemplateForType(listingType: PolymorphicListingType): FeaturedPartnerTemplateKey | null {
  if (listingType === "hotel") return "hotel";
  if (listingType === "restaurant") return "restaurant";
  if (listingType === "cafe") return "cafe";
  return null;
}
