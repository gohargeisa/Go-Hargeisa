/**
 * The `/api/v1/*` contract — DTOs shared by the website's Route Handlers
 * (which produce them) and the native app's API client (which consumes
 * them). Self-contained on purpose: no `@gohargeisa/types` import, so a
 * schema change to the DB types never silently reshapes the wire format.
 *
 * All localizable text is ALREADY resolved to the request locale
 * server-side (from the `Accept-Language` header) — the client renders
 * strings as-is.
 */

export type ApiLocale = "en" | "ar" | "so";

export interface LatLng {
  lat: number;
  lng: number;
}

export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
}

export interface HealthResponse {
  ok: true;
  service: "gohargeisa-api";
  version: "v1";
  ts: string;
}

export interface CategoryDTO {
  id: string;
  slug: string;
  /** Localized. */
  name: string;
  /** Localized; null when the category has no description. */
  description: string | null;
  /** lucide-react icon export name — the app maps it to its own icon set. */
  icon: string;
  color: string | null;
  imageUrl: string | null;
  targetTable: string;
  /** Published-listing count (already filtered to visible verticals). */
  businessCount: number;
  supportsProducts: boolean;
  supportsAppointments: boolean;
}

export interface ReviewDTO {
  id: string;
  authorName: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  title: string | null;
  /** "YYYY-MM-DD" — when the reviewer says they visited, distinct from
   *  createdAt. Null when unset. */
  visitDate: string | null;
}

export interface GalleryImageDTO {
  url: string;
  caption: string | null;
}

/** The shape returned in list/search results — lean. */
export interface CityServiceListItem {
  id: string;
  slug: string;
  /** Localized. */
  name: string;
  categoryId: string;
  categorySlug: string | null;
  categoryName: string | null;
  /** Localized; may be long — the client truncates for cards. */
  description: string | null;
  image: string | null;
  logoUrl: string | null;
  rating: number;
  reviewCount: number;
  featured: boolean;
  isPartner: boolean;
  coords: LatLng | null;
  phone: string | null;
  whatsapp: string | null;
}

/** The full partner-detail payload. */
export interface CityServiceDetail extends CityServiceListItem {
  email: string | null;
  website: string | null;
  mapsUrl: string | null;
  openingHours: string | null;
  /** Structured week grid when the listing has one; else null. Opaque to
   *  the contract — the app's shared opening-hours helpers parse it. */
  openingHoursStructured: unknown[] | null;
  is24Hours: boolean;
  temporarilyClosed: boolean;
  permanentlyClosed: boolean;
  gallery: GalleryImageDTO[];
  amenities: string[];
  serviceTags: string[];
  social: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    snapchat?: string;
    x?: string;
    youtube?: string;
    telegram?: string;
  };
  reviews: ReviewDTO[];
  /** Empty unless the listing's category supports appointments (Health,
   *  Beauty Salons, ...). */
  departments: DepartmentDTO[];
  /** Empty unless the listing's category supports appointments. */
  doctors: DoctorDTO[];
  /** Empty unless the listing's category supports products
   *  (categories.supports_products). */
  products: ProductDTO[];
  /** city_services checkout always offers delivery — no configurable flag
   *  exists for this vertical (matches the website's own hardcoded `true`
   *  on this page). */
  deliveryEnabled: boolean;
}

export interface DepartmentDTO {
  id: string;
  /** Localized. */
  name: string;
}

export interface DoctorDTO {
  id: string;
  departmentId: string | null;
  name: string;
  photo: string | null;
  /** Localized; null when the doctor has none set. */
  specialty: string | null;
  /** Localized; null when the doctor has none set. */
  bio: string | null;
  languages: string[];
  appointmentDurationMinutes: number;
  consultationFee: number | null;
}

export interface SlotStatusDTO {
  /** "HH:mm" in the doctor's own working-hours timezone (no timezone
   *  conversion is applied anywhere in this pipeline — same as the website). */
  time: string;
  /** false = already taken by a pending/confirmed appointment for this
   *  doctor + date; the client renders it disabled/labelled "Booked". */
  available: boolean;
}

