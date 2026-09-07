import type { SlotStatusDTO } from "@gohargeisa/api";
import type { OpeningHoursGroup } from "@/types";
import { createPublicClient } from "@/lib/supabase/public";
import { createAdminClient } from "@/lib/supabase/admin";
import { getSlotStatuses } from "@/lib/utils/doctor-availability";
import { corsPreflight, handle, jsonError, jsonOk } from "../_lib/http";

export function OPTIONS() {
  return corsPreflight();
}

interface DoctorAvailabilityRow {
  working_hours: unknown;
  appointment_duration_minutes: number;
  is_active: boolean;
}

/**
 * GET /api/v1/appointment-slots?doctorId=<uuid>&date=<YYYY-MM-DD>
 *
 * Re-exposes lib/actions/appointments.ts's getSlotAvailability as JSON for
 * the native app, which has no server-side context of its own. Same privacy
 * handling: `appointments` has no public SELECT policy (a patient's name/
 * phone must stay private), so the admin client is used ONLY to read
 * `appointment_time` for this doctor/date — nothing else from the row is
 * ever read or returned. Doctor working hours come from the public client,
 * same as every other public read in this layer.
 */
export const GET = handle(async (req) => {
  const url = new URL(req.url);
  const doctorId = url.searchParams.get("doctorId");
  const date = url.searchParams.get("date");
  if (!doctorId || !date) {
    return jsonError(400, "Missing doctorId or date", "bad_request");
  }

  const supabase = createPublicClient();
  const { data: doctorRow } = await supabase
    .from("doctors")
    .select("working_hours, appointment_duration_minutes, is_active")
    .eq("id", doctorId)
    .single();
  const doctor = doctorRow as DoctorAvailabilityRow | null;

  if (!doctor || !doctor.is_active) {
    const body: SlotStatusDTO[] = [];
    return jsonOk(body, { cache: false });
  }

  const workingHours = Array.isArray(doctor.working_hours)
    ? (doctor.working_hours as unknown as OpeningHoursGroup[])
    : [];

  const admin = createAdminClient();
  const { data: booked } = await admin
    .from("appointments")
    .select("appointment_time")
    .eq("doctor_id", doctorId)
    .eq("appointment_date", date)
    .in("status", ["pending", "confirmed"]);
  const bookedTimes = ((booked ?? []) as { appointment_time: string }[]).map(
    (r) => r.appointment_time,
  );

  const body: SlotStatusDTO[] = getSlotStatuses(
    workingHours,
    date,
    doctor.appointment_duration_minutes,
    bookedTimes,
  );
  return jsonOk(body, { cache: false });
});
