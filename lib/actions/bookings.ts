"use server";

import { createClient } from "@/lib/supabase/server";

export interface BookingRequestInput {
  hotelId: string;
  roomId?: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  adults: number;
  children: number;
  roomsCount: number;
  checkIn: string;
  checkOut: string;
  notes?: string;
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
  if (!input.guestName.trim() || !input.guestPhone.trim()) {
    return { ok: false, error: "Full name and phone number are required." };
  }
  if (!input.checkIn || !input.checkOut) {
    return { ok: false, error: "Check-in and check-out dates are required." };
  }
  if (isPastDate(input.checkIn)) {
    return { ok: false, error: "Check-in date can't be in the past." };
  }
  if (input.checkOut <= input.checkIn) {
    return { ok: false, error: "Check-out must be after check-in." };
  }
  if (input.adults < 1) {
    return { ok: false, error: "At least 1 adult is required." };
  }
  if (input.roomsCount < 1) {
    return { ok: false, error: "At least 1 room is required." };
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
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true, bookingReference: data ?? "" };
}
