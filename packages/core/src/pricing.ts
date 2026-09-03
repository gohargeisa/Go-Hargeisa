/**
 * Price / product-pricing helpers shared with the web app. Sources:
 *   - `lib/utils/price-range.ts`     (import-free)
 *   - `lib/utils/starting-price.ts`  (import-free, generic)
 *   - `lib/utils/product-pricing.ts` (type-only import of `Product`)
 *
 * Keeps the native product cards / detail screens showing the exact same
 * "from $X" / sale-price logic as the website.
 */
export { hasMeaningfulPrice } from "../../../lib/utils/price-range";
export { getStartingPrice } from "../../../lib/utils/starting-price";
export { getProductPricing, type ProductPricing } from "../../../lib/utils/product-pricing";
