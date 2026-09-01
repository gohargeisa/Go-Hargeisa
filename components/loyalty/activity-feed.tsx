"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ArrowDownRight, ArrowUpRight, Loader2 } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { LoyaltyTransaction } from "@/lib/loyalty/types";
import { loadLoyaltyActivityAction } from "@/lib/actions/loyalty";

const TYPE_KEY: Record<LoyaltyTransaction["type"], string> = {
  PURCHASE_EARN: "txPurchase",
  WELCOME_BONUS: "txWelcome",
  BONUS: "txBonus",
  REDEMPTION: "txRedemption",
  MANUAL_ADJUSTMENT: "txAdjustment",
  REFUND: "txRefund",
  EXPIRATION: "txExpiration",
};

export function ActivityFeed({
  locale,
  memberId,
  initial,
  initialHasMore,
}: {
  locale: Locale;
  memberId: string;
  initial: LoyaltyTransaction[];
  initialHasMore: boolean;
}) {
  const t = useTranslations("loyalty");
  const [rows, setRows] = useState(initial);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [pending, startTransition] = useTransition();

  const dateFmt = new Intl.DateTimeFormat(locale, { day: "numeric", month: "short", year: "numeric" });

  function loadMore() {
    startTransition(async () => {
      const res = await loadLoyaltyActivityAction(memberId, rows.length);
      setRows((prev) => [...prev, ...res.rows]);
      setHasMore(res.hasMore);
    });
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-ink/15 px-4 py-8 text-center text-sm text-ink/50 dark:border-white/15 dark:text-sand/50">
        {t("noActivity")}
      </p>
    );
  }

  return (
    <div>
      <ul className="divide-y divide-ink/8 overflow-hidden rounded-2xl border border-ink/8 dark:divide-white/10 dark:border-white/10">
        {rows.map((tx) => {
          const positive = tx.points >= 0;
          return (
            <li key={tx.id} className="flex items-center gap-3 bg-white px-4 py-3 dark:bg-white/[0.03]">
              <span
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                  positive
                    ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                    : "bg-ink/8 text-ink/60 dark:bg-white/10 dark:text-sand/60"
                }`}
              >
                {positive ? <ArrowUpRight size={15} aria-hidden="true" /> : <ArrowDownRight size={15} aria-hidden="true" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{tx.description || t(TYPE_KEY[tx.type])}</p>
                <p className="text-xs text-ink/45 dark:text-sand/45">
                  {t(TYPE_KEY[tx.type])} · {dateFmt.format(new Date(tx.createdAt))}
                </p>
              </div>
              <span
                className={`shrink-0 text-sm font-bold tabular-nums ${
                  positive ? "text-emerald-600 dark:text-emerald-400" : "text-ink/70 dark:text-sand/70"
                }`}
              >
                {positive ? "+" : ""}
                {tx.points.toLocaleString()}
              </span>
            </li>
          );
        })}
      </ul>

      {hasMore && (
        <button
          type="button"
          onClick={loadMore}
          disabled={pending}
          className="mx-auto mt-4 flex items-center gap-2 rounded-full border border-ink/15 px-5 py-2 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary disabled:opacity-60 dark:border-white/20 dark:text-white"
        >
          {pending && <Loader2 size={14} className="animate-spin" aria-hidden="true" />}
          {t("loadMoreActivity")}
        </button>
      )}
    </div>
  );
}
