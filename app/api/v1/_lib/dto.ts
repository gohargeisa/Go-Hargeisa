/**
 * Project the website's rich domain objects (`Category`, `CityService`)
 * onto the lean `/api/v1` wire DTOs. The domain objects already come from
 * the shared `lib/data/*` layer with mappers, feature flags and caching
 * applied — this file only narrows + localizes the last mile.
 */
import type {
  CafeDetail,
  CafeListItem,
  CategoryDTO,
  CityServiceDetail,
  CityServiceListItem,
  DepartmentDTO,
  DoctorDTO,
  HotelDetail,
  HotelListItem,
  HotelRoomDTO,
  MenuItemDTO,
  ProductAddonDTO,
  ProductDTO,
  ProductOptionChoiceDTO,
  ProductOptionDTO,
  ProductVariantDTO,
  RestaurantDetail,
  RestaurantListItem,
  ReviewDTO,
  ApiLocale,
} from "@gohargeisa/api";
import { FLOWER_SPECIALTY_CATEGORIES } from "@/lib/config/product-categories";
import type {
  Cafe,
  Category,
  CityService,
  Department,
  Doctor,
  Hotel,
  HotelRoom,
  Product,
  ProductAddon,
  ProductOption,
  ProductVariant,
  Restaurant,
  RestaurantMenuItem,
  Review,
} from "@/types";

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
    title: r.title ?? null,
    visitDate: r.visitDate ?? null,
  };
}

export function toDepartmentDTO(d: Department, locale: ApiLocale): DepartmentDTO {
  return { id: d.id, name: pick(locale, d.name, d.nameAr, d.nameSo) ?? d.name };
}

export function toDoctorDTO(d: Doctor, locale: ApiLocale): DoctorDTO {
  return {
    id: d.id,
    departmentId: d.departmentId ?? null,
    name: d.name,
    photo: d.photo ?? null,
    specialty: pick(locale, d.specialty, d.specialtyAr, d.specialtySo),
    bio: pick(locale, d.bio, d.bioAr, d.bioSo),
    languages: d.languages,
    appointmentDurationMinutes: d.appointmentDurationMinutes,
    consultationFee: d.consultationFee ?? null,
  };
}

export function toCityServiceDetail(
  s: CityService,
  category: CategoryRef | undefined,
  locale: ApiLocale,
  departments: Department[] = [],
  doctors: Doctor[] = [],
  products: Product[] = [],
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
    departments: departments.map((d) => toDepartmentDTO(d, locale)),
    doctors: doctors.map((d) => toDoctorDTO(d, locale)),
    products: products.map((p) => toProductDTO(p, locale)),
    deliveryEnabled: true,
  };
}

function toMenuItemDTO(m: RestaurantMenuItem): MenuItemDTO {
  return {
    name: m.name,
    price: m.price ?? null,
    description: m.description ?? null,
    category: m.category ?? null,
  };
}

/** Restaurants have no localized name/description columns — `locale` isn't
 *  needed here (verified against lib/data/mappers.ts's mapRestaurant). */
export function toRestaurantListItem(r: Restaurant): RestaurantListItem {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    shortDescription: r.shortDescription,
    image: r.coverImage ?? null,
    cuisine: r.cuisine,
    priceRange: r.priceRange,
    rating: r.rating,
    reviewCount: r.reviewCount,
    featured: Boolean(r.featured),
    isPartner: Boolean(r.isPartner),
    reservable: Boolean(r.reservable),
    coords: r.location ? { lat: r.location.lat, lng: r.location.lng } : null,
    phone: r.phone ?? null,
    whatsapp: r.whatsapp ?? null,
  };
}

export function toRestaurantDetail(r: Restaurant, locale: ApiLocale, products: Product[] = []): RestaurantDetail {
  return {
    ...toRestaurantListItem(r),
    description: r.description,
    email: r.email ?? null,
    website: r.website ?? null,
    mapsUrl: r.googleMapsUrl ?? null,
    openingHours: r.openingHours ?? null,
    openingHoursStructured:
      r.openingHoursStructured && r.openingHoursStructured.length > 0
        ? (r.openingHoursStructured as unknown[])
        : null,
    is24Hours: Boolean(r.is24Hours),
    temporarilyClosed: Boolean(r.temporarilyClosed),
    permanentlyClosed: Boolean(r.permanentlyClosed),
    gallery: (r.gallery ?? []).map((g) => ({ url: g.url, caption: g.caption ?? null })),
    menuHighlights: (r.menuHighlights ?? []).map(toMenuItemDTO),
    amenities: r.amenitiesV2 ?? [],
    social: {
      instagram: r.socialInstagram,
      facebook: r.socialFacebook,
      tiktok: r.socialTiktok,
      snapchat: r.socialSnapchat,
      x: r.socialX,
      youtube: r.socialYoutube,
      telegram: r.socialTelegram,
    },
    reviews: (r.reviews ?? []).map(toReviewDTO),
    products: products.map((p) => toProductDTO(p, locale)),
    deliveryEnabled: Boolean(r.productsDeliveryEnabled),
  };
}

