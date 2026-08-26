"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertCanManageListing } from "@/lib/actions/business";
import type { EventRequestStatus } from "@/types";

export interface CreateEventRequestInput {
  listingId: string;
  customerName: string;
  customerPhone: string;
  eventType: "family" | "school" | "festival" | "entertainment" | "social" | "other";
  eventDate?: string;
  eventLocation?: string;
  guestCount?: number;
  budgetRange?: string;
  servicesRequired?: string;
  notes?: string;
  imageUrl?: string;
}

export type CreateEventRequestResult = { ok: true; requestId: string } | { ok: false; error: string };

/** Customer-facing — creates an event-planning request. Same "always
 * signed-in customer" reasoning as createPurchaseRequest — no RPC needed. */
export async function createEventRequest(input: CreateEventRequestInput): Promise<CreateEventRequestResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  if (!input.customerName.trim() || !input.customerPhone.trim()) {
    return { ok: false, error: "Name and phone are required." };
  }
  if (input.guestCount != null && (input.guestCount < 1 || input.guestCount > 100000)) {
    return { ok: false, error: "Guest count doesn't look right." };
  }

  // Same eligibility gate as createPurchaseRequest — the target listing must
  // be a published city_service whose category has opted into event
  // requests (categories.supports_event_requests).
  const { data: listing } = await supabase
    .from("city_services")
    .select("status, categories(supports_event_requests)")
    .eq("id", input.listingId)
    .single();
  const eligible = listing as { status: string; categories: { supports_event_requests: boolean } | null } | null;
  if (!eligible || eligible.status !== "published" || !eligible.categories?.supports_event_requests) {
    return { ok: false, error: "This listing is not accepting event requests." };
  }

  const { data, error } = await supabase
    .from("event_requests")
    .insert({
      listing_type: "city_service",
      listing_id: input.listingId,
      user_id: user.id,
      customer_name: input.customerName.trim(),
      customer_phone: input.customerPhone.trim(),
      event_type: input.eventType,
      event_date: input.eventDate || null,
      event_location: input.eventLocation?.trim() || null,
      guest_count: input.guestCount ?? null,
      budget_range: input.budgetRange?.trim() || null,
      services_required: input.servicesRequired?.trim() || null,
      notes: input.notes?.trim() || null,
      image_url: input.imageUrl || null,
    } as never)
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Could not submit your request." };
  return { ok: true, requestId: (data as { id: string }).id };
}

/** Customer explicitly approves or declines a sent proposal — same
 * RLS-plus-trigger enforcement shape as respondToQuote. */
export async function respondToProposal(requestId: string, response: "approved" | "declined"): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("event_requests")
    .update({ status: response } as never)
    .eq("id", requestId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/events/" + requestId);
  return { ok: true };
}

export interface ProposalInput {
  proposalDetails: string;
  proposalCost?: number;
}

/** Business owner sends a proposal — flips status to 'proposal_sent'. */
export async function sendProposal(
  requestId: string,
  listingId: string,
  proposal: ProposalInput,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageListing("city_service", listingId, "orders_manage");

  const { data: existing } = await supabase.from("event_requests").select("status").eq("id", requestId).single();
  const previousStatus = (existing as { status: EventRequestStatus } | null)?.status;

  const { error } = await supabase
    .from("event_requests")
    .update({
      status: "proposal_sent",
      proposal_details: proposal.proposalDetails.trim(),
      proposal_cost: proposal.proposalCost ?? null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", requestId)
    .eq("listing_id", listingId);

  if (error) return { ok: false, error: error.message };

  if (previousStatus && previousStatus !== "proposal_sent") {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("event_request_status_history").insert({
      request_id: requestId,
      old_status: previousStatus,
      new_status: "proposal_sent",
      changed_by: user?.id ?? null,
    } as never);
  }

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

const MANAGEABLE_STATUSES: EventRequestStatus[] = ["reviewing", "planning", "completed", "cancelled"];

export async function updateEventRequestStatus(
  requestId: string,
  listingId: string,
  status: EventRequestStatus,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  if (!MANAGEABLE_STATUSES.includes(status)) return { ok: false, error: "Invalid status." };

  const supabase = await assertCanManageListing("city_service", listingId, "orders_manage");

  const { data: existing } = await supabase.from("event_requests").select("status").eq("id", requestId).single();
  const previousStatus = (existing as { status: EventRequestStatus } | null)?.status;

  const { error } = await supabase
    .from("event_requests")
    .update({ status, updated_at: new Date().toISOString() } as never)
    .eq("id", requestId)
    .eq("listing_id", listingId);

  if (error) return { ok: false, error: error.message };

  if (previousStatus && previousStatus !== status) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("event_request_status_history").insert({
      request_id: requestId,
      old_status: previousStatus,
      new_status: status,
      changed_by: user?.id ?? null,
    } as never);
  }

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}
