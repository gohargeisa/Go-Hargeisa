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
  /** Optional short caption shown under the photo in the gallery/lightbox —
   * distinct from `alt` (accessibility text, not necessarily shown visually). */
  caption?: string;
}

/** Optional short video clip attached to a listing — the Media Manager's
 * one genuinely new media type alongside the existing cover/logo/gallery. */
export interface MediaVideo {
  url: string;
  caption?: string;
}

/** A verification document (business license, registration, etc.) attached
 * to a /join submission — admin-review-only, never copied onto the public
 * listing when a request is converted. */
export interface BusinessDocument {
  url: string;
  name: string;
}

export interface Review {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  title?: string;
  /** ISO date (no time) — when the reviewer says they visited, distinct from `createdAt`. */
  visitDate?: string;
  createdAt: string;
  photos?: GalleryImage[];
  ownerReply?: string;
  ownerReplyAt?: string;
  isReported?: boolean;
  helpfulCount: number;
  status?: "published" | "hidden";
}

/** Listing types with a full /business dashboard (bookings, offers,
 * analytics, gallery manager, messages) — see lib/data/business.ts.
 * city_service joined this union 2026-08-09: it has its own dedicated
 * server actions (lib/actions/city-services.ts's updateCityServicePartial)
 * rather than the shared updateRecord/ALLOWED_TABLES pipeline the other
 * four use, since its schema (image not cover_image, no logo_url/address,
 * maps_url not google_maps_url, amenities_v2 for tags) differs from theirs. */
export type BusinessListingType = "hotel" | "restaurant" | "cafe" | "service" | "city_service";

/** Per-business permission keys a team member can be granted on one
 * business_access_grants row — see supabase/migrations/20260901000001_
 * access_control_system.sql. Absent/false means "no access"; an empty
 * grant object is the default (visible, can do nothing). */
export type BusinessPermissionKey =
  | "orders_view"
  | "orders_manage"
  | "bookings_view"
  | "bookings_manage"
  | "appointments_view"
  | "appointments_manage"
  | "businesses_view"
  | "businesses_edit"
  | "reviews_view"
  | "reviews_moderate";

/** Platform-wide (not tied to one business) permission keys a team member
 * can be granted on their single team_platform_permissions row. */
export type PlatformPermissionKey =
  | "partners_view"
  | "partners_add"
  | "partners_edit"
  | "partners_manage_status"
  | "content_view"
  | "content_create"
  | "content_edit"
  | "content_publish"
  | "reports_view"
  | "reports_export"
  | "analytics_view"
  | "requests_view"
  | "requests_manage";

export type BusinessPermissions = Partial<Record<BusinessPermissionKey, boolean>>;
export type PlatformPermissions = Partial<Record<PlatformPermissionKey, boolean>>;

/** One team member's access to one specific business — see
 * business_access_grants. */
