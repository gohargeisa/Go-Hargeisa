import type { ServiceCategory } from "@/types";

/**
 * Single source of truth for turning a `ServiceCategory` enum value into a
 * URL segment and back. Services live at /services/{category-slug}/{slug}
 * (nested under category, unlike hotels/restaurants/cafes' flat /{type}/
 * {slug}) since slugs are only unique within `services` as a whole and a
 * flat /services/[slug] route would collide with /services/[category] at
 * the Next.js routing level. Used by the category/detail routes, the
 * Interactive Map, the homepage section, and every href builder (reviews,
 * favorites, saved trips) that needs to link to a service.
 */
export const SERVICE_CATEGORY_SLUGS: Record<ServiceCategory, string> = {
  hospital: "hospitals",
  pharmacy: "pharmacies",
  dental_clinic: "dental-clinics",
  bank: "banks",
  atm: "atms",
  currency_exchange: "currency-exchange",
  gas_station: "gas-stations",
  car_rental: "car-rentals",
  mosque: "mosques",
  school: "schools",
  university: "universities",
  gym: "gyms",
  tour_company: "tour-companies",
  apartment: "apartments",
};

export const SERVICE_CATEGORY_LABELS: Record<ServiceCategory, string> = {
  hospital: "Hospitals",
  pharmacy: "Pharmacies",
  dental_clinic: "Dental Clinics",
  bank: "Banks",
  atm: "ATMs",
  currency_exchange: "Currency Exchange",
  gas_station: "Gas Stations",
  car_rental: "Car Rentals",
  mosque: "Mosques",
  school: "Schools",
  university: "Universities",
  gym: "Gyms",
  tour_company: "Tour Companies",
  apartment: "Apartments",
};

export const SERVICE_CATEGORY_SINGULAR_LABELS: Record<ServiceCategory, string> = {
  hospital: "Hospital",
  pharmacy: "Pharmacy",
  dental_clinic: "Dental Clinic",
  bank: "Bank",
  atm: "ATM",
  currency_exchange: "Currency Exchange",
  gas_station: "Gas Station",
  car_rental: "Car Rental",
  mosque: "Mosque",
  school: "School",
  university: "University",
  gym: "Gym",
  tour_company: "Tour Company",
  apartment: "Apartment",
};

export const SERVICE_CATEGORY_ORDER: ServiceCategory[] = [
  "hospital",
  "pharmacy",
  "dental_clinic",
  "bank",
  "atm",
  "currency_exchange",
  "gas_station",
  "car_rental",
  "mosque",
  "school",
  "university",
  "gym",
  "tour_company",
  "apartment",
];

const SLUG_TO_CATEGORY: Record<string, ServiceCategory> = Object.fromEntries(
  SERVICE_CATEGORY_ORDER.map((category) => [SERVICE_CATEGORY_SLUGS[category], category])
) as Record<string, ServiceCategory>;

export function categoryFromSlug(slug: string): ServiceCategory | null {
  return SLUG_TO_CATEGORY[slug] ?? null;
}

export function serviceHref(category: ServiceCategory, slug: string): string {
  return `/services/${SERVICE_CATEGORY_SLUGS[category]}/${slug}`;
}

// Extra search keywords per category so "Hospital", "ATM", "Gas Station",
// etc. return relevant results even when a business's real name doesn't
// literally contain that word (e.g. a bank branded "Dahabshiil" rather
// than "Dahabshiil Bank", or a fuel stop branded "Total").
const SERVICE_CATEGORY_KEYWORDS: Record<ServiceCategory, string[]> = {
  hospital: ["hospital", "hospitals", "clinic", "medical", "health"],
  pharmacy: ["pharmacy", "pharmacies", "chemist", "drugstore", "medicine"],
  dental_clinic: ["dental", "dentist", "dental clinic", "teeth"],
  bank: ["bank", "banks", "banking"],
  atm: ["atm", "atms", "cash machine", "cash point"],
  currency_exchange: ["currency exchange", "money exchange", "exchange", "forex"],
  gas_station: ["gas station", "gas", "petrol", "fuel", "filling station"],
  car_rental: ["car rental", "car rentals", "rent a car", "car hire"],
  mosque: ["mosque", "mosques", "masjid", "jaamac"],
  school: ["school", "schools", "primary school", "secondary school"],
  university: ["university", "universities", "college"],
  gym: ["gym", "gyms", "fitness", "fitness center", "workout"],
  tour_company: ["tour company", "tour companies", "tours", "travel agency", "tour operator"],
  apartment: ["apartment", "apartments", "flat", "flats", "furnished apartment"],
};

/** Resolves a free-text search query to a service category when the query
 * is really a category name ("Hospital", "ATM", "Gas Station") rather than
 * a business name — used so the /services search box surfaces the whole
 * category instead of relying on literal name matches. */
export function matchCategoryFromQuery(query: string): ServiceCategory | null {
  const needle = query.trim().toLowerCase();
  if (!needle) return null;
  for (const category of SERVICE_CATEGORY_ORDER) {
    if (SERVICE_CATEGORY_KEYWORDS[category].some((kw) => kw === needle || needle.includes(kw) || kw.includes(needle))) {
      return category;
    }
  }
  return null;
}
