/**
 * Free-form category tag for gallery photos — hotels, restaurants, and
 * cafes each have their own category vocabulary (see
 * lib/utils/gallery-categories.ts), so this stays a plain string rather
 * than a shared union.
 */
export interface GalleryImage {
  url: string;
  alt?: string;
  category?: string;
}

export interface Review {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
  photos?: GalleryImage[];
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface MapPoint {
  id: string;
  slug?: string;
  name: string;
  category: string;
  address?: string;
  location: Coordinates;
  image?: string;
  description?: string;
  featured?: boolean;
}

export interface Destination {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  placeCount: number;
  highlights?: string[];
}

export interface HotelRoom {
  id: string;
  name: string;
  image?: string;
  sizeSqm?: number;
  maxGuests: number;
  bedType?: string;
  features: string[];
  pricePerNight?: number;
}

export interface Hotel {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  coverImage: string;
  gallery: GalleryImage[];
  address: string;
  location: Coordinates;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  phone?: string;
  website?: string;
  priceRange: string;
  amenities: string[];
  nearbyAttractionIds: string[];
  featured?: boolean;
  logo?: string;
  checkInTime?: string;
  checkOutTime?: string;
  languages: string[];
  rooms: HotelRoom[];
  restaurant?: Restaurant | null;
  cafe?: Cafe | null;
}

export interface RestaurantMenuItem {
  name: string;
  price: string;
  description?: string;
}

export interface Restaurant {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  coverImage: string;
  gallery: GalleryImage[];
  address: string;
  location: Coordinates;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  phone?: string;
  website?: string;
  cuisine: string[];
  priceRange: "$" | "$$" | "$$$";
  openingHours: string;
  menuHighlights: RestaurantMenuItem[];
  reservable: boolean;
  featured?: boolean;
  logo?: string;
  menuPdfUrl?: string;
}

export interface Cafe {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  coverImage: string;
  gallery: GalleryImage[];
  address: string;
  location: Coordinates;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  phone?: string;
  specialDrinks: string[];
  wifi: boolean;
  workingSpace: boolean;
  openingHours: string;
  featured?: boolean;
  logo?: string;
  menuHighlights: RestaurantMenuItem[];
  menuPdfUrl?: string;
}

export interface Attraction {
  id: string;
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  coverImage: string;
  gallery: GalleryImage[];
  address: string;
  location: Coordinates;
  rating: number;
  reviewCount: number;
  reviews: Review[];
  history: string;
  bestTimeToVisit: string;
  entryFee: string | null;
  visitorTips: string[];
  nearbyRestaurantIds: string[];
  nearbyHotelIds: string[];
  category: string;
  featured?: boolean;
}

export interface EventItem {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  category: string;
  startDate: string;
  endDate: string | null;
  location: string;
  ticketInfo?: string;
}

export interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImage: string;
  author: string;
  publishedAt: string;
  readMinutes: number;
  category: string;
}

/**
 * Smart City Map — a separate city-services map (hospitals, pharmacies,
 * mosques, etc.) from the Hotels/Restaurants/Cafes/Attractions map.
 * Backed by the existing `map_points` table; categories without a match
 * in that table's schema simply render with zero points (see
 * lib/data/map-points.ts getCityServicePoints for the mapping).
 */
export type CityServiceCategory =
  | "hospital"
  | "pharmacy"
  | "gas_station"
  | "atm"
  | "mosque"
  | "supermarket"
  | "police"
  | "government"
  | "school"
  | "university"
  | "airport"
  | "parking";

export interface CityServicePoint {
  id: string;
  name: string;
  category: CityServiceCategory;
  location: Coordinates;
}
