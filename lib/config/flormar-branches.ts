/**
 * Flormar's two real branches — Hargeisa (Somaliland) and Mogadishu
 * (Somalia). Single source of truth for the exact display label, so the
 * checkout city-selection UI and the order-management views (business +
 * platform admin) can never drift out of sync with each other or invent a
 * different wording.
 *
 * Location-label rule (explicit platform-owner requirement): Hargeisa must
 * always read "Hargeisa, Somaliland" — never "Hargeisa, SO", never
 * "Hargeisa, Somalia", never "Somalia - Hargeisa". Mogadishu is genuinely
 * "Mogadishu, Somalia" (a different, real country) — the two branches are
 * not interchangeable and must not be normalized to the same country.
 *
 * The mechanism this feeds (AddToCartBusiness.branches, CartState.branches,
 * product_orders.fulfillment_city) is fully generic — see cart-context.tsx
 * and 20260907000018_product_order_fulfillment_city.sql's own doc
 * comments — this file is just where Flormar's own two real branches are
 * declared, the same way flormar-categories.ts holds Flormar's own category
 * data on top of a generic mechanism.
 */
export const FLORMAR_BRANCHES: { value: string; label: string }[] = [
  { value: "hargeisa", label: "Hargeisa, Somaliland" },
  { value: "mogadishu", label: "Mogadishu, Somalia" },
];

export function fulfillmentCityLabel(key: string | null | undefined): string | undefined {
  if (!key) return undefined;
  return FLORMAR_BRANCHES.find((b) => b.value === key)?.label ?? key;
}
