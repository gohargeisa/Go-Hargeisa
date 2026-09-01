/**
 * Maps a raw Postgres `raise exception` message from a loyalty RPC to a
 * localised string. The RPC messages are stable English; anything unmatched
 * falls back to a generic localised error rather than surfacing raw SQL text.
 * Shared by the customer (lib/actions/loyalty.ts) and staff
 * (lib/actions/loyalty-staff.ts) action layers.
 */
export function localiseLoyaltyRpcError(message: string, t: (key: string) => string): string {
  const m = (message ?? "").toLowerCase();
  if (m.includes("signed in")) return t("errSignIn");
  if (m.includes("not authorized") || m.includes("not authorised")) return t("errNotAuthorized");
  if (m.includes("not available") || m.includes("not currently active")) return t("errProgramUnavailable");
  if (m.includes("member not found")) return t("errMemberNotFound");
  if (m.includes("not a member")) return t("errNotMember");
  if (m.includes("membership is not active")) return t("errMembershipInactive");
  if (m.includes("not enough points")) return t("errInsufficientPoints");
  if (m.includes("already redeemed") || m.includes("already been redeemed")) return t("errAlreadyRedeemed");
  if (m.includes("fully redeemed")) return t("errRewardExhausted");
  if (m.includes("not eligible")) return t("errTierIneligible");
  if (m.includes("code not found")) return t("errCodeNotFound");
  if (m.includes("has expired")) return t("errRewardExpired");
  if (m.includes("not available yet")) return t("errRewardNotStarted");
  if (m.includes("not currently available")) return t("errRewardInactive");
  if (m.includes("was cancelled")) return t("errRedemptionCancelled");
  if (m.includes("already fulfilled") || m.includes("cannot be cancelled")) return t("errAlreadyFulfilled");
  if (m.includes("greater than zero")) return t("errAmountPositive");
  if (m.includes("implausibly large")) return t("errAmountTooLarge");
  if (m.includes("non-zero")) return t("errAmountNonZero");
  if (m.includes("below zero")) return t("errBalanceBelowZero");
  return t("errGeneric");
}
