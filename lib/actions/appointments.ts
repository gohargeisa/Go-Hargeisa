"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAvailableSlots as computeAvailableSlots, getSlotStatuses as computeSlotStatuses, type SlotStatus } from "@/lib/utils/doctor-availability";
import { hasBusinessGrantPermission } from "@/lib/data/access-control";
import type { AppointmentStatus, OpeningHoursGroup, BusinessPermissionKey } from "@/types";
import type { Locale } from "@/lib/i18n/config";

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
 * Public, anonymous-writable appointment request. Goes through the
 * `submit_appointment_request` SECURITY DEFINER RPC (see
 * supabase/migrations/20260812000003_appointment_engine_hardening.sql)
 * rather than a raw insert — the RPC re-checks server-side whether the
 * doctor/date/time slot is still free (a raw insert had no such check, so
 * two patients could double-book the exact same slot; the partial unique
 * index on `appointments` is the final backstop against the remaining race
 * window). If signed in, user_id is attached (via auth.uid() inside the
 * function) so the patient can later see their own request via "Patients
 * read their own appointments".
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
      return { ok: false, error: "That time slot was just booked by someone else — please pick another time." };
    }
    return { ok: false, error: error.message };
  }
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
    .in("status", ["pending", "confirmed"]);
  const bookedTimes = ((booked ?? []) as { appointment_time: string }[]).map((r) => r.appointment_time);

  return computeAvailableSlots(workingHours, date, doctor.appointment_duration_minutes, bookedTimes);
}

/**
 * Like getAvailableSlots, but returns EVERY working-hour slot with an
 * `available` flag — so the booking form can show taken slots as a disabled
 * "— Booked" option instead of hiding them. Same privacy handling: the admin
 * client reads only `appointment_time` (never patient name/phone/notes).
 */
export async function getSlotAvailability(doctorId: string, date: string): Promise<SlotStatus[]> {
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
    .in("status", ["pending", "confirmed"]);
  const bookedTimes = ((booked ?? []) as { appointment_time: string }[]).map((r) => r.appointment_time);

  return computeSlotStatuses(workingHours, date, doctor.appointment_duration_minutes, bookedTimes);
}

/** Same ownership shape as lib/actions/doctors.ts's assertCanManageDoctor,
 * joined one level further through doctors -> city_services (matches the
 * "Owners manage their own doctors' appointments" RLS policy exactly).
 * `requiredPermission` is the Team Member fallback, mirroring
 * assertCanManageListing's — a caller that doesn't pass it keeps the
 * original owner/business_owner-only behavior. */
async function assertCanManageAppointment(doctorId: string, requiredPermission?: BusinessPermissionKey) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role;

  if (role === "owner") return supabase;

  const { data: doctor } = await supabase.from("doctors").select("city_service_id").eq("id", doctorId).single();
  const cityServiceId = (doctor as { city_service_id: string } | null)?.city_service_id;

  if (role === "business_owner" && cityServiceId) {
    const { data: listing } = await supabase.from("city_services").select("owner_id").eq("id", cityServiceId).single();
    if ((listing as { owner_id: string | null } | null)?.owner_id === user.id) return supabase;
  }

  if (requiredPermission && cityServiceId && (await hasBusinessGrantPermission(user.id, "city_service", cityServiceId, requiredPermission))) {
    return supabase;
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
  const supabase = await assertCanManageAppointment(doctorId, "appointments_manage");

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

/**
 * A signed-in patient cancels their own appointment — only while it's still
 * pending/confirmed. Mirrors lib/actions/bookings.ts's cancelMyBooking; the
 * "Patients cancel their own appointments" RLS policy
 * (20260812000003_appointment_engine_hardening.sql) is what's actually
 * authoritative, this is just a fast, friendly error message.
 */
export async function cancelMyAppointment(appointmentId: string, locale: Locale): Promise<{ ok: boolean; error?: string }> {
  const t = await getTranslations({ locale, namespace: "dashboard" });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: t("genericError") };

  const { data: existing } = await supabase.from("appointments").select("status, user_id").eq("id", appointmentId).single();
  const appointment = existing as { status: string; user_id: string | null } | null;

  if (!appointment || appointment.user_id !== user.id) {
    return { ok: false, error: t("genericError") };
  }
  if (appointment.status !== "pending" && appointment.status !== "confirmed") {
    return { ok: false, error: t("appointmentNoLongerCancellable") };
  }

  const { error } = await supabase.from("appointments").update({ status: "cancelled" } as never).eq("id", appointmentId);
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/${locale}/dashboard`);
  return { ok: true };
}
