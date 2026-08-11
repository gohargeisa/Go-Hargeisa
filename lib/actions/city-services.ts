"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { logActivity } from "./activity";
import { upgradeToBusinessOwner } from "./claims";
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

/**
 * Same shape as lib/actions/business.ts's assertCanManageListing: a platform
 * admin (role='owner') may edit any city service; a business_owner may only
 * edit the one(s) assigned to them via owner_id. Used only by
 * updateCityService — create/delete/feature/visibility toggles stay
 * admin-only (assertOwner), same as hotels/restaurants/cafes/services only
 * grant business_owner an UPDATE, never INSERT/DELETE. RLS's "Owners manage
 * their city services" policy (owner_id = auth.uid()) backs this up server-side.
 */
async function assertCanEditCityService(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role;

  if (role === "owner") return supabase;

  if (role === "business_owner") {
    const { data: listing } = await supabase.from("city_services").select("owner_id").eq("id", id).single();
    if ((listing as { owner_id: string | null } | null)?.owner_id === user.id) return supabase;
  }

  throw new Error("Not authorized.");
}

export interface CityServiceInput {
  categoryId: string;
  /** Only ever read by createCityService — assigning/changing/removing an
   * owner on an EXISTING listing goes through lib/actions/claims.ts's
   * transferOwnership/removeOwnership instead (admin-only there too), so a
   * business_owner editing their own listing has no owner_id in their
   * update payload at all to tamper with. */
  ownerId?: string | null;
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
  /** Only meaningful for categories with a subcategory picker wired up in
   * components/admin/service-tags-picker.tsx — Beauty Salons, Men's
   * Barbershops, Auto Repair & Services (a services-offered vocabulary, see
   * lib/config/service-tags.ts) and Cosmetics & Women's Beauty (a curated
   * subset of product categories, see COSMETICS_SPECIALTY_CATEGORIES in
   * lib/config/product-categories.ts — a declared-specialties signal,
   * distinct from the Products Engine's own per-product category field).
   * Ignored (stored as []) for every other category. */
  serviceTags?: string[];
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
  // Schools + Universities — every count below is optional and off by
  // default; none are gender-split. Ignored for every other category.
  schoolType?: string;
  curriculum?: string;
  educationLevels?: string[];
  ageRangeGrades?: string;
  numberOfClassrooms?: number;
  universityType?: string;
  degreeLevels?: string[];
  facultiesOffered?: string[];
  numberOfBuildings?: number;
  educationFacilities?: string[];
  numberOfStudents?: number;
  numberOfTeachers?: number;
  admissionsOpen?: boolean;
  admissionPhone?: string;
  admissionWhatsapp?: string;
  admissionUrl?: string;
  applicationUrl?: string;
  numberOfFloors?: number;
  yearEstablished?: number;
  languages?: string[];
  // Women's Beauty Salons (women-only) + Men's Barbershops (men-only) —
  // no unisex value exists in either vocabulary. Ignored for every other
  // category.
  salonType?: string;
  shopType?: string;
  staffCount?: number;
  walkInsAccepted?: boolean;
  homeServiceAvailable?: boolean;
  // Cosmetics & Women's Beauty + Perfumes — ignored for every other category.
  storeType?: string;
  brands?: string[];
  // Car Rental — ignored for every other category.
  rentalType?: string;
  vehicleTypes?: string[];
  minimumRentalPeriod?: string;
  driversLicenseRequired?: boolean;
  depositRequired?: boolean;
  fleetSize?: number;
  // Dental Clinics (clinic-level fields only) — ignored for every other category.
  clinicType?: string;
  numberOfTreatmentRooms?: number;
  insuranceAccepted?: string[];
  // Auto Repair & Car Services — ignored for every other category.
  garageType?: string;
  // Gym / Fitness Center — ignored for every other category.
  gymType?: string;
  classesOffered?: string[];
  membershipOptions?: string[];
  personalTrainingAvailable?: boolean;
  groupClassesAvailable?: boolean;
  gymFacilities?: string[];
  trainersAvailable?: boolean;
  femaleTrainersAvailable?: boolean;
  maleTrainersAvailable?: boolean;
  trialMembershipAvailable?: boolean;
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
    owner_id: input.ownerId || null,
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
    service_tags: input.serviceTags ?? [],
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
    school_type: input.schoolType || null,
    curriculum: input.curriculum || null,
    education_levels: input.educationLevels ?? [],
    age_range_grades: input.ageRangeGrades?.trim() || null,
    number_of_classrooms: input.numberOfClassrooms ?? null,
    university_type: input.universityType || null,
    degree_levels: input.degreeLevels ?? [],
    faculties_offered: input.facultiesOffered ?? [],
    number_of_buildings: input.numberOfBuildings ?? null,
    education_facilities: input.educationFacilities ?? [],
    number_of_students: input.numberOfStudents ?? null,
    number_of_teachers: input.numberOfTeachers ?? null,
    admissions_open: input.admissionsOpen ?? true,
    admission_phone: input.admissionPhone?.trim() || null,
    admission_whatsapp: input.admissionWhatsapp?.trim() || null,
    admission_url: input.admissionUrl?.trim() || null,
    application_url: input.applicationUrl?.trim() || null,
    number_of_floors: input.numberOfFloors ?? null,
    year_established: input.yearEstablished ?? null,
    languages: input.languages ?? [],
    salon_type: input.salonType || null,
    shop_type: input.shopType || null,
    staff_count: input.staffCount ?? null,
    walk_ins_accepted: input.walkInsAccepted ?? null,
    home_service_available: input.homeServiceAvailable ?? null,
    store_type: input.storeType || null,
    brands: input.brands ?? [],
    rental_type: input.rentalType || null,
    vehicle_types: input.vehicleTypes ?? [],
    minimum_rental_period: input.minimumRentalPeriod?.trim() || null,
    drivers_license_required: input.driversLicenseRequired ?? null,
    deposit_required: input.depositRequired ?? null,
    fleet_size: input.fleetSize ?? null,
    clinic_type: input.clinicType || null,
    number_of_treatment_rooms: input.numberOfTreatmentRooms ?? null,
    insurance_accepted: input.insuranceAccepted ?? [],
    garage_type: input.garageType || null,
    gym_type: input.gymType || null,
    classes_offered: input.classesOffered ?? [],
    membership_options: input.membershipOptions ?? [],
    personal_training_available: input.personalTrainingAvailable ?? null,
    group_classes_available: input.groupClassesAvailable ?? null,
    gym_facilities: input.gymFacilities ?? [],
    trainers_available: input.trainersAvailable ?? null,
    female_trainers_available: input.femaleTrainersAvailable ?? null,
    male_trainers_available: input.maleTrainersAvailable ?? null,
    trial_membership_available: input.trialMembershipAvailable ?? null,
  } as never);

  if (error) return { ok: false, error: error.message };

  if (input.ownerId) await upgradeToBusinessOwner(supabase, input.ownerId);

  await logActivity("create", "city_service", undefined, { name: input.name, categoryId: input.categoryId, ownerId: input.ownerId });
  revalidatePath(`/${locale}/admin/city-services`);
  revalidatePath(`/${locale}/city-services`);
  revalidatePath(`/${locale}/city-services/${slug}`);
  // /services shares this exact same city_services data (getCityServicesGroupedByCategory)
  // — see app/[locale]/services/page.tsx — and is separately ISR-cached
  // (revalidate = 3600), so without this it can show stale data for up to
  // an hour after any write here.
  revalidatePath(`/${locale}/services`);
  revalidatePath(`/${locale}`);
  return { ok: true };
}

