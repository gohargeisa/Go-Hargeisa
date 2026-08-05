import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireListingsAccess } from "@/lib/supabase/guards";
import { mapReview, mapBusinessOffer } from "./mappers";
import type { Locale } from "@/lib/i18n/config";
import type { BusinessListingType, Booking, BusinessSubscription, BusinessMessage, Review, BusinessOffer } from "@/types";

export interface OwnedListing {
  listingType: BusinessListingType;
  id: string;
  slug: string;
  name: string;
  logo?: string;
  coverImage: string;
  address: string;
  phone?: string;
  website?: string;
  rating: number;
  reviewCount: number;
  createdAt: string;
  /** amenities (hotel) | cuisine (restaurant) | specialDrinks (cafe) — same field TagInput already edits per type. */
  serviceTags: string[];
  /** Real profile-completeness signals for PerformanceTips — no extra query, read straight off the same row. */
  hasDescription: boolean;
  galleryCount: number;
  /** 'trial' listings have a linked owner_id but no dashboard access yet —
   * see app/[locale]/business/layout.tsx, which is what actually enforces this. */
  partnerStatus: "trial" | "official";
}

function galleryLength(gallery: unknown): number {
  return Array.isArray(gallery) ? gallery.length : 0;
}

/**
 * Every listing table a business_owner row could be attached to. Reads all
 * three in parallel — RLS's owner_id = auth.uid() UPDATE policies don't
 * restrict SELECT (hotels/restaurants/cafes are all publicly readable when
 * published), so this scopes with an explicit .eq("owner_id", userId)
 * rather than relying on RLS to do the filtering.
 */
async function _getOwnedListings(userId: string): Promise<OwnedListing[]> {
  const supabase = await createClient();

  const [{ data: hotels }, { data: restaurants }, { data: cafes }, { data: services }] = await Promise.all([
    supabase.from("hotels").select("*").eq("owner_id", userId),
    supabase.from("restaurants").select("*").eq("owner_id", userId),
    supabase.from("cafes").select("*").eq("owner_id", userId),
    supabase.from("services").select("*").eq("owner_id", userId),
  ]);

  const out: OwnedListing[] = [];

  for (const h of hotels ?? []) {
    out.push({
      listingType: "hotel",
      id: h.id,
      slug: h.slug,
      name: h.name,
      logo: h.logo_url ?? undefined,
      coverImage: h.cover_image,
      address: h.address,
      phone: h.phone ?? undefined,
      website: h.website ?? undefined,
      rating: Number(h.rating),
      reviewCount: h.review_count,
      createdAt: h.created_at,
      serviceTags: h.amenities ?? [],
      hasDescription: Boolean(h.description?.trim()),
      galleryCount: galleryLength(h.gallery),
      partnerStatus: h.partner_status,
    });
  }
  for (const r of restaurants ?? []) {
    out.push({
      listingType: "restaurant",
      id: r.id,
      slug: r.slug,
      name: r.name,
      logo: r.logo_url ?? undefined,
      coverImage: r.cover_image,
      address: r.address,
      phone: r.phone ?? undefined,
      website: r.website ?? undefined,
      rating: Number(r.rating),
      reviewCount: r.review_count,
      createdAt: r.created_at,
      serviceTags: r.cuisine ?? [],
      hasDescription: Boolean(r.description?.trim()),
      galleryCount: galleryLength(r.gallery),
      partnerStatus: r.partner_status,
    });
  }
  for (const c of cafes ?? []) {
    out.push({
      listingType: "cafe",
      id: c.id,
      slug: c.slug,
      name: c.name,
      logo: c.logo_url ?? undefined,
      coverImage: c.cover_image,
      address: c.address,
      phone: c.phone ?? undefined,
      website: undefined,
      rating: Number(c.rating),
      reviewCount: c.review_count,
      createdAt: c.created_at,
      serviceTags: c.special_drinks ?? [],
      hasDescription: Boolean(c.description?.trim()),
      galleryCount: galleryLength(c.gallery),
      partnerStatus: c.partner_status,
    });
  }
  // Services has no partner_status/logo_url column — there's no trial
  // flow for this listing type (owner_id is set directly by an admin, not
  // via a convertJoinRequest-style upgrade path), so every service owner
  // is treated as "official" and gets dashboard access immediately.
  for (const s of services ?? []) {
    out.push({
      listingType: "service",
      id: s.id,
      slug: s.slug,
      name: s.name,
      logo: undefined,
      coverImage: s.cover_image,
      address: s.address,
      phone: s.phone ?? undefined,
      website: s.website ?? undefined,
      rating: Number(s.rating),
      reviewCount: s.review_count,
      createdAt: s.created_at,
      serviceTags: s.services ?? [],
      hasDescription: Boolean(s.description?.trim()),
      galleryCount: galleryLength(s.gallery),
      partnerStatus: "official",
    });
  }

  return out;
}

