import { createClient } from "@/lib/supabase/server";
import { mapEventRequest, mapEventRequestStatusHistory } from "./mappers";
import type { EventRequest, EventRequestStatusHistoryEntry } from "@/types";

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
