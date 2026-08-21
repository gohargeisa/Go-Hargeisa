/** Stable identity for one owned listing across the 5 business tables —
 * shared by both the server (lib/data/business.ts, lib/actions/business.ts)
 * and the client (BusinessSwitcher) so the cookie value and the switcher's
 * option keys are always built the same way. Its own file (not
 * lib/data/business.ts) because that module pulls in next/headers, which a
 * "use client" component can't import. */
export function listingKey(listing: { listingType: string; id: string }): string {
  return `${listing.listingType}:${listing.id}`;
}
