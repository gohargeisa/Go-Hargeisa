"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvailableSlots as computeAvailableSlots } from "@/lib/utils/doctor-availability";
import type { AppointmentStatus, OpeningHoursGroup } from "@/types";

export interface AppointmentRequestInput {
  doctorId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  appointmentDate: string;
  appointmentTime: string;
  notes?: string;
}

function isPastDate(iso: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(`${iso}T00:00:00`);
  return date < today;
}

/**
 * Public, anonymous-writable appointment request — mirrors
 * lib/actions/bookings.ts's submitBookingRequest, but plain `.insert(...)`
 * without `.select()`: unlike bookings, appointments have no
 * "generate a reference and hand it back" requirement, so there's no need
 * for bookings.ts's SECURITY DEFINER RPC workaround (RETURNING is the only
 * thing RLS SELECT policies block for an anonymous insert — a bare insert
 * with no RETURNING never needs SELECT permission at all). Backed by the
 * "Anyone can submit an appointment request" INSERT policy (with check(true)).
 * If signed in, user_id is attached so the patient can later see their own
 * request via "Patients read their own appointments".
 */
export async function submitAppointmentRequest(input: AppointmentRequestInput): Promise<{ ok: boolean; error?: string }> {
  if (!input.patientName.trim() || !input.patientPhone.trim()) {
    return { ok: false, error: "Name and phone are required." };
  }
  if (!input.appointmentDate || !input.appointmentTime) {
    return { ok: false, error: "Please select a date and time." };
  }
  if (isPastDate(input.appointmentDate)) {
    return { ok: false, error: "Please select a future date." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("appointments").insert({
    doctor_id: input.doctorId,
    patient_name: input.patientName.trim(),
    patient_phone: input.patientPhone.trim(),
    patient_email: input.patientEmail?.trim() || null,
    user_id: user?.id ?? null,
    appointment_date: input.appointmentDate,
    appointment_time: input.appointmentTime,
    notes: input.notes?.trim() || null,
  } as never);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Available time slots for a doctor on a given date — used by the public
 * booking flow. Doctor working hours are already public data (RLS grants
 * public SELECT on `doctors` for published listings), but `appointments`
 * deliberately has NO public SELECT policy (a patient's name/phone must stay
 * private), so this uses the admin client ONLY to read `appointment_time`
 * for that doctor/date — nothing else from the row (no patient_name, phone,
 * email, or notes) is ever read or returned to the caller.
 */
export async function getAvailableSlots(doctorId: string, date: string): Promise<string[]> {
  const supabase = await createClient();
  const { data: doctorRow } = await supabase
    .from("doctors")
    .select("working_hours, appointment_duration_minutes, is_active")
    .eq("id", doctorId)
    .single();
  const doctor = doctorRow as { working_hours: unknown; appointment_duration_minutes: number; is_active: boolean } | null;
  if (!doctor || !doctor.is_active) return [];

  const workingHours = Array.isArray(doctor.working_hours) ? (doctor.working_hours as unknown as OpeningHoursGroup[]) : [];

  const admin = createAdminClient();
  const { data: booked } = await admin
    .from("appointments")
    .select("appointment_time")
    .eq("doctor_id", doctorId)
    .eq("appointment_date", date)
    .neq("status", "cancelled");
  const bookedTimes = ((booked ?? []) as { appointment_time: string }[]).map((r) => r.appointment_time);

  return computeAvailableSlots(workingHours, date, doctor.appointment_duration_minutes, bookedTimes);
}

/** Same ownership shape as lib/actions/doctors.ts's assertCanManageDoctor,
 * joined one level further through doctors -> city_services (matches the
 * "Owners manage their own doctors' appointments" RLS policy exactly). */
async function assertCanManageAppointment(doctorId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role;

  if (role === "owner") return supabase;

  if (role === "business_owner") {
    const { data: doctor } = await supabase.from("doctors").select("city_service_id").eq("id", doctorId).single();
    const cityServiceId = (doctor as { city_service_id: string } | null)?.city_service_id;
    if (cityServiceId) {
      const { data: listing } = await supabase.from("city_services").select("owner_id").eq("id", cityServiceId).single();
      if ((listing as { owner_id: string | null } | null)?.owner_id === user.id) return supabase;
    }
  }

  throw new Error("Not authorized.");
}

/**
 * Owner/admin status change — writes appointment_status_history, mirroring
 * lib/actions/business.ts's updateBookingStatus's audit-trail logic almost
 * verbatim (Phase 4 accepted design choice).
 */
export async function updateAppointmentStatus(
  appointmentId: string,
  doctorId: string,
  status: AppointmentStatus,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageAppointment(doctorId);

  const { data: existing } = await supabase.from("appointments").select("status").eq("id", appointmentId).single();
  const previousStatus = (existing as { status: AppointmentStatus } | null)?.status;

  const { error } = await supabase
    .from("appointments")
    .update({ status, updated_at: new Date().toISOString() } as never)
    .eq("id", appointmentId);
  if (error) return { ok: false, error: error.message };

  if (previousStatus && previousStatus !== status) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("appointment_status_history").insert({
      appointment_id: appointmentId,
      old_status: previousStatus,
      new_status: status,
      changed_by: user?.id ?? null,
    } as never);
  }

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}