export interface SubmitAppointmentInput {
  doctorId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  /** "YYYY-MM-DD". */
  appointmentDate: string;
  /** "HH:mm", one of the values returned by the appointment-slots endpoint. */
  appointmentTime: string;
  notes?: string;
}

export interface SubmitAppointmentResult {
  ok: true;
}

/** Menu item — shared shape for restaurants and cafes (both back onto the
 *  same free-form `menu` jsonb column shape). */
export interface MenuItemDTO {
  name: string;
  price: string | null;
  description: string | null;
  category: string | null;
}

/** Lean shape for restaurant list/search results. Restaurants have no
 *  localized name/description columns in the database (English-only
 *  content) — this is a real, verified schema fact, not an omission. */
export interface RestaurantListItem {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  image: string | null;
  cuisine: string[];
  priceRange: "$" | "$$" | "$$$";
  rating: number;
  reviewCount: number;
  featured: boolean;
  isPartner: boolean;
  reservable: boolean;
  coords: LatLng | null;
  phone: string | null;
  whatsapp: string | null;
}

export interface RestaurantDetail extends RestaurantListItem {
  description: string;
  email: string | null;
  website: string | null;
  mapsUrl: string | null;
  openingHours: string | null;
  openingHoursStructured: unknown[] | null;
  is24Hours: boolean;
  temporarilyClosed: boolean;
  permanentlyClosed: boolean;
  gallery: GalleryImageDTO[];
  menuHighlights: MenuItemDTO[];
  amenities: string[];
  social: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    snapchat?: string;
    x?: string;
    youtube?: string;
    telegram?: string;
  };
  reviews: ReviewDTO[];
  /** Empty unless `catalogOrderingEnabled` is true. */
  products: ProductDTO[];
  deliveryEnabled: boolean;
}

/** Lean shape for cafe list/search results. Unlike restaurants, cafes DO
 *  have a localized `description` column (name is still English-only) —
 *  already resolved to the request locale server-side, same as everything
 *  else in this contract. */
export interface CafeListItem {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  image: string | null;
  priceRange: "$" | "$$" | "$$$" | "$$$$" | null;
  rating: number;
  reviewCount: number;
  featured: boolean;
  isPartner: boolean;
  reservable: boolean;
  wifi: boolean;
  workingSpace: boolean;
  coords: LatLng | null;
  phone: string | null;
  whatsapp: string | null;
}

export interface CafeDetail extends CafeListItem {
  description: string;
  email: string | null;
  website: string | null;
  mapsUrl: string | null;
  openingHours: string | null;
  openingHoursStructured: unknown[] | null;
  is24Hours: boolean;
  temporarilyClosed: boolean;
  permanentlyClosed: boolean;
  gallery: GalleryImageDTO[];
  menuHighlights: MenuItemDTO[];
  specialDrinks: string[];
  amenities: string[];
  social: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    snapchat?: string;
    x?: string;
    youtube?: string;
    telegram?: string;
  };
  reviews: ReviewDTO[];
  /** Empty unless `ordering_enabled` is true. Legacy business-wide
   *  `flower_addons` are already merged into each eligible product's own
   *  `addons` array server-side — never exposed as a separate field. */
  products: ProductDTO[];
  deliveryEnabled: boolean;
}

