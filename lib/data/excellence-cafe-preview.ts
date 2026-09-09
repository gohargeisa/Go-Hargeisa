import { createAdminClient } from "@/lib/supabase/admin";
import { mapRestaurant, mapProduct, mapProductVariant, mapProductOption } from "./mappers";
import type { Restaurant, Product } from "@/types";

/**
 * Excellence Café's private preview (app/[locale]/preview/excellence-cafe)
 * reads a REAL, database-driven `restaurants` row + `products` rows — not
 * hardcoded constants — but that row is deliberately `status: 'draft'`,
 * which the standard RLS policies make invisible to every public/anon read
 * path (listing grids, search, sitemap, nearby-places, even the generic
 * `/restaurants/[slug]` route itself). That's the actual privacy mechanism
 * — not just "unlinked" — so this route needs its own service-role read to
 * see its own draft data. Same pattern as lib/data/village-preview.ts; kept
 * as a separate file (not a shared generic helper) for the same reason that
 * file gives: easiest to reason about that no other route accidentally
 * gains admin-client access by sharing this function.
 *
 * NEVER reuse this pattern for a public-facing page or expose
 * createAdminClient() to anything a normal visitor's request can reach with
 * attacker-controlled input — this file exists only because the one slug it
 * reads ("excellence-cafe") is hardcoded by the page itself, not derived
 * from user input.
 */
export async function getExcellenceCafePreviewData(): Promise<{ restaurant: Restaurant; products: Product[] } | null> {
  const supabase = createAdminClient();

  const { data: row, error } = await supabase.from("restaurants").select("*").eq("slug", "excellence-cafe").maybeSingle();
  if (error || !row) return null;

  const { data: productRows } = await supabase
    .from("products")
    .select("*")
    .eq("listing_type", "restaurant")
    .eq("listing_id", row.id)
    .eq("is_hidden", false)
    .order("is_featured", { ascending: false })
    .order("sort_order", { ascending: true });

  const products = (productRows ?? []).map(mapProduct);
  if (products.length === 0) return { restaurant: mapRestaurant(row), products };

  const ids = products.map((p) => p.id);
  const [{ data: variantRows }, { data: optionRows }] = await Promise.all([
    supabase.from("product_variants").select("*").in("product_id", ids).order("sort_order", { ascending: true }),
    supabase.from("product_options").select("*").in("product_id", ids).order("sort_order", { ascending: true }),
  ]);

  const variantsByProduct = new Map<string, Product["variants"]>();
  for (const r of variantRows ?? []) {
    const v = mapProductVariant(r);
    const list = variantsByProduct.get(v.productId) ?? [];
    list.push(v);
    variantsByProduct.set(v.productId, list);
  }
  const optionsByProduct = new Map<string, Product["options"]>();
  for (const r of optionRows ?? []) {
    const o = mapProductOption(r);
    const list = optionsByProduct.get(o.productId) ?? [];
    list.push(o);
    optionsByProduct.set(o.productId, list);
  }

  return {
    restaurant: mapRestaurant(row),
    products: products.map((p) => {
      const variants = variantsByProduct.get(p.id);
      const options = optionsByProduct.get(p.id);
      return { ...p, ...(variants && variants.length > 0 ? { variants } : null), ...(options && options.length > 0 ? { options } : null) };
    }),
  };
}
