import type { OrderableListingType, ProductAddon } from "@/types";

/** One line in the cart. `key` identifies a distinct line (same product with
 * a different add-on selection is a separate line, e.g. two "10 Roses"
 * bouquets — one with Extra Gypsophila, one without). */
export interface CartItem {
  key: string;
  productId: string;
  name: string;
  nameAr?: string;
  nameSo?: string;
  image?: string;
  unitPrice: number;
  quantity: number;
  addons: ProductAddon[];
  /** Present only for a product ordered in a specific shade/finish/size —
   * see types/index.ts's ProductVariant. Absent for every non-variant
   * product (everything on the platform before variants existed). */
  variantId?: string;
  variantName?: string;
  variantSku?: string;
}

/** ONE CART = ONE BUSINESS — every item in `items` belongs to
 * (listingType, listingId). Empty cart carries no business identity. */
export interface CartState {
  listingType: OrderableListingType | null;
  listingId: string | null;
  businessName: string | null;
  deliveryEnabled: boolean;
  addons: ProductAddon[];
  items: CartItem[];
  /** Idempotency key for the current checkout attempt — generated once
   * (see CartContext.getOrderAttemptId) and cleared only when the cart is,
   * so a retry (double-click, network retry, refresh mid-flight) of the
   * same attempt always carries the same key, while a genuinely new order
   * always starts with a fresh one. Not user data — never rendered. */
  orderAttemptId: string | null;
}

/** `variantId` is optional and appended only when present, so every
 * existing call site (two-arg, no variant) keeps producing the exact same
 * key string as before — different shades of the same product become
 * distinct cart lines without changing any non-variant product's key. */
export function cartItemKey(productId: string, addonIds: string[], variantId?: string): string {
  const base = `${productId}::${[...addonIds].sort().join(",")}`;
  return variantId ? `${base}::${variantId}` : base;
}

/** Matches submit_cart_order()'s server-side formula exactly: unit price
 * scales with quantity, add-ons are a flat per-line charge (not multiplied
 * by quantity) — e.g. "10 Roses x2 + Extra Gypsophila" is (20*2)+3, not
 * (20+3)*2. Client-side total must equal what the server actually charges,
 * or the cart shows a number the checkout doesn't honor. */
export function lineTotal(item: CartItem): number {
  const addonsTotal = item.addons.reduce((sum, a) => sum + a.price, 0);
  return item.unitPrice * item.quantity + addonsTotal;
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + lineTotal(item), 0);
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
