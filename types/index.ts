/**
 * Free-form category tag for gallery photos — hotels, restaurants, and
 * cafes each have their own category vocabulary (see
 * lib/utils/gallery-categories.ts), so this stays a plain string rather
 * than a shared union.
 */
export interface GalleryImage {
  url: string;
  alt?: string;
  category?: string;
}

/** Optional short video clip attached to a listing — the Media Manager's
 * one genuinely new media type alongside the existing cover/logo/gallery. */
export interface MediaVideo {
  url: string;
  caption?: string;
}

export interface Review {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
  photos?: GalleryImage[];
  ownerReply?: string;
  ownerReplyAt?: string;
  isReported?: boolean;
}

/** Listing types a `business_owner` profile can currently own/manage — see lib/data/business.ts. */
export type BusinessListingType = "hotel" | "restaurant" | "cafe" | "service";

export type PaymentStatus = "unpaid" | "pending" | "paid" | "refunded";

export interface Booking {
  id: string;
  hotelId: string;
  hotelName?: string;
  hotelSlug?: string;
  roomId?: string;
  roomName?: string;
  guestName: string;
  guestPhone?: string;
  guestEmail?: string;
  guestCountry?: string;
  /** Total headcount (adults + children) — kept for existing displays; prefer `adults`/`children` for new UI. */
  guestsCount: number;
  adults: number;
  children: number;
  roomsCount: number;
  checkIn: string;
  checkOut: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  notes?: string;
  bookingReference?: string;
  paymentStatus: PaymentStatus;
  paymentMethod?: string;
  userId?: string;
  createdAt: string;
}

export interface BusinessMetricEvent {
  id: string;
  listingType: BusinessListingType;
  listingId: string;
  eventType: "view" | "website_click" | "call_click" | "whatsapp_click";
  createdAt: string;
}

export type SubscriptionStatus = "active" | "paused" | "cancelled";

export interface BusinessSubscription {
  id: string;
  listingType: BusinessListingType;
  listingId: string;
  planTier: "basic" | "silver" | "gold";
  status: SubscriptionStatus;
  renewsAt?: string;
}

export type OfferDiscountType = "percentage" | "fixed";
export type OfferApprovalStatus = "pending" | "approved" | "rejected";
/** Derived, never stored — see lib/utils/offer-status.ts. "inactive" means
 * the owner has it toggled off; the other three are purely date-driven,
 * which is how offers auto-expire without a cron job. */
export type OfferLifecycleStatus = "inactive" | "scheduled" | "active" | "expired";

/** Owner-published, time-boxed promotion against their own listing —
 * "hotel"|"restaurant"|"cafe" only, matching converted_listing_type's
 * scope (services has no dashboard-driven offers concept yet). Only
 * visible publicly once approvalStatus is "approved" (see the RLS policy
 * in 20260801000004_offers_moderation.sql). */
