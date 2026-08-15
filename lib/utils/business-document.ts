/**
 * Single source of truth for which "PDF label" family a business/category
 * belongs to — same category-grouping shape as
 * lib/utils/business-primary-action.ts, just for the optional business
 * document (hotels.document_url / city_services.document_url /
 * services.document_url). Restaurant/Cafe keep their own existing,
 * unrelated "Menu" PDF section (restaurants.menu_pdf_url /
 * cafes.menu_pdf_url) untouched — this only covers the 3 listing tables
 * that had no PDF concept at all before this feature.
 */
export type DocumentLabelGroup =
  | "hotel_info"
  | "medical_info"
  | "price_list"
  | "course_catalog"
  | "brochure"
  | "catalog"
  | "generic";

const MEDICAL_INFO_SLUGS = new Set(["hospital", "clinic", "dental-clinic", "pharmacy"]);
const PRICE_LIST_SLUGS = new Set(["beauty-salon", "men-barbershop", "cosmetics-beauty"]);
const COURSE_CATALOG_SLUGS = new Set(["school", "university", "institute", "language-institute", "quran-memorization-center"]);
const BROCHURE_SLUGS = new Set(["real-estate"]);
const CATALOG_SLUGS = new Set(["flower-shops", "perfume-shop", "electronics"]);

export function getDocumentLabelGroup(params: { listingType: "hotel" | "city_service" | "service"; categorySlug?: string }): DocumentLabelGroup {
  if (params.listingType === "hotel") return "hotel_info";
  const slug = params.categorySlug ?? "";
  if (MEDICAL_INFO_SLUGS.has(slug)) return "medical_info";
  if (PRICE_LIST_SLUGS.has(slug)) return "price_list";
  if (COURSE_CATALOG_SLUGS.has(slug)) return "course_catalog";
  if (BROCHURE_SLUGS.has(slug)) return "brochure";
  if (CATALOG_SLUGS.has(slug)) return "catalog";
  return "generic";
}
