import { createClient } from "@/lib/supabase/server";
import { mapPurchaseRequest, mapPurchaseRequestForCustomer, mapPurchaseRequestStatusHistory } from "./mappers";
import type { PurchaseRequestCustomerRow } from "./mappers";
import { groupRequestsByListing, type AdminRequestGroup } from "./request-groups";
import type { PurchaseRequest, PurchaseRequestStatusHistoryEntry } from "@/types";

/** Every purchase_requests column except partner_notes_internal (the
 * business's private note — never meant to reach the customer). Used by
 * every customer-facing query below instead of select("*") so there is
 * nothing to filter out after the fact; see mapPurchaseRequestForCustomer.
 * A plain (non-literal) select string defeats supabase-js's column-based
 * type inference, so the result is cast to the explicit customer-safe row
 * type below — same "as unknown as" pattern already used throughout
 * lib/data/mappers.ts for shapes the generated Database types can't infer. */
const CUSTOMER_SAFE_COLUMNS =
  "id, listing_type, listing_id, user_id, customer_name, customer_phone, product_name, product_url, " +
  "platform, quantity, size, color, variant, delivery_location, notes, image_url, status, " +
  "quoted_product_cost, quoted_shipping_cost, quoted_customs_fee, quoted_service_fee, quoted_total, " +
  "quote_expires_at, partner_notes_customer, created_at, updated_at";

/** Every purchase request for one listing, newest first. Scoped by
 * listing_type + listing_id — RLS ("Business owners manage their listing
 * purchase requests") is the real guarantee this only ever returns the
 * caller's own listing's requests. */
export async function getPurchaseRequestsForListing(listingId: string): Promise<PurchaseRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_requests")
    .select("*")
    .eq("listing_type", "city_service")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map(mapPurchaseRequest);
}

/**
 * Every purchase request platform-wide, grouped by listing — admin-only,
 * backed by the "Admins manage all purchase requests" RLS policy
 * (profiles.role = 'owner'). The platform-side counterpart to
 * getPurchaseRequestsForListing (business owner) and getMyPurchaseRequests
 * (customer): a request never becomes invisible just because its listing
 * has owner_id = NULL and therefore no business dashboard — the same
 * "unclaimed listing still shows up" guarantee getAllProductOrdersForAdmin
 * gives the universal cart. Emaankoo Group is exactly this case (published
 * with owner_id = NULL by its onboarding migration).
 */
export async function getAllPurchaseRequestsForAdmin(): Promise<AdminRequestGroup<PurchaseRequest>[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("purchase_requests").select("*").order("created_at", { ascending: false });
  if (error || !data?.length) return [];
  return groupRequestsByListing(supabase, data.map(mapPurchaseRequest));
}

/** A signed-in customer's own purchase request — RLS backs this up
 * (user_id = auth.uid()), the explicit .eq is just so this reads as "not
 * found" rather than "forbidden" for a request that isn't theirs. */
export async function getMyPurchaseRequestById(requestId: string): Promise<PurchaseRequest | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("purchase_requests").select(CUSTOMER_SAFE_COLUMNS).eq("id", requestId).eq("user_id", user.id).single();
  return data ? mapPurchaseRequestForCustomer(data as unknown as PurchaseRequestCustomerRow) : null;
}

/** Every one of a signed-in customer's own purchase requests, newest first. */
export async function getMyPurchaseRequests(): Promise<PurchaseRequest[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.from("purchase_requests").select(CUSTOMER_SAFE_COLUMNS).eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) return [];
  return ((data ?? []) as unknown as PurchaseRequestCustomerRow[]).map(mapPurchaseRequestForCustomer);
}

export async function getPurchaseRequestStatusHistory(requestId: string): Promise<PurchaseRequestStatusHistoryEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("purchase_request_status_history")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data ?? []).map(mapPurchaseRequestStatusHistory);
}
