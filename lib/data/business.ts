import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { listingKey } from "@/lib/utils/listing-key";
import { requireBusinessAccess } from "@/lib/supabase/guards";
import { mapReview, mapBusinessOffer } from "./mappers";
import type { Locale } from "@/lib/i18n/config";
import type { Database } from "@/types/database";
import type { BusinessListingType, Booking, BusinessSubscription, BusinessMessage, Review, BusinessOffer, BusinessPermissions } from "@/types";

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
  /** Admin-only override, independent of partnerStatus/listing status — see
   * 20260830000001_partner_suspension_and_status_parity.sql. A suspended
   * listing is invisible on the public site but the owner still reaches
   * their dashboard (business/layout.tsx shows a banner, doesn't block
   * access) so they can see why and get in touch. */
  isSuspended: boolean;
  /** True for any listing the universal cart/order system is enabled on:
   * city_service/service via their category's supports_products flag (see
   * lib/data/categories.ts's mapCategory), cafe/restaurant via their own
   * ordering_enabled column. Always false for hotel, which has neither.
   * Drives the conditional "Products"/"Doctors"/"Appointments" nav items in
   * business-sidebar.tsx. */
  supportsProducts: boolean;
  supportsAppointments: boolean;
  /** Same category-capability-flag pattern as supportsProducts — gates the
   * "Requests"/"Event Requests" nav items in business-sidebar.tsx. Always
   * false for hotel/restaurant/cafe, which have no purchase/event-request
   * capability flags of their own. */
  supportsPurchaseRequests: boolean;
  supportsEventRequests: boolean;
  /** city_service listings only — see lib/utils/appointment-domain.ts,
   * which uses this to decide whether the shared doctors/appointments
   * engine's dashboard copy should read as medical (Hospital/Clinic) or
   * generic (every other supportsAppointments category, e.g. Beauty Salon). */
  categorySlug?: string;
  /** "owner" — a Business Partner's own listing, via owner_id, full access
   * (permissions is undefined/ignored). "granted" — a Team Member's access
   * via an active business_access_grants row; `permissions` is that row's
   * jsonb and the dashboard must gate actions by it. Defaults to "owner"
   * everywhere getOwnedListings has always been used, so no existing call
   * site needs to change. */
  accessKind?: "owner" | "granted";
  permissions?: BusinessPermissions;
}

function galleryLength(gallery: unknown): number {
  return Array.isArray(gallery) ? gallery.length : 0;
}

type ListingAccess = { accessKind: "owner" | "granted"; permissions?: BusinessPermissions };

// Each of these turns one raw row (as returned by the exact `.select(...)`
// shapes below) into an OwnedListing — shared between _getOwnedListings
// (queries by owner_id) and _getGrantedListings (queries by id, for rows a
// team member was explicitly granted access to) so the two query paths
// never duplicate this field-mapping.
function hotelRowToListing(h: HotelQueryRow, access: ListingAccess): OwnedListing {
  return {
    listingType: "hotel", id: h.id, slug: h.slug, name: h.name,
    logo: h.logo_url ?? undefined, coverImage: h.cover_image, address: h.address,
    phone: h.phone ?? undefined, website: h.website ?? undefined,
    rating: Number(h.rating), reviewCount: h.review_count, createdAt: h.created_at,
    serviceTags: h.amenities ?? [], hasDescription: Boolean(h.description?.trim()),
    galleryCount: galleryLength(h.gallery), partnerStatus: h.partner_status,
    isSuspended: h.is_suspended ?? false, supportsProducts: false, supportsAppointments: false,
    supportsPurchaseRequests: false, supportsEventRequests: false,
    ...access,
  };
}

function restaurantRowToListing(r: RestaurantQueryRow, access: ListingAccess): OwnedListing {
  return {
    listingType: "restaurant", id: r.id, slug: r.slug, name: r.name,
    logo: r.logo_url ?? undefined, coverImage: r.cover_image, address: r.address,
    phone: r.phone ?? undefined, website: r.website ?? undefined,
    rating: Number(r.rating), reviewCount: r.review_count, createdAt: r.created_at,
    serviceTags: r.cuisine ?? [], hasDescription: Boolean(r.description?.trim()),
    galleryCount: galleryLength(r.gallery), partnerStatus: r.partner_status,
    isSuspended: r.is_suspended ?? false, supportsProducts: r.ordering_enabled ?? false, supportsAppointments: false,
    supportsPurchaseRequests: false, supportsEventRequests: false,
    ...access,
  };
}

