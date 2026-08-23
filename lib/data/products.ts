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
  // PostgREST caps rows-per-request (commonly 1000) regardless of how many
  // actually match — a listing with more products than that would
  // otherwise silently truncate with no error. Page through with `.range()`
  // until a page comes back short, same pattern used below for
  // product_variants/product_options.
  const PAGE = 1000;
  const products: Product[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data: page, error } = await supabase
      .from("products")
      .select("*")
      .eq("listing_type", listingType)
      .eq("listing_id", listingId)
      .eq("is_hidden", false)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .range(from, from + PAGE - 1);

    if (error) {
      if (process.env.NODE_ENV === "development") console.error("getProductsForListing:", error.message);
      return products;
    }
    products.push(...(page ?? []).map(mapProduct));
    if (!page || page.length < PAGE) break;
  }

  if (products.length === 0) return products;

  // Product IDs go into a `.in()` filter, which PostgREST encodes into the
  // request URL — a listing with hundreds of products would otherwise
  // build a single URL long enough to hit server/proxy URL-length limits.
  // Chunking keeps every request's URL a bounded, safe size regardless of
  // catalog size.
  const ID_CHUNK = 150;
  const idChunks: string[][] = [];
  for (let i = 0; i < products.length; i += ID_CHUNK) idChunks.push(products.slice(i, i + ID_CHUNK).map((p) => p.id));

  // One set of chunked queries for every variant across the whole listing
  // (not N+1 per product) — variants are a genuinely optional add-on, so
  // most listings (no variants at all) pay for one small query per chunk,
  // not one per product. Publicly-visible variants only (is_available
  // doesn't gate visibility — an out-of-stock shade still needs to show as
  // "sold out", not disappear).
  const variantsByProduct = new Map<string, Product["variants"]>();
  for (const ids of idChunks) {
    const { data: variantRows, error: variantError } = await supabase
      .from("product_variants")
      .select("*")
      .in("product_id", ids)
      .order("sort_order", { ascending: true });

    if (variantError) {
      // Missing table (migration not applied yet in this environment) or
      // any other read failure degrades to "no variants" for this chunk
      // rather than failing the whole product list.
      if (process.env.NODE_ENV === "development") console.error("getProductsForListing (variants):", variantError.message);
      continue;
    }
    for (const row of variantRows ?? []) {
      const variant = mapProductVariant(row);
      const list = variantsByProduct.get(variant.productId) ?? [];
      list.push(variant);
      variantsByProduct.set(variant.productId, list);
    }
  }

  // Same chunked, graceful-degradation pattern as variants above — most
  // listings (no configured options) pay for one small empty query per chunk.
  const optionsByProduct = new Map<string, Product["options"]>();
  for (const ids of idChunks) {
    const { data: optionRows, error: optionError } = await supabase
      .from("product_options")
      .select("*")
      .in("product_id", ids)
      .order("sort_order", { ascending: true });

    if (optionError) {
      if (process.env.NODE_ENV === "development") console.error("getProductsForListing (options):", optionError.message);
      continue;
    }
    for (const row of optionRows ?? []) {
      const option = mapProductOption(row);
      const list = optionsByProduct.get(option.productId) ?? [];
      list.push(option);
      optionsByProduct.set(option.productId, list);
    }
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