export async function updateCityService(
  locale: string,
  id: string,
  input: CityServiceInput
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanEditCityService(id);
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
    service_tags: input.serviceTags ?? [],
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
      school_type: input.schoolType || null,
      curriculum: input.curriculum || null,
      education_levels: input.educationLevels ?? [],
      age_range_grades: input.ageRangeGrades?.trim() || null,
      number_of_classrooms: input.numberOfClassrooms ?? null,
      university_type: input.universityType || null,
      degree_levels: input.degreeLevels ?? [],
      faculties_offered: input.facultiesOffered ?? [],
      number_of_buildings: input.numberOfBuildings ?? null,
      education_facilities: input.educationFacilities ?? [],
      number_of_students: input.numberOfStudents ?? null,
      number_of_teachers: input.numberOfTeachers ?? null,
      admissions_open: input.admissionsOpen ?? true,
      admission_phone: input.admissionPhone?.trim() || null,
      admission_whatsapp: input.admissionWhatsapp?.trim() || null,
      admission_url: input.admissionUrl?.trim() || null,
      application_url: input.applicationUrl?.trim() || null,
      number_of_floors: input.numberOfFloors ?? null,
      year_established: input.yearEstablished ?? null,
      languages: input.languages ?? [],
      salon_type: input.salonType || null,
      shop_type: input.shopType || null,
      staff_count: input.staffCount ?? null,
      walk_ins_accepted: input.walkInsAccepted ?? null,
      home_service_available: input.homeServiceAvailable ?? null,
      store_type: input.storeType || null,
      brands: input.brands ?? [],
      rental_type: input.rentalType || null,
      vehicle_types: input.vehicleTypes ?? [],
      minimum_rental_period: input.minimumRentalPeriod?.trim() || null,
      drivers_license_required: input.driversLicenseRequired ?? null,
      deposit_required: input.depositRequired ?? null,
      fleet_size: input.fleetSize ?? null,
      clinic_type: input.clinicType || null,
      number_of_treatment_rooms: input.numberOfTreatmentRooms ?? null,
      insurance_accepted: input.insuranceAccepted ?? [],
      garage_type: input.garageType || null,
      gym_type: input.gymType || null,
      classes_offered: input.classesOffered ?? [],
      membership_options: input.membershipOptions ?? [],
      personal_training_available: input.personalTrainingAvailable ?? null,
      group_classes_available: input.groupClassesAvailable ?? null,
      gym_facilities: input.gymFacilities ?? [],
      trainers_available: input.trainersAvailable ?? null,
      female_trainers_available: input.femaleTrainersAvailable ?? null,
      male_trainers_available: input.maleTrainersAvailable ?? null,
      trial_membership_available: input.trialMembershipAvailable ?? null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await logActivity("update", "city_service", id, { name: input.name });
  revalidatePath(`/${locale}/admin/city-services`);
  revalidatePath(`/${locale}/city-services`);
  const { data: row } = await supabase.from("city_services").select("slug").eq("id", id).single();
  if (row?.slug) revalidatePath(`/${locale}/city-services/${row.slug}`);
  revalidatePath(`/${locale}/services`);
  revalidatePath(`/${locale}`);
  return { ok: true };
}

