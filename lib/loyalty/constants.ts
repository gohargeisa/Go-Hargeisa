/**
 * QR payload format for a loyalty membership card.
 *
 * The card encodes `GHLY1:<member_uid>` — a namespaced token, NOT a working
 * URL and NOT any personal identifier. `member_uid` is an opaque random uuid;
 * on its own it grants nothing. The staff scanner (Phase 8) strips the prefix
 * and calls `loyalty_staff_lookup(member_uid)`, which returns data only to an
 * authorized `loyalty_is_staff()` caller.
 */
export const LOYALTY_QR_PREFIX = "GHLY1:";

export function buildLoyaltyQrPayload(memberUid: string): string {
  return `${LOYALTY_QR_PREFIX}${memberUid}`;
}

/** Parse a scanned string back to a member_uid, or null if it isn't ours. */
export function parseLoyaltyQrPayload(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed.startsWith(LOYALTY_QR_PREFIX)) return null;
  const uid = trimmed.slice(LOYALTY_QR_PREFIX.length).trim();
  // uuid v4-ish shape check — defensive, the RPC validates authoritatively.
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid) ? uid : null;
}

/** How many activity rows the Rewards home loads on first paint. */
export const LOYALTY_ACTIVITY_PAGE_SIZE = 8;
