import { isPlaceholderImage } from "@/lib/utils/is-placeholder-image";

/**
 * Reusable partner data-quality checks — the "Partner Production Quality
 * System" infrastructure. Pure functions, no DB/network access, so they
 * can run both server-side (as a pre-publish gate — see
 * lib/actions/admin.ts, lib/actions/city-services.ts,
 * lib/actions/business-requests.ts) and in admin UI for display, without
 * duplicating the rules in two places.
 *
 * Deliberately narrow: these check *completeness and honesty* (is there a
 * real name/contact/photo, does it look like placeholder junk), never
 * business-specific facts (never asserts what a business's real hours or
 * price *should* be) — this project's own rule is "never fabricate," and a
 * validator that guessed correct values would violate that as much as a
 * human editor would.
 */

export interface QualityIssue {
  code: string;
  message: string;
}

export interface QualityCheckResult {
  errors: QualityIssue[];
  warnings: QualityIssue[];
}

const PLACEHOLDER_TEXT_VALUES = new Set([
  "test",
  "testing",
  "todo",
  "n/a",
  "na",
  "tbd",
  "draft",
  "asdf",
  "placeholder",
  "xxx",
  "sample business",
  "example",
  "example business",
  "untitled",
]);

/** Generous bounding box around Hargeisa/Somaliland — wide enough to never
 * flag a real local listing, tight enough to catch a swapped lat/lng or a
 * stray (0, 0) default. */
const SOMALILAND_BOUNDS = { minLat: 8, maxLat: 12, minLng: 42, maxLng: 49 };

function isPlaceholderText(value: string | null | undefined): boolean {
  if (!value) return false;
  const normalized = value.trim().toLowerCase();
  if (PLACEHOLDER_TEXT_VALUES.has(normalized)) return true;
  return normalized.includes("lorem ipsum");
}

function isPlausiblePhone(value: string | null | undefined): boolean {
  if (!value) return false;
  const digits = value.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export interface ListingQualityInput {
  name: string | null | undefined;
  description: string | null | undefined;
  phone: string | null | undefined;
  cover_image: string | null | undefined;
  gallery: unknown;
  lat: number | null | undefined;
  lng: number | null | undefined;
}

export interface ListingQualityOptions {
  /** From categories.supports_products — when a category doesn't sell
   * products at all, an empty catalog is expected, not a quality issue. */
  supportsProducts?: boolean;
  productCount?: number;
}

/** Checks one hotel/restaurant/cafe/service/city_service row. Field names
 * match the raw DB columns shared across every listing table (same
 * convention lib/data/owner-dashboard.ts's computeHealthScore already
 * uses), so callers can pass a query result straight through. */
export function validatePartnerListing(
  listing: ListingQualityInput,
  options: ListingQualityOptions = {}
): QualityCheckResult {
  const errors: QualityIssue[] = [];
  const warnings: QualityIssue[] = [];

  if (!listing.name?.trim()) {
    errors.push({ code: "missingName", message: "Business name is empty." });
  } else if (isPlaceholderText(listing.name)) {
    errors.push({ code: "placeholderName", message: `"${listing.name}" looks like placeholder text, not a real business name.` });
  }

  if (!listing.description?.trim()) {
    warnings.push({ code: "missingDescription", message: "No description yet." });
  } else if (isPlaceholderText(listing.description)) {
    errors.push({ code: "placeholderDescription", message: "Description looks like placeholder text (e.g. lorem ipsum)." });
  }

  if (!listing.phone?.trim()) {
    errors.push({ code: "missingContact", message: "No phone number on file — customers have no way to reach this business." });
  } else if (!isPlausiblePhone(listing.phone)) {
    warnings.push({ code: "suspiciousPhone", message: `Phone number "${listing.phone}" doesn't look like a valid number.` });
  }

  if (isPlaceholderImage(listing.cover_image)) {
    warnings.push({ code: "placeholderCoverImage", message: "Cover image is a generated placeholder, not a real photo." });
  }

  const galleryCount = Array.isArray(listing.gallery) ? listing.gallery.length : 0;
  if (galleryCount === 0) {
    warnings.push({ code: "noGalleryPhotos", message: "No gallery photos yet." });
  }

  if (listing.lat == null || listing.lng == null) {
    warnings.push({ code: "missingCoordinates", message: "No map coordinates set." });
  } else if (
    listing.lat < SOMALILAND_BOUNDS.minLat ||
    listing.lat > SOMALILAND_BOUNDS.maxLat ||
    listing.lng < SOMALILAND_BOUNDS.minLng ||
    listing.lng > SOMALILAND_BOUNDS.maxLng
  ) {
    warnings.push({ code: "coordinatesOutOfRange", message: "Coordinates fall outside the expected Somaliland area — double-check they're correct." });
  }

  if (options.supportsProducts && (options.productCount ?? 0) === 0) {
    warnings.push({ code: "noProductsYet", message: "This category supports products, but none are listed yet." });
  }

  return { errors, warnings };
}

export interface ProductQualityInput {
  name: string | null | undefined;
  price: number | null | undefined;
}

/** Checks one product row. Missing price is a warning, not an error — "Ask
 * for Price" is a legitimate, honest state, never a reason to block
 * publishing on its own. */
export function validateProductListing(product: ProductQualityInput): QualityCheckResult {
  const errors: QualityIssue[] = [];
  const warnings: QualityIssue[] = [];

  if (!product.name?.trim()) {
    errors.push({ code: "missingName", message: "Product name is empty." });
  } else if (isPlaceholderText(product.name)) {
    errors.push({ code: "placeholderName", message: `"${product.name}" looks like placeholder text.` });
  }

  if (product.price == null) {
    warnings.push({ code: "missingPrice", message: 'No price set — will show as "Ask for Price".' });
  } else if (product.price === 0) {
    warnings.push({ code: "zeroPrice", message: "Price is $0 — confirm this is intentional (e.g. genuinely free)." });
  } else if (product.price < 0) {
    errors.push({ code: "negativePrice", message: "Price is negative." });
  }

  return { errors, warnings };
}

/** "Production Ready" / "Needs Review" / "Blocked" — internal-only status
 * for admin surfaces (never rendered to customers, see partner-quality.ts's
 * own header comment and Go Hargeisa Partner Production Quality System
 * section 43). Blocked mirrors the same hard-error bar the pre-publish gate
 * itself enforces; "Needs Review" is everything short of that with an open
 * warning. */
export type QualityStatus = "ready" | "needsReview" | "blocked";

export function qualityStatusFor(result: QualityCheckResult): QualityStatus {
  if (result.errors.length > 0) return "blocked";
  if (result.warnings.length > 0) return "needsReview";
  return "ready";
}
