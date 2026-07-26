/**
 * price_range is a NOT NULL enum ('$' | '$$' | '$$$' | '$$$$') defaulting
 * to '$$' on every hotel/restaurant row — there's no way for it to be
 * genuinely empty, so a bare falsy check never actually catches "no real
 * price data" was entered. A lone "$" carries no comparative meaning on
 * its own (unlike $$/$$$/$$$$) and, in practice, is what an unset/default
 * price looks like — so it's treated the same as "no price" everywhere
 * the price is displayed.
 */
export function hasMeaningfulPrice(priceRange?: string | null): priceRange is string {
  return Boolean(priceRange) && priceRange !== "$";
}
