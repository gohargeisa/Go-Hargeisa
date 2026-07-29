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
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      hotel_id: input.hotelId,
      room_id: input.roomId || null,
      guest_name: input.guestName.trim(),
      guest_phone: input.guestPhone.trim(),
      guest_email: input.guestEmail?.trim() || null,
      guests_count: input.adults + input.children,
      adults: input.adults,
      children: input.children,
      rooms_count: input.roomsCount,
      check_in: input.checkIn,
      check_out: input.checkOut,
      status: "pending",
      notes: input.notes?.trim() || null,
      user_id: user?.id ?? null,
    } as never)
    .select("booking_reference")
    .single();

  if (error) return { ok: false, error: error.message };

  const bookingReference = (data as { booking_reference?: string } | null)?.booking_reference;
  return { ok: true, bookingReference: bookingReference ?? "" };
}
