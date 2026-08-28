/**
 * Lavender-specific menu section list and display order.
 *
 * History: this file originally existed because `products.category` had to
 * be NULL for every café-menu row — the live CHECK constraint only allowed
 * Perfume/Cosmetics/Flower vocabulary — so items were grouped purely
 * positionally (by sort_order, sliced by hand-counted section sizes). That
 * constraint has since been dropped and every Lavender café product's
 * `category` column has been backfilled (see migration
 * 20260907000014_lavender_cafe_category_backfill_and_content_fix.sql) with
 * the real values below — which is what groupProductsByCategory() actually
 * groups by now. This is immune to the positional-drift bug the old
 * approach had: adding a product, or a product losing/gaining an image, can
 * never shift another product into the wrong section, because grouping no
 * longer depends on array position at all.
 *
 * `LAVENDER_MENU_SECTIONS`' `count` field is kept only because
 * `scripts/add-lavender-menu-items.ts` (a one-off insert script, already
 * run, idempotent but not part of the live runtime) still imports it for a
 * defensive self-check against its own source arrays — it's historical
 * documentation of the original PDF section sizes, not consulted by
 * anything that renders the live page anymore.
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
  // 2026-09-07 Excel reconciliation: 6 products added after the original 106
  // (sort_order 206-211, contiguous immediately after this list's positional
  // range), too small a batch to justify renumbering the whole positional
  // scheme — one trailing catch-all section instead of interleaving them
  // into their "natural" section (Hot Coffee/Smoothies/Milkshakes/Brunch)
  // without risking a database sort_order rewrite mid-phase. Should be
  // folded into its proper section (or replaced entirely by a real
  // products.category backfill — the CHECK constraint blocking that is
  // already gone) next time this file is touched.
  { label: "Newly Added", count: 6 },
];

export const LAVENDER_MENU_SORT_ORDER_BASE = 100;

/** Display order for the real, backfilled `products.category` values —
 * matches the source PDF's own section order. A handful of later-added rows
 * (Espresso, Hazelnut Latte, Pineapple Smoothie, Caramel/Pistachio
 * Milkshake, Hungry Burger) were folded into their closest matching
 * category here by name rather than by a second PDF pass — see the backfill
 * migration's header comment. */
export const LAVENDER_MENU_CATEGORY_ORDER: string[] = [
  "Hot Drinks",
  "Tea",
  "Hot Coffee",
  "Hot Matcha",
  "Iced Matcha",
  "Iced Coffee",
  "Smoothies",
  "Milkshakes",
  "Mojito Mocktails",
  "Frappuccino",
  "Brunch & Bites",
  "Wraps",
  "Desserts",
  "Cakes (Slices)",
  "Full Cakes",
  "Wedding Cakes",
  "Mini Cakes",
];

/**
 * Groups an already-fetched product list by its real `category` field, in
 * `order`. A product whose category isn't in `order` (shouldn't happen post-
 * backfill, but not assumed) is appended in a trailing "Other" group rather
 * than silently dropped. Empty groups are omitted so a category with no
 * remaining visible items never renders an empty heading. Items within a
 * group keep their sort_order.
 */
export function groupProductsByCategory<T extends { category?: string | null; sortOrder: number }>(
  products: T[],
  order: string[]
): { label: string; items: T[] }[] {
  const byCategory = new Map<string, T[]>();
  const other: T[] = [];
  for (const p of products) {
    if (p.category && order.includes(p.category)) {
      const list = byCategory.get(p.category) ?? [];
      list.push(p);
      byCategory.set(p.category, list);
    } else {
      other.push(p);
    }
  }
  const groups: { label: string; items: T[] }[] = [];
  for (const label of order) {
    const items = (byCategory.get(label) ?? []).sort((a, b) => a.sortOrder - b.sortOrder);
    if (items.length > 0) groups.push({ label, items });
  }
  if (other.length > 0) groups.push({ label: "Other", items: other.sort((a, b) => a.sortOrder - b.sortOrder) });
  return groups;
}
