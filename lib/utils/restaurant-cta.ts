import { normalizeExternalUrl } from "@/lib/utils/normalize-url";

export interface OrderCta {
  href: string;
  external: boolean;
}

/**
 * "Order Now" is driven entirely by the restaurant's own explicit,
 * owner-controlled capability flags (restaurants.online_ordering_enabled /
 * phone_ordering_enabled — see the business dashboard's Ordering & Reservation
 * Settings form and components/admin/restaurant-form.tsx) — never inferred
 * from restaurant_type, and never shown "merely because the business is a
 * restaurant". Online ordering wins when both are on, since a real link is a
 * stronger signal than "call to order". Never a fabricated ordering/delivery
 * URL: online ordering only produces a CTA when a real online_order_url is
 * also actually saved, even if the flag itself is on.
 */
export function getRestaurantOrderCta(restaurant: {
  onlineOrderingEnabled?: boolean;
  onlineOrderUrl?: string;
  phoneOrderingEnabled?: boolean;
  phone?: string;
}): OrderCta | undefined {
  if (restaurant.onlineOrderingEnabled && restaurant.onlineOrderUrl) {
    return { href: normalizeExternalUrl(restaurant.onlineOrderUrl), external: true };
  }
  if (restaurant.phoneOrderingEnabled && restaurant.phone) {
    return { href: `tel:${restaurant.phone}`, external: false };
  }
  return undefined;
}
