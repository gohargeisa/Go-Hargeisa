"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import {
  ArrowDownRight,
  ArrowUpRight,
  BadgeCheck,
  Gift,
  Loader2,
  Minus,
  Plus,
  RefreshCw,
  Ticket,
  UserRound,
  X,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { LoyaltyStaffRole, StaffMemberDoc } from "@/lib/loyalty/types";
import {
  staffRecordPurchaseAction,
  staffAdjustPointsAction,
  staffRedeemRewardAction,
  staffValidateCodeAction,
  staffCancelRedemptionAction,
} from "@/lib/actions/loyalty-staff";

function newRef() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random()}`;
}

function localName(
  obj: { name: string; name_ar: string | null; name_so: string | null } | null,
  locale: string
) {
  if (!obj) return null;
  return (locale === "ar" && obj.name_ar) || (locale === "so" && obj.name_so) || obj.name;
}

export function MemberPanel({
  locale,
  role,
  program,
  doc,
  onRefresh,
  onClear,
}: {
  locale: Locale;
  role: LoyaltyStaffRole;
  program: { id: string; currency: string; pointsPerCurrency: number };
  doc: StaffMemberDoc;
  onRefresh: () => Promise<void>;
  onClear: () => void;
}) {
  const t = useTranslations("loyalty");
  const [pending, startTransition] = useTransition();
  const [banner, setBanner] = useState<{ tone: "ok" | "error"; text: string } | null>(null);

  const m = doc.member;
  const dateFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" }),
    [locale]
  );
  const currencyFmt = useMemo(() => {
    try {
      return new Intl.NumberFormat(locale, { style: "currency", currency: program.currency });
    } catch {
      return null;
    }
  }, [locale, program.currency]);

  // --- Add purchase form ---
  const [amount, setAmount] = useState("");
  const [purchaseNote, setPurchaseNote] = useState("");
  const estPoints =
    Number(amount) > 0
      ? Math.floor(Number(amount) * program.pointsPerCurrency * (m.tier?.multiplier ?? 1))
      : 0;

  // --- Adjust points form (manager) ---
  const [adjPoints, setAdjPoints] = useState("");
  const [adjType, setAdjType] = useState<"BONUS" | "MANUAL_ADJUSTMENT" | "REFUND">("BONUS");
  const [adjReason, setAdjReason] = useState("");
  const [adjSign, setAdjSign] = useState<1 | -1>(1);

  function run(fn: () => Promise<{ ok: boolean; error?: string }>, okText: string) {
    setBanner(null);
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        setBanner({ tone: "ok", text: okText });
        await onRefresh();
      } else {
        setBanner({ tone: "error", text: res.error ?? t("errGeneric") });
      }
    });
  }

  function submitPurchase(e: React.FormEvent) {
    e.preventDefault();
    const amt = Number(amount);
    if (!(amt > 0)) return;
    const ref = newRef();
    run(
      () =>
        staffRecordPurchaseAction(
          { memberUid: m.member_uid, amount: amt, note: purchaseNote.trim() || undefined, clientRef: ref },
          locale
        ),
      t("purchaseRecorded")
    );
    setAmount("");
    setPurchaseNote("");
  }

  function submitAdjust(e: React.FormEvent) {
    e.preventDefault();
    const p = Math.abs(parseInt(adjPoints, 10) || 0) * adjSign;
    if (!p) return;
    const ref = newRef();
    run(
      () =>
        staffAdjustPointsAction(
          { memberUid: m.member_uid, points: p, type: adjType, description: adjReason.trim() || undefined, clientRef: ref },
          locale
        ),
      t("pointsAdjusted")
    );
    setAdjPoints("");
    setAdjReason("");
  }

  function redeemReward(rewardId: string) {
    const ref = newRef();
    run(() => staffRedeemRewardAction({ memberUid: m.member_uid, rewardId, clientRef: ref }, locale), t("rewardRedeemedForMember"));
  }

  function markCodeUsed(code: string) {
    run(() => staffValidateCodeAction(code, locale), t("codeMarkedUsed"));
  }

  function cancelRedemption(code: string) {
    run(() => staffCancelRedemptionAction(code, undefined, locale), t("redemptionCancelled"));
  }

  const isManager = role === "manager";

  return (
    <div className="space-y-5">
      {/* Member header */}
      <div className="rounded-3xl bg-primary-800 p-5 text-white shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white/12">
              <UserRound size={20} aria-hidden="true" />
            </span>
            <div>
              <p className="font-display text-lg font-semibold">{m.name ?? t("member")}</p>
              <p className="font-mono text-xs text-white/60">{m.membership_number}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold transition-colors hover:bg-white/25"
          >
            <X size={12} aria-hidden="true" />
            {t("newScan")}
          </button>
        </div>
        <div className="mt-4 flex items-end justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-white/60">{t("pointsLabel")}</p>
            <p className="font-display text-3xl font-bold tabular-nums">{m.current_points.toLocaleString()}</p>
          </div>
          <div className="text-end text-xs">
            {m.tier && (
              <span
                className="inline-block rounded-full px-2.5 py-1 font-bold"
                style={{
                  backgroundColor: (m.tier.color ?? "#fff") + "22",
                  color: m.tier.color ?? "#fff",
                }}
              >
                {localName(m.tier, locale)}
              </span>
            )}
            <p className="mt-1 text-white/55">
              {t("lifetimePoints", { points: m.lifetime_points.toLocaleString() })}
            </p>
            <p className="text-white/45">{t("memberSince", { date: dateFmt.format(new Date(m.joined_at)) })}</p>
          </div>
        </div>
        {m.status !== "active" && (
          <p className="mt-3 rounded-lg bg-white/10 px-3 py-2 text-xs font-semibold text-amber-200">
            {t(`status_${m.status}`)} — {t("membershipNotActiveNote")}
          </p>
        )}
      </div>

      {banner && (
        <p
          className={`rounded-2xl px-4 py-3 text-sm font-medium ${
            banner.tone === "ok"
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
              : "bg-red-500/10 text-red-700 dark:text-red-300"
          }`}
        >
          {banner.text}
        </p>
      )}

      {/* Add purchase */}
      <section className="rounded-2xl border border-ink/8 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold">
          <Plus size={16} aria-hidden="true" className="text-primary" />
          {t("addPurchase")}
        </h3>
        <form onSubmit={submitPurchase} className="mt-3 space-y-3">
          <div className="flex gap-2">
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
              placeholder={t("purchaseAmountLabel", { currency: program.currency })}
              aria-label={t("purchaseAmountLabel", { currency: program.currency })}
              className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/20"
            />
            <button
              type="submit"
              disabled={pending || !(Number(amount) > 0)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-primary-700 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-800 disabled:opacity-60"
            >
              {pending ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : <BadgeCheck size={14} aria-hidden="true" />}
              {t("record")}
            </button>
          </div>
          <input
            value={purchaseNote}
            onChange={(e) => setPurchaseNote(e.target.value)}
            placeholder={t("noteOptional")}
            aria-label={t("noteOptional")}
            className="w-full rounded-xl border border-ink/15 bg-transparent px-3.5 py-2 text-sm outline-none focus:border-primary dark:border-white/20"
          />
          {estPoints > 0 && (
            <p className="text-xs text-ink/55 dark:text-sand/55">
              {t("willEarn", { points: estPoints.toLocaleString() })}
              {currencyFmt && Number(amount) > 0 ? ` · ${currencyFmt.format(Number(amount))}` : ""}
            </p>
          )}
        </form>
      </section>

      {/* Redeem a reward for the member */}
      <section className="rounded-2xl border border-ink/8 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
        <h3 className="flex items-center gap-2 font-display text-base font-semibold">
          <Gift size={16} aria-hidden="true" className="text-primary" />
          {t("redeemRewardTitle")}
        </h3>
        {doc.available_rewards.length === 0 ? (
          <p className="mt-2 text-sm text-ink/50 dark:text-sand/50">{t("noRedeemableRewards")}</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {doc.available_rewards.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl border border-ink/8 px-3 py-2.5 dark:border-white/10">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{localName(r, locale)}</p>
                  <p className="text-xs text-ink/50 dark:text-sand/50">
                    {t("pointsAmount", { points: r.points_required.toLocaleString() })}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => redeemReward(r.id)}
                  disabled={pending}
                  className="shrink-0 rounded-full border border-primary/30 px-3.5 py-1.5 text-xs font-bold text-primary-700 transition-colors hover:bg-primary/10 disabled:opacity-60 dark:text-primary-300"
                >
                  {t("redeem")}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Open redemption codes */}
      {doc.open_redemptions.length > 0 && (
        <section className="rounded-2xl border border-ink/8 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
          <h3 className="flex items-center gap-2 font-display text-base font-semibold">
            <Ticket size={16} aria-hidden="true" className="text-primary" />
            {t("openRedemptions")}
          </h3>
          <ul className="mt-3 space-y-2">
            {doc.open_redemptions.map((red) => (
              <li key={red.id} className="rounded-xl border border-ink/8 px-3 py-2.5 dark:border-white/10">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">
                      {localName(
                        red.snapshot
                          ? { name: red.snapshot.name, name_ar: red.snapshot.name_ar, name_so: red.snapshot.name_so }
                          : null,
                        locale
                      ) ?? t("reward")}
                    </p>
                    <p className="font-mono text-xs text-primary-700 dark:text-primary-300">{red.code}</p>
                  </div>
                  <div className="flex shrink-0 gap-1.5">
                    <button
                      type="button"
                      onClick={() => markCodeUsed(red.code)}
                      disabled={pending}
                      className="rounded-full bg-primary-700 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-primary-800 disabled:opacity-60"
                    >
                      {t("markUsed")}
                    </button>
                    {isManager && (
                      <button
                        type="button"
                        onClick={() => cancelRedemption(red.code)}
                        disabled={pending}
                        className="rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-ink/60 transition-colors hover:border-red-400 hover:text-red-500 disabled:opacity-60 dark:border-white/20 dark:text-sand/60"
                      >
                        {t("cancel")}
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Manual points adjustment — managers only */}
      {isManager && (
        <section className="rounded-2xl border border-ink/8 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
          <h3 className="flex items-center gap-2 font-display text-base font-semibold">
            <RefreshCw size={16} aria-hidden="true" className="text-primary" />
            {t("adjustPoints")}
          </h3>
          <form onSubmit={submitAdjust} className="mt-3 space-y-3">
            <div className="flex gap-2">
              <div className="flex overflow-hidden rounded-xl border border-ink/15 dark:border-white/20">
                <button
                  type="button"
                  onClick={() => setAdjSign(1)}
                  aria-pressed={adjSign === 1}
                  className={`px-3 ${adjSign === 1 ? "bg-emerald-500/15 text-emerald-600" : "text-ink/50"}`}
                >
                  <Plus size={14} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={() => setAdjSign(-1)}
                  aria-pressed={adjSign === -1}
                  className={`px-3 ${adjSign === -1 ? "bg-red-500/15 text-red-500" : "text-ink/50"}`}
                >
                  <Minus size={14} aria-hidden="true" />
                </button>
              </div>
              <input
                inputMode="numeric"
                value={adjPoints}
                onChange={(e) => setAdjPoints(e.target.value.replace(/[^0-9]/g, ""))}
                placeholder={t("pointsLabel")}
                aria-label={t("adjustPointsAmountLabel")}
                className="min-w-0 flex-1 rounded-xl border border-ink/15 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/20"
              />
              <select
                value={adjType}
                onChange={(e) => setAdjType(e.target.value as typeof adjType)}
                aria-label={t("adjustTypeLabel")}
                className="rounded-xl border border-ink/15 bg-transparent px-2 py-2.5 text-sm outline-none focus:border-primary dark:border-white/20"
              >
                <option value="BONUS">{t("txBonus")}</option>
                <option value="MANUAL_ADJUSTMENT">{t("txAdjustment")}</option>
                <option value="REFUND">{t("txRefund")}</option>
              </select>
            </div>
            <input
              value={adjReason}
              onChange={(e) => setAdjReason(e.target.value)}
              placeholder={t("reasonLabel")}
              aria-label={t("reasonLabel")}
              className="w-full rounded-xl border border-ink/15 bg-transparent px-3.5 py-2 text-sm outline-none focus:border-primary dark:border-white/20"
            />
            <button
              type="submit"
              disabled={pending || !parseInt(adjPoints, 10)}
              className="inline-flex items-center gap-1.5 rounded-full bg-primary-700 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-800 disabled:opacity-60"
            >
              {pending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
              {t("applyAdjustment")}
            </button>
          </form>
        </section>
      )}

      {/* Recent activity */}
      <section>
        <h3 className="mb-2 font-display text-base font-semibold">{t("recentActivity")}</h3>
        {doc.recent_transactions.length === 0 ? (
          <p className="text-sm text-ink/50 dark:text-sand/50">{t("noActivity")}</p>
        ) : (
          <ul className="divide-y divide-ink/8 overflow-hidden rounded-2xl border border-ink/8 dark:divide-white/10 dark:border-white/10">
            {doc.recent_transactions.map((tx) => {
              const positive = tx.points >= 0;
              return (
                <li key={tx.id} className="flex items-center gap-3 bg-white px-3.5 py-2.5 dark:bg-white/[0.03]">
                  <span
                    className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                      positive ? "bg-emerald-500/10 text-emerald-600" : "bg-ink/8 text-ink/50 dark:bg-white/10"
                    }`}
                  >
                    {positive ? <ArrowUpRight size={13} aria-hidden="true" /> : <ArrowDownRight size={13} aria-hidden="true" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm">{tx.description || t("txFallback")}</p>
                    <p className="text-xs text-ink/45 dark:text-sand/45">{dateFmt.format(new Date(tx.created_at))}</p>
                  </div>
                  <span className={`shrink-0 text-sm font-bold tabular-nums ${positive ? "text-emerald-600 dark:text-emerald-400" : "text-ink/60"}`}>
                    {positive ? "+" : ""}
                    {tx.points.toLocaleString()}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
