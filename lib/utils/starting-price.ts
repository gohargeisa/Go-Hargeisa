/**
 * Computes a "starting from" price from a list of priced sub-items (hotel
 * rooms today; any future per-vertical priced collection — service
 * packages, rental tiers — tomorrow) as the SINGLE reusable source of truth
 * for that display. Exists so every UI surface that shows a "starting
 * price" (a booking sidebar, a hero strip, a card) computes it the same
 * way from the same real data, instead of each one falling back
 * independently to an unrelated value (like a business's `price_range`
 * tier symbol) and silently disagreeing with what the item cards
 * themselves already show.
 *
 * Generic over the item shape and how to read its price/availability, so a
 * hotel's `HotelRoom[]` (via `pricePerNight`) and any future vertical's own
 * priced-item array can both use this without a new helper each time.
 */
export function getStartingPrice<T>(
  items: T[] | undefined,
  getPrice: (item: T) => number | undefined | null,
  isAvailable?: (item: T) => boolean
): number | undefined {
  if (!items || items.length === 0) return undefined;

  const prices = items
    .filter((item) => (isAvailable ? isAvailable(item) : true))
    .map(getPrice)
    .filter((price): price is number => price != null);

  if (prices.length === 0) return undefined;
  return Math.min(...prices);
}
