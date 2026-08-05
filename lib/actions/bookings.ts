"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { bookingReceivedEmail, bookingSubmittedEmail } from "@/lib/email/templates";
import type { Locale } from "@/lib/i18n/config";

export interface BookingRequestInput {
  hotelId: string;
  roomId?: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  guestCountry?: string;
  adults: number;
  children: number;
  roomsCount: number;
  checkIn: string;
  checkOut: string;
  notes?: string;
  /** UI locale the guest booked in — used as the best-effort language for
   * the owner's "new booking" email notification (their own locale
   * preference isn't tracked anywhere). */
  locale?: string;
}

export type BookingRequestResult =
  | { ok: true; bookingReference: string }
  | { ok: false; error: string };

function isPastDate(iso: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${iso}T00:00:00`);
  return date < today;
}

/**
 * Public, anonymous-writable booking request — the "Go Hargeisa Booking"
 * mode's guest-facing half, also used by the WhatsApp booking mode (the
 * booking is still created here first, so its auto-generated reference can
 * appear in the WhatsApp message — see
 * lib/utils/whatsapp-booking-message.ts — and so the hotel owner sees
 * WhatsApp-originated requests in their dashboard too, same as any other).
 * See the "Anyone can submit a booking request" INSERT policy
 * (supabase/migrations/20260729000003_add_hotel_booking_mode.sql), which
 * only allows status='pending' rows — guests can create a request but can't
 * read, confirm, or cancel bookings.
 */
export async function submitBookingRequest(input: BookingRequestInput): Promise<BookingRequestResult> {
  const t = await getTranslations({ locale: input.locale ?? "en", namespace: "bookingRequest" });

  if (!input.guestName.trim() || !input.guestPhone.trim()) {
    return { ok: false, error: t("required") };
  }
  if (!input.checkIn || !input.checkOut) {
    return { ok: false, error: t("required") };
  }
  if (isPastDate(input.checkIn)) {
    return { ok: false, error: t("errorCheckInPast") };
  }
  if (input.checkOut <= input.checkIn) {
    return { ok: false, error: t("invalidRange") };
  }
  if (input.adults < 1) {
    return { ok: false, error: t("errorAdultsRequired") };
  }
  if (input.roomsCount < 1) {
    return { ok: false, error: t("errorRoomsRequired") };
  }

  const supabase = await createClient();

  // Plain `.insert(...).select(...)` doesn't work here for a signed-out
  // guest: Postgres governs INSERT ... RETURNING by the table's SELECT
  // policies, and `bookings` only grants SELECT to the hotel's owner or the
  // submitting user (auth.uid() = user_id) — an anonymous guest never
  // matches that, so the RETURNING clause itself gets rejected by RLS even
  // though the insert is allowed. This RPC (defined in
  // supabase/migrations/20260729000007_add_submit_booking_request_rpc.sql)
  // performs the insert with elevated privileges and hands back only the
  // generated reference, sidestepping that conflict.
  const { data, error } = await supabase.rpc("submit_booking_request", {
    p_hotel_id: input.hotelId,
    p_room_id: input.roomId || null,
    p_guest_name: input.guestName.trim(),
    p_guest_phone: input.guestPhone.trim(),
    p_guest_email: input.guestEmail?.trim() || null,
    p_adults: input.adults,
    p_children: input.children,
    p_rooms_count: input.roomsCount,
    p_check_in: input.checkIn,
    p_check_out: input.checkOut,
    p_notes: input.notes?.trim() || null,
    p_guest_country: input.guestCountry?.trim() || null,
  });

  if (error) return { ok: false, error: error.message };
  const bookingReference = data ?? "";

  // Owner email notification — best-effort, gated by their notify_activity
  // preference, same as every other transactional email in lib/email/.
  // A failure here must never surface as a failed booking.
  try {
    const { data: hotel } = await supabase.from("hotels").select("owner_id, name").eq("id", input.hotelId).single();
    const ownerId = (hotel as { owner_id: string | null; name: string } | null)?.owner_id;
    const hotelName = (hotel as { owner_id: string | null; name: string } | null)?.name ?? "";
    if (ownerId) {
      const { data: ownerProfile } = await supabase.from("profiles").select("notify_activity").eq("id", ownerId).single();
      if ((ownerProfile as { notify_activity: boolean } | null)?.notify_activity ?? true) {
        const { data: ownerUser } = await createAdminClient().auth.admin.getUserById(ownerId);
        if (ownerUser?.user?.email) {
          const { subject, html } = bookingReceivedEmail(
            (input.locale as Locale) || "en",
            hotelName,
            input.guestName.trim(),
            input.checkIn,
            input.checkOut,
            bookingReference
          );
          await sendEmail({ to: ownerUser.user.email, subject, html });
        }
      }
    }
  } catch {
    // best-effort — see comment above
  }

  // Guest confirmation email — best-effort, only sent when the guest gave
  // an email (unlike phone, it's optional on this form).
  if (input.guestEmail?.trim()) {
    try {
      const { data: hotel } = await supabase.from("hotels").select("name").eq("id", input.hotelId).single();
      const hotelName = (hotel as { name: string } | null)?.name ?? "";
      const { subject, html } = bookingSubmittedEmail(
        (input.locale as Locale) || "en",
        hotelName,
        input.checkIn,
        input.checkOut,
        bookingReference
      );
      await sendEmail({ to: input.guestEmail.trim(), subject, html });
    } catch {
      // best-effort — a failed confirmation email must never fail the booking
    }
  }

  return { ok: true, bookingReference };
}

const CANCELLATION_WINDOW_HOURS = 24;

/**
 * A signed-in guest cancels their own booking — only while it's still
 * pending/confirmed and more than 24h before check-in. The app-level check
 * here is a fast, friendly error message; the "Users cancel their own
 * booking" RLS policy (20260802000007_user_booking_cancel.sql) mirrors the
 * same window and is what's actually authoritative.
 */
export async function cancelMyBooking(bookingId: string, locale: string): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations({ locale, namespace: "bookingRequest" });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: t("errorSignInRequired") };

  const { data: existing } = await supabase
    .from("bookings")
    .select("status, check_in, user_id")
    .eq("id", bookingId)
    .single();
  const booking = existing as { status: string; check_in: string; user_id: string | null } | null;

  if (!booking || booking.user_id !== user.id) {
    return { ok: false, error: t("errorBookingNotFound") };
  }
  if (booking.status !== "pending" && booking.status !== "confirmed") {
    return { ok: false, error: t("errorNoLongerCancellable") };
  }
  const hoursUntilCheckIn = (new Date(`${booking.check_in}T00:00:00`).getTime() - Date.now()) / 3_600_000;
  if (hoursUntilCheckIn <= CANCELLATION_WINDOW_HOURS) {
    return { ok: false, error: t("errorCancellationWindow", { hours: CANCELLATION_WINDOW_HOURS }) };
  }

  const { error } = await supabase.from("bookings").update({ status: "cancelled" } as never).eq("id", bookingId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/${locale}/dashboard`);
  return { ok: true };
}
