import type { Database } from "@/types/database";
import type { Hotel, HotelRoom, Restaurant, Cafe, Service, Attraction, EventItem, Article, GalleryImage, Review, BusinessOffer, MediaVideo, Notification, NotificationCategory, NotificationSeverity } from "@/types";

type HotelRow = Database["public"]["Tables"]["hotels"]["Row"];
type HotelRoomRow = Database["public"]["Tables"]["hotel_rooms"]["Row"];
type RestaurantRow = Database["public"]["Tables"]["restaurants"]["Row"];
type CafeRow = Database["public"]["Tables"]["cafes"]["Row"];
type ServiceRow = Database["public"]["Tables"]["services"]["Row"];
type AttractionRow = Database["public"]["Tables"]["attractions"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];
type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

function toGallery(json: unknown): GalleryImage[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter((g): g is { url: string; alt?: string; category?: string } => !!g && typeof g === "object" && "url" in g)
    .map((g) => ({
      url: g.url,
      alt: g.alt ?? "",
      category: (g.category as GalleryImage["category"]) ?? undefined,
    }));
}

function toVideos(json: unknown): MediaVideo[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter((v): v is { url: string; caption?: string } => !!v && typeof v === "object" && "url" in v)
    .map((v) => ({ url: v.url, caption: v.caption || undefined }));
}

export function mapReview(row: ReviewRow, authorName = "Guest"): Review {
  return {
    id: row.id,
    authorName,
    rating: row.rating,
    comment: row.comment ?? "",
    createdAt: row.created_at,
    photos: toGallery((row as { photos?: unknown }).photos),
    ownerReply: row.owner_reply ?? undefined,
    ownerReplyAt: row.owner_reply_at ?? undefined,
    isReported: row.is_reported,
  };
}

export function mapHotelRoom(row: HotelRoomRow & { room_images?: unknown }): HotelRoom {
  return {
    id: row.id,
    name: row.name,
    image: row.image ?? undefined,
    images: toGallery(row.room_images),
    description: row.description ?? undefined,
    sizeSqm: row.size_sqm ?? undefined,
    maxGuests: row.max_guests,
    bedType: row.bed_type ?? undefined,
    bathrooms: row.bathrooms ?? 1,
    features: row.features ?? [],
    pricePerNight: row.price_per_night != null ? Number(row.price_per_night) : undefined,
    weekendPrice: row.weekend_price != null ? Number(row.weekend_price) : undefined,
    discountPrice: row.discount_price != null ? Number(row.discount_price) : undefined,
    totalRooms: row.total_rooms ?? 1,
    roomType: row.room_type ?? "standard",
    isAvailable: row.is_available ?? true,
  };
}

export function mapHotel(
  row: HotelRow,
  extras: { reviews?: Review[]; rooms?: HotelRoom[]; restaurant?: Restaurant | null; cafe?: Cafe | null } = {}
): Hotel {
  const { reviews = [], rooms = [], restaurant = null, cafe = null } = extras;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    coverImage: row.cover_image,
    gallery: toGallery(row.gallery),
    videos: toVideos(row.videos),
    address: row.address,
    location: { lat: row.lat, lng: row.lng },
    googleMapsUrl: row.google_maps_url ?? undefined,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    reviews,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    email: row.email ?? undefined,
    socialInstagram: row.social_instagram ?? undefined,
    socialFacebook: row.social_facebook ?? undefined,
    priceRange: row.price_range,
    amenities: row.amenities ?? [],
    nearbyAttractionIds: [],
    featured: row.featured,
    logo: row.logo_url ?? undefined,
    checkInTime: row.check_in_time ?? undefined,
    checkOutTime: row.check_out_time ?? undefined,
    languages: row.languages ?? [],
    rooms,
    restaurant,
    cafe,
    bookingMode: row.booking_mode ?? "go_hargeisa",
    externalBookingOption: row.external_booking_option ?? undefined,
    externalBookingUrl: row.external_booking_url ?? undefined,
    bookingWhatsapp: row.booking_whatsapp ?? undefined,
    bookingComUrl: row.booking_com_url ?? undefined,
    partnerStatus: row.partner_status,
  };
}

export function mapRestaurant(row: RestaurantRow, reviews: Review[] = []): Restaurant {
  const menu = Array.isArray(row.menu) ? (row.menu as { name: string; price: string; description?: string }[]) : [];
  const openingHoursStructured = Array.isArray(row.opening_hours_structured)
    ? (row.opening_hours_structured as unknown as Restaurant["openingHoursStructured"])
    : [];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    coverImage: row.cover_image,
    gallery: toGallery(row.gallery),
    videos: toVideos(row.videos),
    address: row.address,
    location: { lat: row.lat, lng: row.lng },
    googleMapsUrl: row.google_maps_url ?? undefined,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    reviews,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    email: row.email ?? undefined,
    socialInstagram: row.social_instagram ?? undefined,
    socialFacebook: row.social_facebook ?? undefined,
    cuisine: row.cuisine ?? [],
    priceRange: (row.price_range as "$" | "$$" | "$$$") ?? "$$",
    openingHours: row.opening_hours ?? "",
    openingHoursStructured,
    menuHighlights: menu,
    reservable: row.reservable,
    featured: row.featured,
    logo: row.logo_url ?? undefined,
    menuPdfUrl: row.menu_pdf_url ?? undefined,
    partnerStatus: row.partner_status,
  };
}