function cafeRowToListing(c: CafeQueryRow, access: ListingAccess): OwnedListing {
  return {
    listingType: "cafe", id: c.id, slug: c.slug, name: c.name,
    logo: c.logo_url ?? undefined, coverImage: c.cover_image, address: c.address,
    phone: c.phone ?? undefined, website: undefined,
    rating: Number(c.rating), reviewCount: c.review_count, createdAt: c.created_at,
    serviceTags: c.special_drinks ?? [], hasDescription: Boolean(c.description?.trim()),
    galleryCount: galleryLength(c.gallery), partnerStatus: c.partner_status,
    isSuspended: c.is_suspended ?? false, supportsProducts: c.ordering_enabled ?? false, supportsAppointments: false,
    supportsPurchaseRequests: false, supportsEventRequests: false,
    ...access,
  };
}

// Services has no logo_url column and (as of 20260830000001) DOES have a
// partner_status column, but no UI ever sets it to 'trial' — there's no
// trial flow for this listing type (owner_id is set directly by an admin,
// not via a convertJoinRequest-style upgrade path), so every service
// owner is still treated as "official" here and gets dashboard access
// immediately, regardless of what /admin/partners' Trial/Official toggle
// (which IS wired up for services now) actually shows.
function serviceRowToListing(s: ServiceQueryRow, access: ListingAccess): OwnedListing {
  const category = s.categories;
  return {
    listingType: "service", id: s.id, slug: s.slug, name: s.name,
    logo: undefined, coverImage: s.cover_image, address: s.address,
    phone: s.phone ?? undefined, website: s.website ?? undefined,
    rating: Number(s.rating), reviewCount: s.review_count, createdAt: s.created_at,
    serviceTags: s.services ?? [], hasDescription: Boolean(s.description?.trim()),
    galleryCount: galleryLength(s.gallery), partnerStatus: "official",
    isSuspended: s.is_suspended ?? false,
    supportsProducts: category?.supports_products ?? false, supportsAppointments: category?.supports_appointments ?? false,
    supportsPurchaseRequests: category?.supports_purchase_requests ?? false, supportsEventRequests: category?.supports_event_requests ?? false,
    categorySlug: category?.slug,
    ...access,
  };
}

// city_services (as of 20260830000001) DOES have a partner_status column
// too, same "no trial flow, always official" rationale as `services`
// above — owner_id is set directly by an admin (transferOwnership). No
// address column either (city_services only stores lat/lng + maps_url) —
// "" rather than undefined since OwnedListing.address is required.
function cityServiceRowToListing(cs: CityServiceQueryRow, access: ListingAccess): OwnedListing {
  const category = cs.categories;
  return {
    listingType: "city_service", id: cs.id, slug: cs.slug, name: cs.name,
    logo: undefined, coverImage: cs.image ?? "", address: "",
    phone: cs.phone ?? undefined, website: cs.website ?? undefined,
    rating: Number(cs.rating), reviewCount: cs.review_count, createdAt: cs.created_at,
    serviceTags: cs.amenities_v2 ?? [], hasDescription: Boolean(cs.description?.trim()),
    galleryCount: galleryLength(cs.gallery), partnerStatus: "official",
    isSuspended: cs.is_suspended ?? false,
    supportsProducts: category?.supports_products ?? false, supportsAppointments: category?.supports_appointments ?? false,
    supportsPurchaseRequests: category?.supports_purchase_requests ?? false, supportsEventRequests: category?.supports_event_requests ?? false,
    categorySlug: category?.slug,
    ...access,
  };
}

