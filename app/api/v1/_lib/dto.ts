/**
 * Project the website's rich domain objects (`Category`, `CityService`)
 * onto the lean `/api/v1` wire DTOs. The domain objects already come from
 * the shared `lib/data/*` layer with mappers, feature flags and caching
 * applied — this file only narrows + localizes the last mile.
 */
import type {
  CategoryDTO,
  CityServiceDetail,
  CityServiceListItem,
  ReviewDTO,
  ApiLocale,
} from "@gohargeisa/api";
import type { Category, CityService, Review } from "@/types";

function pick(
  locale: ApiLocale,
  en: string | null | undefined,
  ar: string | null | undefined,
  so: string | null | undefined,
): string | null {
  if (locale === "ar" && ar) return ar;
  if (locale === "so" && so) return so;
  return en ?? null;
}

export function toCategoryDTO(c: Category, locale: ApiLocale): CategoryDTO {
  return {
    id: c.id,
    slug: c.slug,
    name: pick(locale, c.name, c.nameAr, c.nameSo) ?? c.name,
    description: pick(locale, c.description, c.descriptionAr, c.descriptionSo),
    icon: c.icon,
    color: c.color ?? null,
    imageUrl: c.imageUrl ?? null,
    targetTable: c.targetTable,
    businessCount: c.businessCount ?? 0,
    supportsProducts: c.supportsProducts,
    supportsAppointments: c.supportsAppointments,
  };
}

interface CategoryRef {
  slug: string;
  name: string;
}

/** Build a locale-resolved `{ slug, name }` ref from a full Category. */
export function categoryRef(c: Category, locale: ApiLocale): CategoryRef {
  return { slug: c.slug, name: pick(locale, c.name, c.nameAr, c.nameSo) ?? c.name };
}

/** `CityService.name` / `.description` are ALREADY locale-resolved by
 *  `mapCityService(row, [], locale)` in lib/data — don't re-pick here. */
export function toCityServiceListItem(
  s: CityService,
  category?: CategoryRef,
): CityServiceListItem {
  const lat = s.coords?.lat;
  const lng = s.coords?.lng;
  return {
    id: s.id,
    slug: s.slug,
    name: s.name,
    categoryId: s.categoryId,
    categorySlug: category?.slug ?? null,
    categoryName: category?.name ?? null,
    description: s.description ?? null,
    image: s.image ?? null,
    logoUrl: s.logoUrl ?? null,
    rating: s.rating ?? 0,
    reviewCount: s.reviewCount ?? 0,
    featured: Boolean(s.featured),
    isPartner: Boolean(s.isPartner),
    coords:
      typeof lat === "number" && typeof lng === "number"
        ? { lat, lng }
        : null,
    phone: s.phone ?? null,
    whatsapp: s.whatsapp ?? null,
  };
}

function toReviewDTO(r: Review): ReviewDTO {
  return {
    id: r.id,
    authorName: r.authorName,
    rating: r.rating,
    comment: r.comment || null,
    createdAt: r.createdAt,
  };
}

export function toCityServiceDetail(
  s: CityService,
  category?: CategoryRef,
): CityServiceDetail {
  return {
    ...toCityServiceListItem(s, category),
    email: s.email ?? null,
    website: s.website ?? null,
    mapsUrl: s.mapsUrl ?? null,
    openingHours: s.openingHours ?? null,
    openingHoursStructured:
      s.openingHoursStructured && s.openingHoursStructured.length > 0
        ? (s.openingHoursStructured as unknown[])
        : null,
    is24Hours: Boolean(s.is24Hours),
    temporarilyClosed: Boolean(s.temporarilyClosed),
    permanentlyClosed: Boolean(s.permanentlyClosed),
    gallery: (s.gallery ?? []).map((g) => ({
      url: g.url,
      caption: g.caption ?? null,
    })),
    amenities: s.amenitiesV2 ?? [],
    serviceTags: s.serviceTags ?? [],
    social: {
      instagram: s.socialInstagram,
      facebook: s.socialFacebook,
      tiktok: s.socialTiktok,
      snapchat: s.socialSnapchat,
      x: s.socialX,
      youtube: s.socialYoutube,
      telegram: s.socialTelegram,
    },
    reviews: (s.reviews ?? []).map(toReviewDTO),
  };
}
