/**
 * Derived from price_range — shared by every listing type's header badge
 * line and quick-info cards so they never drift apart. `kind` is the plain
 * noun for the listing type ("Hotel", "Restaurant", "Cafe").
 */
export function listingCategoryLabel(priceRange: string | undefined, kind: string): string {
  switch (priceRange) {
    case "$$$$":
      return `Luxury ${kind}`;
    case "$$$":
      return `Premium ${kind}`;
    case "$":
      return `Budget ${kind}`;
    default:
      return kind;
  }
}

export function hotelCategoryLabel(priceRange?: string): string {
  return listingCategoryLabel(priceRange, "Hotel");
}
