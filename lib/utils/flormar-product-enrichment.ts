import { cleanFlormarProductName, cleanFlormarShadeName } from "@/lib/utils/flormar-product-names";
import { FLORMAR_CATEGORY_OVERRIDES } from "@/lib/config/flormar-category-overrides";
import { FLORMAR_PRODUCT_DESCRIPTIONS, FLORMAR_SHADE_HEX } from "@/lib/config/flormar-product-details";
import type { Locale } from "@/lib/i18n/config";
import type { Product } from "@/types";

/**
 * Flormar's display-time-only product enrichment (real catalog name
 * cleanup, a verified-SKU category override, English-only verified
 * copy fallback, per-shade variant identity) — extracted from
 * FlormarStorefront so it can run in TWO places against the SAME real
 * data: server-side (city-services/[slug]/page.tsx) for the small,
 * whole-catalog-derived views (featured/discover-picks/category-tile-
 * images/campaign-linked products) that page computes from the full
 * fetch it already has, and client-side (FlormarStorefront) for whatever
 * page of the paginated "Shopping" grid /api/products returns — same
 * transform either way, nothing product-related duplicated or
 * reimplemented. Never writes to the database; the raw row is untouched.
 */
export function enrichFlormarProduct(p: Product, locale: Locale): Product {
  const base8 = (p.sku ?? "").split("-")[0]?.slice(0, 8) ?? "";
  const categoryOverride = (p.sku && FLORMAR_CATEGORY_OVERRIDES[p.sku]) || FLORMAR_CATEGORY_OVERRIDES[base8];
  const verifiedDescription =
    locale === "en" ? (p.sku && FLORMAR_PRODUCT_DESCRIPTIONS[p.sku]) || FLORMAR_PRODUCT_DESCRIPTIONS[base8] : undefined;

  return {
    ...p,
    name: cleanFlormarProductName(p.name, p.sku),
    brand: "Flormar",
    ...(categoryOverride ? { category: categoryOverride } : null),
    ...(verifiedDescription && !p.description ? { description: verifiedDescription } : null),
    ...(p.variants
      ? {
          variants: p.variants.map((v) => {
            const shade = cleanFlormarShadeName(v.shadeName || v.name);
            const code = v.shadeCode?.trim();
            return {
              ...v,
              name: code && !shade.startsWith(code) ? `${code} ${shade}` : shade,
              shadeName: shade,
              ...(v.sku && FLORMAR_SHADE_HEX[v.sku] ? { hexColor: FLORMAR_SHADE_HEX[v.sku] } : null),
            };
          }),
        }
      : null),
  };
}