/** Cached per-request: the /business layout and every sub-page independently need this — dedupes the 3 owner_id lookups to one. */
export const getOwnedListings = cache(_getOwnedListings);

/**
 * Every /business/* page starts the same way: confirm the signed-in user is
 * an owner/business_owner, then resolve which listing they're managing.
 * Redirects to login (via requireListingsAccess) or renders nothing further
 * if they have zero listings — callers should treat a null return as "show
 * the empty state", not an error.
 */
export async function getActiveListing(locale: Locale, redirectTo: string): Promise<OwnedListing | null> {
  const access = await requireListingsAccess(locale, redirectTo);
  if (!access) redirect(`/${locale}/auth/login?next=${encodeURIComponent(redirectTo)}`);

  const listings = await getOwnedListings(access.userId);
  return listings[0] ?? null;
}

/** The signed-in business owner's display name + email — used by the header and everywhere ContactSupportButton needs a "from" identity. */
export const getOwnerProfile = cache(async function _getOwnerProfile(): Promise<{ name: string; email: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { name: "Owner", email: "" };

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  return { name: profile?.full_name || user.email || "Owner", email: user.email ?? "" };
});

export interface BookingsKpi {
  total: number;
  today: number;
  yesterday: number;
  growthPercent: number | null;
}

export async function getBookingsKpi(hotelId: string): Promise<BookingsKpi> {
  const supabase = await createClient();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const [{ count: total }, { data: recent }] = await Promise.all([
    supabase.from("bookings").select("id", { count: "exact", head: true }).eq("hotel_id", hotelId),
    supabase.from("bookings").select("created_at").eq("hotel_id", hotelId).gte("created_at", startOfYesterday.toISOString()),
  ]);

  let today = 0;
  let yesterday = 0;
  for (const row of recent ?? []) {
    if (new Date(row.created_at) >= startOfToday) today += 1;
    else yesterday += 1;
  }
  const growthPercent = yesterday === 0 ? (today > 0 ? 100 : null) : Math.round(((today - yesterday) / yesterday) * 100);

  return { total: total ?? 0, today, yesterday, growthPercent };
}

export interface KpiStat {
  eventType: "view" | "website_click" | "call_click" | "whatsapp_click";
  today: number;
  yesterday: number;
  /** null when there's no yesterday data to compare against yet (too early to show a %). */
  growthPercent: number | null;
}

const EVENT_TYPES: KpiStat["eventType"][] = ["view", "website_click", "call_click", "whatsapp_click"];

/** One query for all 4 event types across today+yesterday, bucketed here instead of 8 round trips. */
export async function getKpiStats(listingType: BusinessListingType, listingId: string): Promise<KpiStat[]> {
  const supabase = await createClient();
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfYesterday = new Date(startOfToday);
  startOfYesterday.setDate(startOfYesterday.getDate() - 1);

  const { data } = await supabase
    .from("business_metric_events")
    .select("event_type, created_at")
    .eq("listing_type", listingType)
    .eq("listing_id", listingId)
    .gte("created_at", startOfYesterday.toISOString());

  const counts: Record<string, { today: number; yesterday: number }> = {};
  for (const type of EVENT_TYPES) counts[type] = { today: 0, yesterday: 0 };

  for (const row of data ?? []) {
    const created = new Date(row.created_at);
    const bucket = counts[row.event_type];
    if (!bucket) continue;
    if (created >= startOfToday) bucket.today += 1;
    else bucket.yesterday += 1;
  }

  return EVENT_TYPES.map((eventType) => {
    const { today, yesterday } = counts[eventType];
    const growthPercent = yesterday === 0 ? (today > 0 ? 100 : null) : Math.round(((today - yesterday) / yesterday) * 100);
    return { eventType, today, yesterday, growthPercent };
  });
}

