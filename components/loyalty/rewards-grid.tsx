"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, Gift, Loader2, Lock, X } from "lucide-react";
import { useScrollLock } from "@/lib/hooks/use-scroll-lock";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import type { Locale } from "@/lib/i18n/config";
import type { LoyaltyReward, LoyaltyTier } from "@/lib/loyalty/types";
import {
  rewardName,
  rewardDescription,
  rewardTerms,
  rewardValueLabel,
  rewardAvailability,
  tierName,
} from "@/lib/loyalty/helpers";
import { redeemLoyaltyRewardAction } from "@/lib/actions/loyalty";

interface RewardsGridProps {
  locale: Locale;
  currency: string;
  rewards: LoyaltyReward[];
  currentPoints: number;
  memberTier: LoyaltyTier | null;
  tiers: LoyaltyTier[];
  /** rewardId -> count of this member's non-cancelled redemptions. */
  usedByReward: Record<string, number>;
  accentColor: string | null;
  pathToRevalidate: string;
}

export function RewardsGrid({
  locale,
  currency,
  rewards,
  currentPoints,
  memberTier,
  tiers,
  usedByReward,
  accentColor,
  pathToRevalidate,
}: RewardsGridProps) {
  const t = useTranslations("loyalty");
  const router = useRouter();
  const tiersById = useMemo(() => new Map(tiers.map((x) => [x.id, x])), [tiers]);

  const [active, setActive] = useState<LoyaltyReward | null>(null);
  const [clientRef, setClientRef] = useState<string>("");
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ code: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useScrollLock(!!active);
  useFocusTrap(dialogRef, !!active);

  useEffect(() => {
    if (!active) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  if (rewards.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-ink/15 px-4 py-8 text-center text-sm text-ink/50 dark:border-white/15 dark:text-sand/50">
        {t("noRewards")}
      </p>
    );
  }

  function open(reward: LoyaltyReward) {
    setActive(reward);
    setResult(null);
    setError(null);
    setClientRef(
      typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${reward.id}-${Date.now()}`
    );
  }

  function close() {
    setActive(null);
    setResult(null);
    setError(null);
  }

  function confirmRedeem() {
    if (!active) return;
    setError(null);
    startTransition(async () => {
      const res = await redeemLoyaltyRewardAction(active.id, locale, clientRef, pathToRevalidate);
      if (res.ok) {
        setResult({ code: res.redemptionCode });
        router.refresh();
      } else {
        setError(res.error);
      }
    });
  }

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {rewards.map((reward) => {
          const avail = rewardAvailability({
            reward,
            currentPoints,
            memberTier,
            tiersById,
            usedByMe: usedByReward[reward.id] ?? 0,
          });
          const locked = !avail.redeemable;
          const requiredTier = reward.minTierId ? tiersById.get(reward.minTierId) : null;

          return (
            <button
              key={reward.id}
              type="button"
              onClick={() => open(reward)}
              className="group flex items-stretch gap-3 rounded-2xl border border-ink/8 bg-white p-3 text-start shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:shadow-card dark:border-white/10 dark:bg-white/[0.03]"
            >
              <span
                className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl"
                style={{ background: (accentColor ?? "#7c3f5d") + "14" }}
              >
                {reward.imageUrl ? (
                  <Image src={reward.imageUrl} alt="" fill sizes="64px" className="object-cover" />
                ) : (
                  <Gift size={20} aria-hidden="true" style={{ color: accentColor ?? undefined }} />
                )}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-semibold">{rewardName(reward, locale)}</span>
                <span className="mt-0.5 line-clamp-2 text-xs text-ink/55 dark:text-sand/55">
                  {rewardValueLabel(reward, locale, currency, t("freeGift"))}
                </span>
                <span className="mt-auto flex items-center gap-1.5 pt-1.5">
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-bold text-primary-700 dark:text-primary-300">
                    {t("pointsAmount", { points: reward.pointsRequired.toLocaleString() })}
                  </span>
                  {locked && avail.reason === "tier" && requiredTier && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink/45 dark:text-sand/45">
                      <Lock size={11} aria-hidden="true" />
                      {tierName(requiredTier, locale)}
                    </span>
                  )}
                  {locked && avail.reason === "points" && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-ink/45 dark:text-sand/45">
                      <Lock size={11} aria-hidden="true" />
                      {t("needMorePoints", {
                        points: (reward.pointsRequired - currentPoints).toLocaleString(),
                      })}
                    </span>
                  )}
                  {locked && avail.reason === "limit" && (
                    <span className="text-[11px] font-semibold text-ink/45 dark:text-sand/45">{t("alreadyRedeemed")}</span>
                  )}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={rewardName(active, locale)}
          onClick={close}
        >
          <div
            ref={dialogRef}
            tabIndex={-1}
            className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-ink sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-display text-lg font-semibold">{rewardName(active, locale)}</h3>
              <button
                type="button"
                onClick={close}
                aria-label={t("close")}
                className="-me-1.5 -mt-1.5 flex h-8 w-8 items-center justify-center rounded-full text-ink/50 hover:bg-ink/5 dark:hover:bg-white/10"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {result ? (
              <div className="mt-2 text-center">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Check size={22} aria-hidden="true" />
                </span>
                <p className="mt-3 text-sm font-semibold">{t("redeemSuccessTitle")}</p>
                <p className="mt-1 text-xs text-ink/55 dark:text-sand/55">{t("redeemSuccessBody")}</p>
                <p className="mt-4 rounded-2xl border border-dashed border-primary/30 bg-primary/5 py-4 font-mono text-xl font-bold tracking-[0.2em] text-primary-700 dark:text-primary-300">
                  {result.code}
                </p>
                <button
                  type="button"
                  onClick={close}
                  className="mt-4 inline-flex w-full items-center justify-center rounded-full bg-primary-700 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-primary-800"
                >
                  {t("done")}
                </button>
              </div>
            ) : (
              <>
                {rewardDescription(active, locale) && (
                  <p className="mt-2 text-sm leading-6 text-ink/70 dark:text-sand/70">{rewardDescription(active, locale)}</p>
                )}
                <dl className="mt-4 space-y-2 rounded-2xl bg-ink/[0.03] p-4 text-sm dark:bg-white/[0.04]">
                  <div className="flex justify-between">
                    <dt className="text-ink/55 dark:text-sand/55">{t("rewardValue")}</dt>
                    <dd className="font-semibold">{rewardValueLabel(active, locale, currency, t("freeGift"))}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink/55 dark:text-sand/55">{t("costLabel")}</dt>
                    <dd className="font-semibold">
                      {t("pointsAmount", { points: active.pointsRequired.toLocaleString() })}
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-ink/55 dark:text-sand/55">{t("balanceAfter")}</dt>
                    <dd className="font-semibold tabular-nums">
                      {Math.max(0, currentPoints - active.pointsRequired).toLocaleString()}
                    </dd>
                  </div>
                </dl>
                {rewardTerms(active, locale) && (
                  <p className="mt-3 text-xs leading-5 text-ink/45 dark:text-sand/45">{rewardTerms(active, locale)}</p>
                )}
                {error && <p className="mt-3 text-sm font-medium text-red-600 dark:text-red-400">{error}</p>}

                {(() => {
                  const avail = rewardAvailability({
                    reward: active,
                    currentPoints,
                    memberTier,
                    tiersById,
                    usedByMe: usedByReward[active.id] ?? 0,
                  });
                  return (
                    <button
                      type="button"
                      onClick={confirmRedeem}
                      disabled={pending || !avail.redeemable}
                      className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary-700 px-6 py-3.5 text-sm font-bold text-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-800 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                    >
                      {pending && <Loader2 size={16} className="animate-spin" aria-hidden="true" />}
                      {avail.redeemable
                        ? t("confirmRedeem")
                        : avail.reason === "points"
                          ? t("notEnoughPoints")
                          : avail.reason === "tier"
                            ? t("tierLocked")
                            : avail.reason === "limit"
                              ? t("alreadyRedeemed")
                              : t("rewardUnavailable")}
                    </button>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
