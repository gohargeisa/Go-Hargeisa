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

/** Owner-only — see business_subscription_notes RLS in
 * supabase/migrations/20260730000005_subscription_lifecycle.sql. Never
 * fetched or shown on the business-owner-facing dashboard. */
export interface SubscriptionNote {
  id: string;
  subscriptionId: string;
  note: string;
  createdAt: string;
}

/** Supported categories for a new-business application — narrower than
 * BusinessListingType (no "service"), matching the listing_type_business
 * DB enum business_join_requests.category actually uses. */
export type JoinRequestCategory = "hotel" | "restaurant" | "cafe";
export type BusinessRequestStatus = "pending" | "approved" | "rejected" | "needs_info" | "archived";

export interface BusinessJoinRequest {
  id: string;
  category: JoinRequestCategory;
  businessName: string;
  ownerName: string;
  phone: string;
  whatsapp: string | null;
  email: string;
  address: string;
  mapsUrl: string | null;
  description: string;
  logo: string | null;
  gallery: string[];
  menuPdfUrl: string | null;
  bookingUrl: string | null;
  website: string | null;
  status: BusinessRequestStatus;
  convertedListingType: JoinRequestCategory | null;
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
  sizeSqm?: number;
  maxGuests: number;
  bedType?: string;
  features: string[];
  pricePerNight?: number;
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
  address: string;
  location: Coordinates;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  phone?: string;
  website?: string;
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
  address: string;
  location: Coordinates;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  phone?: string;
  website?: string;
  cuisine: string[];
  priceRange: "$" | "$$" | "$$$";
  openingHours: string;
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
  address: string;
  location: Coordinates;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  phone?: string;
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
  | "car_rental";

export interface Service {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  coverImage: string;
  gallery: GalleryImage[];
  address: string;
  location: Coordinates;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  phone?: string;
  website?: string;
  openingHours?: string;
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
  name: string;
  description: string | null;
  phone: string | null;
  openingHours: string | null;
  mapsUrl: string | null;
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
  | "parking";

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