type CategoryJoin = {
  supports_products: boolean; supports_appointments: boolean;
  supports_purchase_requests: boolean; supports_event_requests: boolean;
  slug: string;
} | null;
type HotelQueryRow = Database["public"]["Tables"]["hotels"]["Row"];
type RestaurantQueryRow = Database["public"]["Tables"]["restaurants"]["Row"];
type CafeQueryRow = Database["public"]["Tables"]["cafes"]["Row"];
type ServiceQueryRow = Database["public"]["Tables"]["services"]["Row"] & { categories: CategoryJoin };
type CityServiceQueryRow = Database["public"]["Tables"]["city_services"]["Row"] & { categories: CategoryJoin };

const OWNER_ACCESS: ListingAccess = { accessKind: "owner" };

/**
 * Every listing table a business_owner row could be attached to. Reads all
 * three in parallel — RLS's owner_id = auth.uid() UPDATE policies don't
 * restrict SELECT (hotels/restaurants/cafes are all publicly readable when
 * published), so this scopes with an explicit .eq("owner_id", userId)
 * rather than relying on RLS to do the filtering.
 */
async function _getOwnedListings(userId: string): Promise<OwnedListing[]> {
  const supabase = await createClient();

  const [{ data: hotels }, { data: restaurants }, { data: cafes }, { data: services }, { data: cityServices }] = await Promise.all([
    supabase.from("hotels").select("*").eq("owner_id", userId),
    supabase.from("restaurants").select("*").eq("owner_id", userId),
    supabase.from("cafes").select("*").eq("owner_id", userId),
    supabase.from("services").select("*, categories(supports_products, supports_appointments, supports_purchase_requests, supports_event_requests, slug)").eq("owner_id", userId),
    supabase
      .from("city_services")
      .select("*, categories(supports_products, supports_appointments, supports_purchase_requests, supports_event_requests, slug)")
      .eq("owner_id", userId),
  ]);

  const out: OwnedListing[] = [];
  for (const h of hotels ?? []) out.push(hotelRowToListing(h, OWNER_ACCESS));
  for (const r of restaurants ?? []) out.push(restaurantRowToListing(r, OWNER_ACCESS));
  for (const c of cafes ?? []) out.push(cafeRowToListing(c, OWNER_ACCESS));
  for (const s of (services ?? []) as unknown as ServiceQueryRow[]) out.push(serviceRowToListing(s, OWNER_ACCESS));
  for (const cs of (cityServices ?? []) as unknown as CityServiceQueryRow[]) out.push(cityServiceRowToListing(cs, OWNER_ACCESS));

  return out;
}

/**
 * Every listing a Team Member has been explicitly granted access to (via an
 * active business_access_grants row) — NOT businesses they own. Queries
 * business_access_grants first, groups the granted ids by listing_type,
 * then fetches only those specific rows from each table (never the whole
 * table) so a team member's access is bounded to exactly what was granted,
 * mirroring the same owner_id-scoping discipline _getOwnedListings uses.
 */
