import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapProduct, mapProductVariant, mapProductOption, mapProductAddon } from "./mappers";
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

  // Same chunked pattern as variants/options above — most listings (no
  // configured add-ons yet) pay for one small empty query per chunk. See
  // supabase/migrations/20260906000001_tax_system_and_product_addons.sql —
  // genuinely per-product, unlike the older cafes.flower_addons vocabulary
  // (lib/cart/product-addons.ts merges both).
  const addonsByProduct = new Map<string, Product["addons"]>();
  for (const ids of idChunks) {
    const { data: addonRows, error: addonError } = await supabase
      .from("product_addons")
      .select("*")
      .in("product_id", ids)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (addonError) {
      // Missing table (migration not applied yet in this environment) or
      // any other read failure degrades to "no add-ons" for this chunk
      // rather than failing the whole product list.
      if (process.env.NODE_ENV === "development") console.error("getProductsForListing (addons):", addonError.message);
      continue;
    }
    for (const row of addonRows ?? []) {
      const addon = mapProductAddon(row);
      const list = addonsByProduct.get(addon.productId!) ?? [];
      list.push(addon);
      addonsByProduct.set(addon.productId!, list);
    }
  }

  // Reusable add-on GROUPS (supabase/migrations/
  // 20260907000017_addon_groups_and_village_side_dishes.sql) — a group's
  // own add-ons (product_addons.group_id set, product_id null) are resolved
  // once per chunk via the product_addon_groups junction and merged into
  // the exact same addonsByProduct map as direct per-product add-ons, so
  // every downstream consumer (ProductCard, ProductDetailModal,
  // getValidAddonsForProduct) sees one flat, already-merged addons array
  // and never needs to know whether a given add-on came from a direct
  // assignment or a shared group. A product with no group assignment pays
  // for one small empty query per chunk, same graceful-degradation pattern
  // as variants/options/direct add-ons above.
  for (const ids of idChunks) {
    const { data: assignmentRows, error: assignmentError } = await supabase
      .from("product_addon_groups")
      .select("product_id, group_id")
      .in("product_id", ids);

    if (assignmentError) {
      if (process.env.NODE_ENV === "development") console.error("getProductsForListing (addon group assignments):", assignmentError.message);
      continue;
    }
    if (!assignmentRows || assignmentRows.length === 0) continue;

    const groupIds = Array.from(new Set(assignmentRows.map((r) => r.group_id)));
    const { data: groupAddonRows, error: groupAddonError } = await supabase
      .from("product_addons")
      .select("*")
      .in("group_id", groupIds)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (groupAddonError) {
      if (process.env.NODE_ENV === "development") console.error("getProductsForListing (group addons):", groupAddonError.message);
      continue;
    }

    const addonsByGroup = new Map<string, Product["addons"]>();
    for (const row of groupAddonRows ?? []) {
      const addon = mapProductAddon(row);
      const list = addonsByGroup.get(row.group_id) ?? [];
      list.push(addon);
      addonsByGroup.set(row.group_id, list);
    }

    for (const { product_id, group_id } of assignmentRows) {
      const groupAddons = addonsByGroup.get(group_id);
      if (!groupAddons || groupAddons.length === 0) continue;
      const list = addonsByProduct.get(product_id) ?? [];
      list.push(...groupAddons);
      addonsByProduct.set(product_id, list);
    }
  }

  return products.map((p) => {
    const variants = variantsByProduct.get(p.id);
    const options = optionsByProduct.get(p.id);
    const addons = addonsByProduct.get(p.id);
    return {
      ...p,
      ...(variants && variants.length > 0 ? { variants } : null),
      ...(options && options.length > 0 ? { options } : null),
      ...(addons && addons.length > 0 ? { addons } : null),
    };
  });
}

export const getProductsForListing = cache(_getProductsForListing);