export interface BusinessAccessGrant {
  id: string;
  userId: string;
  listingType: BusinessListingType;
  listingId: string;
  permissions: BusinessPermissions;
  isActive: boolean;
  grantedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/** One team member's platform-wide admin permissions — see
 * team_platform_permissions. At most one row per user. */
export interface TeamPlatformPermissionsGrant {
  id: string;
  userId: string;
  permissions: PlatformPermissions;
  isActive: boolean;
  grantedBy?: string;
  createdAt: string;
  updatedAt: string;
}

/** A recognition-only honorary title (e.g. Father/Mother) — see
 * honorary_members. Carries zero permissions; never read by any
 * authorization check. */
export interface HonoraryMember {
  id: string;
  userId: string;
  titleEn: string;
  titleAr?: string;
  titleSo?: string;
  isPublic: boolean;
  createdBy?: string;
  createdAt: string;
}

/** Listing types the admin ownership-assignment system (lib/actions/claims.ts:
 * getOwnedListings/transferOwnership/removeOwnership) can operate on. Kept as
 * its own alias (rather than inlining BusinessListingType at each call site)
 * since claims.ts predates city_service's /business dashboard support and
 * this reads clearer at those call sites either way. */
export type OwnableListingType = BusinessListingType;

/** Free-text (products.category has no DB CHECK constraint — see
 * 20260823000002_universal_cart_orders.sql) so any product-selling vertical
 * (Perfume, Flowers, Café menu items, Restaurant dishes, Fashion, Grocery,
 * ...) can use its own category vocabulary without a schema change. Known
 * categories get a translated label from lib/config/product-categories.ts;
 * anything else falls back to a humanized version of the raw string. */
export type ProductCategory = string;

export type ProductGender = "men" | "women" | "unisex" | "kids";

/** Every listing type that can sell products through the universal cart —
 * city_service/service via categories.supports_products, cafe/restaurant via
 * their own ordering_enabled column (see 20260823000002). */
export type OrderableListingType = "city_service" | "service" | "cafe" | "restaurant";

/** Phase 4 Catalog/Product Engine — polymorphic owner (listingType/listingId),
 * same pattern as reviews/business_metric_events. Serves every vertical in
 * OrderableListingType through one table (no per-category products table). */
export interface Product {
  id: string;
  listingType: OrderableListingType;
  listingId: string;
  name: string;
  nameAr?: string;
  nameSo?: string;
  description?: string;
  descriptionAr?: string;
  descriptionSo?: string;
  brand?: string;
  category?: ProductCategory;
  gender?: ProductGender;
  price?: number;
  /** Pre-discount "compare at" price — optional, same nullable-numeric shape
   * as `price`. A product is "on sale" purely by this being present and
   * greater than `price`; no separate boolean flag exists on purpose (one
   * fewer field that could drift out of sync — set both prices, or unset
   * this one to end the sale). The discount percent is always derived
   * (`lib/utils/product-pricing.ts`), never stored, so it can't go stale.
   * Absent for every product until a caller explicitly sets it — every
   * existing reader of `Product` that doesn't know about this field keeps
   * working unchanged. */
  originalPrice?: number;
  currency: string;
  image?: string;
  gallery: GalleryImage[];
  isAvailable: boolean;
  isFeatured: boolean;
  isHidden: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  /** Free-text size/variant descriptor (e.g. "50ml", "Large", "Set of 3") — optional, most products won't need it. */
  size?: string;
  /** Optional external inventory reference (e.g. an Odoo Internal Reference)
   * — lets a re-import from the same source reconcile against this exact
   * row instead of guessing by name. Not customer-facing UI unless a
   * partner surface chooses to show it. */
  sku?: string;
  /** Optional on-hand count from the source inventory system — informational only. */
  stockQuantity?: number;
  /** Structured variants (shade/color/finish/size combinations) — present
   * only for products that actually have them (e.g. a lipstick with 12
   * shades). Absent/empty means "just this one product", identical to
   * every product on the platform before variants existed — every existing
   * caller that never reads this field keeps working unchanged. See
   * ProductVariant below and supabase/migrations/20260825000001_product_variants.sql. */
  variants?: ProductVariant[];
  /** Product-specific configurable options (shade is NOT here — that's
   * `variants`; this is everything else: gift wrap, cake writing, milk
   * type, toppings, candles...). Present only for products an owner has
   * actually configured — absent/empty means "nothing to configure", the
   * same as every product before this system existed. See ProductOption
   * below and supabase/migrations/20260829000001_product_options.sql. */
  options?: ProductOption[];
  /** Genuine per-product add-ons (Cheese, Olives, Oil, ...) — owned by
   * exactly one product, same "absent/empty means nothing to configure"
   * contract as `variants`/`options`. See ProductAddon below and
   * supabase/migrations/20260906000001_tax_system_and_product_addons.sql.
   * Distinct from the older `AddToCartBusiness.addons` (cafes.flower_addons,
   * a business-wide vocabulary still used for Lavender's flower line) —
   * lib/cart/product-addons.ts merges both into one list a caller reads. */
  addons?: ProductAddon[];
}

/** One purchasable variant of a Product (a specific shade/finish/size).
 * Deliberately a child of `products` (see the migration), not a second
 * product system — a product with no variants behaves exactly as it always
 * has; a product with variants gets an interactive swatch/size picker
 * wherever ProductCard/ProductDetailModal render it. Any field left unset
 * on a variant falls back to the parent Product's own value (e.g. a variant
 * with no `image` shows the product's base image). */
export interface ProductVariant {
  id: string;
  productId: string;
  /** Display name for this variant, e.g. "09 Rosewood" or "Small". */
  name: string;
  nameAr?: string;
  nameSo?: string;
  /** Human shade name alone, e.g. "Rosewood" (name may combine code + this). */
  shadeName?: string;
  /** Shade/reference code, e.g. "09". */
  shadeCode?: string;
  /** Swatch color for the picker UI, e.g. "#A85751". */
  hexColor?: string;
  /** e.g. "Matte", "Glossy", "Shimmer". */
  finish?: string;
  /** e.g. "30ml", "Large" — for variants that vary by size rather than color. */
  size?: string;
  /** Falls back to the parent product's image when unset. */
  image?: string;
  sku?: string;
  /** Falls back to the parent product's price when unset. */
  price?: number;
  isAvailable: boolean;
  sortOrder: number;
}

/** One selectable choice within a 'select'/'multiselect' ProductOption
 * (e.g. {value:"oat", label:"Oat Milk", priceDelta:0.5}). */
export interface ProductOptionChoice {
  value: string;
  label: string;
  labelAr?: string;
  labelSo?: string;
  priceDelta?: number;
}

/** One configurable option a specific product exposes — the reusable
 * mechanism behind every category's "own" ordering fields (gift wrap on a
 * bouquet, milk type on a latte, writing text on a cake, toppings on a
 * pizza, candle count on a birthday cake). Owned by exactly one product
 * (`productId`), never shared across products or inferred from category —
 * two products in the same category can have entirely different option
 * sets. A product with no options renders exactly as it always has. See
 * supabase/migrations/20260829000001_product_options.sql. */
export interface ProductOption {
  id: string;
  productId: string;
  key: string;
  label: string;
  labelAr?: string;
  labelSo?: string;
  type: "select" | "multiselect" | "boolean" | "text" | "number";
  required: boolean;
  /** Flat price impact for 'boolean' (added when true) and per-unit
   * multiplier for 'number' (price * entered quantity). 'select'/
   * 'multiselect' price from each choice's own `priceDelta` instead. */
  priceDelta: number;
  choices: ProductOptionChoice[];
  placeholder?: string;
  placeholderAr?: string;
  placeholderSo?: string;
  maxLength?: number;
  sortOrder: number;
}

/** The frozen snapshot of one ProductOption selection at order time — lives
 * on OrderItem.selectedOptions, resolved and priced server-side in
 * submit_cart_order(), never trusted from the client. `value` is the raw
 * selection (a string, string[], boolean, or number depending on `type`);
 * `valueLabel` is what's actually shown to the business owner/admin. */
export interface SelectedProductOption {
  key: string;
  label: string;
  type: ProductOption["type"];
  value: string | string[] | boolean | number;
  valueLabel: string;
  priceDelta: number;
}

/** Phase 4 Medical Appointment Engine — one shared engine for Hospitals,
 * Clinics, and Dental Clinics. */
export interface Department {
  id: string;
  cityServiceId: string;
  name: string;
  nameAr?: string;
  nameSo?: string;
  sortOrder: number;
}

export interface Doctor {
  id: string;
  cityServiceId: string;
  departmentId?: string;
  name: string;
  photo?: string;
  specialty?: string;
  specialtyAr?: string;
  specialtySo?: string;
  bio?: string;
  bioAr?: string;
  bioSo?: string;
  languages: string[];
  /** Same OpeningHoursGroup[] shape as every other "hours" field on the platform. */
  workingHours: OpeningHoursGroup[];
  appointmentDurationMinutes: number;
  isActive: boolean;
  sortOrder: number;
  consultationFee?: number;
}

export type AppointmentStatus = "pending" | "confirmed" | "completed" | "cancelled" | "rejected" | "no_show";

export interface Appointment {
  id: string;
  doctorId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  userId?: string;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
  notes?: string;
  createdAt: string;
}

/** Every listing type that participates in the polymorphic reviews/
 * favorites/saved-trip-items system (the `listing_type` DB enum). Single
 * source of truth for the `ListingType` alias every review/favorite/trip
 * call site used to redeclare locally — kept in sync here instead of in
 * ~8 separate files as new listing types (event, city_service) are added. */
export type PolymorphicListingType = "hotel" | "restaurant" | "cafe" | "attraction" | "service" | "event" | "city_service";

/** Which real table a category's listings actually live in — see
 * supabase/migrations/20260806000001_add_categories_system.sql for why
 * hotels/restaurants/cafes/attractions/events keep their own dedicated
 * tables while every other category is backed by `services`. */
export type CategoryTargetTable = "hotels" | "restaurants" | "cafes" | "attractions" | "events" | "services" | "city_services";

/** One admin-defined extra field a category's listings can capture — e.g.
 * Real Estate's "Property Type", Travel Agencies' "Destinations Covered".
 * Purely data-driven (no per-category code) so it works for "any future
 * category" an admin creates, not just the ones seeded at launch. Rendered
 * as a form input on submission (matching `type`) and as a labeled row in
 * the listing detail page's Details section. */
export interface CategoryCustomField {
  /** Stable identifier — the key under which the value is stored in a
   * listing's `customFields` map. Never changes once fields have data. */
  key: string;
  label: string;
  type: "text" | "number" | "select" | "boolean" | "textarea";
  required: boolean;
  /** Only meaningful when type === "select". */
  options?: string[];
}

/** Single source of truth for every business category — the `categories`
 * table. Replaces the scattered per-vocabulary config files
 * (lib/utils/service-categories.ts, lib/utils/partner-categories.ts, etc.)
 * as the one place the navbar, homepage, submission form, search, and
 * admin panel all read category metadata from. */
export interface Category {
  id: string;
  slug: string;
  name: string;
  nameAr?: string;
  nameSo?: string;
  description?: string;
  descriptionAr?: string;
  descriptionSo?: string;
  /** lucide-react icon export name (e.g. "Hotel", "Flower2") — resolve via lib/utils/dynamic-icon.tsx. */
  icon: string;
  color?: string;
  /** Admin-uploaded category photo (Supabase Storage, `category-images`
   * bucket) — the single source of truth for every category card across the
   * platform. undefined/null means no custom image has been uploaded yet;
   * see lib/utils/category-image.ts for the fallback chain callers use. */
  imageUrl?: string;
  targetTable: CategoryTargetTable;
  isActive: boolean;
  isPinned: boolean;
  sortOrder: number;
  /** Extra free-text terms that should resolve a search query to this category — see matchCategoryFromQuery. */
  searchKeywords: string[];
  /** Admin-defined extra submission/detail-page fields for this category — empty for most categories. */
  customFieldsSchema: CategoryCustomField[];
  /** Replaces lib/config/gallery-eligibility.ts — whether this category's listings get the multi-image gallery UI. */
  supportsGallery: boolean;
  /** Replaces lib/config/listing-feature-eligibility.ts — whether this category's listings show reviews/opening-hours badge/amenities/video gallery/social links. */
  supportsNewFeatures: boolean;
  /** schema.org @type for JSON-LD (e.g. "Hospital"). Falls back to "LocalBusiness" when unset. */
  schemaOrgType?: string;
  /** Phase 4 — whether this category's city_services listings get the Products catalog UI (currently just perfume-shop). */
  supportsProducts: boolean;
  /** Phase 4 — whether this category's city_services listings get the Medical Appointment Engine (Book a Doctor/Dentist, currently hospital/clinic/dental-clinic). */
  supportsAppointments: boolean;
  /** Whether this category's city_services listings get the purchase-request (buy-for-me + manual quote) system — see purchase_requests table, lib/actions/purchase-requests.ts. */
  supportsPurchaseRequests: boolean;
  /** Whether this category's city_services listings get the event-request (event planning + proposal) system — see event_requests table, lib/actions/event-requests.ts. */
  supportsEventRequests: boolean;
  /** Computed, never stored — `targetTable !== "city_services"`. True for every category with its own reachable page
   * (hotels/restaurants/cafes/attractions/events/services); false only for City Services' internal groupings, which
   * exist solely to be grouped inside the City Services hub and must never also appear as a standalone page. Deriving
   * this from targetTable (rather than a separate stored flag) is what guarantees it can never drift out of sync. */
  isStandaloneSection: boolean;
  /** Populated by getCategoriesWithCounts() — the number of published listings in this category. Absent from plain getCategories(). */
  businessCount?: number;
  createdAt: string;
  updatedAt: string;
}

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
  planTier: "basic" | "silver" | "gold" | "premium";
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
  | "business_claim_approved"
  | "business_claim_rejected"
  | "contact_message_new"
  | "join_request_new"
  | "join_request_approved"
  | "join_request_rejected"
  | "booking_new"
  | "booking_status"
  | "reservation_new"
  | "order_new"
  | "appointment_new"
  | "review_new"
  | "offer_approved"
  | "offer_rejected"
  | "message_new"
  | "review_reply"
  | "promotion_new"
  | "event_published"
  | "account_verified"
  | "system_announcement"
  | "purchase_request_new"
  | "purchase_request_quote_ready"
  | "purchase_request_status"
  | "purchase_request_customer_response"
  | "event_request_new"
  | "event_request_proposal_sent"
  | "event_request_status"
  | "event_request_customer_response";

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

/** Every value `converted_listing_type` can legitimately hold once a
 * request is converted. hotel/restaurant/cafe go to their own dedicated
 * tables; a category="other" request whose resolved category has
 * target_table='city_services' goes to the shared city_services table
 * (see isConvertibleCategory/convertJoinRequest). "service" is a legacy
 * possibility from the now-removed admin Services module — the DB enum
 * still allows it for historical rows, but nothing writes it anymore
 * (that admin CRUD no longer exists, so it's display-only, never a fresh
 * conversion target). */
export type ConvertibleJoinRequestCategory = "hotel" | "restaurant" | "cafe" | "city_service" | "service";

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
  /** Set only when category === "other" — references a `categories` row
   * (target_table='services'). Null for hotel/restaurant/cafe requests. */
  categoryId: string | null;
  /** Per-category custom field values, keyed by the referenced category's
   * customFieldsSchema field keys. Empty for hotel/restaurant/cafe requests. */
  customFields: Record<string, string | number | boolean>;
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
  convertedAt: string | null;
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
  /** Optional business document (hotel information/services PDF) — see
   * lib/utils/business-document.ts for the category-aware public label. */
  documentUrl?: string;
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
  socialTiktok?: string;
  socialSnapchat?: string;
  socialX?: string;
  socialYoutube?: string;
  socialTelegram?: string;
  priceRange: string;
  /** Free-text amenity tags — powers card-preview chips and the hotel
   * search filter only. See `amenitiesV2` for the detail-page Amenities
   * section's fixed vocabulary (lib/config/amenities.ts). */
  amenities: string[];
  amenitiesV2?: string[];
  favoriteCount?: number;
  nearbyAttractionIds: string[];
  featured?: boolean;
  logo?: string;
  checkInTime?: string;
  checkOutTime?: string;
  openingHoursStructured?: OpeningHoursGroup[];
  is24Hours?: boolean;
  temporarilyClosed?: boolean;
  permanentlyClosed?: boolean;
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
  /** Manual, owner-controlled "GO HARGEISA PARTNER" badge flag — independent
   * of partnerStatus/subscription/category/featured/reviews. Defaults to
   * false; only an admin toggling it in the edit form changes it. */
  isPartner: boolean;
  /** Self-declared classification, distinct from `rating` (a guest-review
   * score) — see lib/config/hotel-attributes.ts. */
  hotelType?: "hotel" | "boutique" | "resort" | "guesthouse" | "hostel" | "apartment_hotel";
  starRating?: number;
  numberOfFloors?: number;
  yearEstablished?: number;
}

