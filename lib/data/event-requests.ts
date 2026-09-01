import { createClient } from "@/lib/supabase/server";
import { mapEventRequest, mapEventRequestStatusHistory } from "./mappers";
import { groupRequestsByListing, type AdminRequestGroup } from "./request-groups";
import type { EventRequest, EventRequestStatusHistoryEntry } from "@/types";

/**
 * Every event request platform-wide, grouped by listing — admin-only,
 * backed by the "Admins manage all event requests" RLS policy
 * (profiles.role = 'owner'). Same rationale as getAllPurchaseRequestsForAdmin:
 * /business/events needs the listing to have a linked owner_id, which a
 * partner like Emaankoo Group does not, so without this the requests are
 * invisible to everyone at Go Hargeisa.
 */
export async function getAllEventRequestsForAdmin(): Promise<AdminRequestGroup<EventRequest>[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("event_requests").select("*").order("created_at", { ascending: false });
  if (error || !data?.length) return [];
  return groupRequestsByListing(supabase, data.map(mapEventRequest));
}

export async function getEventRequestsForListing(listingId: string): Promise<EventRequest[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_requests")
    .select("*")
    .eq("listing_type", "city_service")
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  if (error) return [];
  return (data ?? []).map(mapEventRequest);
}

export async function getMyEventRequestById(requestId: string): Promise<EventRequest | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase.from("event_requests").select("*").eq("id", requestId).eq("user_id", user.id).single();
  return data ? mapEventRequest(data) : null;
}

export async function getMyEventRequests(): Promise<EventRequest[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase.from("event_requests").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map(mapEventRequest);
}

export async function getEventRequestStatusHistory(requestId: string): Promise<EventRequestStatusHistoryEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("event_request_status_history")
    .select("*")
    .eq("request_id", requestId)
    .order("created_at", { ascending: true });

  if (error) return [];
  return (data ?? []).map(mapEventRequestStatusHistory);
}
