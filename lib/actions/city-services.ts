"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "./activity";
import type { EssentialServiceCategory } from "@/types";

async function assertOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "owner") throw new Error("Not authorized.");

  return supabase;
}

export interface CityServiceInput {
  category: EssentialServiceCategory;
  name: string;
  phone?: string;
  openingHours?: string;
  mapsUrl?: string;
  image?: string;
}

export async function createCityService(
  locale: string,
  input: CityServiceInput
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertOwner();

  const { error } = await supabase.from("city_services").insert({
    category: input.category,
    name: input.name.trim(),
    phone: input.phone?.trim() || null,
    opening_hours: input.openingHours?.trim() || null,
    maps_url: input.mapsUrl?.trim() || null,
    image: input.image || null,
    status: "published",
  } as never);

  if (error) return { ok: false, error: error.message };

  await logActivity("create", "city_service", undefined, { name: input.name, category: input.category });
  revalidatePath(`/${locale}/admin/city-services`);
  revalidatePath(`/${locale}/city-services`);
  return { ok: true };
}

export async function updateCityService(
  locale: string,
  id: string,
  input: CityServiceInput
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertOwner();

  const { error } = await supabase
    .from("city_services")
    .update({
      category: input.category,
      name: input.name.trim(),
      phone: input.phone?.trim() || null,
      opening_hours: input.openingHours?.trim() || null,
      maps_url: input.mapsUrl?.trim() || null,
      image: input.image || null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await logActivity("update", "city_service", id, { name: input.name });
  revalidatePath(`/${locale}/admin/city-services`);
  revalidatePath(`/${locale}/city-services`);
  return { ok: true };
}

export async function deleteCityService(locale: string, id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertOwner();

  const { error } = await supabase.from("city_services").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logActivity("delete", "city_service", id);
  revalidatePath(`/${locale}/admin/city-services`);
  revalidatePath(`/${locale}/city-services`);
  return { ok: true };
}

export async function toggleCityServiceVisibility(
  locale: string,
  id: string,
  nextStatus: "published" | "archived"
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertOwner();

  const { error } = await supabase.from("city_services").update({ status: nextStatus } as never).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logActivity(nextStatus === "published" ? "publish" : "archive", "city_service", id);
  revalidatePath(`/${locale}/admin/city-services`);
  revalidatePath(`/${locale}/city-services`);
  return { ok: true };
}