export interface RestaurantMenuItem {
  name: string;
  /** Optional — some verified official menus (e.g. a brand's public menu
   * page) list real items without publishing prices. Omitted rather than
   * fabricated in that case; the menu UI hides the price line entirely. */
  price?: string;
  description?: string;
  /** Optional grouping label (e.g. "Starters", "Grills", "Drinks") — items
   * without one render in the original flat list (backward compatible with
   * every listing's existing menu data); once any item on a listing has a
   * category, the menu switches to grouped cards with tab/chip navigation. */
  category?: string;
  /** Per-item photo — same GalleryImage-less plain URL shape as the rest of
   * this jsonb column (no schema change: `menu` is jsonb, this is just a
   * richer shape within it). */
  image?: string;
  featured?: boolean;
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
  socialTiktok?: string;
  socialSnapchat?: string;
  socialX?: string;
  socialYoutube?: string;
  socialTelegram?: string;
  cuisine: string[];
  priceRange: "$" | "$$" | "$$$";
  openingHours: string;
  openingHoursStructured?: OpeningHoursGroup[];
  is24Hours?: boolean;
  temporarilyClosed?: boolean;
  permanentlyClosed?: boolean;
  menuHighlights: RestaurantMenuItem[];
  reservable: boolean;
  featured?: boolean;
  logo?: string;
  menuPdfUrl?: string;
  partnerStatus: PartnerStatus;
  /** Manual, owner-controlled "GO HARGEISA PARTNER" badge flag — independent
   * of partnerStatus/subscription/category/featured/reviews. Defaults to
   * false; only an admin toggling it in the edit form changes it. */
  isPartner: boolean;
  /** Fixed-vocabulary amenities for the detail-page Amenities section (lib/config/amenities.ts). */
  amenitiesV2?: string[];
  favoriteCount?: number;
  restaurantType?: "somali" | "international" | "fast_food" | "cafe_restaurant" | "family" | "fine_dining" | "buffet" | "bakery_restaurant" | "other";
  seatingCapacity?: number;
  numberOfTables?: number;
  onlineOrderUrl?: string;
  /** Independent, owner-controlled capability flags — see
   * lib/utils/restaurant-cta.ts. Order Now only ever appears when the
   * matching flag is on; restaurant_type/onlineOrderUrl alone are never
   * enough on their own. */
  onlineOrderingEnabled: boolean;
  phoneOrderingEnabled: boolean;
  languages?: string[];
  /** Gates the universal cart/checkout system (browse this restaurant's own
   * menu as real `products` rows, add to cart, place a real order) —
   * unrelated to onlineOrderingEnabled/phoneOrderingEnabled above, which
   * only ever produce a link out to a third-party ordering app or a phone
   * call. Off by default for every restaurant. */
  catalogOrderingEnabled: boolean;
  productsDeliveryEnabled: boolean;
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
  website?: string;
  socialTiktok?: string;
  socialSnapchat?: string;
  socialX?: string;
  socialYoutube?: string;
  socialTelegram?: string;
  specialDrinks: string[];
  wifi: boolean;
  workingSpace: boolean;
  openingHours: string;
  openingHoursStructured?: OpeningHoursGroup[];
  is24Hours?: boolean;
  temporarilyClosed?: boolean;
  permanentlyClosed?: boolean;
  priceRange?: "$" | "$$" | "$$$" | "$$$$";
  /** Legacy free-text/fixed-enum amenity tags (kept for the old admin
   * checklist's data, no longer rendered on the detail page). See
   * `amenitiesV2` for the unified vocabulary (lib/config/amenities.ts). */
  amenities?: string[];
  amenitiesV2?: string[];
  socialInstagram?: string;
  socialFacebook?: string;
  featured?: boolean;
  logo?: string;
  menuHighlights: RestaurantMenuItem[];
  menuPdfUrl?: string;
  partnerStatus: PartnerStatus;
  /** Manual, owner-controlled "GO HARGEISA PARTNER" badge flag — independent
   * of partnerStatus/subscription/category/featured/reviews. Defaults to
   * false; only an admin toggling it in the edit form changes it. */
  isPartner: boolean;
  favoriteCount?: number;
  cafeType?: "coffee_shop" | "dessert_cafe" | "study_cafe" | "rooftop_cafe" | "tea_house" | "other";
  seatingCapacity?: number;
  /** Off by default for every cafe — only set true for a cafe that's
   * actually confirmed to take table reservations (see restaurants.reservable,
   * the same flag Restaurant already has). */
  reservable?: boolean;
  /** Content flag: does this cafe have a flower/bouquet product line (used
   * to label that part of the catalog "Flowers & Bouquets"). Whether
   * ordering is actually available is `orderingEnabled` below, not this. */
  sellsFlowers?: boolean;
  /** Order-time modifiers a customer picks from when ordering any product
   * from this cafe (e.g. "Extra Gypsophila +$3") — a cafe-wide list, not a
   * property of one product. */
  flowerAddons?: ProductAddon[];
  /** Off by default — most cafes selling a secondary product line are
   * pickup-only. When true, the delivery option appears in the order form. */
  productsDeliveryEnabled?: boolean;
  /** Gates the universal cart/checkout system for this cafe's whole
   * products catalog (menu items and/or flowers — both live in the same
   * `products` table). Off by default; backfilled true for every cafe that
   * already had sellsFlowers true (see 20260823000002_universal_cart_orders.sql). */
  orderingEnabled?: boolean;
}