async function _getGrantedListings(userId: string): Promise<OwnedListing[]> {
  const supabase = await createClient();

  const { data: rawGrants } = await supabase
    .from("business_access_grants")
    .select("listing_type, listing_id, permissions")
    .eq("user_id", userId)
    .eq("is_active", true);
  const grants = (rawGrants ?? []) as { listing_type: BusinessListingType; listing_id: string; permissions: BusinessPermissions }[];
  if (grants.length === 0) return [];

  const idsByType: Record<BusinessListingType, string[]> = { hotel: [], restaurant: [], cafe: [], service: [], city_service: [] };
  const permsByKey = new Map<string, BusinessPermissions>();
  for (const g of grants) {
    idsByType[g.listing_type].push(g.listing_id);
    permsByKey.set(`${g.listing_type}:${g.listing_id}`, (g.permissions ?? {}) as BusinessPermissions);
  }
  function accessFor(listingType: BusinessListingType, id: string): ListingAccess {
    return { accessKind: "granted", permissions: permsByKey.get(`${listingType}:${id}`) ?? {} };
  }

  const [{ data: hotels }, { data: restaurants }, { data: cafes }, { data: services }, { data: cityServices }] = await Promise.all([
    idsByType.hotel.length ? supabase.from("hotels").select("*").in("id", idsByType.hotel) : Promise.resolve({ data: [] as HotelQueryRow[] }),
    idsByType.restaurant.length ? supabase.from("restaurants").select("*").in("id", idsByType.restaurant) : Promise.resolve({ data: [] as RestaurantQueryRow[] }),
    idsByType.cafe.length ? supabase.from("cafes").select("*").in("id", idsByType.cafe) : Promise.resolve({ data: [] as CafeQueryRow[] }),
    idsByType.service.length
      ? supabase.from("services").select("*, categories(supports_products, supports_appointments, supports_purchase_requests, supports_event_requests, slug)").in("id", idsByType.service)
      : Promise.resolve({ data: [] as ServiceQueryRow[] }),
    idsByType.city_service.length
      ? supabase.from("city_services").select("*, categories(supports_products, supports_appointments, supports_purchase_requests, supports_event_requests, slug)").in("id", idsByType.city_service)
      : Promise.resolve({ data: [] as CityServiceQueryRow[] }),
  ]);

  const out: OwnedListing[] = [];
  for (const h of hotels ?? []) out.push(hotelRowToListing(h, accessFor("hotel", h.id)));
  for (const r of restaurants ?? []) out.push(restaurantRowToListing(r, accessFor("restaurant", r.id)));
  for (const c of cafes ?? []) out.push(cafeRowToListing(c, accessFor("cafe", c.id)));
  for (const s of (services ?? []) as unknown as ServiceQueryRow[]) out.push(serviceRowToListing(s, accessFor("service", s.id)));
  for (const cs of (cityServices ?? []) as unknown as CityServiceQueryRow[]) out.push(cityServiceRowToListing(cs, accessFor("city_service", cs.id)));

  return out;
}

/** Everything a user can reach on the /business dashboard: what they own
 * (full access) plus what's been explicitly granted to them as a team
 * member (scoped access). Used by the business switcher and layout so
 * both Business Partners and Team Members see the same kind of "My
 * Businesses" list, each entry carrying enough info (accessKind,
 * permissions) for the UI to know what to show. */
export const getAccessibleListings = cache(async function _getAccessibleListings(userId: string): Promise<OwnedListing[]> {
  const [owned, granted] = await Promise.all([getOwnedListings(userId), _getGrantedListings(userId)]);
  return [...owned, ...granted];
});

/** Cached per-request: the /business layout and every sub-page independently need this — dedupes the 3 owner_id lookups to one. */
export const getOwnedListings = cache(_getOwnedListings);

/** Which of a business_owner's (possibly several — Lavender Café + Lavender
 * Flowers under one login is the canonical example) listings the dashboard
 * is currently scoped to. A plain cookie, not a DB column: nothing about
 * "which business am I looking at right now" is account state, it's this
 * browser session's UI selection, so it needs no migration and no RLS
 * change. Every actual read/write below this selection still re-derives its
 * candidate set from `listings` (itself owner_id-scoped server-side) and
 * re-checks ownership per call (assertCanManageListing) — this cookie can
 * only ever pick among listings the signed-in user already owns, tampered
 * or not, so it carries no authorization weight of its own. */
export const ACTIVE_BUSINESS_COOKIE = "gh_active_business";

/**
 * Picks the listing the dashboard should render right now: the cookie's
 * choice if it's still one of this user's OFFICIAL listings, else the first
 * official one (matches the dashboard's own "trial listings don't get
 * dashboard access yet" rule) — never a trial-only listing, and never a
 * listing this user no longer owns or has been granted.
 *
 * `listings` may mix accessKind: "owner" (a Business Partner's own listing,
 * full access) and "granted" (a Team Member's scoped access) — both are
 * eligible to become the active listing; the dashboard gates individual
 * actions by `listing.permissions` when accessKind is "granted".
 */
export async function selectActiveListing(listings: OwnedListing[]): Promise<OwnedListing | null> {
  const official = listings.filter((l) => l.partnerStatus === "official");
  if (official.length === 0) return null;

  const cookieStore = await cookies();
  const selected = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value;
  const match = selected ? official.find((l) => listingKey(l) === selected) : undefined;
  return match ?? official[0];
}

