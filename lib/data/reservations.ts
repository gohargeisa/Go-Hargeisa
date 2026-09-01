import { createClient } from "@/lib/supabase/server";
import { mapTableReservation } from "./mappers";
import type { TableReservation } from "@/types";

export type CustomerTableReservation = TableReservation & { businessName: string };

/**
 * Every restaurant/cafe table reservation a signed-in customer has
 * requested, newest first. Backed by the "Customers view their own
 * reservations" RLS policy (user_id = auth.uid()) that has existed since
 * table_reservations was created — this is the customer-facing read the
 * policy was written for but that the app never surfaced anywhere, so a
 * shopper who requested a table had no way to see or track it. Business
 * name is resolved per row (listing_id is polymorphic, no FK).
 */
export async function getMyTableReservations(): Promise<CustomerTableReservation[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("table_reservations")
    .select("*")
    .eq("user_id", user.id)
    .order("reservation_date", { ascending: false })
    .order("reservation_time", { ascending: false });

  if (error || !data?.length) return [];
  const reservations = data.map(mapTableReservation);

  const idsByType: Record<TableReservation["listingType"], string[]> = { restaurant: [], cafe: [], service: [] };
  for (const r of reservations) idsByType[r.listingType].push(r.listingId);

  const [restaurantRows, cafeRows, serviceRows] = await Promise.all([
    idsByType.restaurant.length ? supabase.from("restaurants").select("id, name").in("id", idsByType.restaurant) : { data: [] },
    idsByType.cafe.length ? supabase.from("cafes").select("id, name").in("id", idsByType.cafe) : { data: [] },
    idsByType.service.length ? supabase.from("services").select("id, name").in("id", idsByType.service) : { data: [] },
  ]);

  const nameLookup = new Map<string, string>();
  for (const rows of [restaurantRows.data ?? [], cafeRows.data ?? [], serviceRows.data ?? []]) {
    for (const row of rows as { id: string; name: string }[]) nameLookup.set(row.id, row.name);
  }

  return reservations.map((r) => ({ ...r, businessName: nameLookup.get(r.listingId) ?? "Removed listing" }));
}

/**
 * Every restaurant/cafe table reservation for one listing, newest request
 * first. Scoped entirely by listing_type + listing_id — the same call works
 * for Sultan, Beydan, or any future restaurant/cafe with no per-business
 * code. RLS (table_reservations' "Business owners manage their listing
 * reservations" policy) is what actually keeps an owner from reading a
 * different listing's reservations even if this were called with the wrong
 * id; this function doesn't re-implement that check.
 */
export async function getReservationsForListing(
  listingType: "restaurant" | "cafe" | "service",
  listingId: string
): Promise<TableReservation[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("table_reservations")
    .select("*")
    .eq("listing_type", listingType)
    .eq("listing_id", listingId)
    .order("reservation_date", { ascending: false })
    .order("reservation_time", { ascending: false });

  if (error) return [];
  return (data ?? []).map(mapTableReservation);
}
