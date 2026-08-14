"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { assertCanManageListing } from "@/lib/actions/business";

export interface TableReservationInput {
  listingType: "restaurant" | "cafe";
  listingId: string;
  customerName: string;
  customerPhone: string;
  reservationDate: string;
  reservationTime: string;
  guestsCount: number;
  notes?: string;
  locale?: string;
}

export type TableReservationResult =
  | { ok: true; reservationReference: string }
  | { ok: false; error: string };

function isPastDate(iso: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${iso}T00:00:00`);
  return date < today;
}

/**
 * Public, anonymous-writable reservation REQUEST — never real-time table
 * availability, just a request the business owner reviews (see
 * table_reservations' default 'pending' status). Generic over
 * listingType/listingId: works for Sultan, Beydan, or any future
 * restaurant/cafe with reservable=true, no per-business branching.
 *
 * Goes through the submit_table_reservation() RPC rather than a plain
 * `.insert().select()` for the same reason submitBookingRequest() does (see
 * supabase/migrations/20260813000002_table_reservation_reference_rpc.sql):
 * table_reservations' SELECT policy only grants read access to the
 * business owner or `user_id = auth.uid()`, which a signed-out requester
 * never satisfies — a plain insert+select would fail on the RETURNING
 * clause even though the insert itself is allowed. The RPC re-validates the
 * target listing is published and reservable itself, so this function's own
 * checks are a fast, friendly first pass, not the authoritative guard.
 */
export async function submitTableReservation(input: TableReservationInput): Promise<TableReservationResult> {
  const t = await getTranslations({ locale: input.locale ?? "en", namespace: "tableReservation" });

  if (!input.customerName.trim() || !input.customerPhone.trim()) {
    return { ok: false, error: t("errorRequired") };
  }
  if (!input.reservationDate || !input.reservationTime) {
    return { ok: false, error: t("errorRequired") };
  }
  if (isPastDate(input.reservationDate)) {
    return { ok: false, error: t("errorPastDate") };
  }
  if (input.guestsCount < 1 || input.guestsCount > 50) {
    return { ok: false, error: t("errorGuestsRequired") };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("submit_table_reservation", {
      p_listing_type: input.listingType,
      p_listing_id: input.listingId,
      p_customer_name: input.customerName.trim(),
      p_customer_phone: input.customerPhone.trim(),
      p_reservation_date: input.reservationDate,
      p_reservation_time: input.reservationTime,
      p_guests_count: input.guestsCount,
      p_notes: input.notes?.trim() || null,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, reservationReference: data ?? "" };
  } catch {
    return { ok: false, error: t("errorGeneric") };
  }
}

/**
 * Owner-side status change (pending -> confirmed/cancelled/completed) —
 * assertCanManageListing is the same generic ownership guard every other
 * business-dashboard mutation uses (lib/actions/business.ts), so this
 * works identically for a restaurant owner or a cafe owner.
 */
export async function updateReservationStatus(
  reservationId: string,
  listingType: "restaurant" | "cafe",
  listingId: string,
  status: "pending" | "confirmed" | "cancelled" | "completed",
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageListing(listingType, listingId);

  const { error } = await supabase
    .from("table_reservations")
    .update({ status, updated_at: new Date().toISOString() } as never)
    .eq("id", reservationId)
    .eq("listing_id", listingId);

  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}
