/**
 * Category vocabularies for the categorized photo gallery — one list per
 * business type, since hotels/restaurants/cafes each need entirely
 * different categories. GalleryImage.category (types/index.ts) is a plain
 * string rather than a shared union so all three can coexist on the same
 * field without a three-way union type getting in the way.
 */
export interface GalleryCategoryOption {
  value: string;
  label: string;
}

export const HOTEL_GALLERY_CATEGORIES: GalleryCategoryOption[] = [
  { value: "exterior", label: "Exterior" },
  { value: "lobby", label: "Lobby" },
  { value: "rooms", label: "Rooms" },
  { value: "suites", label: "Suites" },
  { value: "bathrooms", label: "Bathrooms" },
  { value: "restaurant", label: "Restaurant" },
  { value: "cafe", label: "Cafe" },
  { value: "pool", label: "Swimming Pool" },
  { value: "gym", label: "Gym" },
  { value: "conference_hall", label: "Conference Hall" },
  { value: "garden", label: "Garden" },
  { value: "outdoor", label: "Outdoor" },
  { value: "other", label: "Other" },
];

export const RESTAURANT_GALLERY_CATEGORIES: GalleryCategoryOption[] = [
  { value: "food", label: "Food" },
  { value: "drinks", label: "Drinks" },
  { value: "dining_area", label: "Dining Area" },
  { value: "kitchen", label: "Kitchen" },
  { value: "outdoor_seating", label: "Outdoor Seating" },
  { value: "atmosphere", label: "Atmosphere" },
  { value: "other", label: "Other" },
];

export const CAFE_GALLERY_CATEGORIES: GalleryCategoryOption[] = [
  { value: "coffee", label: "Coffee" },
  { value: "drinks", label: "Drinks" },
  { value: "desserts", label: "Desserts" },
  { value: "indoor_seating", label: "Indoor Seating" },
  { value: "outdoor_seating", label: "Outdoor Seating" },
  { value: "atmosphere", label: "Atmosphere" },
  { value: "other", label: "Other" },
];

export const SERVICE_GALLERY_CATEGORIES: GalleryCategoryOption[] = [
  { value: "product", label: "Product" },
  { value: "exterior", label: "Exterior" },
  { value: "interior", label: "Interior" },
  { value: "staff", label: "Staff" },
  { value: "equipment", label: "Equipment" },
  { value: "other", label: "Other" },
];

export const ATTRACTION_GALLERY_CATEGORIES: GalleryCategoryOption[] = [
  { value: "landmark", label: "Landmark" },
  { value: "surroundings", label: "Surroundings" },
  { value: "visitors", label: "Visitors" },
  { value: "other", label: "Other" },
];

export const EVENT_GALLERY_CATEGORIES: GalleryCategoryOption[] = [
  { value: "crowd", label: "Crowd" },
  { value: "performers", label: "Performers" },
  { value: "venue", label: "Venue" },
  { value: "highlights", label: "Highlights" },
  { value: "other", label: "Other" },
];

export const EMAANKOO_GALLERY_CATEGORIES: GalleryCategoryOption[] = [
  { value: "office", label: "Office & Team" },
  { value: "activities", label: "Events & Activities" },
  { value: "products", label: "Products & Shipments" },
  { value: "promotions", label: "Promotions" },
  { value: "other", label: "Other" },
];

export function galleryCategoryLabel(categories: GalleryCategoryOption[], category?: string): string {
  return categories.find((c) => c.value === category)?.label ?? "Other";
}