export interface ViewsSeriesPoint {
  label: string;
  count: number;
}

export type AnalyticsRange = "7d" | "30d" | "90d" | "12m";

/** "Views during the last N days" chart data — day-bucketed for 7d/30d/90d, month-bucketed for 12m. */
export async function getViewsSeries(
  listingType: BusinessListingType,
  listingId: string,
  range: AnalyticsRange
): Promise<ViewsSeriesPoint[]> {
  const supabase = await createClient();
  const now = new Date();
  const byMonth = range === "12m";
  const days = { "7d": 7, "30d": 30, "90d": 90, "12m": 365 }[range];
  const since = new Date(now);
  since.setDate(since.getDate() - days);

  const { data } = await supabase
    .from("business_metric_events")
    .select("created_at")
    .eq("listing_type", listingType)
    .eq("listing_id", listingId)
    .eq("event_type", "view")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true });

  const buckets = new Map<string, number>();
  for (const row of data ?? []) {
    const d = new Date(row.created_at);
    const key = byMonth
      ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
      : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }

  const points: ViewsSeriesPoint[] = [];
  if (byMonth) {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      points.push({ label: d.toLocaleDateString("en-US", { month: "short" }), count: buckets.get(key) ?? 0 });
    }
  } else {
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      points.push({ label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }), count: buckets.get(key) ?? 0 });
    }
  }
  return points;
}

function mapBooking(row: {
  id: string; hotel_id: string; room_id: string | null; guest_name: string; guest_phone: string | null;
  guest_email: string | null; guest_country?: string | null; guests_count: number; check_in: string; check_out: string;
  status: Booking["status"]; notes: string | null; created_at: string;
  adults?: number; children?: number; rooms_count?: number; booking_reference?: string | null;
  payment_status?: Booking["paymentStatus"]; payment_method?: string | null; user_id?: string | null;
  hotel_rooms?: { name: string } | null;
  hotels?: { name: string; slug: string } | null;
}): Booking {
  return {
    id: row.id,
    hotelId: row.hotel_id,
    hotelName: row.hotels?.name,
    hotelSlug: row.hotels?.slug,
    roomId: row.room_id ?? undefined,
    roomName: row.hotel_rooms?.name,
    guestName: row.guest_name,
    guestPhone: row.guest_phone ?? undefined,
    guestEmail: row.guest_email ?? undefined,
    guestCountry: row.guest_country ?? undefined,
    guestsCount: row.guests_count,
    adults: row.adults ?? row.guests_count ?? 1,
    children: row.children ?? 0,
    roomsCount: row.rooms_count ?? 1,
    checkIn: row.check_in,
    checkOut: row.check_out,
    status: row.status,
    notes: row.notes ?? undefined,
    bookingReference: row.booking_reference ?? undefined,
    paymentStatus: row.payment_status ?? "unpaid",
    paymentMethod: row.payment_method ?? undefined,
    userId: row.user_id ?? undefined,
    createdAt: row.created_at,
  };
}

export async function getBookingsForHotel(hotelId: string, limit?: number): Promise<Booking[]> {
  const supabase = await createClient();
  let query = supabase
    .from("bookings")
    .select("*, hotel_rooms(name)")
    .eq("hotel_id", hotelId)
    .order("check_in", { ascending: false });
  if (limit) query = query.limit(limit);

  const { data } = await query;
  return (data ?? []).map((row: any) => mapBooking(row));
}

export interface BlockedDate {
  roomId: string;
  date: string;
  note?: string;
}

/** Owner-blocked dates across every room of a hotel — the booking calendar
 * overlays these (gray) on top of real bookings (colored by status). */
export async function getBlockedDatesForHotel(hotelId: string): Promise<BlockedDate[]> {
  const supabase = await createClient();
  const { data: roomIds } = await supabase.from("hotel_rooms").select("id").eq("hotel_id", hotelId);
  const ids = (roomIds ?? []).map((r) => (r as { id: string }).id);
  if (ids.length === 0) return [];

  const { data } = await supabase
    .from("room_availability" as any)
    .select("room_id, date, note")
    .in("room_id", ids)
    .eq("is_available", false);

  return (data ?? []).map((row: any) => ({ roomId: row.room_id, date: row.date, note: row.note ?? undefined }));
}

