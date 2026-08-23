import { createAdminClient } from "@/lib/supabase/admin";
import { mapCityService, mapProduct, mapProductVariant, mapProductOption } from "./mappers";
import type { CityService, Product } from "@/types";

/**
 * Flormar Hargeisa's private preview (app/[locale]/preview/flormar) reads a
 * REAL, database-driven `city_services` row + `products` rows — not mock
 * data — but that row is deliberately `status: 'draft'`, which the
 * standard RLS policies (see 20260823000002_universal_cart_orders.sql)
 * make invisible to every public/anon read path: listing grids, search,
 * sitemap, nearby-places, even the generic `/city-services/[slug]` route
 * itself. That's the actual privacy mechanism — not just "unlinked" —
 * so this route needs its own service-role read to see its own draft data.
 *
 * NEVER reuse this pattern for a public-facing page or expose
 * createAdminClient() to anything a normal visitor's request can reach
 * with attacker-controlled input — this file exists only because the one
 * slug it reads ("flormar-hargeisa") is hardcoded by the page itself, not
 * derived from user input.
 */
export async function getFlormarPreviewData(): Promise<{ service: CityService; products: Product[] } | null> {
  const supabase = createAdminClient();

  const { data: row, error } = await supabase.from("city_services").select("*").eq("slug", "flormar-hargeisa").maybeSingle();
  if (error || !row) return null;

  // PostgREST caps rows-per-request (commonly 1000) — page through with
  // `.range()` so a catalog this size (1000+ products) doesn't silently
  // truncate, same fix as lib/data/products.ts's getProductsForListing.
  const PAGE = 1000;
  const products: Product[] = [];
  for (let from = 0; ; from += PAGE) {
    const { data: page, error: productError } = await supabase
      .from("products")
      .select("*")
      .eq("listing_type", "city_service")
      .eq("listing_id", row.id)
      .eq("is_hidden", false)
      .order("is_featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .range(from, from + PAGE - 1);

    if (productError) return { service: mapCityService(row), products };
    products.push(...(page ?? []).map(mapProduct));
    if (!page || page.length < PAGE) break;
  }

  if (products.length === 0) return { service: mapCityService(row), products };

  // Same chunked variant/option join as lib/data/products.ts's
  // getProductsForListing (kept as a separate copy, not a shared import,
  // because this one runs on the admin/service-role client for a draft
  // listing — the public version must never be reachable with elevated
  // privileges). Chunking keeps every request's `.in()` URL a bounded size
  // regardless of catalog size.
  const ID_CHUNK = 150;
  const idChunks: string[][] = [];
  for (let i = 0; i < products.length; i += ID_CHUNK) idChunks.push(products.slice(i, i + ID_CHUNK).map((p) => p.id));

  const variantsByProduct = new Map<string, Product["variants"]>();
  for (const ids of idChunks) {
    const { data: variantRows } = await supabase.from("product_variants").select("*").in("product_id", ids).order("sort_order", { ascending: true });
    for (const r of variantRows ?? []) {
      const variant = mapProductVariant(r);
      const list = variantsByProduct.get(variant.productId) ?? [];
      list.push(variant);
      variantsByProduct.set(variant.productId, list);
    }
  }

  const optionsByProduct = new Map<string, Product["options"]>();
  for (const ids of idChunks) {
    const { data: optionRows } = await supabase.from("product_options").select("*").in("product_id", ids).order("sort_order", { ascending: true });
    for (const r of optionRows ?? []) {
      const option = mapProductOption(r);
      const list = optionsByProduct.get(option.productId) ?? [];
      list.push(option);
      optionsByProduct.set(option.productId, list);
    }
  }

  return {
    service: mapCityService(row),
    products: products.map((p) => {
      const variants = variantsByProduct.get(p.id);
      const options = optionsByProduct.get(p.id);
      return { ...p, ...(variants && variants.length > 0 ? { variants } : null), ...(options && options.length > 0 ? { options } : null) };
    }),
  };
}
