"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "./activity";
import type { GalleryImage, MediaVideo, OpeningHoursGroup } from "@/types";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Every City Services category's `categories.slug` is its legacy
 * `city_service_category` enum value with underscores in place of dashes
 * (e.g. "gas-station" -> "gas_station") — see the seed migration
 * (20260807000008_city_services_category_migration.sql). Used to keep
 * writing the still-NOT-NULL legacy `category` column from the real
 * `categoryId` FK, since owner-dashboard.ts's City Coverage KPI widget
 * still reads it directly. */
async function legacyCategoryEnum(supabase: SupabaseClient, categoryId: string): Promise<string> {
  const { data } = await supabase.from("categories").select("slug").eq("id", categoryId).single();
  const slug = (data as { slug?: string } | null)?.slug ?? "";
  return slug.replace(/-/g, "_");
}

/** Same shape as the slug backfill in the Phase 11 migration
 * (20260803000016_city_services_upgrade.sql) — slugified name + a short
 * random suffix for uniqueness, since two listings can share a name. */
function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .trim()
      .replace(/\s+/g, "-") +
    "-" +
    Math.random().toString(36).slice(2, 10)
  );
}

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
  categoryId: string;
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
  videos?: MediaVideo[];
  lat?: number;
  lng?: number;
  amenitiesV2?: string[];
  openingHoursStructured?: OpeningHoursGroup[];
  is24Hours?: boolean;
  temporarilyClosed?: boolean;
  permanentlyClosed?: boolean;
  socialInstagram?: string;
  socialFacebook?: string;
  socialTiktok?: string;
  socialSnapchat?: string;
  socialX?: string;
  socialYoutube?: string;
  socialTelegram?: string;
  status?: "draft" | "published";
  featured?: boolean;
}

export async function createCityService(
  locale: string,
  input: CityServiceInput
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertOwner();
  const slug = slugify(input.name);
  const category = await legacyCategoryEnum(supabase, input.categoryId);

  const { error } = await supabase.from("city_services").insert({
    slug,
    category_id: input.categoryId,
    category,
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
    videos: input.videos ?? [],
    lat: input.lat ?? 9.5624,
    lng: input.lng ?? 44.065,
    amenities_v2: input.amenitiesV2 ?? [],
    opening_hours_structured: input.openingHoursStructured ?? [],
    is_24_hours: input.is24Hours ?? false,
    temporarily_closed: input.temporarilyClosed ?? false,
    permanently_closed: input.permanentlyClosed ?? false,
    social_instagram: input.socialInstagram?.trim() || null,
    social_facebook: input.socialFacebook?.trim() || null,
    social_tiktok: input.socialTiktok?.trim() || null,
    social_snapchat: input.socialSnapchat?.trim() || null,
    social_x: input.socialX?.trim() || null,
    social_youtube: input.socialYoutube?.trim() || null,
    social_telegram: input.socialTelegram?.trim() || null,
    status: input.status ?? "draft",
    featured: input.featured ?? false,
  } as never);

  if (error) return { ok: false, error: error.message };

  await logActivity("create", "city_service", undefined, { name: input.name, categoryId: input.categoryId });
  revalidatePath(`/${locale}/admin/city-services`);
  revalidatePath(`/${locale}/city-services`);
  revalidatePath(`/${locale}/city-services/${slug}`);
  revalidatePath(`/${locale}`);
  return { ok: true };
}

export async function updateCityService(
  locale: string,
  id: string,
  input: CityServiceInput
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertOwner();
  const category = await legacyCategoryEnum(supabase, input.categoryId);

  const { error } = await supabase
    .from("city_services")
    .update({
      category_id: input.categoryId,
      category,
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
      videos: input.videos ?? [],
      lat: input.lat ?? 9.5624,
      lng: input.lng ?? 44.065,
      amenities_v2: input.amenitiesV2 ?? [],
      opening_hours_structured: input.openingHoursStructured ?? [],
      is_24_hours: input.is24Hours ?? false,
      temporarily_closed: input.temporarilyClosed ?? false,
      permanently_closed: input.permanentlyClosed ?? false,
      social_instagram: input.socialInstagram?.trim() || null,
      social_facebook: input.socialFacebook?.trim() || null,
      social_tiktok: input.socialTiktok?.trim() || null,
      social_snapchat: input.socialSnapchat?.trim() || null,
      social_x: input.socialX?.trim() || null,
      social_youtube: input.socialYoutube?.trim() || null,
      social_telegram: input.socialTelegram?.trim() || null,
      status: input.status,
      featured: input.featured ?? false,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await logActivity("update", "city_service", id, { name: input.name });
  revalidatePath(`/${locale}/admin/city-services`);
  revalidatePath(`/${locale}/city-services`);
  const { data: row } = await supabase.from("city_services").select("slug").eq("id", id).single();
  if (row?.slug) revalidatePath(`/${locale}/city-services/${row.slug}`);
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
