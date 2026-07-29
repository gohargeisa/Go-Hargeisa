"use server";

import { createClient } from "@/lib/supabase/server";

export interface BookingRequestInput {
  hotelId: string;
  roomId?: string;
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  guestsCount: number;
  checkIn: string;
  checkOut: string;
  notes?: string;
}

/**
 * Public, anonymous-writable booking request — the "Go Hargeisa Booking"
 * mode's guest-facing half. See the "Anyone can submit a booking request"
 * INSERT policy (supabase/migrations/20260729000003_add_hotel_booking_mode.sql),
 * which only allows status='pending' rows — guests can create a request but
 * can't read, confirm, or cancel bookings. The hotel owner reviews and
 * manages every request from their dashboard's Bookings tab (same table,
 * same UI as owner-entered bookings — see lib/actions/business.ts).
 */
export async function submitBookingRequest(
  input: BookingRequestInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.guestName.trim() || !input.checkIn || !input.checkOut) {
    return { ok: false, error: "Name, check-in and check-out dates are required." };
  }
  if (input.checkOut <= input.checkIn) {
    return { ok: false, error: "Check-out must be after check-in." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("bookings").insert({
    hotel_id: input.hotelId,
    room_id: input.roomId || null,
    guest_name: input.guestName.trim(),
    guest_phone: input.guestPhone?.trim() || null,
    guest_email: input.guestEmail?.trim() || null,
    guests_count: input.guestsCount,
    check_in: input.checkIn,
    check_out: input.checkOut,
    status: "pending",
    notes: input.notes?.trim() || null,
  } as never);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
