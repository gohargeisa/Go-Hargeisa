"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { getMemberTransactionsPage } from "@/lib/data/loyalty";
import { LOYALTY_ACTIVITY_PAGE_SIZE } from "@/lib/loyalty/constants";
import { localiseLoyaltyRpcError } from "@/lib/loyalty/errors";
import type { Locale } from "@/lib/i18n/config";
import type { LoyaltyListingType, LoyaltyTransaction } from "@/lib/loyalty/types";

/**
 * Customer-facing loyalty server actions. Every points-affecting operation is
 * a thin wrapper over a SECURITY DEFINER RPC
 * (see supabase/migrations/20260908000001_loyalty_core.sql) — this layer only
 * checks the session, localises the RPC's error, and revalidates the page.
 * It never computes a balance or trusts a points value from the client.
 */

type ActionResult<T = Record<string, never>> = ({ ok: true } & T) | { ok: false; error: string };

const localiseRpcError = localiseLoyaltyRpcError;

export async function joinLoyaltyProgramAction(
  listingType: LoyaltyListingType,
  listingId: string,
  locale: Locale,
  pathToRevalidate?: string
): Promise<ActionResult<{ membershipNumber: string; memberUid: string }>> {
  const t = await getTranslations({ locale, namespace: "loyalty" });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: t("errSignIn") };

  try {
    const { data, error } = await supabase.rpc("loyalty_join", {
      p_listing_type: listingType,
      p_listing_id: listingId,
    });
    if (error) return { ok: false, error: localiseRpcError(error.message, t) };
    const row = (Array.isArray(data) ? data[0] : data) as
      | { membership_number?: string; member_uid?: string }
      | null;
    if (pathToRevalidate) revalidatePath(pathToRevalidate);
    return {
      ok: true,
      membershipNumber: row?.membership_number ?? "",
      memberUid: row?.member_uid ?? "",
    };
  } catch {
    return { ok: false, error: t("errGeneric") };
  }
}

export async function redeemLoyaltyRewardAction(
  rewardId: string,
  locale: Locale,
  clientRef?: string,
  pathToRevalidate?: string
): Promise<ActionResult<{ redemptionCode: string; expiresAt: string | null }>> {
  const t = await getTranslations({ locale, namespace: "loyalty" });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: t("errSignIn") };

  try {
    const { data, error } = await supabase.rpc("loyalty_redeem_reward", {
      p_reward_id: rewardId,
      p_client_ref: clientRef ?? null,
    });
    if (error) return { ok: false, error: localiseRpcError(error.message, t) };
    const row = (Array.isArray(data) ? data[0] : data) as
      | { redemption_code?: string; expires_at?: string | null }
      | null;
    if (!row?.redemption_code) return { ok: false, error: t("errGeneric") };
    if (pathToRevalidate) revalidatePath(pathToRevalidate);
    return { ok: true, redemptionCode: row.redemption_code, expiresAt: row.expires_at ?? null };
  } catch {
    return { ok: false, error: t("errGeneric") };
  }
}

/**
 * "Load more" for the Rewards home activity feed. RLS scopes
 * loyalty_transactions to the member's owner, so a mismatched memberId simply
 * returns nothing.
 */
export async function loadLoyaltyActivityAction(
  memberId: string,
  offset: number
): Promise<{ rows: LoyaltyTransaction[]; hasMore: boolean }> {
  const rows = await getMemberTransactionsPage(memberId, offset, LOYALTY_ACTIVITY_PAGE_SIZE + 1);
  const hasMore = rows.length > LOYALTY_ACTIVITY_PAGE_SIZE;
  return { rows: rows.slice(0, LOYALTY_ACTIVITY_PAGE_SIZE), hasMore };
}

/**
 * Fire-and-forget impression analytics (`loyalty_events`). Never throws to the
 * caller — a failed analytics write must not affect the customer experience.
 */
export async function recordLoyaltyEventAction(
  programId: string,
  eventType:
    | "qr_viewed"
    | "card_viewed"
    | "reward_viewed"
    | "offer_viewed"
    | "join_prompt_viewed",
  memberId?: string | null,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from("loyalty_events").insert({
      program_id: programId,
      member_id: memberId ?? null,
      event_type: eventType,
      metadata: metadata ?? {},
    });
  } catch {
    /* swallow — analytics is best-effort */
  }
}
