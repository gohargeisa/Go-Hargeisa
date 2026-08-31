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

/**
 * Flormar's official-site category philosophy (Face / Eyes / Lips / Nails /
 * Skin Care / Accessories) mapped onto our existing, real, verified
 * `products.category` values — a UI-level regrouping only, no schema change
 * and no per-product recategorization. "skincare" folds in both
 * `skincare_creams` and `body_care` (2 products) per that same official
 * philosophy (Skin Care = face care + body care + perfume on flormar.com).
 *
 * `other` (58 of 225 products, the source spreadsheet's own "Other / Review"
 * flag) is deliberately NOT assigned to any group here — none of these 6
 * buckets is a confidently-known home for all of them, and guessing one
 * would be exactly the "assign categories automatically" this file's
 * products explicitly must not get. Those products stay fully visible in
 * the unfiltered "All Products" grid; they're just not reachable via a named
 * category chip until a real review assigns each one individually.
 */
export const FLORMAR_PRIMARY_CATEGORY_GROUPS: { key: string; titleKey: "groupFace" | "groupEyes" | "groupLips" | "groupNails" | "groupSkincare" | "groupAccessories"; categories: Product["category"][] }[] = [
  { key: "face", titleKey: "groupFace", categories: ["face"] },
  { key: "eyes", titleKey: "groupEyes", categories: ["eyes"] },
  { key: "lips", titleKey: "groupLips", categories: ["lips"] },
  { key: "nails", titleKey: "groupNails", categories: ["nail_care"] },
  { key: "skincare", titleKey: "groupSkincare", categories: ["skincare_creams", "body_care"] },
  { key: "accessories", titleKey: "groupAccessories", categories: ["beauty_tools_accessories"] },
];
