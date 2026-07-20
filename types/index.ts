export interface GalleryImage {
  url: string;
  alt?: string;
}

export interface Review {
  id: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
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
