"use server";

import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { localiseLoyaltyRpcError } from "@/lib/loyalty/errors";
import type { Locale } from "@/lib/i18n/config";
import type { StaffMemberDoc } from "@/lib/loyalty/types";

/**
 * Loyalty STAFF server actions — thin wrappers over the SECURITY DEFINER
 * staff RPCs (20260908000001 / 20260908000003). Authorization is entirely
 * the DB's: every RPC calls `loyalty_is_staff()` / `loyalty_is_manager()`
 * for the target program and raises if the caller isn't authorised. This
 * layer only checks that a session exists, localises the error, and shapes
 * the result. It never trusts a points value or a balance from the client.
 */

type Fail = { ok: false; error: string };
type Result<T> = ({ ok: true } & T) | Fail;
type VoidResult = { ok: true } | Fail;

async function tErr(locale: Locale) {
  return getTranslations({ locale, namespace: "loyalty" });
}

export async function staffLookupByQrAction(
  memberUid: string,
  locale: Locale
): Promise<Result<{ doc: StaffMemberDoc }>> {
  const t = await tErr(locale);
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: t("errSignIn") };

    const { data, error } = await supabase.rpc("loyalty_staff_lookup", { p_member_uid: memberUid });
    if (error) return { ok: false, error: localiseLoyaltyRpcError(error.message, t) };
    if (!data) return { ok: false, error: t("errMemberNotFound") };
    return { ok: true, doc: data as StaffMemberDoc };
  } catch {
    return { ok: false, error: t("errGeneric") };
  }
}

export async function staffLookupByNumberAction(
  programId: string,
  membershipNumber: string,
  locale: Locale
): Promise<Result<{ doc: StaffMemberDoc }>> {
  const t = await tErr(locale);
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: t("errSignIn") };

    const { data, error } = await supabase.rpc("loyalty_staff_lookup_by_number", {
      p_program_id: programId,
      p_number: membershipNumber,
    });
    if (error) return { ok: false, error: localiseLoyaltyRpcError(error.message, t) };
    if (!data) return { ok: false, error: t("errMemberNotFound") };
    return { ok: true, doc: data as StaffMemberDoc };
  } catch {
    return { ok: false, error: t("errGeneric") };
  }
}

export async function staffRecordPurchaseAction(
  input: {
    memberUid: string;
    amount: number;
    note?: string;
    reference?: string;
    clientRef?: string;
  },
  locale: Locale
): Promise<Result<{ pointsAwarded: number }>> {
  const t = await tErr(locale);
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: t("errSignIn") };

    if (!(input.amount > 0)) return { ok: false, error: t("errAmountPositive") };

    const { data, error } = await supabase.rpc("loyalty_record_purchase", {
      p_member_uid: input.memberUid,
      p_amount: input.amount,
      p_currency: null,
      p_reference: input.reference ?? null,
      p_note: input.note ?? null,
      p_client_ref: input.clientRef ?? null,
    });
    if (error) return { ok: false, error: localiseLoyaltyRpcError(error.message, t) };
    const row = (Array.isArray(data) ? data[0] : data) as { points?: number } | null;
    return { ok: true, pointsAwarded: row?.points ?? 0 };
  } catch {
    return { ok: false, error: t("errGeneric") };
  }
}

export async function staffAdjustPointsAction(
  input: {
    memberUid: string;
    points: number;
    type: "MANUAL_ADJUSTMENT" | "BONUS" | "REFUND";
    description?: string;
    clientRef?: string;
  },
  locale: Locale
): Promise<Result<{ points: number; balanceAfter: number }>> {
  const t = await tErr(locale);
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: t("errSignIn") };

    if (!input.points) return { ok: false, error: t("errAmountNonZero") };

    const { data, error } = await supabase.rpc("loyalty_adjust_points", {
      p_member_uid: input.memberUid,
      p_points: Math.trunc(input.points),
      p_type: input.type,
      p_description: input.description ?? null,
      p_client_ref: input.clientRef ?? null,
    });
    if (error) return { ok: false, error: localiseLoyaltyRpcError(error.message, t) };
    const row = (Array.isArray(data) ? data[0] : data) as
      | { points?: number; balance_after?: number }
      | null;
    return { ok: true, points: row?.points ?? 0, balanceAfter: row?.balance_after ?? 0 };
  } catch {
    return { ok: false, error: t("errGeneric") };
  }
}

export async function staffValidateCodeAction(
  code: string,
  locale: Locale
): Promise<Result<{ code: string; rewardName: string | null }>> {
  const t = await tErr(locale);
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: t("errSignIn") };

    const { data, error } = await supabase.rpc("loyalty_staff_redeem", {
      p_redemption_code: code,
    });
    if (error) return { ok: false, error: localiseLoyaltyRpcError(error.message, t) };
    const row = (Array.isArray(data) ? data[0] : data) as
      | { redemption_code?: string; reward_snapshot?: { name?: string } }
      | null;
    return {
      ok: true,
      code: row?.redemption_code ?? code,
      rewardName: row?.reward_snapshot?.name ?? null,
    };
  } catch {
    return { ok: false, error: t("errGeneric") };
  }
}

export async function staffRedeemRewardAction(
  input: { memberUid: string; rewardId: string; clientRef?: string },
  locale: Locale
): Promise<Result<{ code: string }>> {
  const t = await tErr(locale);
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: t("errSignIn") };

    const { data, error } = await supabase.rpc("loyalty_staff_redeem_reward", {
      p_member_uid: input.memberUid,
      p_reward_id: input.rewardId,
      p_client_ref: input.clientRef ?? null,
    });
    if (error) return { ok: false, error: localiseLoyaltyRpcError(error.message, t) };
    const row = (Array.isArray(data) ? data[0] : data) as { redemption_code?: string } | null;
    if (!row?.redemption_code) return { ok: false, error: t("errGeneric") };
    return { ok: true, code: row.redemption_code };
  } catch {
    return { ok: false, error: t("errGeneric") };
  }
}

export async function staffCancelRedemptionAction(
  code: string,
  reason: string | undefined,
  locale: Locale
): Promise<VoidResult> {
  const t = await tErr(locale);
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { ok: false, error: t("errSignIn") };

    const { error } = await supabase.rpc("loyalty_cancel_redemption", {
      p_redemption_code: code,
      p_reason: reason ?? null,
    });
    if (error) return { ok: false, error: localiseLoyaltyRpcError(error.message, t) };
    return { ok: true };
  } catch {
    return { ok: false, error: t("errGeneric") };
  }
}
