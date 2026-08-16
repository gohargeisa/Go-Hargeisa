/**
 * Temporary, Lavender-specific menu grouping — a stand-in for
 * `products.category` until 20260823000002_universal_cart_orders.sql (which
 * drops products.category's fixed CHECK constraint) is reviewed and applied.
 * That constraint's vocabulary is Perfume/Cosmetics/Flower-only (see
 * 20260818000002_universal_video_pdf_products_bookings.sql) — it rejects any
 * café-menu category text ("Hot Coffee", "Brunch & Bites", ...), so those
 * ~106 real menu items are inserted with category = null and grouped here
 * instead, purely in application code. No schema change.
 *
 * The grouping is positional, not stored per-row: `scripts/add-lavender-
 * menu-items.ts` inserts every item with a contiguous sort_order starting at
 * LAVENDER_MENU_SORT_ORDER_BASE, in exactly the order these sections list —
 * groupProductsIntoSections() below re-sorts the fetched rows by sort_order
 * and slices them by these counts. The counts here MUST match each source
 * array's length in the insert script (HOT_DRINKS.length, TEA.length, ...) —
 * they're duplicated by hand because the script is a one-off tool, not
 * something app code should import at runtime.
 *
 * Once the pending migration lands, the real fix is to backfill
 * products.category from this same list (by sort_order) and delete this
 * file — ProductsSection's existing free-text category filter already
 * handles arbitrary category strings with no further code changes needed.
 */

export interface LavenderMenuSection {
  label: string;
  count: number;
}

/** The 12 flower/bouquet products (scripts/add-lavender-cafe.ts) — these
 * already carry a real category ('bouquet', valid under the current
 * constraint) and sort_order 1–12. Listed here only so the café menu
 * section list below knows where the flower block ends. */
export const LAVENDER_FLOWER_SECTION: LavenderMenuSection = { label: "Flowers & Bouquets", count: 12 };
export const LAVENDER_FLOWER_SORT_ORDER_BASE = 1;

/** Café menu sections, in the exact order scripts/add-lavender-menu-items.ts
 * inserts them, matching the PDF's own section headers. Sum = 106. */
export const LAVENDER_MENU_SECTIONS: LavenderMenuSection[] = [
  { label: "Hot Drinks", count: 4 },
  { label: "Tea", count: 4 },
  { label: "Hot Coffee", count: 13 },
  { label: "Hot Matcha", count: 3 },
  { label: "Iced Matcha", count: 4 },
  { label: "Iced Coffee", count: 8 },
  { label: "Smoothies", count: 8 },
  { label: "Milkshakes", count: 12 },
  { label: "Mojito Mocktails", count: 12 },
  { label: "Frappuccino", count: 6 },
  { label: "Brunch & Bites", count: 6 },
  { label: "Wraps", count: 3 },
  { label: "Desserts", count: 3 },
  { label: "Cakes (Slices)", count: 7 },
  { label: "Full Cakes", count: 6 },
  { label: "Wedding Cakes", count: 4 },
  { label: "Mini Cakes", count: 3 },
];

export const LAVENDER_MENU_SORT_ORDER_BASE = 100;

/**
 * Groups an already-fetched product list into labeled sections by
 * sort_order, starting at `base` and consuming `sections` in order. Products
 * with sort_order < base are ignored (they belong to an earlier block, e.g.
 * flowers). Sections with zero matched items are omitted so a partial
 * insert never renders empty headings.
 */
export function groupProductsIntoSections<T extends { sortOrder: number }>(
  products: T[],
  base: number,
  sections: LavenderMenuSection[]
): { label: string; items: T[] }[] {
  const sorted = products.filter((p) => p.sortOrder >= base).sort((a, b) => a.sortOrder - b.sortOrder);
  const groups: { label: string; items: T[] }[] = [];
  let cursor = 0;
  for (const section of sections) {
    const items = sorted.slice(cursor, cursor + section.count);
    if (items.length > 0) groups.push({ label: section.label, items });
    cursor += section.count;
  }
  return groups;
}
