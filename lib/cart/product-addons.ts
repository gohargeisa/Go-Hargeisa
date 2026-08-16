import { FLOWER_SPECIALTY_CATEGORIES } from "@/lib/config/product-categories";
import type { Product, ProductAddon } from "@/types";
import type { AddToCartBusiness } from "./cart-context";

/**
 * Single source of truth for "which add-ons are actually valid for THIS
 * product" — every caller that renders or applies add-ons (ProductCard,
 * ProductDetailModal) must go through this instead of reading
 * `business.addons` directly.
 *
 * Root cause this exists to close: `business.addons` (cafes.flower_addons)
 * is a BUSINESS-wide vocabulary, but it was being applied unconditionally
 * to every product from that business — so a café's own drinks/food showed
 * "Extra Gypsophila"/"Premium Wrapping"/"Message Card", add-ons that only
 * make sense for its flower line. The fix is a real product/category
 * relationship, not a UI hide: a product only ever receives the business's
 * add-on vocabulary when it's actually categorized as a flower/gift item
 * (FLOWER_SPECIALTY_CATEGORIES — the same category list flower shops
 * already use elsewhere, not a new one invented for this). Every other
 * product (a café's coffee, tea, cakes, ...) always gets an empty list,
 * structurally — nothing downstream can ever attach a flower add-on to it.
 *
 * The RPC (submit_cart_order, see 20260823000002_universal_cart_orders.sql)
 * enforces the identical rule server-side, so a crafted client request
 * can't attach flower_addons pricing to a non-flower product_id either —
 * this client helper is a UX convenience (don't even show/offer the
 * checkboxes), not the only line of defense.
 */
export function getValidAddonsForProduct(product: Pick<Product, "category">, business: AddToCartBusiness): ProductAddon[] {
  const isFlowerProduct = Boolean(product.category && FLOWER_SPECIALTY_CATEGORIES.includes(product.category));
  return isFlowerProduct ? business.addons : [];
}
