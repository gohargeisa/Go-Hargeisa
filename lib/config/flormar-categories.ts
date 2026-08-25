import type { Product } from "@/types";

/** `image` is deliberately typed in (asset-ready) but left unset — no real
 * Flormar category photography exists yet. The storefront falls back to
 * PartnerProductPlaceholder until one is supplied; adding a real photo
 * later is a one-line change here, no component change. Purely structural
 * UI metadata (category tabs), not product data — unlike the catalog
 * itself, this stays a small static config rather than a DB table.
 *
 * The 8 categories below are exactly the ones the real, database-driven
 * catalog uses (see scripts/import-flormar-catalog.mjs's CATEGORY_MAP —
 * matches lib/config/product-categories.ts's COSMETICS_CATALOG_CATEGORIES).
 * Labels are resolved via `productCategoryLabel()` (the same EN/AR/SO
 * label map every other cosmetics/product category picker on the site
 * already uses) rather than a separate `flormarPreview.categoryX` i18n key
 * per tile, so there's exactly one source of truth for what each category
 * is called. This file previously listed 4 stale tiles (including
 * "makeup", which zero products in the current catalog use) left over from
 * an earlier mock catalog — updated to match the real data.
 */
export const FLORMAR_CATEGORY_TILES: { key: string; category: Product["category"] }[] = [
  { key: "eyes", category: "eyes" },
  { key: "face", category: "face" },
  { key: "lips", category: "lips" },
  { key: "nail_care", category: "nail_care" },
  { key: "skincare_creams", category: "skincare_creams" },
  { key: "beauty_tools_accessories", category: "beauty_tools_accessories" },
  { key: "body_care", category: "body_care" },
  { key: "other", category: "other" },
];
