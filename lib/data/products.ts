import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapProduct } from "./mappers";
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
  return (data ?? []).map(mapProduct);
}

export const getProductsForListing = cache(_getProductsForListing);
