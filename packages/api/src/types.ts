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