/** An order-time modifier a customer can add to a product order (e.g.
 * "Extra Gypsophila +$3", "Cheese +$2", "Message Card" at $0). Two sources
 * populate this same shape: the newer, genuinely per-product
 * `product_addons` table (`productId` set) and the older business-wide
 * `cafes.flower_addons` vocabulary (`productId` absent — see Cafe.
 * flowerAddons). Resolved server-side by id in submit_cart_order — the
 * client never sends a price. */
export interface ProductAddon {
  id: string;
  name: string;
  nameAr?: string;
  nameSo?: string;
  price: number;
  /** Set only for a product_addons-sourced row — absent for the legacy
   * cafes.flower_addons ones, which aren't tied to one product. */
  productId?: string;
  /** Whether this add-on's price is included in the order's taxable base —
   * defaults to true (the common case) when a source doesn't set it (the
   * legacy flower_addons vocabulary has no concept of this and is always
   * taxable). See lib/tax/. */
  isTaxable?: boolean;
}

/** One configured tax rule (supabase/migrations/
 * 20260906000001_tax_system_and_product_addons.sql's `tax_policies` table).
 * See lib/tax/resolve.ts for how a set of these resolves to one effective
 * rate for a given order line — this type is the raw row shape, not the
 * resolved result (see EffectiveTaxPolicy for that). */
