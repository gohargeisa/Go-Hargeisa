/**
 * Hotel booking — direct supabase-js RPC, same architecture as
 * lib/reservations.ts. `submit_booking_request` is "Public,
 * anonymous-writable" (see lib/actions/bookings.ts on the website); room
 * availability is a static per-room flag already returned in the hotel
 * detail payload (HotelRoomDTO.isAvailable) — there is no live date-range
 * availability RPC exposed to guests (room_capacity_available is
 * owner-side only, used from the business dashboard's manual booking flow,
 * never from this guest-facing path).
 */
import { useMutation } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export interface SubmitBookingInput {
  hotelId: string;
  roomId?: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  guestCountry?: string;
  adults: number;
  children: number;
  roomsCount: number;
  /** "YYYY-MM-DD". */
  checkIn: string;
  /** "YYYY-MM-DD". */
  checkOut: string;
  notes?: string;
}

export class BookingError extends Error {}

function isPastDate(iso: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${iso}T00:00:00`);
  return date < today;
}

export function useSubmitBookingRequest() {
  return useMutation({
    mutationFn: async (input: SubmitBookingInput): Promise<string> => {
      if (!input.guestName.trim() || !input.guestPhone.trim()) {
        throw new BookingError("Full name and phone number are required.");
      }
      if (!input.checkIn || !input.checkOut) {
        throw new BookingError("Please select check-in and check-out dates.");
      }
      if (isPastDate(input.checkIn)) {
        throw new BookingError("Check-in date can't be in the past.");
      }
      if (input.checkOut <= input.checkIn) {
        throw new BookingError("Check-out must be after check-in.");
      }
      if (input.adults < 1) {
        throw new BookingError("At least 1 adult is required.");
      }
      if (input.roomsCount < 1) {
        throw new BookingError("At least 1 room is required.");
      }

      // `submit_booking_request` isn't in the generated Database Functions
      // map yet — same known type-generation gap as submit_table_reservation
      // (see lib/reservations.ts's identical comment).
      const { data, error } = await (supabase.rpc as any)("submit_booking_request", {
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

      if (error) throw new BookingError(error.message);
      return (data as string | null) ?? "";
    },
  });
}
