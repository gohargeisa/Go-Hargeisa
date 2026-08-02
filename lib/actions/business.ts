"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { bookingStatusEmail, reviewReplyEmail } from "@/lib/email/templates";
import type { Locale } from "@/lib/i18n/config";
import type { BusinessListingType } from "@/types";

/** Every server action here receives revalidatePaths[0] as `/${locale}/...`
 * (verified across every caller) — reused as a best-effort signal for which
 * language to send a best-effort transactional email in. Defaults to 'en'. */
function localeFromRevalidatePaths(paths: string[]): Locale {
  return (paths[0]?.match(/^\/([a-z]{2})\//)?.[1] as Locale) ?? "en";
}

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
export async function assertCanManageListing(listingType: BusinessListingType, listingId: string) {
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

  const { data: existing } = await supabase
    .from("bookings")
    .select("status, guest_email, user_id")
    .eq("id", bookingId)
    .single();
  const booking = existing as { status: BookingInput["status"]; guest_email: string | null; user_id: string | null } | null;
  const previousStatus = booking?.status;

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

    // Email notification — best-effort, gated by the recipient's own
    // notify_activity preference when they're a signed-in user (a guest
    // booking has no preference to check, same as before accounts existed).
    if (booking?.guest_email) {
      let shouldEmail = true;
      if (booking.user_id) {
        const { data: recipientProfile } = await supabase
          .from("profiles")
          .select("notify_activity")
          .eq("id", booking.user_id)
          .single();
        shouldEmail = (recipientProfile as { notify_activity: boolean } | null)?.notify_activity ?? true;
      }
      if (shouldEmail) {
        const { data: hotel } = await supabase.from("hotels").select("name").eq("id", hotelId).single();
        const hotelName = (hotel as { name: string } | null)?.name ?? "";
        const { subject, html } = bookingStatusEmail(localeFromRevalidatePaths(revalidatePaths), hotelName, status);
        await sendEmail({ to: booking.guest_email, subject, html });
      }
    }
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

  const { data: existingReview } = await supabase
    .from("reviews")
    .select("user_id, owner_reply")
    .eq("id", reviewId)
    .single();
  const isFirstReply = !(existingReview as { owner_reply: string | null } | null)?.owner_reply;
  const reviewerId = (existingReview as { user_id: string } | null)?.user_id;

  const { error } = await supabase
    .from("reviews")
    .update({ owner_reply: replyText, owner_reply_at: new Date().toISOString() } as never)
    .eq("id", reviewId)
    .eq("listing_type", listingType)
    .eq("listing_id", listingId);
  if (error) return { ok: false, error: error.message };

  // Email notification — best-effort, only on the first reply (not every
  // subsequent edit), gated by the reviewer's notify_activity preference.
  if (isFirstReply && reviewerId) {
    const { data: reviewerProfile } = await supabase
      .from("profiles")
      .select("notify_activity")
      .eq("id", reviewerId)
      .single();
    if ((reviewerProfile as { notify_activity: boolean } | null)?.notify_activity ?? true) {
      const { data: listing } = await supabase.from(LISTING_TABLE[listingType]).select("name").eq("id", listingId).single();
      const listingName = (listing as { name: string } | null)?.name ?? "";
      const { data: reviewerUser } = await createAdminClient().auth.admin.getUserById(reviewerId);
      if (reviewerUser?.user?.email) {
        const { subject, html } = reviewReplyEmail(localeFromRevalidatePaths(revalidatePaths), listingName);
        await sendEmail({ to: reviewerUser.user.email, subject, html });
      }
    }
  }

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