export interface TaxPolicy {
  id: string;
  scope: "global" | "category" | "business" | "product";
  /** Set only when scope = 'category' — either a categories.slug (city_
   * service/service verticals) or a literal listing_type ('restaurant',
   * 'cafe') for the two types with no categories table of their own. */
  category?: string;
  /** Set only when scope = 'business'. */
  listingType?: OrderableListingType;
  listingId?: string;
  /** Set only when scope = 'product'. */
  productId?: string;
  /** Fraction, e.g. 0.05 = 5%. Ignored when isExempt is true. */
  rate: number;
  isExempt: boolean;
  isInclusive: boolean;
  isEnabled: boolean;
  label?: string;
  effectiveFrom: string;
  effectiveUntil?: string;
  createdAt: string;
  updatedAt: string;
}

/** The single resolved outcome of applying the tax hierarchy to one order
 * line — what resolve_tax_policy() returns in SQL and what
 * lib/tax/resolve.ts mirrors in TypeScript for client-side preview. Never
 * itself the source of truth for a placed order (submit_cart_order's own
 * SQL-side resolution is) — see lib/tax/README's note on keeping the two
 * in sync. */
export interface EffectiveTaxPolicy {
  rate: number;
  isExempt: boolean;
  isInclusive: boolean;
  label?: string;
}

/** One reservation request for a restaurant or cafe table — same
 * `listing_type`/`listing_id` polymorphic shape reviews/favorites already
 * use, so this works for any restaurant or cafe without per-business code.
 * Never real-time table availability — see submit_table_reservation() —
 * this is always a request the business owner reviews and confirms. */
export interface TableReservation {
  id: string;
  /** "service" listings are always Real Estate property-viewing requests —
   * table_reservations reused rather than a third near-identical table, see
   * lib/utils/business-document.ts's sibling comment in the migration. */
  listingType: "restaurant" | "cafe" | "service";
  listingId: string;
  customerName: string;
  customerPhone: string;
  reservationDate: string;
  reservationTime: string;
  guestsCount: number;
  notes?: string;
  status: "pending" | "confirmed" | "cancelled" | "completed";
  reservationReference: string;
  userId?: string;
  createdAt: string;
}

export type PurchaseRequestStatus =
  | "pending" | "reviewing" | "quote_ready" | "approved" | "declined"
  | "ordered" | "shipped" | "in_transit" | "ready_for_delivery" | "completed"
  | "cancelled" | "rejected";

/** One "buy this for me" request — customer submits a product link/photo,
 * the business manually reviews and returns a priced quote (never
 * auto-calculated: product/shipping/customs cost vary too much to guess),
 * the customer explicitly approves it, then the request is tracked through
 * fulfillment. Polymorphic listingType/listingId like every other
 * business-owned table (reviews, table reservations) — not hardcoded to
 * one partner. */
