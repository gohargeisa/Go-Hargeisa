import type { Database } from "@/types/database";
import type { Hotel, Restaurant, Cafe, Attraction, EventItem, Article, GalleryImage, Review } from "@/types";

type HotelRow = Database["public"]["Tables"]["hotels"]["Row"];
type RestaurantRow = Database["public"]["Tables"]["restaurants"]["Row"];
type CafeRow = Database["public"]["Tables"]["cafes"]["Row"];
type AttractionRow = Database["public"]["Tables"]["attractions"]["Row"];
type EventRow = Database["public"]["Tables"]["events"]["Row"];
type ArticleRow = Database["public"]["Tables"]["articles"]["Row"];
type ReviewRow = Database["public"]["Tables"]["reviews"]["Row"];

function toGallery(json: unknown): GalleryImage[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter((g): g is { url: string; alt?: string } => !!g && typeof g === "object" && "url" in g)
    .map((g) => ({ url: g.url, alt: g.alt ?? "" }));
}

export function mapReview(row: ReviewRow, authorName = "Guest"): Review {
  return {
    id: row.id,
    authorName,
    rating: row.rating,
    comment: row.comment ?? "",
    createdAt: row.created_at,
  };
}

export function mapHotel(row: HotelRow, reviews: Review[] = []): Hotel {
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
    rating: Number(row.rating),
    reviewCount: row.review_count,
    reviews,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    priceRange: row.price_range,
    amenities: row.amenities ?? [],
    nearbyAttractionIds: [],
    featured: row.featured,
  };
}

export function mapRestaurant(row: RestaurantRow, reviews: Review[] = []): Restaurant {
  const menu = Array.isArray(row.menu) ? (row.menu as { name: string; price: string; description?: string }[]) : [];
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
    rating: Number(row.rating),
    reviewCount: row.review_count,
    reviews,
    phone: row.phone ?? undefined,
    website: row.website ?? undefined,
    cuisine: row.cuisine ?? [],
    priceRange: (row.price_range as "$" | "$$" | "$$$") ?? "$$",
    openingHours: row.opening_hours ?? "",
    menuHighlights: menu,
    reservable: row.reservable,
    featured: row.featured,
  };
}

export function mapCafe(row: CafeRow, reviews: Review[] = []): Cafe {
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
    rating: Number(row.rating),
    reviewCount: row.review_count,
    reviews,
    phone: row.phone ?? undefined,
    specialDrinks: row.special_drinks ?? [],
    wifi: row.wifi,
    workingSpace: row.working_space,
    openingHours: row.opening_hours ?? "",
    featured: row.featured,
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
