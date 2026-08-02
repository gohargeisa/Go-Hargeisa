export interface FilterParams {
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: "rating" | "price-low" | "price-high" | "newest";
  cuisine?: string[];
  amenities?: string[];
}

export interface Listing {
  id: string;
  name: string;
  rating: number;
  reviewCount: number;
  priceRange?: string;
  cuisine?: string[];
  amenities?: string[];
  featured?: boolean;
  createdAt?: string;
}

/**
 * Parse price range string like "$$ - $$$" to numeric value
 * $ = 0-50, $$ = 50-100, $$$ = 100-250, $$$$ = 250+
 */
function getPriceValue(priceRange?: string): number {
  if (!priceRange) return 0;
  const count = (priceRange.match(/\$/g) || []).length;
  return count * 60; // Rough approximation
}

/**
 * Filter and sort listings based on provided parameters
 */
export function filterListings<T extends Listing>(
  listings: T[],
  params: FilterParams
): T[] {
  let filtered = [...listings];

  // Price filter
  if (params.minPrice !== undefined || params.maxPrice !== undefined) {
    filtered = filtered.filter((item) => {
      const price = getPriceValue(item.priceRange);
      if (params.minPrice !== undefined && price < params.minPrice) return false;
      if (params.maxPrice !== undefined && price > params.maxPrice) return false;
      return true;
    });
  }

  // Rating filter
  if (params.minRating !== undefined && params.minRating > 0) {
  const minRating = params.minRating;

  filtered = filtered.filter((item) => item.rating >= minRating);
}

  // Cuisine filter (restaurants only)
  if (params.cuisine && params.cuisine.length > 0 && "cuisine" in filtered[0]) {
    filtered = filtered.filter((item) => {
      const itemCuisines = (item as any).cuisine || [];
      return params.cuisine!.some((c) => itemCuisines.includes(c));
    });
  }

  // Amenities filter (hotels) — must have every selected amenity, not just any.
  if (params.amenities && params.amenities.length > 0) {
    filtered = filtered.filter((item) => {
      const itemAmenities = item.amenities || [];
      return params.amenities!.every((a) => itemAmenities.includes(a));
    });
  }

  // Sort
  if (params.sortBy) {
    switch (params.sortBy) {
      case "rating":
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      case "price-low":
        filtered.sort((a, b) => getPriceValue(a.priceRange) - getPriceValue(b.priceRange));
        break;
      case "price-high":
        filtered.sort((a, b) => getPriceValue(b.priceRange) - getPriceValue(a.priceRange));
        break;
      case "newest":
        filtered.sort((a, b) => {
          const dateA = new Date(a.createdAt || 0).getTime();
          const dateB = new Date(b.createdAt || 0).getTime();
          return dateB - dateA;
        });
        break;
    }
  } else {
    // Default sort by rating
    filtered.sort((a, b) => b.rating - a.rating);
  }

  return filtered;
}

/**
 * Extract unique cuisine types from listings
 */
export function getUniqueCuisines<T extends { cuisine?: string[] }>(
  listings: T[]
): string[] {
  const cuisines = new Set<string>();
  listings.forEach((item) => {
    if (item.cuisine) {
      item.cuisine.forEach((c) => cuisines.add(c));
    }
  });
  return Array.from(cuisines).sort();
}

/**
 * Extract unique amenities from listings. Amenities are free-text (admin-
 * entered, no fixed enum — see lib/utils/amenity-icon.ts), so the filter's
 * option list is derived from what's actually present in the data rather
 * than a hardcoded taxonomy.
 */
export function getUniqueAmenities<T extends { amenities?: string[] }>(
  listings: T[]
): string[] {
  const amenities = new Set<string>();
  listings.forEach((item) => {
    if (item.amenities) {
      item.amenities.forEach((a) => amenities.add(a));
    }
  });
  return Array.from(amenities).sort();
}
