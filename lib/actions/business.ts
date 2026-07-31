"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { BusinessListingType } from "@/types";

const LISTING_TABLE: Record<BusinessListingType, "hotels" | "restaurants" | "cafes" | "services"> = {
  hotel: "hotels",
  restaurant: "restaurants",
  cafe: "cafes",
  service: "services",
};

/**
 * Same ownership check shape as lib/actions/hotel-rooms.ts's
 * assertCanManageRoom, generalized across all three business listing types
 * since bookings/reviews/messages/subscriptions all authorize the same way:
 * via the parent listing's owner_id, not a column of their own. RLS on each
 * new table mirrors this server-side as the authoritative backstop.
 */
async function assertCanManageListing(listingType: BusinessListingType, listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role;

  if (role === "owner") return supabase;

  if (role === "business_owner") {
    const table = LISTING_TABLE[listingType];
    const { data: listing } = await supabase.from(table).select("owner_id").eq("id", listingId).single();
    if ((listing as { owner_id: string | null } | null)?.owner_id === user.id) return supabase;
  }

  throw new Error("Not authorized.");
}

/**
 * Fires a real, anonymous-writable metric event (profile view / website
 * click / call click / WhatsApp click) — see business_metric_events' public
 * INSERT policy. Best-effort: swallows failures so a tracking hiccup never
 * breaks the visitor's page or their outbound click.
 */
export async function trackMetricEvent(
  listingType: BusinessListingType,
  listingId: string,
  eventType: "view" | "website_click" | "call_click" | "whatsapp_click"
): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("business_metric_events").insert({
      listing_type: listingType,
      listing_id: listingId,
      event_type: eventType,
    } as never);
  } catch {
    // best-effort — never let tracking failures affect the visitor
  }
}

export interface BookingInput {
  roomId?: string;
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  guestsCount: number;
  checkIn: string;
  checkOut: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes?: string;
}

function bookingPayload(hotelId: string, input: BookingInput) {
  return {
    hotel_id: hotelId,
    room_id: input.roomId || null,
    guest_name: input.guestName,
    guest_phone: input.guestPhone || null,
    guest_email: input.guestEmail || null,
    guests_count: input.guestsCount,
    check_in: input.checkIn,
    check_out: input.checkOut,
    status: input.status,
    notes: input.notes || null,
  };
}

export async function createBooking(
  hotelId: string,
  input: BookingInput,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageListing("hotel", hotelId);

  const { error } = await supabase.from("bookings").insert(bookingPayload(hotelId, input) as never);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function updateBookingStatus(
  bookingId: string,
  hotelId: string,
  status: BookingInput["status"],
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageListing("hotel", hotelId);

  const { data: existing } = await supabase.from("bookings").select("status").eq("id", bookingId).single();
  const previousStatus = (existing as { status: BookingInput["status"] } | null)?.status;

  const { error } = await supabase
    .from("bookings")
    .update({ status, updated_at: new Date().toISOString() } as never)
    .eq("id", bookingId);
  if (error) return { ok: false, error: error.message };

  // Audit trail — best-effort, never blocks the actual status change.
  if (previousStatus && previousStatus !== status) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("booking_status_history").insert({
      booking_id: bookingId,
      old_status: previousStatus,
      new_status: status,
      changed_by: user?.id ?? null,
    } as never);
  }

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function replyToReview(
  reviewId: string,
  listingType: BusinessListingType,
  listingId: string,
  replyText: string,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageListing(listingType, listingId);

  const { error } = await supabase
    .from("reviews")
    .update({ owner_reply: replyText, owner_reply_at: new Date().toISOString() } as never)
    .eq("id", reviewId)
    .eq("listing_type", listingType)
    .eq("listing_id", listingId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function reportReview(
  reviewId: string,
  listingType: BusinessListingType,
  listingId: string,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageListing(listingType, listingId);

  const { error } = await supabase
    .from("reviews")
    .update({ is_reported: true } as never)
    .eq("id", reviewId)
    .eq("listing_type", listingType)
    .eq("listing_id", listingId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function markMessageRead(
  messageId: string,
  listingType: BusinessListingType,
  listingId: string,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageListing(listingType, listingId);

  const { error } = await supabase
    .from("business_messages")
    .update({ is_read: true } as never)
    .eq("id", messageId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export interface OfferInput {
  title: string;
  description?: string;
  discountLabel?: string;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
}

function offerPayload(input: OfferInput) {
  return {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    discount_label: input.discountLabel?.trim() || null,
    starts_at: input.startsAt || null,
    ends_at: input.endsAt || null,
    is_active: input.isActive,
  };
}

export async function createOffer(
  listingType: "hotel" | "restaurant" | "cafe",
  listingId: string,
  input: OfferInput,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  if (!input.title.trim()) return { ok: false, error: "A title is required." };
  const supabase = await assertCanManageListing(listingType, listingId);

  const { error } = await supabase.from("business_offers").insert({
    listing_type: listingType,
    listing_id: listingId,
    ...offerPayload(input),
  } as never);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function updateOffer(
  offerId: string,
  listingType: "hotel" | "restaurant" | "cafe",
  listingId: string,
  input: OfferInput,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  if (!input.title.trim()) return { ok: false, error: "A title is required." };
  const supabase = await assertCanManageListing(listingType, listingId);

  const { error } = await supabase
    .from("business_offers")
    .update({ ...offerPayload(input), updated_at: new Date().toISOString() } as never)
    .eq("id", offerId)
    .eq("listing_type", listingType)
    .eq("listing_id", listingId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function toggleOfferActive(
  offerId: string,
  listingType: "hotel" | "restaurant" | "cafe",
  listingId: string,
  isActive: boolean,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageListing(listingType, listingId);

  const { error } = await supabase
    .from("business_offers")
    .update({ is_active: isActive, updated_at: new Date().toISOString() } as never)
    .eq("id", offerId)
    .eq("listing_type", listingType)
    .eq("listing_id", listingId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function deleteOffer(
  offerId: string,
  listingType: "hotel" | "restaurant" | "cafe",
  listingId: string,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageListing(listingType, listingId);

  const { error } = await supabase
    .from("business_offers")
    .delete()
    .eq("id", offerId)
    .eq("listing_type", listingType)
    .eq("listing_id", listingId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}
