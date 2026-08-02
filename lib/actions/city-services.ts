"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "./activity";
import type { EssentialServiceCategory, GalleryImage } from "@/types";

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
  nameAr?: string;
  nameSo?: string;
  description?: string;
  descriptionAr?: string;
  descriptionSo?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  openingHours?: string;
  mapsUrl?: string;
  website?: string;
  image?: string;
  gallery?: GalleryImage[];
  status?: "draft" | "published";
  featured?: boolean;
}

export async function createCityService(
  locale: string,
  input: CityServiceInput
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertOwner();

  const { error } = await supabase.from("city_services").insert({
    category: input.category,
    name: input.name.trim(),
    name_ar: input.nameAr?.trim() || null,
    name_so: input.nameSo?.trim() || null,
    description: input.description?.trim() || null,
    description_ar: input.descriptionAr?.trim() || null,
    description_so: input.descriptionSo?.trim() || null,
    phone: input.phone?.trim() || null,
    whatsapp: input.whatsapp?.trim() || null,
    email: input.email?.trim() || null,
    opening_hours: input.openingHours?.trim() || null,
    maps_url: input.mapsUrl?.trim() || null,
    website: input.website?.trim() || null,
    image: input.image || null,
    gallery: input.gallery ?? [],
    status: input.status ?? "draft",
    featured: input.featured ?? false,
  } as never);

  if (error) return { ok: false, error: error.message };

  await logActivity("create", "city_service", undefined, { name: input.name, category: input.category });
  revalidatePath(`/${locale}/admin/city-services`);
  revalidatePath(`/${locale}/city-services`);
  revalidatePath(`/${locale}`);
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
      name_ar: input.nameAr?.trim() || null,
      name_so: input.nameSo?.trim() || null,
      description: input.description?.trim() || null,
      description_ar: input.descriptionAr?.trim() || null,
      description_so: input.descriptionSo?.trim() || null,
      phone: input.phone?.trim() || null,
      whatsapp: input.whatsapp?.trim() || null,
      email: input.email?.trim() || null,
      opening_hours: input.openingHours?.trim() || null,
      maps_url: input.mapsUrl?.trim() || null,
      website: input.website?.trim() || null,
      image: input.image || null,
      gallery: input.gallery ?? [],
      status: input.status,
      featured: input.featured ?? false,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await logActivity("update", "city_service", id, { name: input.name });
  revalidatePath(`/${locale}/admin/city-services`);
  revalidatePath(`/${locale}/city-services`);
  revalidatePath(`/${locale}`);
  return { ok: true };
}

/** Owner-only quick toggle from the list view — purely a "highlight within
 * its category" flag now (sort/visual emphasis), not a public-visibility
 * gate: every published listing shows regardless of this flag. */
export async function toggleCityServiceFeatured(
  locale: string,
  id: string,
  nextFeatured: boolean
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertOwner();

  const { error } = await supabase.from("city_services").update({ featured: nextFeatured } as never).eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logActivity("update", "city_service_featured", id, { featured: nextFeatured });
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
  revalidatePath(`/${locale}`);
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
  revalidatePath(`/${locale}`);
  return { ok: true };
}
