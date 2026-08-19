import type { Product } from "@/types";

/**
 * Derives a product's sale/discount presentation from its two price fields
 * (`price`, `originalPrice`) — the single source of truth for "is this
 * product on sale" everywhere it's displayed (card badge, detail modal,
 * anywhere else that needs it later), so the rule can never drift between
 * call sites. A product is on sale purely when `originalPrice` is set and
 * strictly greater than `price`; equal or lower values (a data-entry
 * mistake, or a sale that's been turned off by clearing the price gap)
 * intentionally show as a normal, non-discounted product rather than a 0%
 * or negative badge.
 */
export interface ProductPricing {
  hasDiscount: boolean;
  price: number | undefined;
  originalPrice: number | undefined;
  /** Whole-number percent off, floor-rounded so a badge never overstates
   * the saving (e.g. 33.9% off shows as "-33%", not "-34%"). */
  discountPercent: number | undefined;
}

export function getProductPricing(product: Pick<Product, "price" | "originalPrice">): ProductPricing {
  const { price, originalPrice } = product;
  const hasDiscount = price != null && originalPrice != null && originalPrice > price;
  return {
    hasDiscount,
    price,
    originalPrice,
    discountPercent: hasDiscount ? Math.floor((1 - price! / originalPrice!) * 100) : undefined,
  };
}