/** The signed-in guest's own bookings, across every hotel — powers the user
 * dashboard's "My Bookings" tab. Requires the "Users view their own
 * bookings" RLS policy (user_id = auth.uid()); only bookings submitted while
 * logged in ever get a user_id, so anonymous guest requests won't show up
 * here even for the same person. */
export async function getMyBookings(): Promise<Booking[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("bookings")
    .select("*, hotel_rooms(name), hotels(name, slug)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row: any) => mapBooking(row));
}

/** Every booking platform-wide — admin-only (backed by the "Owners manage
 * all bookings" RLS policy). Powers /admin/bookings' filter/search/export. */
export async function getAllBookingsForAdmin(): Promise<Booking[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select("*, hotel_rooms(name), hotels(name, slug)")
    .order("created_at", { ascending: false });

  return (data ?? []).map((row: any) => mapBooking(row));
}

/** A single booking, scoped to the signed-in guest who made it — powers the
 * print-friendly confirmation page. Returns null if it doesn't exist or
 * belongs to someone else (RLS backs this up; the explicit .eq is just so
 * this reads as "not found" rather than an empty-row surprise). */
export async function getMyBookingById(bookingId: string): Promise<Booking | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("bookings")
    .select("*, hotel_rooms(name), hotels(name, slug)")
    .eq("id", bookingId)
    .eq("user_id", user.id)
    .single();

  return data ? mapBooking(data as any) : null;
}

export async function getReviewsForListing(listingType: BusinessListingType, listingId: string): Promise<Review[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*, profiles(full_name)")
    .eq("listing_type", listingType)
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((row: any) => mapReview(row, row.profiles?.full_name ?? "Guest"));
}

/** Reads (or lazily creates, defaulting to 'basic') the subscription row for a listing. */
export async function getOrCreateSubscription(
  listingType: BusinessListingType,
  listingId: string
): Promise<BusinessSubscription> {
  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("business_subscriptions")
    .select("*")
    .eq("listing_type", listingType)
    .eq("listing_id", listingId)
    .maybeSingle();

  if (existing) {
    return {
      id: existing.id,
      listingType,
      listingId,
      planTier: existing.plan_tier,
      status: existing.status,
      renewsAt: existing.renews_at ?? undefined,
    };
  }

  const { data: created } = await supabase
    .from("business_subscriptions")
    .insert({ listing_type: listingType, listing_id: listingId, plan_tier: "basic" } as never)
    .select("*")
    .single();

  return {
    id: created?.id ?? "",
    listingType,
    listingId,
    planTier: created?.plan_tier ?? "basic",
    status: created?.status ?? "active",
    renewsAt: created?.renews_at ?? undefined,
  };
}

export async function getOffersForListing(
  listingType: "hotel" | "restaurant" | "cafe",
  listingId: string
): Promise<BusinessOffer[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_offers")
    .select("*")
    .eq("listing_type", listingType)
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  return (data ?? []).map(mapBusinessOffer);
}

export async function getMessagesForListing(listingType: BusinessListingType, listingId: string): Promise<BusinessMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("business_messages")
    .select("*")
    .eq("listing_type", listingType)
    .eq("listing_id", listingId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((m) => ({
    id: m.id,
    listingType,
    listingId,
    senderName: m.sender_name,
    senderEmail: m.sender_email ?? undefined,
    senderPhone: m.sender_phone ?? undefined,
    message: m.message,
    isRead: m.is_read,
    createdAt: m.created_at,
  }));
}

export interface BusinessSummaryStats {
  totalViews: number;
  totalBookings: number;
  totalReviews: number;
  memberSince: string;
}

export async function getBusinessSummary(
  listing: OwnedListing
): Promise<BusinessSummaryStats> {
  const supabase = await createClient();

  const [{ count: totalViews }, bookingsCount] = await Promise.all([
    supabase
      .from("business_metric_events")
      .select("id", { count: "exact", head: true })
      .eq("listing_type", listing.listingType)
      .eq("listing_id", listing.id)
      .eq("event_type", "view"),
    listing.listingType === "hotel"
      ? supabase.from("bookings").select("id", { count: "exact", head: true }).eq("hotel_id", listing.id)
      : Promise.resolve({ count: 0 }),
  ]);

  return {
    totalViews: totalViews ?? 0,
    totalBookings: (bookingsCount as { count: number | null }).count ?? 0,
    totalReviews: listing.reviewCount,
    memberSince: listing.createdAt,
  };
}