/** `description` is ALREADY locale-resolved by `mapCafe(row, [], locale)` in
 *  lib/data — don't re-pick here. `name` has no localized columns (same
 *  asymmetry as restaurants). */
export function toCafeListItem(c: Cafe): CafeListItem {
  return {
    id: c.id,
    slug: c.slug,
    name: c.name,
    shortDescription: c.shortDescription,
    image: c.coverImage ?? null,
    priceRange: c.priceRange ?? null,
    rating: c.rating,
    reviewCount: c.reviewCount,
    featured: Boolean(c.featured),
    isPartner: Boolean(c.isPartner),
    reservable: Boolean(c.reservable),
    wifi: Boolean(c.wifi),
    workingSpace: Boolean(c.workingSpace),
    coords: c.location ? { lat: c.location.lat, lng: c.location.lng } : null,
    phone: c.phone ?? null,
    whatsapp: c.whatsapp ?? null,
  };
}

export function toCafeDetail(c: Cafe, locale: ApiLocale, products: Product[] = []): CafeDetail {
  return {
    ...toCafeListItem(c),
    description: c.description,
    email: c.email ?? null,
    website: c.website ?? null,
    mapsUrl: c.googleMapsUrl ?? null,
    openingHours: c.openingHours ?? null,
    openingHoursStructured:
      c.openingHoursStructured && c.openingHoursStructured.length > 0
        ? (c.openingHoursStructured as unknown[])
        : null,
    is24Hours: Boolean(c.is24Hours),
    temporarilyClosed: Boolean(c.temporarilyClosed),
    permanentlyClosed: Boolean(c.permanentlyClosed),
    gallery: (c.gallery ?? []).map((g) => ({ url: g.url, caption: g.caption ?? null })),
    menuHighlights: (c.menuHighlights ?? []).map(toMenuItemDTO),
    specialDrinks: c.specialDrinks ?? [],
    amenities: c.amenitiesV2 ?? [],
    social: {
      instagram: c.socialInstagram,
      facebook: c.socialFacebook,
      tiktok: c.socialTiktok,
      snapchat: c.socialSnapchat,
      x: c.socialX,
      youtube: c.socialYoutube,
      telegram: c.socialTelegram,
    },
    reviews: (c.reviews ?? []).map(toReviewDTO),
    products: products.map((p) => toProductDTO(p, locale, c.flowerAddons ?? [])),
    deliveryEnabled: Boolean(c.productsDeliveryEnabled),
  };
}

function toHotelRoomDTO(r: HotelRoom): HotelRoomDTO {
  return {
    id: r.id,
    name: r.name,
    image: r.image ?? null,
    description: r.description ?? null,
    maxGuests: r.maxGuests,
    bedType: r.bedType ?? null,
    bathrooms: r.bathrooms,
    features: r.features,
    pricePerNight: r.pricePerNight ?? null,
    weekendPrice: r.weekendPrice ?? null,
    discountPrice: r.discountPrice ?? null,
    roomType: r.roomType,
    isAvailable: r.isAvailable,
  };
}

/** `name`/`description` are ALREADY locale-resolved by `mapHotel(row, extras,
 *  locale)` in lib/data when `locale` was passed in — the list endpoint
 *  doesn't pass one (see HotelListItem's own comment), so list results are
 *  always English, matching the website's real `getHotels()` behavior. */
export function toHotelListItem(h: Hotel): HotelListItem {
  return {
    id: h.id,
    slug: h.slug,
    name: h.name,
    shortDescription: h.shortDescription,
    image: h.coverImage ?? null,
    priceRange: h.priceRange,
    rating: h.rating,
    reviewCount: h.reviewCount,
    featured: Boolean(h.featured),
    isPartner: Boolean(h.isPartner),
    bookingMode: h.bookingMode ?? "go_hargeisa",
    coords: h.location ? { lat: h.location.lat, lng: h.location.lng } : null,
    phone: h.phone ?? null,
    whatsapp: h.whatsapp ?? null,
  };
}

