import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapProduct, mapProductVariant, mapProductOption, mapProductAddon } from "./mappers";
import { sanitizeSearchQuery } from "@/lib/utils/sanitize-search-query";
import type { Product, ProductGender, OrderableListingType } from "@/types";

export type ProductSortKey = "featured" | "newest" | "priceLow" | "priceHigh" | "name";

/**
 * Resolves variants/options/add-ons (including group-assigned add-ons) for
 * a bounded set of product IDs, chunked so no single request's URL grows
 * unbounded — shared by both the full-catalog fetch below and the paginated
 * fetch, so a page of results and the full catalog are decorated exactly
 * the same way. Each pass degrades to "nothing found" on error rather than
 * failing the whole product list (a missing table from an unapplied
 * migration, for instance).
 */
async function fetchProductExtras(
  supabase: SupabaseClient,
  productIds: string[]
): Promise<{
  variantsByProduct: Map<string, Product["variants"]>;
  optionsByProduct: Map<string, Product["options"]>;
  addonsByProduct: Map<string, Product["addons"]>;
}> {
  const variantsByProduct = new Map<string, Product["variants"]>();
  const optionsByProduct = new Map<string, Product["options"]>();
  const addonsByProduct = new Map<string, Product["addons"]>();

  if (productIds.length === 0) return { variantsByProduct, optionsByProduct, addonsByProduct };

  // Product IDs go into a `.in()` filter, which PostgREST encodes into the
  // request URL — a listing with hundreds of products would otherwise
  // build a single URL long enough to hit server/proxy URL-length limits.
  // Chunking keeps every request's URL a bounded, safe size regardless of
  // how many IDs are passed in.
  const ID_CHUNK = 150;
  const idChunks: string[][] = [];
  for (let i = 0; i < productIds.length; i += ID_CHUNK) idChunks.push(productIds.slice(i, i + ID_CHUNK));

  // One set of chunked queries for every variant across the given products
  // (not N+1 per product) — variants are a genuinely optional add-on, so
  // most listings (no variants at all) pay for one small query per chunk,
  // not one per product. Publicly-visible variants only (is_available
  // doesn't gate visibility — an out-of-stock shade still needs to show as
  // "sold out", not disappear).
  for (const ids of idChunks) {
    const { data: variantRows, error } = await supabase
      .from("product_variants")
      .select("*")
      .in("product_id", ids)
      .order("sort_order", { ascending: true });

    if (error) {
      if (process.env.NODE_ENV === "development") console.error("fetchProductExtras (variants):", error.message);
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
  for (const ids of idChunks) {
    const { data: optionRows, error } = await supabase
      .from("product_options")
      .select("*")
      .in("product_id", ids)
      .order("sort_order", { ascending: true });

    if (error) {
      if (process.env.NODE_ENV === "development") console.error("fetchProductExtras (options):", error.message);
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
  for (const ids of idChunks) {
    const { data: addonRows, error } = await supabase
      .from("product_addons")
      .select("*")
      .in("product_id", ids)
      .eq("is_active", true)
      .order("sort_order", { ascending: true });

    if (error) {
      if (process.env.NODE_ENV === "development") console.error("fetchProductExtras (addons):", error.message);
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
      if (process.env.NODE_ENV === "development") console.error("fetchProductExtras (addon group assignments):", assignmentError.message);
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
      if (process.env.NODE_ENV === "development") console.error("fetchProductExtras (group addons):", groupAddonError.message);
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

  return { variantsByProduct, optionsByProduct, addonsByProduct };
}

function decorateWithExtras(
  products: Product[],
  extras: {
    variantsByProduct: Map<string, Product["variants"]>;
    optionsByProduct: Map<string, Product["options"]>;
    addonsByProduct: Map<string, Product["addons"]>;
  }
): Product[] {
  return products.map((p) => {
    const variants = extras.variantsByProduct.get(p.id);
    const options = extras.optionsByProduct.get(p.id);
    const addons = extras.addonsByProduct.get(p.id);
    return {
      ...p,
      ...(variants && variants.length > 0 ? { variants } : null),
      ...(options && options.length > 0 ? { options } : null),
      ...(addons && addons.length > 0 ? { addons } : null),
    };
  });
}

/**
 * Every non-hidden product for a listing — any OrderableListingType
 * (city_service/service via categories.supports_products, cafe/restaurant
 * via their own ordering_enabled column) — sorted featured-first then by
 * sort_order, same shape as every other public listing fetch in this file's
 * siblings (getCityServiceBySlug etc.). Callers are expected to already know
 * the listing is eligible before calling this.
 *
 * Fetches the WHOLE catalog — safe for the mobile API routes (app/api/v1/*)
 * and admin/internal callers that genuinely need every row, but NOT what a
 * public storefront page should hand to the browser for a large catalog
 * (a 225-product listing shipped its full ~1.2MB of product data on every
 * page load this way — see getProductsPageForListing below for the
 * server-paginated alternative the public storefront UI now uses).
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
  // until a page comes back short.
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

  const extras = await fetchProductExtras(supabase, products.map((p) => p.id));
  return decorateWithExtras(products, extras);
}

export const getProductsForListing = cache(_getProductsForListing);

export interface ProductsPageOptions {
  limit: number;
  offset: number;
  /** A single category value, or several — Flormar's discovery UI groups
   * several raw `category` values under one UI group (e.g. "Skin Care" =
   * skincare_creams + body_care), so a group filter needs `.in()`, not
   * `.eq()`. */
  category?: string | string[];
  gender?: ProductGender;
  /** Substring match against `brand`, same as ProductsSection's existing
   * free-text brand search box. */
  brandQuery?: string;
  /** Exact match against `brand` — PinnacleProductGrid's brand dropdown
   * needs `.eq()`, not a substring match (a substring match on the full
   * value of one brand would also match another brand name that happens to
   * contain it, e.g. "Dior" inside "Christian Dior"). Distinct from
   * `brandQuery` above. */
  brand?: string;
  /** Substring match against the product's name in any locale (`name`,
   * `name_ar`, `name_so`), its `sku`, or its `brand` — same fields
   * ExcellenceCafeMenu/VillageMenuOrderSection/FlormarStorefront/
   * PinnacleProductGrid's existing search boxes already matched against
   * (brand included so Pinnacle's single search box, which searches name OR
   * brand, keeps working server-side). */
  nameQuery?: string;
  sort?: ProductSortKey;
}

export interface ProductsPageResult {
  items: Product[];
  /** Total rows matching the filters (ignoring limit/offset) — from Postgres's
   * exact count on the same filtered query, not a separate round trip. */
  total: number;
}

/**
 * Real server-side pagination for a listing's product catalog: only
 * `limit` rows are ever requested from Postgres (via `.range()`), with
 * `total` coming from the same query's exact count — never "fetch
 * everything, slice in JS". Category/gender/brand filters are applied in
 * SQL too, so switching a filter re-queries just that filtered page rather
 * than re-filtering an in-memory copy of the whole catalog.
 *
 * Not React-`cache()`-wrapped: unlike `getProductsForListing` (deliberately
 * deduped because generateMetadata and the page body call it with the
 * exact same arguments), this is called once per distinct page/filter
 * combination by design — there's nothing to dedupe.
 */
async function _getProductsPageForListing(
  listingId: string,
  listingType: OrderableListingType,
  options: ProductsPageOptions
): Promise<ProductsPageResult> {
  if (!isSupabaseConfigured()) return { items: [], total: 0 };

  const { limit, offset, category, gender, brandQuery, brand, nameQuery, sort = "featured" } = options;
  const supabase = createPublicClient();

  let query = supabase
    .from("products")
    .select("*", { count: "exact" })
    .eq("listing_type", listingType)
    .eq("listing_id", listingId)
    .eq("is_hidden", false);

  if (Array.isArray(category)) {
    if (category.length > 0) query = query.in("category", category);
  } else if (category) {
    query = query.eq("category", category);
  }
  if (gender) query = query.eq("gender", gender);
  if (brand) query = query.eq("brand", brand);
  if (brandQuery) query = query.ilike("brand", `%${brandQuery}%`);
  if (nameQuery) {
    const safeQ = sanitizeSearchQuery(nameQuery);
    if (safeQ)
      query = query.or(
        `name.ilike.%${safeQ}%,name_ar.ilike.%${safeQ}%,name_so.ilike.%${safeQ}%,sku.ilike.%${safeQ}%,brand.ilike.%${safeQ}%`
      );
  }

  switch (sort) {
    case "newest":
      query = query.order("created_at", { ascending: false });
      break;
    case "priceLow":
      query = query.order("price", { ascending: true, nullsFirst: false });
      break;
    case "priceHigh":
      query = query.order("price", { ascending: false, nullsFirst: false });
      break;
    case "name":
      query = query.order("name", { ascending: true });
      break;
    case "featured":
    default:
      query = query.order("is_featured", { ascending: false }).order("sort_order", { ascending: true });
  }
  // Stable tiebreaker (unique column) so a page boundary never lands mid-tie
  // and duplicate/skip a row across "Load More" calls when many products
  // share the same sort value (e.g. the same price, or sort_order=0).
  query = query.order("id", { ascending: true }).range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) {
    if (process.env.NODE_ENV === "development") console.error("getProductsPageForListing:", error.message);
    return { items: [], total: 0 };
  }

  const products = (data ?? []).map(mapProduct);
  if (products.length === 0) return { items: [], total: count ?? 0 };

  const extras = await fetchProductExtras(supabase, products.map((p) => p.id));
  return { items: decorateWithExtras(products, extras), total: count ?? products.length };
}

export const getProductsPageForListing = _getProductsPageForListing;

export interface ProductFacets {
  categories: string[];
  genders: ProductGender[];
  brands: string[];
}

/**
 * Splits an already-fetched full catalog (getProductsForListing) into what
 * a storefront's initial render actually needs: the first `pageSize` items
 * (already in the catalog's real sort order), the true total, and the
 * distinct category/gender/brand values across the WHOLE catalog (so filter
 * pills reflect items that haven't loaded yet, not just page 1).
 *
 * For a page that fetches the full catalog anyway (a sibling section needs
 * whole-catalog visibility — e.g. Village's "Signature Selection" picks
 * specific dishes from anywhere in the menu, or a generic restaurant page's
 * text-first menu), this is a free, in-memory way to still only SHIP the
 * first page to the browser — no second Supabase round trip. Every
 * subsequent page (via "Load More" or a filter change) goes through the
 * real server-side query instead (getProductsPageForListing via
 * /api/products, see lib/hooks/use-paginated-products.ts) — never another
 * full-catalog fetch.
 */
export function deriveInitialProductsPage(
  allProducts: Product[],
  pageSize: number
): { initialProducts: Product[]; initialTotal: number; facets: ProductFacets } {
  const categories: string[] = [];
  const genders = new Set<ProductGender>();
  const brands = new Set<string>();
  for (const p of allProducts) {
    if (p.category && !categories.includes(p.category)) categories.push(p.category);
    if (p.gender) genders.add(p.gender);
    if (p.brand) brands.add(p.brand);
  }

  return {
    initialProducts: allProducts.slice(0, pageSize),
    initialTotal: allProducts.length,
    facets: { categories, genders: Array.from(genders), brands: Array.from(brands).sort() },
  };
}
