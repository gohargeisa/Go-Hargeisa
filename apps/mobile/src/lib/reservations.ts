/**
 * Table reservations (restaurants + cafes) — direct supabase-js RPC, not a
 * new `/api/v1` write route. `submit_table_reservation` is "Public,
 * anonymous-writable" (see lib/actions/reservations.ts on the website) and
 * has no real-time availability to check server-side first — unlike
 * appointments, there is no slot list, just a request the business reviews.
 * The native app's own Supabase client already carries the signed-in user's
 * real session, so `auth.uid()` resolves correctly with no bearer-token
 * workaround needed (that workaround was specific to the website's Route
 * Handler context, which has no user session of its own).
 */
import { useMutation } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";

export type TableReservationListingType = "restaurant" | "cafe";

export interface SubmitTableReservationInput {
  listingType: TableReservationListingType;
  listingId: string;
  customerName: string;
  customerPhone: string;
  /** "YYYY-MM-DD". */
  reservationDate: string;
  /** "HH:mm". */
  reservationTime: string;
  guestsCount: number;
  notes?: string;
}

export class ReservationError extends Error {}

function isPastDate(iso: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${iso}T00:00:00`);
  return date < today;
}

export function useSubmitTableReservation() {
  return useMutation({
    mutationFn: async (input: SubmitTableReservationInput): Promise<string> => {
      if (!input.customerName.trim() || !input.customerPhone.trim()) {
        throw new ReservationError("Full name and phone number are required.");
      }
      if (!input.reservationDate || !input.reservationTime) {
        throw new ReservationError("Please select a date and time.");
      }
      if (isPastDate(input.reservationDate)) {
        throw new ReservationError("Reservation date can't be in the past.");
      }
      if (input.guestsCount < 1 || input.guestsCount > 50) {
        throw new ReservationError("At least 1 guest is required.");
      }

      // `submit_table_reservation` isn't in the generated Database Functions
      // map yet (a known type-generation gap — the website's own cookie-based
      // client calls it the same way, untyped, since lib/supabase/server.ts's
      // createClient() also isn't generic over Database for this reason).
      const { data, error } = await (supabase.rpc as any)("submit_table_reservation", {
        p_listing_type: input.listingType,
        p_listing_id: input.listingId,
        p_customer_name: input.customerName.trim(),
        p_customer_phone: input.customerPhone.trim(),
        p_reservation_date: input.reservationDate,
        p_reservation_time: input.reservationTime,
        p_guests_count: input.guestsCount,
        p_notes: input.notes?.trim() || null,
      });

      if (error) throw new ReservationError(error.message);
      return (data as string | null) ?? "";
    },
  });
}
