"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { OpeningHoursGroup } from "@/types";

export interface DoctorInput {
  name: string;
  photo?: string;
  specialty?: string;
  specialtyAr?: string;
  specialtySo?: string;
  bio?: string;
  bioAr?: string;
  bioSo?: string;
  languages: string[];
  workingHours: OpeningHoursGroup[];
  appointmentDurationMinutes: number;
  isActive: boolean;
  departmentId?: string;
  sortOrder?: number;
}

/** Same ownership shape as lib/actions/departments.ts's assertCanManageDepartment. */
async function assertCanManageDoctor(cityServiceId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role;

  if (role === "owner") return supabase;

  if (role === "business_owner") {
    const { data: listing } = await supabase.from("city_services").select("owner_id").eq("id", cityServiceId).single();
    if ((listing as { owner_id: string | null } | null)?.owner_id === user.id) return supabase;
  }

  throw new Error("Not authorized.");
}

function toPayload(input: DoctorInput, cityServiceId: string) {
  return {
    city_service_id: cityServiceId,
    department_id: input.departmentId || null,
    name: input.name.trim(),
    photo: input.photo || null,
    specialty: input.specialty?.trim() || null,
    specialty_ar: input.specialtyAr?.trim() || null,
    specialty_so: input.specialtySo?.trim() || null,
    bio: input.bio?.trim() || null,
    bio_ar: input.bioAr?.trim() || null,
    bio_so: input.bioSo?.trim() || null,
    languages: input.languages,
    working_hours: input.workingHours,
    appointment_duration_minutes: input.appointmentDurationMinutes,
    is_active: input.isActive,
    sort_order: input.sortOrder ?? 0,
  };
}

export async function createDoctor(
  cityServiceId: string,
  input: DoctorInput,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageDoctor(cityServiceId);

  const { error } = await supabase.from("doctors").insert(toPayload(input, cityServiceId) as never);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function updateDoctor(
  doctorId: string,
  cityServiceId: string,
  input: DoctorInput,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageDoctor(cityServiceId);

  const { error } = await supabase
    .from("doctors")
    .update({ ...toPayload(input, cityServiceId), updated_at: new Date().toISOString() } as never)
    .eq("id", doctorId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function deleteDoctor(
  doctorId: string,
  cityServiceId: string,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageDoctor(cityServiceId);

  const { error } = await supabase.from("doctors").delete().eq("id", doctorId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}