/**
 * Every /business/* page starts the same way: confirm the signed-in user is
 * an owner/business_owner/team-member-with-a-grant, then resolve which
 * listing they're managing. Redirects to login (via requireBusinessAccess)
 * or renders nothing further if they have zero accessible listings —
 * callers should treat a null return as "show the empty state", not an
 * error.
 */
export async function getActiveListing(locale: Locale, redirectTo: string): Promise<OwnedListing | null> {
  const access = await requireBusinessAccess(locale, redirectTo);
  if (!access) redirect(`/${locale}/auth/login?next=${encodeURIComponent(redirectTo)}`);

  const listings = await getAccessibleListings(access.userId);
  return selectActiveListing(listings);
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

/** Every appointment platform-wide — admin-only (backed by the "Platform
 * admin manages all appointments" RLS policy). Powers /admin/appointments,
 * mirroring getAllBookingsForAdmin above. */
export async function getAllAppointmentsForAdmin(): Promise<MyAppointment[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("appointments")
    .select("*, doctors(name, departments(name), city_services(name, slug))")
    .order("appointment_date", { ascending: false });

  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    doctorId: row.doctor_id,
    doctorName: row.doctors?.name ?? "",
    hospitalName: row.doctors?.city_services?.name ?? "",
    hospitalSlug: row.doctors?.city_services?.slug ?? "",
    departmentName: row.doctors?.departments?.name ?? undefined,
    patientName: row.patient_name,
    patientPhone: row.patient_phone,
    appointmentDate: row.appointment_date,
    appointmentTime: row.appointment_time,
    status: row.status,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  }));
}

export interface MyAppointment {
  id: string;
  doctorId: string;
  doctorName: string;
  hospitalName: string;
  hospitalSlug: string;
  departmentName?: string;
  patientName: string;
  patientPhone: string;
  appointmentDate: string;
  appointmentTime: string;
  status: import("@/types").AppointmentStatus;
  notes?: string;
  createdAt: string;
}

/** The signed-in patient's own appointments, across every hospital/clinic —
 * powers the user dashboard's "Appointments" tab. Requires the "Patients
 * read their own appointments" RLS policy (user_id = auth.uid()); only
 * appointments submitted while logged in ever get a user_id, so anonymous
 * requests won't show up here, same reasoning as getMyBookings above. */
export async function getMyAppointments(): Promise<MyAppointment[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data } = await supabase
    .from("appointments")
    .select("*, doctors(name, departments(name), city_services(name, slug))")
    .eq("user_id", user.id)
    .order("appointment_date", { ascending: false });

  return ((data ?? []) as any[]).map((row) => ({
    id: row.id,
    doctorId: row.doctor_id,
    doctorName: row.doctors?.name ?? "",
    hospitalName: row.doctors?.city_services?.name ?? "",
    hospitalSlug: row.doctors?.city_services?.slug ?? "",
    departmentName: row.doctors?.departments?.name ?? undefined,
    patientName: row.patient_name,
    patientPhone: row.patient_phone,
    appointmentDate: row.appointment_date,
    appointmentTime: row.appointment_time,
    status: row.status,
    notes: row.notes ?? undefined,
    createdAt: row.created_at,
  }));
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
  listingType: "hotel" | "restaurant" | "cafe" | "city_service",
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

export interface OwnedListingMessage extends BusinessMessage {
  listingName: string;
}

/** Every inquiry message across every listing this user owns, newest
 * first — the personal Dashboard's Messages tab reuses the same per-listing
 * query the /business dashboard already has (getMessagesForListing) rather
 * than duplicating the fetch logic, just fanned out across owned listings
 * and merged. */
export async function getMyRecentMessages(userId: string, limit = 8): Promise<{ messages: OwnedListingMessage[]; unreadCount: number }> {
  const listings = await getOwnedListings(userId);
  if (listings.length === 0) return { messages: [], unreadCount: 0 };

  const perListing = await Promise.all(
    listings.map(async (listing) => {
      const messages = await getMessagesForListing(listing.listingType, listing.id);
      return messages.map((m) => ({ ...m, listingName: listing.name }));
    })
  );

  const all = perListing.flat().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return { messages: all.slice(0, limit), unreadCount: all.filter((m) => !m.isRead).length };
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
