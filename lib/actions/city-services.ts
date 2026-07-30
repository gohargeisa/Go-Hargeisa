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
  description?: string;
  phone?: string;
  openingHours?: string;
  mapsUrl?: string;
  image?: string;
  featured?: boolean;
}

const MAX_FEATURED_PER_CATEGORY = 4;

/** Only meaningful when the write is turning `featured` on — counts
 * existing featured rows in the same category, excluding the row being
 * edited (if any), so toggling an already-featured row off and back on
 * doesn't falsely count itself against the cap. */
async function featuredCapExceeded(
  supabase: Awaited<ReturnType<typeof assertOwner>>,
  category: EssentialServiceCategory,
  excludeId?: string
): Promise<boolean> {
  let query = supabase
    .from("city_services")
    .select("id", { count: "exact", head: true })
    .eq("category", category)
    .eq("featured", true);
  if (excludeId) query = query.neq("id", excludeId);
  const { count } = await query;
  return (count ?? 0) >= MAX_FEATURED_PER_CATEGORY;
}

export async function createCityService(
  locale: string,
  input: CityServiceInput
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertOwner();

  if (input.featured && (await featuredCapExceeded(supabase, input.category))) {
    return { ok: false, error: `Maximum ${MAX_FEATURED_PER_CATEGORY} featured listings already reached for this category.` };
  }

  const { error } = await supabase.from("city_services").insert({
    category: input.category,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    phone: input.phone?.trim() || null,
    opening_hours: input.openingHours?.trim() || null,
    maps_url: input.mapsUrl?.trim() || null,
    image: input.image || null,
    status: "published",
    featured: input.featured ?? false,
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

  if (input.featured && (await featuredCapExceeded(supabase, input.category, id))) {
    return { ok: false, error: `Maximum ${MAX_FEATURED_PER_CATEGORY} featured listings already reached for this category.` };
  }

  const { error } = await supabase
    .from("city_services")
    .update({
      category: input.category,
      name: input.name.trim(),
      description: input.description?.trim() || null,
      phone: input.phone?.trim() || null,
      opening_hours: input.openingHours?.trim() || null,
      maps_url: input.mapsUrl?.trim() || null,
      image: input.image || null,
      featured: input.featured ?? false,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await logActivity("update", "city_service", id, { name: input.name });
  revalidatePath(`/${locale}/admin/city-services`);
  revalidatePath(`/${locale}/city-services`);
  return { ok: true };
}

/** Owner-only quick toggle from the list view — same featured-cap rule as
 * the full form, without requiring a full edit just to promote/demote a
 * listing. */
export async function toggleCityServiceFeatured(
  locale: string,
  id: string,
  category: EssentialServiceCategory,
  nextFeatured: boolean
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertOwner();

  if (nextFeatured && (await featuredCapExceeded(supabase, category, id))) {
    return { ok: false, error: `Maximum ${MAX_FEATURED_PER_CATEGORY} featured listings already reached for this category.` };
  }

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
