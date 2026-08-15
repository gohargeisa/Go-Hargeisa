/**
 * Single source of truth for which "primary action" family a business/service
 * category belongs to, on the two generic detail-page templates
 * (city-services/[slug] and services/[category]/[slug]) — hotels,
 * restaurants, and cafes already have their own dedicated, capability-driven
 * CTA logic (see booking-cta.ts, restaurant-cta.ts, and the `reservable`
 * column) and are NOT covered here.
 *
 * Doctor/dentist appointments are also handled separately, upstream of this
 * (categories.supports_appointments + at least one real doctor/staff row —
 * see isMedicalAppointmentCategory) since that's a real booking flow with its
 * own table. property_viewing (Real Estate) reuses table_reservations, and
 * product_order (Flower Shops, Perfume Shops, ...) uses the new
 * product_orders table — both real request flows, not just a label choice.
 * car_service/education/travel/contact remain a label/icon choice over the
 * existing contact channels (phone/WhatsApp/website) — no booking table for
 * those, matching "do not invent unavailable functionality".
 */
export type PrimaryActionGroup = "car_service" | "education" | "travel" | "property_viewing" | "product_order" | "contact";

const CAR_SERVICE_CATEGORY_SLUGS = new Set(["car-rental", "car-wash", "auto-repair", "taxi-service"]);
const EDUCATION_CATEGORY_SLUGS = new Set(["school", "university", "institute", "language-institute", "quran-memorization-center"]);
const TRAVEL_AGENCY_CATEGORY_SLUGS = new Set(["tour-companies"]);
const REAL_ESTATE_CATEGORY_SLUGS = new Set(["real-estate"]);

/**
 * `supportsProducts` is the real `categories.supports_products` flag — a
 * category only lands in the "product_order" group when it actually has a
 * product catalog; callers still need to check the listing has at least one
 * real product before offering the order flow, since an empty catalog
 * should fall back to a plain contact action instead.
 */
export function getPrimaryActionGroup(categorySlug: string, supportsProducts: boolean): PrimaryActionGroup {
  if (CAR_SERVICE_CATEGORY_SLUGS.has(categorySlug)) return "car_service";
  if (EDUCATION_CATEGORY_SLUGS.has(categorySlug)) return "education";
  if (TRAVEL_AGENCY_CATEGORY_SLUGS.has(categorySlug)) return "travel";
  if (REAL_ESTATE_CATEGORY_SLUGS.has(categorySlug)) return "property_viewing";
  if (supportsProducts) return "product_order";
  return "contact";
}
