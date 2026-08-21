import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapProduct, mapProductVariant, mapProductOption } from "./mappers";
import type { Product, OrderableListingType } from "@/types";

/**
 * Every non-hidden product for a listing — any OrderableListingType
 * (city_service/service via categories.supports_products, cafe/restaurant
 * via their own ordering_enabled column) — sorted featured-first then by
 * sort_order, same shape as every other public listing fetch in this file's
 * siblings (getCityServiceBySlug etc.). Callers are expected to already know
 * the listing is eligible before calling this.
 */
async function _getProductsForListing(
  listingId: string,
  listingType: OrderableListingType = "city_service"
): Promise<Product[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("listing_type", listingType)
    .eq("listing_id", listingId)
    .eq("is_hidden", false)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true });

  if (error) {
    if (process.env.NODE_ENV === "development") console.error("getProductsForListing:", error.message);
    return [];
  }

  const products = (data ?? []).map(mapProduct);
  if (products.length === 0) return products;

  // One extra query for every variant across the whole listing (not N+1 per
  // product) — variants are a genuinely optional add-on, so most listings
  // (no variants at all) pay for exactly one empty query, not one per
  // product. Publicly-visible variants only (is_available doesn't gate
  // visibility — an out-of-stock shade still needs to show as "sold out",
  // not disappear).
  const { data: variantRows, error: variantError } = await supabase
    .from("product_variants")
    .select("*")
    .in("product_id", products.map((p) => p.id))
    .order("sort_order", { ascending: true });

  if (variantError) {
    // Missing table (migration not applied yet in this environment) or any
    // other read failure degrades to "no variants" rather than failing the
    // whole product list — every product still renders normally.
    if (process.env.NODE_ENV === "development") console.error("getProductsForListing (variants):", variantError.message);
    return products;
  }

  const variantsByProduct = new Map<string, Product["variants"]>();
  for (const row of variantRows ?? []) {
    const variant = mapProductVariant(row);
    const list = variantsByProduct.get(variant.productId) ?? [];
    list.push(variant);
    variantsByProduct.set(variant.productId, list);
  }

  // Same one-extra-query, graceful-degradation pattern as variants above —
  // most listings (no configured options) pay for exactly one empty query.
  const { data: optionRows, error: optionError } = await supabase
    .from("product_options")
    .select("*")
    .in("product_id", products.map((p) => p.id))
    .order("sort_order", { ascending: true });

  const optionsByProduct = new Map<string, Product["options"]>();
  if (!optionError) {
    for (const row of optionRows ?? []) {
      const option = mapProductOption(row);
      const list = optionsByProduct.get(option.productId) ?? [];
      list.push(option);
      optionsByProduct.set(option.productId, list);
    }
  } else if (process.env.NODE_ENV === "development") {
    console.error("getProductsForListing (options):", optionError.message);
  }

  return products.map((p) => {
    const variants = variantsByProduct.get(p.id);
    const options = optionsByProduct.get(p.id);
    return {
      ...p,
      ...(variants && variants.length > 0 ? { variants } : null),
      ...(options && options.length > 0 ? { options } : null),
    };
  });
}

export const getProductsForListing = cache(_getProductsForListing);
