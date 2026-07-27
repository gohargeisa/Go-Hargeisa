/** Derived from price_range — shared by the header badge line and the quick-info cards so they never drift apart. */
export function hotelCategoryLabel(priceRange?: string): string {
  switch (priceRange) {
    case "$$$$":
      return "Luxury Hotel";
    case "$$$":
      return "Premium Hotel";
    case "$":
      return "Budget Hotel";
    default:
      return "Hotel";
  }
}
