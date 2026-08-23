import type { Product } from "@/types";

/** `image` is deliberately typed in (asset-ready) but left unset — no real
 * Flormar category photography exists yet. The storefront falls back to
 * PartnerProductPlaceholder until one is supplied; adding a real photo
 * later is a one-line change here, no component change. Purely structural
 * UI metadata (category tabs), not product data — unlike the catalog
 * itself, this stays a small static config rather than a DB table. */
export const FLORMAR_CATEGORY_TILES: { key: string; labelKey: "makeup" | "skincare" | "nails" | "accessories"; category: Product["category"]; image?: string }[] = [
  { key: "makeup", labelKey: "makeup", category: "makeup" },
  { key: "skincare", labelKey: "skincare", category: "skincare_creams" },
  { key: "nails", labelKey: "nails", category: "nail_care" },
  { key: "accessories", labelKey: "accessories", category: "beauty_tools_accessories" },
];
