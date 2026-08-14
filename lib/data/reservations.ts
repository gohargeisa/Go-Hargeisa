import { createClient } from "@/lib/supabase/server";
import { mapTableReservation } from "./mappers";
import type { TableReservation } from "@/types";

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
  listingType: "restaurant" | "cafe",
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
