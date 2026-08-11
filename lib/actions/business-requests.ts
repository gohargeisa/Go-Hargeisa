"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { placeholderImage } from "@/lib/placeholder-image";
import { logActivity } from "./activity";
import { isConvertibleCategory } from "@/lib/utils/partner-categories";
import { getCategoryById } from "@/lib/data/categories";
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
  /** Selected codes from the referenced category's subcategory vocabulary —
   * either the services-offered vocabulary (Beauty Salons/Men's
   * Barbershops/Auto Repair & Services, see lib/config/service-tags.ts) or,
   * for Cosmetics & Women's Beauty, a curated subset of product categories
   * (see COSMETICS_SPECIALTY_CATEGORIES in lib/config/product-categories.ts).
   * Ignored unless categoryId is set. */
  serviceTags?: string[];
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
    // Long-tail `services` categories (Flower Shops, Real Estate, ...) and
    // City Services categories (Hospitals & Clinics, Pharmacies, ...) are
    // both valid "other" selections — the same dynamic category source the
    // /join form's dropdown reads from (see app/[locale]/join/page.tsx).
    // A City Services selection is never auto-convertible into a listing
    // (see isConvertibleCategory) — it stays an admin-reviewed lead, same
    // as any other non-convertible category.
    if (!cat || !cat.is_active || (cat.target_table !== "services" && cat.target_table !== "city_services")) {
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
    service_tags: input.category === "other" ? (input.serviceTags ?? []) : [],
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

  // Resolved once, up front, so both the convertibility check and (for
  // "other" requests) the actual insert branch below share the same
  // category lookup instead of duplicating it.
  const resolvedCategory = request.category_id ? await getCategoryById(request.category_id) : null;

  // Dynamic categories can live in either the general services table or
  // the City Services table. Both are valid conversion targets now.
  const isDynamicCategory =
    request.category === "other" &&
    Boolean(request.category_id) &&
    (resolvedCategory?.targetTable === "services" ||
      resolvedCategory?.targetTable === "city_services");

  if (
    !isDynamicCategory &&
    !isConvertibleCategory(
      request.category,
      request.category_id,
      resolvedCategory?.targetTable
    )
  ) {
    return {
      ok: false,
      error: "This business type has no matching listing table to convert into.",
    };
  }

  const gallery =
    (request.gallery as { url: string; alt?: string; category?: string }[] | null) ?? [];
  const coverImage =
    request.cover_image ||
    gallery[0]?.url ||
    request.logo ||
    placeholderImage(request.business_name);
  const shortDescription =
    request.description.length > 160
      ? `${request.description.slice(0, 157)}...`
      : request.description;

  // ---------------------------------------------------------------------------
  // DYNAMIC "OTHER" CATEGORIES
  //
  // Categories submitted from the join form carry:
  //   category    = "other"
  //   category_id = the selected category UUID
  //   custom_fields = values entered for that category
  //
  // The selected category decides where the listing belongs:
  //   target_table = "services"      -> services
  //   target_table = "city_services" -> city_services
  //
  // This is important for categories such as Perfumes, which are currently
  // stored in categories.target_table = "city_services".
  // ---------------------------------------------------------------------------
  if (request.category === "other") {
    if (!request.category_id || !resolvedCategory?.targetTable) {
      return {
        ok: false,
        error: "This business category cannot be converted into a listing.",
      };
    }

    const targetTable = resolvedCategory.targetTable;

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const categoryName =
      typeof (resolvedCategory as { name?: unknown } | null)?.name === "string"
        ? (resolvedCategory as { name: string }).name
        : null;

    if (targetTable === "city_services") {
      // city_services has its own narrower schema (see
      // lib/actions/city-services.ts's createCityService, the admin-form
      // insert path) — no address/owner_id/custom_fields columns exist on
      // this table (it predates the owner-claims model), and its image
      // column is named `image`, not `cover_image`. The legacy
      // `category` enum column is still NOT NULL (owner-dashboard.ts's
      // City Coverage KPI reads it directly) and must be derived from the
      // resolved category's slug, same as createCityService does.
      const { data: slugTaken } = await supabase
        .from("city_services")
        .select("id, name, category_id")
        .eq("slug", slug)
        .maybeSingle();

      if (slugTaken) {
        // Same slug + same business name + same category is the exact
        // fingerprint of THIS request's own earlier attempt having already
        // created the listing but failed to link back to it (see below —
        // the listing_type_business enum write) rather than a genuinely
        // different business independently choosing the same slug. Link
        // the existing row instead of erroring or creating a duplicate.
        // Any other match (different name/category) is a real collision —
        // never silently attach an unrelated business to someone else's
        // listing.
        const sameBusiness = slugTaken.name === request.business_name && slugTaken.category_id === request.category_id;

        if (!sameBusiness) {
          return {
            ok: false,
            error: "That slug is already in use — please choose another.",
          };
        }

        const { error: linkError } = await supabase
          .from("business_join_requests")
          .update({
            status: "approved",
            converted_listing_id: slugTaken.id,
            converted_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          } as never)
          .eq("id", requestId);

        if (linkError) {
          return { ok: false, error: linkError.message };
        }

        revalidatePath(`/${locale}/admin/requests`);
        revalidatePath(`/${locale}/admin/city-services`);
        revalidatePath(`/${locale}/city-services`);
        revalidatePath(`/${locale}/services`);

        return { ok: true, listingId: slugTaken.id, table: "city_services" };
      }

      const legacyCategoryEnum = resolvedCategory.slug.replace(/-/g, "_");

      const cityServicePayload: Record<string, unknown> = {
        slug,
        name: request.business_name,
        category_id: request.category_id,
        category: legacyCategoryEnum,
        description: request.description,
        lat: completion.lat,
        lng: completion.lng,
        phone: request.phone,
        website: request.website ?? null,
        image: coverImage,
        gallery,
        service_tags: request.service_tags ?? [],
      };

      const { data: created, error: insertError } = await supabase
        .from("city_services")
        .insert(cityServicePayload as never)
        .select("id")
        .single();

      if (insertError || !created) {
        return {
          ok: false,
          error:
            insertError?.message ??
            "Could not create the City Services listing.",
        };
      }

      // converted_listing_type is deliberately NOT set to "city_service"
      // here: the listing_type_business Postgres enum was never extended
      // with that value (a migration for it exists but is not yet
      // applied), so writing it fails outright — confirmed by a real
      // production incident where this exact insert succeeded but this
      // update then failed, leaving the request's converted_listing_id
      // NULL despite the listing existing (the slugTaken branch above
      // exists specifically to self-heal that state on a retry). Leaving
      // converted_listing_type NULL lets converted_listing_id — the one
      // idempotency actually depends on — get set successfully today,
      // at the cost of the admin requests list not being able to build a
      // direct "View listing" link for city_service rows until that
      // migration lands (the listing itself remains fully manageable via
      // /admin/city-services in the meantime).
      const { error: updateError } = await supabase
        .from("business_join_requests")
        .update({
          status: "approved",
          converted_listing_id: created.id,
          converted_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as never)
        .eq("id", requestId);

      if (updateError) {
        // Keep the two tables consistent — an unlinked listing is exactly
        // the broken state this whole branch exists to avoid, and leaving
        // it in place would only surface as a confusing slug collision on
        // the next retry.
        await supabase.from("city_services").delete().eq("id", created.id);
        return { ok: false, error: updateError.message };
      }

      await logActivity("create", "city_services", created.id, {
        fromJoinRequest: requestId,
        categoryId: request.category_id,
        categoryName,
        partnerStatus: targetPartnerStatus,
      });

      revalidatePath(`/${locale}/admin/requests`);
      revalidatePath(`/${locale}/admin/partners`);
      revalidatePath(`/${locale}/admin/city-services`);
      revalidatePath(`/${locale}/city-services`);
      revalidatePath(`/${locale}/services`);

      return {
        ok: true,
        listingId: created.id,
        table: "city_services",
      };
    }

    if (targetTable !== "services") {
      return {
        ok: false,
        error: "This business category cannot be converted into a service listing.",
      };
    }

    const { data: slugTaken } = await supabase
      .from("services")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    if (slugTaken) {
      return {
        ok: false,
        error: "That slug is already in use — please choose another.",
      };
    }

    const servicePayload: Record<string, unknown> = {
      slug,
      name: request.business_name,
      short_description: shortDescription,
      description: request.description,
      cover_image: coverImage,
      gallery,
      address: request.address,
      lat: completion.lat,
      lng: completion.lng,
      phone: request.phone,
      website: request.website ?? null,
      owner_id: user?.id ?? null,
      category_id: request.category_id,
      custom_fields: request.custom_fields ?? {},
      services: categoryName ? [categoryName] : [],
    };

    const { data: created, error: insertError } = await supabase
      .from("services")
      .insert(servicePayload as never)
      .select("id")
      .single();

    if (insertError || !created) {
      return {
        ok: false,
        error:
          insertError?.message ??
          "Could not create the service listing.",
      };
    }

    const { error: updateError } = await supabase
      .from("business_join_requests")
      .update({
        status: "approved",
        converted_listing_type: "service",
        converted_listing_id: created.id,
        converted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      } as never)
      .eq("id", requestId);

    if (updateError) {
      return { ok: false, error: updateError.message };
    }

    await logActivity("create", "services", created.id, {
      fromJoinRequest: requestId,
      categoryId: request.category_id,
      partnerStatus: targetPartnerStatus,
    });

    revalidatePath(`/${locale}/admin/requests`);
    revalidatePath(`/${locale}/admin/partners`);
    revalidatePath(`/${locale}/admin/services`);
    revalidatePath(`/${locale}/services`);

    return {
      ok: true,
      listingId: created.id,
      table: "services",
    };
  }

  // ---------------------------------------------------------------------------
  // FIXED CATEGORIES: HOTEL / RESTAURANT / CAFE
  // ---------------------------------------------------------------------------

  let table: "hotels" | "restaurants" | "cafes";

  if (request.category === "hotel") {
    table = "hotels";
  } else if (request.category === "restaurant") {
    table = "restaurants";
  } else {
    table = "cafes";
  }

  const { data: slugTaken } = await supabase
    .from(table)
    .select("id")
    .eq("slug", slug)
    .maybeSingle();

  if (slugTaken) {
    return {
      ok: false,
      error: "That slug is already in use — please choose another.",
    };
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

  if (request.price_range) {
    basePayload.price_range = request.price_range;
  }

  // Only hotels has a free-form amenities column that matches the join
  // form's vocabulary 1:1. Restaurants/cafes use their own fixed fields.
  if (
    table === "hotels" &&
    request.amenities &&
    request.amenities.length > 0
  ) {
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

  const { data: created, error: insertError } = await supabase
    .from(table)
    .insert(basePayload as never)
    .select("id")
    .single();

  if (insertError || !created) {
    return {
      ok: false,
      error:
        insertError?.message ??
        "Could not create the listing.",
    };
  }

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

  await logActivity("create", table, created.id, {
    fromJoinRequest: requestId,
    partnerStatus: targetPartnerStatus,
  });

  revalidatePath(`/${locale}/admin/requests`);
  revalidatePath(`/${locale}/admin/partners`);
  revalidatePath(`/${locale}/admin/${table}`);
  revalidatePath(`/${locale}/${table}`);

  return {
    ok: true,
    listingId: created.id,
    table,
  };
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