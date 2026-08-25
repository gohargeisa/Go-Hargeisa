import type { OrderableListingType, ProductAddon, ProductCategory, SelectedProductOption } from "@/types";

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
  /** The product's own category (e.g. "bouquet", "cake", "makeup") — used
   * ONLY to decide which order-level fields checkout shows (e.g. recipient
   * name/phone/occasion are meaningless on a restaurant food order); never
   * used for pricing or option resolution, which stay strictly per-product.
   * Absent for products with no category set. */
  category?: ProductCategory;
  /** The exact per-product configuration selected (gift wrap, cake text,
   * milk type, toppings...) — see ProductOption/SelectedProductOption.
   * Absent for every product with no configured options. `value`/
   * `priceLabel` here are for cart-UI display only; the server always
   * re-resolves the real price from product_options at submit time. */
  selectedOptions?: SelectedProductOption[];
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

/** `variantId`/`selectedOptions` are optional and appended only when
 * present, so every existing call site (two-arg, no variant/options) keeps
 * producing the exact same key string as before — different shades or
 * different configurations of the same product become distinct cart lines
 * without changing any unconfigured product's key. Option values are
 * serialized as sorted `key=value` pairs so the same configuration always
 * produces the same key regardless of selection order. */
export function cartItemKey(
  productId: string,
  addonIds: string[],
  variantId?: string,
  selectedOptions?: SelectedProductOption[]
): string {
  let key = `${productId}::${[...addonIds].sort().join(",")}`;
  if (variantId) key += `::${variantId}`;
  if (selectedOptions && selectedOptions.length > 0) {
    const serialized = [...selectedOptions]
      .map((o) => `${o.key}=${Array.isArray(o.value) ? [...o.value].sort().join(",") : String(o.value)}`)
      .sort()
      .join("|");
    key += `::opts:${serialized}`;
  }
  return key;
}

/** Matches submit_cart_order()'s server-side formula exactly: unit price
 * scales with quantity, add-ons AND selected options are each a flat
 * per-line charge (not multiplied by quantity) — e.g. "10 Roses x2 + Extra
 * Gypsophila" is (20*2)+3, not (20+3)*2. Client-side total must equal what
 * the server actually charges, or the cart shows a number the checkout
 * doesn't honor. */
export function lineTotal(item: CartItem): number {
  const addonsTotal = item.addons.reduce((sum, a) => sum + a.price, 0);
  const optionsTotal = (item.selectedOptions ?? []).reduce((sum, o) => sum + o.priceDelta, 0);
  return item.unitPrice * item.quantity + addonsTotal + optionsTotal;
}

/** Same shape as lineTotal, but add-ons explicitly marked non-taxable
 * (ProductAddon.isTaxable === false) are excluded — this is the taxable
 * BASE a policy's rate applies to, matching taxable_subtotal in
 * submit_cart_order() (see supabase/migrations/
 * 20260906000001_tax_system_and_product_addons.sql). Selected options are
 * always taxable (they're product-price adjustments, not separate items —
 * no per-option exemption exists). */
export function taxableLineAmount(item: CartItem): number {
  const taxableAddonsTotal = item.addons.filter((a) => a.isTaxable !== false).reduce((sum, a) => sum + a.price, 0);
  const optionsTotal = (item.selectedOptions ?? []).reduce((sum, o) => sum + o.priceDelta, 0);
  return item.unitPrice * item.quantity + taxableAddonsTotal + optionsTotal;
}

export function cartSubtotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + lineTotal(item), 0);
}

export function cartItemCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}