export interface RestaurantCafeListParams {
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface ProductOptionChoiceDTO {
  value: string;
  /** Localized. */
  label: string;
  priceDelta: number;
}

export interface ProductOptionDTO {
  id: string;
  key: string;
  /** Localized. */
  label: string;
  type: "select" | "multiselect" | "boolean" | "text" | "number";
  required: boolean;
  priceDelta: number;
  choices: ProductOptionChoiceDTO[];
  /** Localized; null when unset. */
  placeholder: string | null;
  maxLength: number | null;
}

export interface ProductVariantDTO {
  id: string;
  /** Localized. */
  name: string;
  shadeName: string | null;
  shadeCode: string | null;
  hexColor: string | null;
  finish: string | null;
  size: string | null;
  image: string | null;
  sku: string | null;
  price: number | null;
  isAvailable: boolean;
}

export interface ProductAddonDTO {
  id: string;
  /** Localized. */
  name: string;
  price: number;
  /** Set only for a genuine per-product add-on; absent for a business-wide
   *  legacy add-on (see CafeDetail.flowerAddons). */
  productId: string | null;
  isTaxable: boolean;
}

/** One item in a listing's product catalog — city_services (gated by
 *  `categories.supports_products`) or cafes (gated by `cafes.ordering_enabled`)
 *  only. Restaurant ordering is out of scope: the backend RPC already
 *  supports `restaurants.ordering_enabled`, but the website's own frontend
 *  never exposes it (no `orderingEnabled` field on the `Restaurant` type) —
 *  this contract matches that real, current website behavior, not the RPC's
 *  full theoretical capability. */
export interface ProductDTO {
  id: string;
  /** Localized. */
  name: string;
  /** Localized; null when unset. */
  description: string | null;
  brand: string | null;
  category: string | null;
  gender: "men" | "women" | "unisex" | "kids" | null;
  price: number | null;
  originalPrice: number | null;
  currency: string;
  image: string | null;
  gallery: GalleryImageDTO[];
  isAvailable: boolean;
  isFeatured: boolean;
  size: string | null;
  sku: string | null;
  stockQuantity: number | null;
  variants: ProductVariantDTO[];
  options: ProductOptionDTO[];
  /** Already merged server-side: this product's own product_addons rows
   *  PLUS (only when its category is a flower/gift category) the business's
   *  legacy flower_addons — see getValidAddonsForProduct's exact rule on the
   *  website, replicated identically by the DTO projector, not the client. */
  addons: ProductAddonDTO[];
}

export type RoomType = "standard" | "deluxe" | "twin" | "family" | "executive_suite";

export interface HotelRoomDTO {
  id: string;
  name: string;
  image: string | null;
  description: string | null;
  maxGuests: number;
  bedType: string | null;
  bathrooms: number;
  features: string[];
  pricePerNight: number | null;
  weekendPrice: number | null;
  discountPrice: number | null;
  roomType: RoomType;
  isAvailable: boolean;
}

/** Lean shape for hotel list/search results. Hotels have BOTH a localized
 *  `name` and `description` (unlike restaurants, which have neither, and
 *  cafes, which only localize description) — but the website's own
 *  `getHotels()` list function doesn't accept a locale param at all (only
 *  `getHotelBySlug` does), a real, existing asymmetry this list endpoint
 *  preserves rather than "fixing". */
export interface HotelListItem {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  image: string | null;
  priceRange: string;
  rating: number;
  reviewCount: number;
  featured: boolean;
  isPartner: boolean;
  bookingMode: "go_hargeisa" | "external";
  coords: LatLng | null;
  phone: string | null;
  whatsapp: string | null;
}

export interface HotelDetail extends HotelListItem {
  description: string;
  email: string | null;
  website: string | null;
  mapsUrl: string | null;
  checkInTime: string | null;
  checkOutTime: string | null;
  amenities: string[];
  gallery: GalleryImageDTO[];
  rooms: HotelRoomDTO[];
  social: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
    snapchat?: string;
    x?: string;
    youtube?: string;
    telegram?: string;
  };
  reviews: ReviewDTO[];
  /** Only populated when bookingMode is "external". */
  externalBookingOption: "website" | "booking_com" | "whatsapp" | "custom_url" | null;
  externalBookingUrl: string | null;
  bookingWhatsapp: string | null;
  bookingComUrl: string | null;
}

export interface CityServiceListParams {
  /** Category slug filter. */
  category?: string;
  /** Free-text query (matched against name + description server-side). */
  q?: string;
  page?: number;
  pageSize?: number;
}

/** Error body shape for any non-2xx `/api/v1` response. */
export interface ApiErrorBody {
  error: string;
  code?: string;
}