export interface PurchaseRequest {
  id: string;
  listingType: "city_service";
  listingId: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  productUrl?: string;
  platform: "shein" | "amazon" | "noon" | "iherb" | "alibaba" | "other";
  quantity: number;
  size?: string;
  color?: string;
  variant?: string;
  deliveryLocation: string;
  notes?: string;
  imageUrl?: string;
  status: PurchaseRequestStatus;
  quotedProductCost?: number;
  quotedShippingCost?: number;
  quotedCustomsFee?: number;
  quotedServiceFee?: number;
  quotedTotal?: number;
  quoteExpiresAt?: string;
  /** Shown to the customer. */
  partnerNotesCustomer?: string;
  /** Never exposed to the customer — dashboard-only. */
  partnerNotesInternal?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseRequestStatusHistoryEntry {
  id: string;
  requestId: string;
  oldStatus?: PurchaseRequestStatus;
  newStatus: PurchaseRequestStatus;
  changedBy?: string;
  note?: string;
  createdAt: string;
}

export type EventRequestStatus = "new" | "reviewing" | "proposal_sent" | "approved" | "declined" | "planning" | "completed" | "cancelled";

/** One event-planning request — same request/proposal/approval shape as
 * PurchaseRequest, kept as a separate table (not a variant of it) since the
 * fields and status vocabulary genuinely differ (spec section 12). */
export interface EventRequest {
  id: string;
  listingType: "city_service";
  listingId: string;
  userId: string;
  customerName: string;
  customerPhone: string;
  eventType: "family" | "school" | "festival" | "entertainment" | "social" | "other";
  eventDate?: string;
  eventLocation?: string;
  guestCount?: number;
  budgetRange?: string;
  servicesRequired?: string;
  notes?: string;
  imageUrl?: string;
  status: EventRequestStatus;
  proposalDetails?: string;
  proposalCost?: number;
  createdAt: string;
  updatedAt: string;
}

export interface EventRequestStatusHistoryEntry {
  id: string;
  requestId: string;
  oldStatus?: EventRequestStatus;
  newStatus: EventRequestStatus;
  changedBy?: string;
  note?: string;
  createdAt: string;
}

/** One cart line at checkout time, snapshotted server-side into order_items
 * — an order placed today keeps showing today's name/price forever, even
 * after the product is renamed, repriced, or deleted. */
export interface OrderItem {
  id: string;
  orderId: string;
  productId?: string;
  productName: string;
  productNameAr?: string;
  productNameSo?: string;
  productImage?: string;
  unitPrice: number;
  quantity: number;
  addons: ProductAddon[];
  addonsTotal: number;
  lineTotal: number;
  /** Snapshotted at order time — whether this specific line's tax policy
   * resolved to an explicit exemption. See lib/tax/. */
  isTaxExempt?: boolean;
  /** Present only when this line was a specific shade/finish/size — see
   * ProductVariant. Was previously captured client-side but silently
   * dropped when read back (mapOrderItem never read these columns) — now
   * fixed, so the business owner and admin actually see what was ordered. */
  variantId?: string;
  variantName?: string;
  variantSku?: string;
  /** Frozen configuration snapshot — see SelectedProductOption. Absent for
   * every line with no configured options, i.e. every order on the
   * platform before this system existed. */
  selectedOptions?: SelectedProductOption[];
}

export type ProductOrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "out_for_delivery" | "completed" | "cancelled";

/** One universal order — Restaurants, Cafes, Flower Shops, Perfume Shops,
 * and any future OrderableListingType, all through the same table/RPC
 * (submit_cart_order). Holds the order HEADER (customer, fulfillment,
 * status, totals); the products themselves live in `items` (order_items),
 * one row per cart line. Deliberately its own table (not table_reservations):
 * product orders need fields (recipient, occasion, delivery address, card
 * message, line items) that don't fit a table-reservation shape. */
export interface ProductOrder {
  id: string;
  listingType: OrderableListingType;
  listingId: string;
  items: OrderItem[];
  customerName: string;
  customerPhone: string;
  subtotal: number;
  total?: number;
  /** Everything below is a one-time snapshot written by submit_cart_order
   * at order time — a later tax_policies change never retroactively
   * touches an existing order. See lib/tax/ and
   * supabase/migrations/20260906000001_tax_system_and_product_addons.sql. */
  /** Sum of taxable line amounts (base price × qty + taxable add-ons only)
   * — excludes exempt lines and non-taxable add-ons. */
  taxableSubtotal?: number;
  /** Effective/blended rate actually applied, as a fraction (0.05 = 5%) —
   * display only; the authoritative number is `taxAmount`. */
  taxRate?: number;
  taxAmount?: number;
  /** true when the resolved policy was tax-inclusive — `taxAmount` is then
   * the portion already inside `total`/`subtotal`, not an addition to it. */
  taxIsInclusive?: boolean;
  /** The applicable policy's own admin-facing label at order time, if any
   * (e.g. "Somaliland VAT"). Null when no policy applied (0% order). */
  taxPolicyLabel?: string;
  fulfillmentType: "delivery" | "pickup";
  deliveryAddress?: string;
  /** Optional order-level branch/city selection for a multi-branch partner
   * (e.g. Flormar Hargeisa vs. Flormar Mogadishu) — a raw key like
   * "hargeisa"/"mogadishu", NOT a display label (the storefront/checkout
   * owns the label, e.g. "Hargeisa, Somaliland"). Absent for every order
   * from a single-location business. See
   * 20260907000018_product_order_fulfillment_city.sql. */
  fulfillmentCity?: string;
  preferredDate?: string;
  /** Free-form time/window (e.g. "14:00" or "Afternoon (2-5 PM)") — only
   * ever collected for gift-oriented orders (flowers, cakes, ...); absent
   * for every order before this existed and for restaurant/cafe/other
   * generic orders, which never show the field. See
   * 20260831000001_product_order_preferred_time.sql. */
  preferredTime?: string;
  recipientName?: string;
  recipientPhone?: string;
  occasion?: string;
  messageNote?: string;
  notes?: string;
  status: ProductOrderStatus;
  orderReference: string;
  userId?: string;
  createdAt: string;
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
  | "apartment"
  | "supermarket"
  | "clinic"
  | "government_office";

export interface Service {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  coverImage: string;
  gallery: GalleryImage[];
  videos?: MediaVideo[];
  documentUrl?: string;
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
  socialTiktok?: string;
  openingHours?: string;
  openingHoursStructured?: OpeningHoursGroup[];
  services: string[];
  /** @deprecated Superseded by categorySlug/categoryLabel/categoryIcon, resolved from the `categories` table. Kept only for the underlying enum column — null for any category added after the categories table existed, since the enum has no matching value for it. */
  category: ServiceCategory | null;
  /** Resolved from `categories` via services.category_id — see lib/data/services.ts. Falls back to the legacy `category` enum value/label only for rows a migration hasn't backfilled yet. */
  categorySlug: string;
  categoryLabel: string;
  categoryIcon: string;
  categoryColor: string;
  /** Values for the category's customFieldsSchema, keyed by field `key` — empty for categories with no schema. */
  customFields: Record<string, string | number | boolean>;
  featured?: boolean;
  logo?: string;
  /** Manual, owner-controlled "GO HARGEISA PARTNER" badge flag — see Hotel.isPartner. */
  isPartner: boolean;
  // Travel Agency / Travel Office (extends the existing "tour-companies"
  // category, displayed as "Travel Agencies"). Its existing
  // customFieldsSchema fields — destinations/specialties/license_number —
  // are untouched; these are additional, more structured fields.
  travelAgencyType?:
    | "travel_agency" | "tour_operator" | "ticketing_office" | "visa_services"
    | "hajj_umrah_services" | "local_tours" | "international_tours" | "other";
  flightTicketing?: boolean;
  hotelBooking?: boolean;
  visaAssistance?: boolean;
  tourPackages?: boolean;
  airportTransfers?: boolean;
  carRentalAssistance?: boolean;
  hajjUmrahServices?: boolean;
  localTours?: boolean;
  internationalTours?: boolean;
  groupTours?: boolean;
  travelInsuranceAssistance?: boolean;
  languages?: string[];
  // Flower Shop (extends the existing "flower-shops" category). Its
  // existing customFieldsSchema fields — delivery_available/specialties/
  // custom_arrangements — are untouched; these are additional fields.
  flowerShopType?:
    | "fresh_flowers" | "artificial_flowers" | "wedding_flowers" | "event_decoration"
    | "gift_and_flower_shop" | "floral_design" | "other";
  flowerDeliveryAvailable?: boolean;
  sameDayDelivery?: boolean;
  customBouquets?: boolean;
  weddingArrangements?: boolean;
  eventDecorationService?: boolean;
  giftWrapping?: boolean;
  indoorPlants?: boolean;
  outdoorPlants?: boolean;
  onlineOrderingAvailable?: boolean;
  deliveryAreas?: string[];
  // Apartments (extends the existing "apartments" category)
  apartmentType?:
    | "furnished" | "unfurnished" | "serviced" | "studio" | "family" | "luxury"
    | "short_term_rental" | "long_term_rental" | "other";
  bedrooms?: number;
  bathrooms?: number;
  unitsCount?: number;
  floorNumber?: number;
  buildingFloors?: number;
  furnished?: boolean;
  monthlyRent?: number;
  dailyRent?: number;
  securityDeposit?: number;
  minStayNights?: number;
  maxStayNights?: number;
  parkingAvailable?: boolean;
  wifiAvailable?: boolean;
  airConditioning?: boolean;
  kitchenAvailable?: boolean;
  electricityIncluded?: boolean;
  waterIncluded?: boolean;
  generatorAvailable?: boolean;
  securityAvailable?: boolean;
  elevatorAvailable?: boolean;
  swimmingPool?: boolean;
  laundryAvailable?: boolean;
  familyFriendly?: boolean;
  petPolicy?: "allowed" | "not_allowed" | "case_by_case" | "other";
  // Real Estate (extends the existing "real-estate" category)
  propertyType?:
    | "residential" | "commercial" | "land" | "villa" | "house" | "apartment"
    | "office" | "shop" | "warehouse" | "building" | "agricultural_land" | "other";
  listingPurpose?: "for_sale" | "for_rent" | "for_lease";
  price?: number;
  priceCurrency?: "usd" | "sos" | "other";
  realEstateBedrooms?: number;
  realEstateBathrooms?: number;
  floorsCount?: number;
  yearBuilt?: number;
  areaSqm?: number;
  landAreaSqm?: number;
  buildingAreaSqm?: number;
  realEstateParkingAvailable?: boolean;
  realEstateFurnished?: boolean;
  documentsAvailable?: boolean;
  viewingAvailable?: boolean;
  propertyCondition?: "new" | "excellent" | "good" | "needs_renovation" | "under_construction" | "other";
  ownershipStatus?: "freehold" | "leasehold" | "disputed" | "other";
  // Electronics (extends the existing "electronics" category)
  electronicsBusinessType?:
    | "electronics_store" | "mobile_phone_store" | "computer_store" | "appliance_store"
    | "accessories_store" | "repair_center" | "camera_store" | "gaming_store"
    | "home_electronics" | "other";
  brandsAvailable?: string[];
  sellsNew?: boolean;
  sellsUsed?: boolean;
  warrantyAvailable?: boolean;
  electronicsDeliveryAvailable?: boolean;
  electronicsRepairAvailable?: boolean;
  installationAvailable?: boolean;
  paymentOptions?: string[];
  // Transportation (extends the existing "transportation" category)
  transportationType?:
    | "taxi" | "car_rental" | "bus_service" | "minibus" | "private_driver"
    | "airport_transfer" | "transport_company" | "truck_cargo"
    | "motorcycle_transport" | "delivery_transport" | "other";
  vehicleCount?: number;
  passengerCapacity?: number;
  driverAvailable?: boolean;
  airportTransferAvailable?: boolean;
  cityTransfersAvailable?: boolean;
  intercityTransportAvailable?: boolean;
  rentalAvailable?: boolean;
  dailyRentalAvailable?: boolean;
  weeklyRentalAvailable?: boolean;
  monthlyRentalAvailable?: boolean;
  deliveryServiceAvailable?: boolean;
  cargoServiceAvailable?: boolean;
}

/** Phase 2 — the minimal City Services directory (Hospitals/Banks/
 * Supermarkets/Pharmacies). Deliberately separate from `Service` above —
 * no owner_id, no booking, no subscription, name/phone/hours/maps only.
 * Named "Essential" (not "CityService…") to avoid colliding with the
 * pre-existing CityServiceCategory/CityServicePoint types below, which back
 * the unrelated Smart City Map feature. */
export type EssentialServiceCategory =
  | "hospital" | "bank" | "supermarket" | "pharmacy" | "mosque" | "gas_station"
  | "park_playground" | "kids_family" | "taxi_service" | "police_station" | "fire_station"
  | "electricity_service" | "water_service" | "post_office" | "school" | "university"
  | "sports_club" | "gym" | "car_rental" | "car_wash" | "ev_charging" | "government_office"
  | "visa_immigration" | "internet_telecom";

export interface CityService {
  id: string;
  slug: string;
  category: EssentialServiceCategory;
  /** FK into the `categories` table (target_table='city_services') — the real source of truth for grouping/display metadata. */
  categoryId: string;
  /** Already resolved to the request locale (falls back to English) —
   * see lib/data/city-services.ts, same pattern as Cafe.description. */
  name: string;
  description: string | null;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  openingHours: string | null;
  mapsUrl: string | null;
  website: string | null;
  image: string | null;
  /** Business logo/brand image — shown in place of the category icon on the
   * detail page's identity block when set (see HotelHeaderTop). Same
   * `logo_url` column/convention already used by hotels/restaurants/cafes/
   * services, just newly added here. */
  logoUrl?: string;
  gallery: GalleryImage[];
  videos?: MediaVideo[];
  documentUrl?: string;
  coords: Coordinates;
  status: "draft" | "published" | "archived";
  featured: boolean;
  sortOrder: number;
  /** Manual, owner-controlled "GO HARGEISA PARTNER" badge flag — see Hotel.isPartner. */
  isPartner: boolean;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  favoriteCount?: number;
  amenitiesV2?: string[];
  /** Business-wide add-on vocabulary for this listing's own products (e.g.
   * a flower shop's "Extra Gypsophila"/"Premium Wrapping"/"Message Card"),
   * narrowed per-product by getValidAddonsForProduct same as every other
   * listing type — never applied unconditionally. Resolved in
   * lib/data/city-services.ts by matching this row's own real add-on data
   * ONLY: a `cafes` row sharing the exact same slug (the documented pattern
   * from a business that was split into two listing rows, e.g. Lavender
   * Café → Lavender Flowers) contributes its `flower_addons` here — no
   * other city_services row is affected, and nothing is invented when no
   * matching cafe/slug exists (empty array). */
  flowerAddons?: ProductAddon[];
  /** "Services offered" tags for categories with a services-offered
   * vocabulary (Beauty Salons, Men's Barbershops, Auto Repair & Services) —
   * see lib/config/service-tags.ts. Empty/absent for every other category. */
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
  // Schools + Universities — every count below is optional and off by
  // default; none are gender-split, none are required.
  schoolType?: "primary" | "secondary" | "primary_secondary" | "international" | "private" | "public" | "vocational" | "other";
  curriculum?: "somaliland" | "cambridge" | "international" | "arabic" | "islamic" | "other";
  educationLevels?: string[];
  ageRangeGrades?: string;
  numberOfClassrooms?: number;
  universityType?: "public" | "private" | "community_college" | "vocational_institute" | "other";
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
  // no unisex value exists in either vocabulary.
  salonType?: "hair_salon" | "nail_salon" | "full_service" | "spa_wellness" | "bridal_studio" | "mobile" | "other";
  shopType?: "traditional_barbershop" | "modern_grooming" | "barbershop_spa" | "mobile" | "other";
  staffCount?: number;
  walkInsAccepted?: boolean;
  homeServiceAvailable?: boolean;
  // Cosmetics & Women's Beauty + Perfumes
  storeType?: "boutique" | "multi_brand" | "kiosk" | "online_and_physical" | "other";
  brands?: string[];
  // Car Rental
  rentalType?: "self_drive" | "with_driver" | "both" | "other";
  vehicleTypes?: string[];
  minimumRentalPeriod?: string;
  driversLicenseRequired?: boolean;
  depositRequired?: boolean;
  fleetSize?: number;
  // Clinics / Medical Clinics (clinic-level fields only; Dental Clinic is now
  // one clinicType value within this unified category, not a separate one)
  clinicType?:
    | "general" | "dental" | "hijama" | "veterinary" | "eye" | "dermatology" | "pediatric"
    | "womens_health" | "mens_health" | "physiotherapy" | "ent" | "laboratory_diagnostic" | "other";
  numberOfTreatmentRooms?: number;
  insuranceAccepted?: string[];
  // Auto Repair & Car Services
  garageType?: "general_repair" | "specialized" | "dealership_affiliated" | "mobile_repair" | "other";
  // Gym / Fitness Center
  gymType?: "mens_gym" | "womens_gym" | "mixed_gym" | "fitness_center" | "crossfit" | "personal_training" | "other";
  classesOffered?: string[];
  membershipOptions?: string[];
  personalTrainingAvailable?: boolean;
  groupClassesAvailable?: boolean;
  gymFacilities?: string[];
  trainersAvailable?: boolean;
  femaleTrainersAvailable?: boolean;
  maleTrainersAvailable?: boolean;
  trialMembershipAvailable?: boolean;
  // Hospital
  hospitalType?:
    | "general" | "private" | "public" | "specialist" | "maternity" | "childrens"
    | "surgical" | "emergency" | "medical_center" | "other";
  bedsCount?: number;
  doctorsCount?: number;
  nursesCount?: number;
  departmentsCount?: number;
  operatingRoomsCount?: number;
  emergencyDepartment?: boolean;
  icuAvailable?: boolean;
  pharmacyOnsite?: boolean;
  laboratoryOnsite?: boolean;
  radiologyOnsite?: boolean;
  ambulanceAvailable?: boolean;
  maternityDepartment?: boolean;
  pediatricDepartment?: boolean;
  visitingHours?: string;
  // Pharmacy
  pharmacyType?: "community" | "hospital_pharmacy" | "twenty_four_hour" | "online" | "specialty" | "other";
  pharmacyDeliveryAvailable?: boolean;
  prescriptionRequired?: boolean;
  homeDelivery?: boolean;
  pharmacyEmergencyContact?: string;
}

export interface Attraction {
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
  history: string;
  bestTimeToVisit: string;
  entryFee: string | null;
  visitorTips: string[];
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  socialTiktok?: string;
  socialSnapchat?: string;
  socialX?: string;
  socialYoutube?: string;
  socialTelegram?: string;
  nearbyRestaurantIds: string[];
  nearbyHotelIds: string[];
  category: string;
  featured?: boolean;
  /** Optional — not every source (e.g. Supabase rows) populates these yet. */
  openingHours?: string;
  visitDuration?: string;
  openingHoursStructured?: OpeningHoursGroup[];
  is24Hours?: boolean;
  temporarilyClosed?: boolean;
  permanentlyClosed?: boolean;
  /** Fixed-vocabulary amenities for the detail-page Amenities section (lib/config/amenities.ts). */
  amenitiesV2?: string[];
  favoriteCount?: number;
}

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  gallery: GalleryImage[];
  videos?: MediaVideo[];
  category: string;
  startDate: string;
  endDate: string | null;
  location: string;
  /** Geo coordinates for the "Nearby Places" query — distinct from
   * `location`, the free-text venue description (e.g. "Hargeisa Stadium"). */
  coords: Coordinates;
  ticketInfo?: string;
  googleMapsUrl?: string;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  favoriteCount?: number;
  amenitiesV2?: string[];
  openingHoursStructured?: OpeningHoursGroup[];
  is24Hours?: boolean;
  temporarilyClosed?: boolean;
  permanentlyClosed?: boolean;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  socialTiktok?: string;
  socialSnapchat?: string;
  socialX?: string;
  socialYoutube?: string;
  socialTelegram?: string;
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
  | "car_rental"
  | "mosque"
  | "supermarket"
  | "school"
  | "university"
  | "airport"
  | "parking"
  | "gym"
  | "tour_company"
  | "apartment"
  | "auto_repair";

export interface CityServicePoint {
  id: string;
  name: string;
  category: CityServiceCategory;
  location: Coordinates;
  /** Present for Phase 2 service points (backed by the `services` table)
   * so the map popup can show full details + a working Claim button
   * without a second fetch. Absent for legacy map_points pins. */
  slug?: string;
  /** Phase 2 service points only — the `categories` table slug (e.g.
   * "hospitals"), used with serviceHref() to build a detail link. The
   * generic `services` vertical is retired (SERVICES_PUBLIC_ENABLED=false
   * in lib/config/features.ts) so map-points.ts never fetches these rows
   * today — this field stays typed for the shared serviceHref()/dashboard/
   * reviews/favorites machinery, which also resolves other "service"-type
   * records. Distinct from `category` above, which is the map-pin styling
   * taxonomy. */
  categorySlug?: string;
  address?: string;
  description?: string;
  phone?: string;
  /** Phase 2 service points only — the `services` table has no is_24_hours/
   * temporarily_closed/permanently_closed columns (unlike hotels/restaurants/
   * cafes/attractions), so an open/closed badge here can only ever be
   * derived from these day-groups. */
  openingHoursStructured?: OpeningHoursGroup[];
}