export interface BusinessOffer {
  id: string;
  listingType: "hotel" | "restaurant" | "cafe";
  listingId: string;
  title: string;
  description?: string;
  discountType: OfferDiscountType;
  discountValue?: number;
  couponCode?: string;
  coverImage?: string;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
  approvalStatus: OfferApprovalStatus;
  featured: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Stable event keys a notification's `data` payload can be rendered
 * against — see lib/utils/notification-text.ts. Any row without one of
 * these (or with category null, e.g. very old rows) falls back to its raw
 * title/message instead of a localized string. */
export type NotificationCategory =
  | "business_claim_new"
  | "contact_message_new"
  | "join_request_new"
  | "join_request_approved"
  | "join_request_rejected"
  | "booking_new"
  | "booking_status"
  | "review_new"
  | "offer_approved"
  | "offer_rejected"
  | "message_new"
  | "review_reply"
  | "promotion_new"
  | "event_published"
  | "account_verified"
  | "system_announcement";

export type NotificationSeverity = "success" | "error" | "warning" | "info";

/** In-app notification row — recipient-scoped (RLS: user_id = auth.uid()),
 * written exclusively by SECURITY DEFINER DB triggers (see
 * supabase/migrations/20260801000005_notifications_system.sql), never by
 * client code directly. `data` carries whatever raw values the matching
 * category needs to render a localized string. */
export interface Notification {
  id: string;
  title: string;
  message: string | null;
  type: NotificationSeverity;
  category: NotificationCategory | null;
  data: Record<string, string | number | null>;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
  readAt: string | null;
}

/** Owner-only — see business_subscription_notes RLS in
 * supabase/migrations/20260730000005_subscription_lifecycle.sql. Never
 * fetched or shown on the business-owner-facing dashboard. */
export interface SubscriptionNote {
  id: string;
  subscriptionId: string;
  note: string;
  createdAt: string;
}

/** Every business type the partner-onboarding form accepts. Wider than
 * BusinessListingType/ConvertibleJoinRequestCategory below — most of these
 * have no matching listing table yet, so "approved" for them means
 * "verified partner", not "converted into a public listing". */
export type JoinRequestCategory =
  | "hotel"
  | "restaurant"
  | "cafe"
  | "tour_company"
  | "travel_agency"
  | "car_rental"
  | "apartment"
  | "shopping_mall"
  | "hospital"
  | "pharmacy"
  | "gym"
  | "beauty_salon"
  | "other";

/** The subset of JoinRequestCategory that convertJoinRequest can actually
 * turn into a real listing row (hotels/restaurants/cafes tables only). */
export type ConvertibleJoinRequestCategory = "hotel" | "restaurant" | "cafe";

export type BusinessRequestStatus = "pending" | "approved" | "rejected" | "needs_info" | "archived";

/** One weekday's hours for the partner-onboarding form's weekly schedule —
 * distinct from cafes' OpeningHoursGroup (which groups several days under
 * one range): here every day is its own row with its own closed toggle,
 * matching the form's "Saturday / Sunday / … each with Open, Close, Closed"
 * spec exactly. */
export interface WeeklyHoursDay {
  day: "saturday" | "sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday";
  open: string;
  close: string;
  closed: boolean;
}

export interface BusinessJoinRequest {
  id: string;
  category: JoinRequestCategory;
  businessName: string;
  ownerName: string | null;
  phone: string;
  whatsapp: string | null;
  email: string;
  address: string;
  city: string;
  district: string | null;
  location: Coordinates | null;
  mapsUrl: string | null;
  description: string;
  logo: string | null;
  coverImage: string | null;
  gallery: GalleryImage[];
  menuPdfUrl: string | null;
  bookingUrl: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  openingHours: WeeklyHoursDay[];
  amenities: string[];
  priceRange: "$" | "$$" | "$$$" | "$$$$" | null;
  status: BusinessRequestStatus;
  convertedListingType: ConvertibleJoinRequestCategory | null;
  convertedListingId: string | null;
  createdAt: string;
}

/** Owner-only — same reasoning as SubscriptionNote: never shown to the
 * person who submitted the request. */
export interface BusinessJoinRequestNote {
  id: string;
  requestId: string;
  note: string;
  createdAt: string;
}

/** Owner-published general announcement (Stage 7's "Launch Partners" ask —
 * a platform-wide broadcast, not a per-partner post). Public reads only
 * status='published'; the homepage banner shows the single most recent
 * one, see lib/data/announcements.ts. */
export interface SiteAnnouncement {
  id: string;
  title: string;
  message: string;
  linkUrl: string | null;
  linkLabel: string | null;
  status: "draft" | "published" | "archived";
  createdAt: string;
}

export interface BusinessMessage {
  id: string;
  listingType: BusinessListingType;
  listingId: string;
  senderName: string;
  senderEmail?: string;
  senderPhone?: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MapPoint {
  id: string;
  slug?: string;
  name: string;
  category: string;
  address?: string;
  location: Coordinates;
  image?: string;
  description?: string;
  featured?: boolean;
}

export interface Destination {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  placeCount: number;
  highlights?: string[];
}

export type RoomType = "standard" | "deluxe" | "twin" | "family" | "executive_suite";

export interface HotelRoom {
  id: string;
  name: string;
  image?: string;
  images?: GalleryImage[];
  description?: string;
  sizeSqm?: number;
  maxGuests: number;
  bedType?: string;
  bathrooms: number;
  features: string[];
  pricePerNight?: number;
  weekendPrice?: number;
  discountPrice?: number;
  totalRooms: number;
  roomType: RoomType;
  isAvailable: boolean;
}

export type HotelBookingMode = "go_hargeisa" | "external";
export type HotelExternalBookingOption = "website" | "booking_com" | "whatsapp" | "custom_url";

/** Trial: listing is live publicly but its linked business owner (if any) has
 * no /business dashboard access yet. Official: the linked owner gets full
 * dashboard access. Owner-only to change — see the enforce_partner_status_
 * owner_only trigger in supabase/migrations/20260730000002_partner_status.sql. */
export type PartnerStatus = "trial" | "official";

export interface Hotel {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  coverImage: string;
  gallery: GalleryImage[];
  videos?: MediaVideo[];
  address: string;
  location: Coordinates;
  googleMapsUrl?: string;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  phone?: string;
  website?: string;
  whatsapp?: string;
  email?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  priceRange: string;
  amenities: string[];
  nearbyAttractionIds: string[];
  featured?: boolean;
  logo?: string;
  checkInTime?: string;
  checkOutTime?: string;
  languages: string[];
  rooms: HotelRoom[];
  restaurant?: Restaurant | null;
  cafe?: Cafe | null;
  /** Defaults to "go_hargeisa" when absent (mock data / not yet configured). */
  bookingMode?: HotelBookingMode;
  externalBookingOption?: HotelExternalBookingOption;
  externalBookingUrl?: string;
  bookingWhatsapp?: string;
  bookingComUrl?: string;
  partnerStatus: PartnerStatus;
}

export interface RestaurantMenuItem {
  name: string;
  price: string;
  description?: string;
}

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  coverImage: string;
  gallery: GalleryImage[];
  videos?: MediaVideo[];
  address: string;
  location: Coordinates;
  googleMapsUrl?: string;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  phone?: string;
  website?: string;
  whatsapp?: string;
  email?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  cuisine: string[];
  priceRange: "$" | "$$" | "$$$";
  openingHours: string;
  openingHoursStructured?: OpeningHoursGroup[];
  menuHighlights: RestaurantMenuItem[];
  reservable: boolean;
  featured?: boolean;
  logo?: string;
  menuPdfUrl?: string;
  partnerStatus: PartnerStatus;
}

/** One opening-hours row spanning one or more days, e.g. Sat–Wed vs. a
 * standalone Thursday/Friday with different hours. `open`/`close` are
 * "HH:mm" 24h strings; a `close` earlier than `open` means past midnight. */
export interface OpeningHoursGroup {
  days: ("sunday" | "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday")[];
  open: string;
  close: string;
}

export interface Cafe {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  descriptionAr?: string;
  descriptionSo?: string;
  coverImage: string;
  gallery: GalleryImage[];
  videos?: MediaVideo[];
  address: string;
  location: Coordinates;
  googleMapsUrl?: string;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  phone?: string;
  whatsapp?: string;
  email?: string;
  specialDrinks: string[];
  wifi: boolean;
  workingSpace: boolean;
  openingHours: string;
  openingHoursStructured?: OpeningHoursGroup[];
  priceRange?: "$" | "$$" | "$$$" | "$$$$";
  amenities?: string[];
  socialInstagram?: string;
  socialFacebook?: string;
  featured?: boolean;
  logo?: string;
  menuHighlights: RestaurantMenuItem[];
  menuPdfUrl?: string;
  partnerStatus: PartnerStatus;
}

/** Phase 2 — Essential City Services. One shared shape across all 8
 * categories (see supabase/migrations/20260729000001_add_services.sql for
 * why this is one table/type instead of eight near-identical ones). */
export type ServiceCategory =
  | "hospital"
  | "pharmacy"
  | "dental_clinic"
  | "bank"
  | "atm"
  | "currency_exchange"
  | "gas_station"
  | "car_rental"
  | "mosque"
  | "school"
  | "university"
  | "gym"
  | "tour_company"
  | "apartment";

export interface Service {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  coverImage: string;
  gallery: GalleryImage[];
  videos?: MediaVideo[];
  address: string;
  location: Coordinates;
  googleMapsUrl?: string;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  openingHours?: string;
  openingHoursStructured?: OpeningHoursGroup[];
  services: string[];
  category: ServiceCategory;
  featured?: boolean;
  logo?: string;
}

/** Phase 2 — the minimal City Services directory (Hospitals/Banks/
 * Supermarkets/Pharmacies). Deliberately separate from `Service` above —
 * no owner_id, no booking, no subscription, name/phone/hours/maps only.
 * Named "Essential" (not "CityService…") to avoid colliding with the
 * pre-existing CityServiceCategory/CityServicePoint types below, which back
 * the unrelated Smart City Map feature. */
export type EssentialServiceCategory = "hospital" | "bank" | "supermarket" | "pharmacy";

export interface CityService {
  id: string;
  category: EssentialServiceCategory;
  /** Already resolved to the request locale (falls back to English) —
   * see lib/data/city-services.ts, same pattern as Cafe.description. */
  name: string;
  description: string | null;
  phone: string | null;
  openingHours: string | null;
  mapsUrl: string | null;
  website: string | null;
  image: string | null;
  status: "draft" | "published" | "archived";
  featured: boolean;
  sortOrder: number;
}

export interface Attraction {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  coverImage: string;
  gallery: GalleryImage[];
  address: string;
  location: Coordinates;
  googleMapsUrl?: string;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  history: string;
  bestTimeToVisit: string;
  entryFee: string | null;
  visitorTips: string[];
  nearbyRestaurantIds: string[];
  nearbyHotelIds: string[];
  category: string;
  featured?: boolean;
  /** Optional — not every source (e.g. Supabase rows) populates these yet. */
  openingHours?: string;
  visitDuration?: string;
}

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  category: string;
  startDate: string;
  endDate: string | null;
  location: string;
  ticketInfo?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  author: string;
  publishedAt: string;
  readMinutes: number;
  category: string;
}

/**
 * Smart City Map — a separate city-services map (hospitals, pharmacies,
 * mosques, etc.) from the Hotels/Restaurants/Cafes/Attractions map.
 * Backed by the existing `map_points` table; categories without a match
 * in that table's schema simply render with zero points (see
 * lib/data/map-points.ts getCityServicePoints for the mapping).
 */
export type CityServiceCategory =
  | "hospital"
  | "pharmacy"
  | "dental_clinic"
  | "bank"
  | "atm"
  | "currency_exchange"
  | "gas_station"
  | "car_rental"
  | "mosque"
  | "supermarket"
  | "police"
  | "government"
  | "school"
  | "university"
  | "airport"
  | "parking"
  | "gym"
  | "tour_company"
  | "apartment";

export interface CityServicePoint {
  id: string;
  name: string;
  category: CityServiceCategory;
  location: Coordinates;
  /** Present for Phase 2 service points (backed by the `services` table)
   * so the map popup can show full details + a working Claim button
   * without a second fetch. Absent for legacy map_points pins. */
  slug?: string;
  address?: string;
  description?: string;
  phone?: string;
}
