import { SquareParking, Sofa, FileCheck, Eye, type LucideIcon } from "lucide-react";
import type { Service } from "@/types";

export type PropertyType = NonNullable<Service["propertyType"]>;

export const PROPERTY_TYPE_ORDER: PropertyType[] = [
  "residential",
  "commercial",
  "land",
  "villa",
  "house",
  "apartment",
  "office",
  "shop",
  "warehouse",
  "building",
  "agricultural_land",
  "other",
];

export const PROPERTY_TYPE_LABELS: Record<PropertyType, { en: string; ar: string; so: string }> = {
  residential: { en: "Residential Property", ar: "عقار سكني", so: "Hanti Deggaanaya" },
  commercial: { en: "Commercial Property", ar: "عقار تجاري", so: "Hanti Ganacsi" },
  land: { en: "Land", ar: "أرض", so: "Dhul" },
  villa: { en: "Villa", ar: "فيلا", so: "Villa" },
  house: { en: "House", ar: "منزل", so: "Guri" },
  apartment: { en: "Apartment", ar: "شقة", so: "Guri Apartment ah" },
  office: { en: "Office", ar: "مكتب", so: "Xafiis" },
  shop: { en: "Shop", ar: "محل", so: "Dukaan" },
  warehouse: { en: "Warehouse", ar: "مستودع", so: "Bakhaar" },
  building: { en: "Building", ar: "مبنى", so: "Dhismo" },
  agricultural_land: { en: "Agricultural Land", ar: "أرض زراعية", so: "Dhul Beeraale ah" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function propertyTypeLabel(type: PropertyType | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = PROPERTY_TYPE_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

export type ListingPurpose = NonNullable<Service["listingPurpose"]>;

export const LISTING_PURPOSE_ORDER: ListingPurpose[] = ["for_sale", "for_rent", "for_lease"];

export const LISTING_PURPOSE_LABELS: Record<ListingPurpose, { en: string; ar: string; so: string }> = {
  for_sale: { en: "For Sale", ar: "للبيع", so: "Waa la iibinayaa" },
  for_rent: { en: "For Rent", ar: "للإيجار", so: "Waa la kiraynayaa" },
  for_lease: { en: "For Lease", ar: "للتأجير طويل الأجل", so: "Kiro Muddo Dheer" },
};

export function listingPurposeLabel(type: ListingPurpose | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = LISTING_PURPOSE_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

export type PropertyCondition = NonNullable<Service["propertyCondition"]>;

export const PROPERTY_CONDITION_ORDER: PropertyCondition[] = [
  "new",
  "excellent",
  "good",
  "needs_renovation",
  "under_construction",
  "other",
];

export const PROPERTY_CONDITION_LABELS: Record<PropertyCondition, { en: string; ar: string; so: string }> = {
  new: { en: "New", ar: "جديد", so: "Cusub" },
  excellent: { en: "Excellent", ar: "ممتاز", so: "Aad u fiican" },
  good: { en: "Good", ar: "جيد", so: "Fiican" },
  needs_renovation: { en: "Needs Renovation", ar: "يحتاج إلى تجديد", so: "U baahan Dib-u-cusboonaysiin" },
  under_construction: { en: "Under Construction", ar: "قيد الإنشاء", so: "Dhismaha wuu socdaa" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function propertyConditionLabel(type: PropertyCondition | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = PROPERTY_CONDITION_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

export type OwnershipStatus = NonNullable<Service["ownershipStatus"]>;

export const OWNERSHIP_STATUS_ORDER: OwnershipStatus[] = ["freehold", "leasehold", "disputed", "other"];

export const OWNERSHIP_STATUS_LABELS: Record<OwnershipStatus, { en: string; ar: string; so: string }> = {
  freehold: { en: "Freehold", ar: "ملكية حرة", so: "Milkiyad Buuxda" },
  leasehold: { en: "Leasehold", ar: "ملكية مؤجرة", so: "Milkiyad Kiro ah" },
  disputed: { en: "Disputed", ar: "متنازع عليه", so: "Muran ku dhex jira" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function ownershipStatusLabel(type: OwnershipStatus | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = OWNERSHIP_STATUS_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

export type PriceCurrency = NonNullable<Service["priceCurrency"]>;

export const PRICE_CURRENCY_ORDER: PriceCurrency[] = ["usd", "sos", "other"];

export const PRICE_CURRENCY_LABELS: Record<PriceCurrency, { en: string; ar: string; so: string }> = {
  usd: { en: "USD ($)", ar: "دولار أمريكي ($)", so: "Doollar Mareykan ($)" },
  sos: { en: "Somaliland Shilling", ar: "شلن صومالي لاندي", so: "Shilin Somaliland" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function priceCurrencyLabel(type: PriceCurrency | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = PRICE_CURRENCY_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

/** Each code maps 1:1 to its own dedicated boolean column on `services`
 * (real_estate_parking_available, real_estate_furnished, documents_available,
 * viewing_available — column names are prefixed to avoid colliding with
 * Apartments' own parking_available/furnished columns on the same table). */
export const REAL_ESTATE_FEATURE_ORDER = ["parking_available", "furnished", "documents_available", "viewing_available"] as const;

export type RealEstateFeatureCode = (typeof REAL_ESTATE_FEATURE_ORDER)[number];

export const REAL_ESTATE_FEATURE_ICON: Record<RealEstateFeatureCode, LucideIcon> = {
  parking_available: SquareParking,
  furnished: Sofa,
  documents_available: FileCheck,
  viewing_available: Eye,
};

export const REAL_ESTATE_FEATURE_LABELS: Record<RealEstateFeatureCode, { en: string; ar: string; so: string }> = {
  parking_available: { en: "Parking Available", ar: "موقف سيارات متاح", so: "Meel Baabuur la Dhigto" },
  furnished: { en: "Furnished", ar: "مفروش", so: "Alaabo leh" },
  documents_available: { en: "Property Documents Available", ar: "مستندات العقار متوفرة", so: "Waraaqaha Hantida ayaa la heli karaa" },
  viewing_available: { en: "Viewing Available", ar: "المعاينة متاحة", so: "Daawasho ayaa la heli karaa" },
};

export function realEstateFeatureLabel(code: RealEstateFeatureCode, locale: string): string {
  const entry = REAL_ESTATE_FEATURE_LABELS[code];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

/** Suggested "services" chips for the shared `services` text[] column —
 * Real Estate's Featured Listing/Agent Contact reuse existing generic
 * `featured`/`phone` columns instead (see 20260812000001), so this list is
 * purely the services-offered vocabulary. */
export const REAL_ESTATE_SERVICE_SUGGESTIONS: { en: string; ar: string; so: string }[] = [
  { en: "Property Viewing", ar: "معاينة العقار", so: "Daawashada Hantida" },
  { en: "Property Management", ar: "إدارة العقارات", so: "Maaraynta Hantida" },
  { en: "Buying Assistance", ar: "مساعدة في الشراء", so: "Caawimaad Iibsiga" },
  { en: "Selling Assistance", ar: "مساعدة في البيع", so: "Caawimaad Iibinta" },
  { en: "Rental Assistance", ar: "مساعدة في الإيجار", so: "Caawimaad Kirada" },
  { en: "Property Valuation", ar: "تقييم العقار", so: "Qiimeynta Hantida" },
  { en: "Legal Assistance", ar: "مساعدة قانونية", so: "Caawimaad Sharci" },
  { en: "Investment Consultation", ar: "استشارات استثمارية", so: "La-talin Maalgashi" },
];
