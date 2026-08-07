"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { placeholderImage } from "@/lib/placeholder-image";
import { logActivity } from "./activity";
import { isConvertibleCategory } from "@/lib/utils/partner-categories";
import { getCategoryById } from "@/lib/data/categories";
import { formatTime12h } from "@/lib/utils/opening-hours";
import type { JoinRequestCategory, BusinessRequestStatus, GalleryImage, MediaVideo, BusinessDocument, WeeklyHoursDay } from "@/types";

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

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export interface JoinRequestInput {
  category: JoinRequestCategory;
  /** Required, and must reference an active category with target_table
   * 'services', when category === "other". Ignored for hotel/restaurant/cafe. */
  categoryId?: string;
  /** Values for the referenced category's customFieldsSchema. Ignored unless categoryId is set. */
  customFields?: Record<string, string | number | boolean>;
  businessName: string;
  phone: string;
  whatsapp?: string;
  email: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  address: string;
  city: string;
  district?: string;
  lat?: number;
  lng?: number;
  mapsUrl?: string;
  description: string;
  logo?: string;
  coverImage?: string;
  gallery?: GalleryImage[];
  videos?: MediaVideo[];
  documents?: BusinessDocument[];
  menuPdfUrl?: string;
  bookingUrl?: string;
  openingHours?: WeeklyHoursDay[];
  amenities?: string[];
  priceRange?: "$" | "$$" | "$$$" | "$$$$";
}

/**
 * Public — no auth required, matches the anon-insert shape already proven
 * safe for business_claims/contact_messages. Full server-side validation
 * since this is the only real gate (the public form's own validation is
 * just UX, not a security boundary).
 */