export function mapCafe(row: CafeRow, reviews: Review[] = [], locale?: string): Cafe {
  const menu = Array.isArray(row.menu) ? (row.menu as { name: string; price: string; description?: string }[]) : [];
  const openingHoursStructured = Array.isArray(row.opening_hours_structured)
    ? (row.opening_hours_structured as unknown as Cafe["openingHoursStructured"])
    : [];
  const description =
    (locale === "ar" && row.description_ar) || (locale === "so" && row.description_so) || row.description;
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    description,
    descriptionAr: row.description_ar ?? undefined,
    descriptionSo: row.description_so ?? undefined,
    coverImage: row.cover_image,
    gallery: toGallery(row.gallery),
    videos: toVideos(row.videos),
    address: row.address,
    location: { lat: row.lat, lng: row.lng },
    googleMapsUrl: row.google_maps_url ?? undefined,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    reviews,
    phone: row.phone ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    email: row.email ?? undefined,
    specialDrinks: row.special_drinks ?? [],
    wifi: row.wifi,
    workingSpace: row.working_space,
    openingHours: row.opening_hours ?? "",
    openingHoursStructured,
    priceRange: row.price_range,
    amenities: row.amenities ?? [],
    socialInstagram: row.social_instagram ?? undefined,
    socialFacebook: row.social_facebook ?? undefined,
    featured: row.featured,
    logo: row.logo_url ?? undefined,
    menuHighlights: menu,
    menuPdfUrl: row.menu_pdf_url ?? undefined,
    partnerStatus: row.partner_status,
  };
}

export function mapService(row: ServiceRow, reviews: Review[] = []): Service {
  const openingHoursStructured = Array.isArray(row.opening_hours_structured)
    ? (row.opening_hours_structured as unknown as Service["openingHoursStructured"])
    : [];
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    coverImage: row.cover_image,
    gallery: toGallery(row.gallery),
    videos: toVideos(row.videos),
    address: row.address,
    location: { lat: row.lat, lng: row.lng },
    googleMapsUrl: row.google_maps_url ?? undefined,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    reviews,
    phone: row.phone ?? undefined,
    whatsapp: row.whatsapp ?? undefined,
    email: row.email ?? undefined,
    website: row.website ?? undefined,
    socialInstagram: row.social_instagram ?? undefined,
    socialFacebook: row.social_facebook ?? undefined,
    openingHours: row.opening_hours ?? undefined,
    openingHoursStructured,
    services: row.services ?? [],
    category: row.category as Service["category"],
    featured: row.featured,
    logo: row.logo_url ?? undefined,
  };
}

export function mapAttraction(row: AttractionRow, reviews: Review[] = []): Attraction {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    shortDescription: row.short_description,
    description: row.description,
    coverImage: row.cover_image,
    gallery: toGallery(row.gallery),
    address: row.address,
    location: { lat: row.lat, lng: row.lng },
    googleMapsUrl: row.google_maps_url ?? undefined,
    rating: Number(row.rating),
    reviewCount: row.review_count,
    reviews,
    history: row.history ?? "",
    bestTimeToVisit: row.best_time_to_visit ?? "",
    entryFee: row.entry_fee,
    visitorTips: row.visitor_tips ?? [],
    nearbyRestaurantIds: [],
    nearbyHotelIds: [],
    category: row.category,
    featured: row.featured,
  };
}

export function mapEvent(row: EventRow): EventItem {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    coverImage: row.cover_image,
    category: row.category,
    startDate: row.start_date,
    endDate: row.end_date,
    location: row.location,
    ticketInfo: row.ticket_info ?? undefined,
  };
}

export function mapArticle(row: ArticleRow, authorName = "Go Hargeisa Editorial"): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImage: row.cover_image,
    author: authorName,
    publishedAt: row.published_at ?? row.created_at,
    readMinutes: row.read_minutes,
    category: row.category,
  };
}

type BusinessOfferRow = Database["public"]["Tables"]["business_offers"]["Row"];

export function mapBusinessOffer(row: BusinessOfferRow): BusinessOffer {
  return {
    id: row.id,
    listingType: row.listing_type,
    listingId: row.listing_id,
    title: row.title,
    description: row.description ?? undefined,
    discountType: row.discount_type,
    discountValue: row.discount_value ?? undefined,
    couponCode: row.coupon_code ?? undefined,
    coverImage: row.cover_image ?? undefined,
    startsAt: row.starts_at ?? undefined,
    endsAt: row.ends_at ?? undefined,
    isActive: row.is_active,
    approvalStatus: row.approval_status,
    featured: row.featured,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

type NotificationRow = Database["public"]["Tables"]["notifications"]["Row"];

export function mapNotification(row: NotificationRow): Notification {
  return {
    id: row.id,
    title: row.title,
    message: row.message ?? null,
    type: (row.type as NotificationSeverity) ?? "info",
    category: (row.category as NotificationCategory | null) ?? null,
    data: (row.data as Record<string, string | number | null>) ?? {},
    actionUrl: row.action_url ?? null,
    isRead: row.is_read,
    createdAt: row.created_at,
    readAt: row.read_at ?? null,
  };
}
