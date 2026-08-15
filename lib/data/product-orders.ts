import { createClient } from "@/lib/supabase/server";
import { mapProductOrder } from "./mappers";
import type { ProductOrder } from "@/types";

/**
 * Every product order/request for one listing, newest first — same shape as
 * getReservationsForListing(), scoped by listing_type + listing_id.
 */
export async function getProductOrdersForListing(
  listingType: "city_service" | "service",
  listingId: string
): Promise<ProductOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_orders")
    .select("*")
    .eq("listing_type", listingType)
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map(mapProductOrder);
}
