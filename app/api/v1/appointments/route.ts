import type { SubmitAppointmentInput, SubmitAppointmentResult } from "@gohargeisa/api";
import { createBearerClient } from "@/lib/supabase/bearer";
import { corsPreflight, getBearerToken, handle, jsonError, jsonOk } from "../_lib/http";

const WRITE_METHODS = "POST, OPTIONS";

export function OPTIONS() {
  return corsPreflight(WRITE_METHODS);
}

function isPastDate(iso: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${iso}T00:00:00`);
  return date < today;
}

/**
 * POST /api/v1/appointments
 *
 * Native-app equivalent of lib/actions/appointments.ts's
 * submitAppointmentRequest — same validation, same `submit_appointment_request`
 * SECURITY DEFINER RPC (which re-checks server-side whether the slot is still
 * free), same special-cased "slot just taken" error. Anonymous-writable (the
 * RPC itself allows it, matching the website); an `Authorization: Bearer
 * <token>` header attaches the caller's `user_id` via `auth.uid()` inside the
 * RPC when present, exactly as the website's cookie-based session does.
 */
export const POST = handle(async (req) => {
  let input: SubmitAppointmentInput;
  try {
    input = await req.json();
  } catch {
    return jsonError(400, "Invalid JSON body", "bad_request", WRITE_METHODS);
  }

  if (!input?.doctorId) {
    return jsonError(400, "Missing doctorId", "bad_request", WRITE_METHODS);
  }
  if (!input.patientName?.trim() || !input.patientPhone?.trim()) {
    return jsonError(400, "Name and phone are required.", "validation", WRITE_METHODS);
  }
  if (!input.appointmentDate || !input.appointmentTime) {
    return jsonError(400, "Please select a date and time.", "validation", WRITE_METHODS);
  }
  if (isPastDate(input.appointmentDate)) {
    return jsonError(400, "Please select a future date.", "validation", WRITE_METHODS);
  }

  const supabase = createBearerClient(getBearerToken(req));
  const { error } = await supabase.rpc("submit_appointment_request", {
    p_doctor_id: input.doctorId,
    p_patient_name: input.patientName.trim(),
    p_patient_phone: input.patientPhone.trim(),
    p_patient_email: input.patientEmail?.trim() || null,
    p_appointment_date: input.appointmentDate,
    p_appointment_time: input.appointmentTime,
    p_notes: input.notes?.trim() || null,
  });

  if (error) {
    if (error.message.includes("no longer available")) {
      return jsonError(
        409,
        "That time slot was just booked by someone else — please pick another time.",
        "slot_taken",
        WRITE_METHODS,
      );
    }
    return jsonError(400, error.message, "rpc_error", WRITE_METHODS);
  }

  const body: SubmitAppointmentResult = { ok: true };
  return jsonOk(body, { cache: false, methods: WRITE_METHODS });
});
