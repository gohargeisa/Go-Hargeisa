import { createClient } from "@/lib/supabase/server";
import { mapProductOrder } from "./mappers";
import type { ProductOrder, OrderableListingType } from "@/types";

/**
 * Every product order for one listing, newest first — same shape as
 * getReservationsForListing(), scoped by listing_type + listing_id. Joins
 * order_items (one row per cart line) so callers get the full line-item
 * breakdown, not just the order header.
 */
export async function getProductOrdersForListing(
  listingType: OrderableListingType,
  listingId: string
): Promise<ProductOrder[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_orders")
    .select("*, order_items(*)")
    .eq("listing_type", listingType)
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map((row: any) => mapProductOrder(row));
}

export interface AdminProductOrder extends ProductOrder {
  businessName: string;
}

/**
 * Every product order platform-wide — admin-only (backed by the "Owners
 * manage all product orders" RLS policy). listing_id is polymorphic (no
 * real FK across city_services/services/cafes/restaurants), so business
 * names are resolved the same way getReviewsForUser does: group ids by
 * type, batch-fetch names per type, then join in memory. Even a listing
 * with owner_id = NULL (never claimed by a business) still shows up here —
 * this is the platform-wide backstop, not scoped by ownership at all.
 */
export async function getAllProductOrdersForAdmin(): Promise<AdminProductOrder[]> {
  const supabase = await createClient();
  const { data: orders, error } = await supabase
    .from("product_orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  if (error || !orders?.length) return [];

  const idsByType: Record<OrderableListingType, string[]> = {
    city_service: [],
    service: [],
    cafe: [],
    restaurant: [],
  };
  for (const o of orders) idsByType[o.listing_type as OrderableListingType].push(o.listing_id);

  const [cityServiceRows, serviceRows, cafeRows, restaurantRows] = await Promise.all([
    idsByType.city_service.length ? supabase.from("city_services").select("id, name").in("id", idsByType.city_service) : { data: [] },
    idsByType.service.length ? supabase.from("services").select("id, name").in("id", idsByType.service) : { data: [] },
    idsByType.cafe.length ? supabase.from("cafes").select("id, name").in("id", idsByType.cafe) : { data: [] },
    idsByType.restaurant.length ? supabase.from("restaurants").select("id, name").in("id", idsByType.restaurant) : { data: [] },
  ]);

  const nameLookup = new Map<string, string>();
  for (const rows of [cityServiceRows.data ?? [], serviceRows.data ?? [], cafeRows.data ?? [], restaurantRows.data ?? []]) {
    for (const row of rows as { id: string; name: string }[]) nameLookup.set(row.id, row.name);
  }

  return orders.map((row: any) => ({
    ...mapProductOrder(row),
    businessName: nameLookup.get(row.listing_id) ?? "Removed listing",
  }));
}
