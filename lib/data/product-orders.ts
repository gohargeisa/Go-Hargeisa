import { createClient } from "@/lib/supabase/server";
import { mapProductOrder } from "./mappers";
import type { ProductOrder, OrderableListingType } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Resolves each order's business name. `listing_id` is polymorphic (no real
 * FK across city_services/services/cafes/restaurants), so ids are grouped by
 * type, names are batch-fetched per type, then joined in memory — the same
 * approach getReviewsForUser uses. Shared by the admin and customer order
 * lists so the "which business is this order from" lookup lives in one place.
 */
async function attachBusinessNames<T extends ProductOrder>(
  supabase: SupabaseClient,
  orders: T[]
): Promise<(T & { businessName: string })[]> {
  const idsByType: Record<OrderableListingType, string[]> = { city_service: [], service: [], cafe: [], restaurant: [] };
  for (const o of orders) idsByType[o.listingType].push(o.listingId);

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

  return orders.map((o) => ({ ...o, businessName: nameLookup.get(o.listingId) ?? "Removed listing" }));
}

export type CustomerProductOrder = ProductOrder & { businessName: string };

/**
 * Every product order a signed-in customer has placed, newest first. Backed
 * by the "Customers view their own product orders" RLS policy
 * (user_id = auth.uid()); the explicit .eq is so an unrelated row reads as
 * "not mine" rather than "forbidden". This is the customer-facing counterpart
 * to getProductOrdersForListing (business owner) / getAllProductOrdersForAdmin
 * (platform admin) — without it a shopper who checks out through the
 * universal cart has no way to see or track the order they just placed.
 */
export async function getMyProductOrders(): Promise<CustomerProductOrder[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("product_orders")
    .select("*, order_items(*)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error || !data?.length) return [];
  return attachBusinessNames(supabase, data.map((row: any) => mapProductOrder(row)));
}

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

  return attachBusinessNames(supabase, orders.map((row: any) => mapProductOrder(row)));
}