export async function submitJoinRequest(input: JoinRequestInput): Promise<{ ok: boolean; error?: string }> {
  const businessName = input.businessName.trim();
  const phone = input.phone.trim();
  const email = input.email.trim();
  const address = input.address.trim();
  const city = input.city.trim();
  const description = input.description.trim();

  if (!businessName || !phone || !email || !address || !city || !description) {
    return { ok: false, error: "Please fill in all required fields." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  if (digitsOnly(phone).length < 7) {
    return { ok: false, error: "Please enter a valid phone number." };
  }
  const isFixedCategory = input.category === "hotel" || input.category === "restaurant" || input.category === "cafe";
  if (!isFixedCategory && input.category !== "other") {
    return { ok: false, error: "Invalid category." };
  }
  if (input.category === "other" && !input.categoryId) {
    return { ok: false, error: "Please choose a business category." };
  }
  if (input.lat !== undefined && (input.lat < -90 || input.lat > 90)) {
    return { ok: false, error: "Invalid location." };
  }
  if (input.lng !== undefined && (input.lng < -180 || input.lng > 180)) {
    return { ok: false, error: "Invalid location." };
  }

  // Public client — this table's RLS grants anonymous INSERT, but every
  // other query here (the duplicate check, the category check below) should
  // use the same unauthenticated path rather than assuming a signed-in
  // session exists.
  const supabase = createPublicClient();

  if (input.category === "other" && input.categoryId) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id, target_table, is_active")
      .eq("id", input.categoryId)
      .maybeSingle();
    if (!cat || !cat.is_active || cat.target_table !== "services") {
      return { ok: false, error: "Invalid category." };
    }
  }

  const { data: existing } = await supabase
    .from("business_join_requests")
    .select("id")
    .ilike("email", email)
    .ilike("business_name", businessName)
    .in("status", ["pending", "needs_info"])
    .limit(1);

  if (existing && existing.length > 0) {
    return { ok: false, error: "A request for this business is already pending review." };
  }

  const { error } = await supabase.from("business_join_requests").insert({
    category: input.category,
    category_id: input.category === "other" ? (input.categoryId ?? null) : null,
    custom_fields: input.category === "other" ? (input.customFields ?? {}) : {},
    business_name: businessName,
    phone,
    whatsapp: input.whatsapp?.trim() || null,
    email,
    website: input.website?.trim() || null,
    instagram: input.instagram?.trim() || null,
    facebook: input.facebook?.trim() || null,
    address,
    city,
    district: input.district?.trim() || null,
    lat: input.lat ?? null,
    lng: input.lng ?? null,
    maps_url: input.mapsUrl?.trim() || null,
    description,
    logo: input.logo || null,
    cover_image: input.coverImage || null,
    gallery: input.gallery ?? [],
    videos: input.videos ?? [],
    documents: input.documents ?? [],
    menu_pdf_url: input.menuPdfUrl || null,
    booking_url: input.bookingUrl?.trim() || null,
    opening_hours: input.openingHours ?? [],
    amenities: input.amenities ?? [],
    price_range: input.priceRange ?? null,
  } as never);

  if (error) return { ok: false, error: error.message };

  return { ok: true };
}

export async function setRequestStatus(
  locale: string,
  id: string,
  status: BusinessRequestStatus
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertOwner();

  const { error } = await supabase
    .from("business_join_requests")
    .update({ status, updated_at: new Date().toISOString() } as never)
    .eq("id", id);

  if (error) return { ok: false, error: error.message };

  await logActivity("update", "business_join_request", id, { status });
  revalidatePath(`/${locale}/admin/requests`);
  return { ok: true };
}

export async function addRequestNote(locale: string, requestId: string, note: string): Promise<{ ok: boolean; error?: string }> {
  const trimmed = note.trim();
  if (!trimmed) return { ok: false, error: "Note can't be empty." };

  const supabase = await assertOwner();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("business_join_request_notes")
    .insert({ request_id: requestId, note: trimmed, created_by: user?.id ?? null } as never);

  if (error) return { ok: false, error: error.message };

  await logActivity("create", "business_join_request_note", requestId);
  revalidatePath(`/${locale}/admin/requests`);
  return { ok: true };
}

export interface ConvertCompletion {
  slug: string;
  lat: number;
  lng: number;
}

/**
 * Converts an approved request into a real listing. Only lat/lng/slug are
 * required here despite the listing tables having several other NOT NULL
 * columns (short_description, cover_image, price_range, booking_mode, ...)
 * — every one of those either has a sensible DB default (price_range
 * '$$', booking_mode 'go_hargeisa', status 'published') or can be derived
 * from the request itself (short_description from description, cover_image
 * from the first gallery photo/logo/a placeholder). lat/lng are the only
 * fields the join form never collects and that have no default, so they're
 * the only ones that must be confirmed by hand before the listing can
 * exist at all.
 */
export async function convertJoinRequest(
  locale: string,
  requestId: string,
  targetPartnerStatus: "trial" | "official",
  completion: ConvertCompletion
): Promise<{ ok: boolean; error?: string; listingId?: string; table?: string }> {
  const supabase = await assertOwner();

  const slug = completion.slug.trim();
  if (!slug) return { ok: false, error: "Slug is required." };
  if (!Number.isFinite(completion.lat) || completion.lat < -90 || completion.lat > 90) {
    return { ok: false, error: "Latitude must be between -90 and 90." };
  }
  if (!Number.isFinite(completion.lng) || completion.lng < -180 || completion.lng > 180) {
    return { ok: false, error: "Longitude must be between -180 and 180." };
  }

  const { data: request, error: fetchError } = await supabase
    .from("business_join_requests")
    .select("*")
    .eq("id", requestId)
    .single();

  if (fetchError || !request) return { ok: false, error: "Request not found." };
  if (request.converted_listing_id) return { ok: false, error: "This request was already converted." };
  if (!isConvertibleCategory(request.category, request.category_id)) {
    return { ok: false, error: "This business type has no matching listing table to convert into." };
  }

  let table: "hotels" | "restaurants" | "cafes" | "services";
  let servicesCategory: Awaited<ReturnType<typeof getCategoryById>> = null;

  if (request.category === "hotel") table = "hotels";
  else if (request.category === "restaurant") table = "restaurants";
  else if (request.category === "cafe") table = "cafes";
  else {
    table = "services";
    servicesCategory = request.category_id ? await getCategoryById(request.category_id) : null;
    if (!servicesCategory || servicesCategory.targetTable !== "services" || !servicesCategory.isActive) {
      return { ok: false, error: "This request's category is no longer available — check /admin/categories." };
    }
  }

  const { data: slugTaken } = await supabase.from(table).select("id").eq("slug", slug).maybeSingle();
  if (slugTaken) return { ok: false, error: "That slug is already in use — please choose another." };

  const gallery = (request.gallery as { url: string; alt?: string; category?: string }[] | null) ?? [];
  const coverImage = request.cover_image || gallery[0]?.url || request.logo || placeholderImage(request.business_name);
  const shortDescription = request.description.length > 160 ? `${request.description.slice(0, 157)}...` : request.description;

  // Long-tail categories (anything that isn't hotel/restaurant/cafe) all
  // share the one `services` table, keyed by category_id — a genuinely
  // different insert shape (no partner_status/amenities/booking_mode
  // columns; has category_id/custom_fields instead) from the 3 dedicated
  // tables below, so it gets its own branch rather than being squeezed into
  // basePayload. WeeklyHoursDay[] (join form) has no lossless mapping onto
  // services.opening_hours_structured's grouped-days shape, so it's folded
  // into the legacy free-text opening_hours column instead of being dropped.
  if (table === "services") {
    if (!servicesCategory) {
      return { ok: false, error: "This request's category is no longer available — check /admin/categories." };
    }

    const openingHoursText = ((request.opening_hours as WeeklyHoursDay[] | null) ?? [])
      .map((h) => `${h.day}: ${h.closed ? "Closed" : `${formatTime12h(h.open)}–${formatTime12h(h.close)}`}`)
      .join(", ");

    const servicesPayload: Record<string, unknown> = {
      slug,
      name: request.business_name,
      short_description: shortDescription,
      description: request.description,
      cover_image: coverImage,
      logo_url: request.logo,
      gallery,
      videos: request.videos ?? [],
      address: request.address,
      lat: completion.lat,
      lng: completion.lng,
      google_maps_url: request.maps_url,
      phone: request.phone,
      whatsapp: request.whatsapp,
      email: request.email,
      website: request.website,
      social_instagram: request.instagram,
      social_facebook: request.facebook,
      opening_hours: openingHoursText || null,
      opening_hours_structured: [],
      services: [],
      category_id: request.category_id,
      category: null,
      custom_fields: request.custom_fields ?? {},
      featured: false,
    };

    const { data: created, error: insertError } = await supabase.from("services").insert(servicesPayload as never).select("id").single();
    if (insertError || !created) return { ok: false, error: insertError?.message ?? "Could not create the listing." };

    await supabase
      .from("business_join_requests")
      .update({
        status: "approved",
        converted_listing_type: "service",
        converted_listing_id: created.id,
        converted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", requestId);

    await logActivity("create", "services", created.id, { fromJoinRequest: requestId, partnerStatus: targetPartnerStatus });
    revalidatePath(`/${locale}/admin/requests`);
    revalidatePath(`/${locale}/admin/partners`);
    revalidatePath(`/${locale}/admin/services`);
    revalidatePath(`/${locale}/services`);
    revalidatePath(`/${locale}/services/${servicesCategory.slug}`);

    return { ok: true, listingId: created.id, table: "services" };
  }

  const basePayload: Record<string, unknown> = {
    slug,
    name: request.business_name,
    short_description: shortDescription,
    description: request.description,
    cover_image: coverImage,
    gallery,
    videos: request.videos ?? [],
    address: request.address,
    lat: completion.lat,
    lng: completion.lng,
    phone: request.phone,
    logo_url: request.logo,
    partner_status: targetPartnerStatus,
  };

  if (request.price_range) basePayload.price_range = request.price_range;
  // Only hotels has a free-form amenities column that matches the join
  // form's vocabulary 1:1 — restaurants has no legacy amenities column at
  // all, and cafes' amenities column is no longer admin-editable free text
  // (see lib/config/amenities.ts for the fixed amenities_v2 vocabulary now
  // used instead), so passing the partner-form's codes through there would
  // just silently not match any known chip.
  if (table === "hotels" && request.amenities && request.amenities.length > 0) {
    basePayload.amenities = request.amenities;
  }

  if (table === "hotels") {
    basePayload.website = request.website;
    if (request.booking_url) {
      basePayload.booking_mode = "external";
      basePayload.external_booking_option = "custom_url";
      basePayload.external_booking_url = request.booking_url;
    }
  } else if (table === "restaurants") {
    basePayload.website = request.website;
    basePayload.menu_pdf_url = request.menu_pdf_url;
  } else {
    basePayload.menu_pdf_url = request.menu_pdf_url;
  }

  const { data: created, error: insertError } = await supabase.from(table).insert(basePayload as never).select("id").single();

  if (insertError || !created) return { ok: false, error: insertError?.message ?? "Could not create the listing." };

  await supabase
    .from("business_join_requests")
    .update({
      status: "approved",
      converted_listing_type: request.category,
      converted_listing_id: created.id,
      converted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", requestId);

  await logActivity("create", table, created.id, { fromJoinRequest: requestId, partnerStatus: targetPartnerStatus });
  revalidatePath(`/${locale}/admin/requests`);
  revalidatePath(`/${locale}/admin/partners`);
  revalidatePath(`/${locale}/admin/${table}`);
  revalidatePath(`/${locale}/${table}`);

  return { ok: true, listingId: created.id, table };
}

export interface JoinRequestEditInput {
  businessName: string;
  phone: string;
  whatsapp?: string;
  email: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  address: string;
  city: string;
  district?: string;
  description: string;
}

/** Admin quick-edit — corrects a typo'd phone number, tidies up the
 * description, etc. before approving/converting. Doesn't touch
 * images/hours/amenities/location — those came from the applicant's own
 * upload/picker and are left as submitted. */
export async function updateJoinRequest(
  locale: string,
  requestId: string,
  input: JoinRequestEditInput
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertOwner();

  const businessName = input.businessName.trim();
  const phone = input.phone.trim();
  const email = input.email.trim();
  const address = input.address.trim();
  const city = input.city.trim();
  const description = input.description.trim();

  if (!businessName || !phone || !email || !address || !city || !description) {
    return { ok: false, error: "Please fill in all required fields." };
  }
  if (!EMAIL_RE.test(email)) {
    return { ok: false, error: "Please enter a valid email address." };
  }

  const { error } = await supabase
    .from("business_join_requests")
    .update({
      business_name: businessName,
      phone,
      whatsapp: input.whatsapp?.trim() || null,
      email,
      website: input.website?.trim() || null,
      instagram: input.instagram?.trim() || null,
      facebook: input.facebook?.trim() || null,
      address,
      city,
      district: input.district?.trim() || null,
      description,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", requestId);

  if (error) return { ok: false, error: error.message };

  await logActivity("update", "business_join_request", requestId, { edited: true });
  revalidatePath(`/${locale}/admin/requests`);
  return { ok: true };
}