export function toHotelDetail(h: Hotel): HotelDetail {
  return {
    ...toHotelListItem(h),
    description: h.description,
    email: h.email ?? null,
    website: h.website ?? null,
    mapsUrl: h.googleMapsUrl ?? null,
    checkInTime: h.checkInTime ?? null,
    checkOutTime: h.checkOutTime ?? null,
    amenities: h.amenitiesV2 ?? [],
    gallery: (h.gallery ?? []).map((g) => ({ url: g.url, caption: g.caption ?? null })),
    rooms: (h.rooms ?? []).map(toHotelRoomDTO),
    social: {
      instagram: h.socialInstagram,
      facebook: h.socialFacebook,
      tiktok: h.socialTiktok,
      snapchat: h.socialSnapchat,
      x: h.socialX,
      youtube: h.socialYoutube,
      telegram: h.socialTelegram,
    },
    reviews: (h.reviews ?? []).map(toReviewDTO),
    externalBookingOption: h.externalBookingOption ?? null,
    externalBookingUrl: h.externalBookingUrl ?? null,
    bookingWhatsapp: h.bookingWhatsapp ?? null,
    bookingComUrl: h.bookingComUrl ?? null,
  };
}

function toProductAddonDTO(a: ProductAddon, locale: ApiLocale): ProductAddonDTO {
  return {
    id: a.id,
    name: pick(locale, a.name, a.nameAr, a.nameSo) ?? a.name,
    price: a.price,
    productId: a.productId ?? null,
    isTaxable: a.isTaxable ?? true,
  };
}

function toProductVariantDTO(v: ProductVariant, locale: ApiLocale): ProductVariantDTO {
  return {
    id: v.id,
    name: pick(locale, v.name, v.nameAr, v.nameSo) ?? v.name,
    shadeName: v.shadeName ?? null,
    shadeCode: v.shadeCode ?? null,
    hexColor: v.hexColor ?? null,
    finish: v.finish ?? null,
    size: v.size ?? null,
    image: v.image ?? null,
    sku: v.sku ?? null,
    price: v.price ?? null,
    isAvailable: v.isAvailable,
  };
}

function toProductOptionDTO(o: ProductOption, locale: ApiLocale): ProductOptionDTO {
  return {
    id: o.id,
    key: o.key,
    label: pick(locale, o.label, o.labelAr, o.labelSo) ?? o.label,
    type: o.type,
    required: o.required,
    priceDelta: o.priceDelta,
    choices: (o.choices ?? []).map(
      (c): ProductOptionChoiceDTO => ({
        value: c.value,
        label: pick(locale, c.label, c.labelAr, c.labelSo) ?? c.label,
        priceDelta: c.priceDelta ?? 0,
      }),
    ),
    placeholder: pick(locale, o.placeholder, o.placeholderAr, o.placeholderSo),
    maxLength: o.maxLength ?? null,
  };
}

/**
 * `businessFlowerAddons` mirrors getValidAddonsForProduct's exact rule
 * (lib/cart/product-addons.ts) — a business's legacy flower_addons vocabulary
 * is only merged into a product's own add-ons when that product's category
 * is a flower/gift category (FLOWER_SPECIALTY_CATEGORIES), never for any
 * other product. Doing this merge here (server-side, at DTO-projection time)
 * means the native client always receives one already-correct `addons`
 * array per product — it never re-implements this rule itself, so there is
 * no way for a different business's or category's add-ons to leak in.
 */
export function toProductDTO(
  p: Product,
  locale: ApiLocale,
  businessFlowerAddons: ProductAddon[] = [],
): ProductDTO {
  const isFlowerProduct = Boolean(p.category && FLOWER_SPECIALTY_CATEGORIES.includes(p.category));
  const ownAddons = p.addons ?? [];
  const mergedAddons = isFlowerProduct ? [...ownAddons, ...businessFlowerAddons] : ownAddons;

  return {
    id: p.id,
    name: pick(locale, p.name, p.nameAr, p.nameSo) ?? p.name,
    description: pick(locale, p.description, p.descriptionAr, p.descriptionSo),
    brand: p.brand ?? null,
    category: p.category ?? null,
    gender: p.gender ?? null,
    price: p.price ?? null,
    originalPrice: p.originalPrice ?? null,
    currency: p.currency,
    image: p.image ?? null,
    gallery: (p.gallery ?? []).map((g) => ({ url: g.url, caption: g.caption ?? null })),
    isAvailable: p.isAvailable,
    isFeatured: p.isFeatured,
    size: p.size ?? null,
    sku: p.sku ?? null,
    stockQuantity: p.stockQuantity ?? null,
    variants: (p.variants ?? []).map((v) => toProductVariantDTO(v, locale)),
    options: (p.options ?? []).map((o) => toProductOptionDTO(o, locale)),
    addons: mergedAddons.map((a) => toProductAddonDTO(a, locale)),
  };
}
