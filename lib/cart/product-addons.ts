import { FLOWER_SPECIALTY_CATEGORIES } from "@/lib/config/product-categories";
import type { Product, ProductAddon } from "@/types";
import type { AddToCartBusiness } from "./cart-context";

/**
 * Single source of truth for "which add-ons are actually valid for THIS
 * product" — every caller that renders or applies add-ons (ProductCard,
 * ProductDetailModal) must go through this instead of reading
 * `business.addons`/`product.addons` directly. Merges two sources:
 *
 * 1. `product.addons` — the genuine per-product add-ons table (Cheese,
 *    Olives, Oil, ...; supabase/migrations/
 *    20260906000001_tax_system_and_product_addons.sql), owned by exactly
 *    this product. Always included when present, for any listing type or
 *    category — this is what makes Village's "Cheese only on Product A,
 *    Mushrooms only on Product B, no add-ons at all on Product C" possible.
 *
 * 2. `business.addons` (cafes.flower_addons) — the older, business-wide
 *    vocabulary, preserved unchanged for backward compatibility with
 *    Lavender's flower line. Root cause this half exists to close: it was
 *    once applied unconditionally to every product from that business, so
 *    a café's own drinks/food showed "Extra Gypsophila"/"Premium Wrapping",
 *    add-ons that only make sense for its flower line. The fix is a real
 *    category gate, not a UI hide: only a product actually categorized as
 *    a flower/gift item (FLOWER_SPECIALTY_CATEGORIES) ever receives it.
 *
 * The RPC (submit_cart_order, see 20260823000002_universal_cart_orders.sql
 * and 20260906000001) enforces the identical rules server-side for both
 * sources, so a crafted client request can't attach either an unrelated
 * product's add-on or flower_addons pricing to a non-flower product_id —
 * this client helper is a UX convenience (don't even show/offer the
 * checkboxes), not the only line of defense.
 */
export function getValidAddonsForProduct(product: Pick<Product, "category" | "addons">, business: AddToCartBusiness): ProductAddon[] {
  const ownAddons = product.addons ?? [];
  const isFlowerProduct = Boolean(product.category && FLOWER_SPECIALTY_CATEGORIES.includes(product.category));
  const flowerAddons = isFlowerProduct ? business.addons : [];
  return [...ownAddons, ...flowerAddons];
}
