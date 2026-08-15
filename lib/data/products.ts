import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapProduct } from "./mappers";
import type { Product } from "@/types";

/**
 * Every non-hidden product for a listing (city_services — Perfume &
 * Cosmetics shops — or services — Flowers & Gifts), sorted featured-first
 * then by sort_order — same shape as every other public listing fetch in
 * this file's siblings (getCityServiceBySlug etc.). Callers are expected to
 * already know the listing's category supports products
 * (categories.supports_products) before calling this.
 */
async function _getProductsForListing(listingId: string, listingType: "city_service" | "service" = "city_service"): Promise<Product[]> {
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