/**
 * Partial update for the /business dashboard's per-section forms (profile,
 * gallery, service tags) — same "just PATCH the touched columns" shape as
 * lib/actions/admin.ts's updateRecord, but scoped to city_services with
 * assertCanEditCityService's owner_id-aware authorization. updateRecord
 * itself doesn't support city_services at all (see its ALLOWED_TABLES —
 * city_services was deliberately left off since its schema differs from
 * hotels/restaurants/cafes/services: `image` not `cover_image`, no
 * `logo_url`/`address`, `maps_url` not `google_maps_url`, `amenities_v2`
 * for tags), so a full generic reuse isn't a safe drop-in. Column names are
 * the caller's responsibility, same contract as updateRecord.
 */
export async function updateCityServicePartial(
  locale: string,
  id: string,
  patch: Record<string, unknown>
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanEditCityService(id);

  const { error } = await supabase
    .from("city_services")
    .update({ ...patch, updated_at: new Date().toISOString() } as never)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await logActivity("update", "city_service", id);
  revalidatePath(`/${locale}/city-services`);
  const { data: row } = await supabase.from("city_services").select("slug").eq("id", id).single();
  if (row?.slug) revalidatePath(`/${locale}/city-services/${row.slug}`);
  revalidatePath(`/${locale}/services`);
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
  revalidatePath(`/${locale}/services`);
  return { ok: true };
}

export async function deleteCityService(locale: string, id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertOwner();

  const { error } = await supabase.from("city_services").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logActivity("delete", "city_service", id);
  revalidatePath(`/${locale}/admin/city-services`);
  revalidatePath(`/${locale}/city-services`);
  revalidatePath(`/${locale}/services`);
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
  revalidatePath(`/${locale}/services`);
  revalidatePath(`/${locale}`);
  return { ok: true };
}
