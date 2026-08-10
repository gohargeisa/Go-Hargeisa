"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export interface DepartmentInput {
  name: string;
  nameAr?: string;
  nameSo?: string;
  sortOrder?: number;
}

/**
 * Departments authorize via their PARENT city_services listing's owner_id,
 * same shape as lib/actions/hotel-rooms.ts's assertCanManageRoom and
 * lib/actions/products.ts's assertCanManageProduct. RLS on `departments`
 * mirrors this same check server-side as the authoritative gate.
 */
async function assertCanManageDepartment(cityServiceId: string) {
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

function toPayload(input: DepartmentInput, cityServiceId: string) {
  return {
    city_service_id: cityServiceId,
    name: input.name.trim(),
    name_ar: input.nameAr?.trim() || null,
    name_so: input.nameSo?.trim() || null,
    sort_order: input.sortOrder ?? 0,
  };
}

export async function createDepartment(
  cityServiceId: string,
  input: DepartmentInput,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageDepartment(cityServiceId);

  const { error } = await supabase.from("departments").insert(toPayload(input, cityServiceId) as never);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function updateDepartment(
  departmentId: string,
  cityServiceId: string,
  input: DepartmentInput,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageDepartment(cityServiceId);

  const { error } = await supabase.from("departments").update(toPayload(input, cityServiceId) as never).eq("id", departmentId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function deleteDepartment(
  departmentId: string,
  cityServiceId: string,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageDepartment(cityServiceId);

  const { error } = await supabase.from("departments").delete().eq("id", departmentId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}
