"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { setPartnerStatus, assignSubscriptionPlan } from "@/lib/actions/partners";
import { SUBSCRIPTION_PLAN_ORDER, SUBSCRIPTION_PLANS, type SubscriptionPlanId } from "@/lib/config/subscription-plans";
import type { Locale } from "@/lib/i18n/config";

export interface PartnerRow {
  id: string;
  table: "hotels" | "restaurants" | "cafes";
  name: string;
  partnerStatus: "trial" | "official";
  planTier: SubscriptionPlanId | null;
}

export function PartnersList({ locale, rows }: { locale: Locale; rows: PartnerRow[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onToggleStatus(row: PartnerRow) {
    setPendingId(row.id);
    startTransition(async () => {
      const next = row.partnerStatus === "official" ? "trial" : "official";
      const result = await setPartnerStatus(locale, row.table, row.id, next);
      if (result.ok) router.refresh();
      else alert(result.error ?? t("somethingWentWrong"));
      setPendingId(null);
    });
  }

  function onChangePlan(row: PartnerRow, plan: SubscriptionPlanId) {
    setPendingId(row.id);
    startTransition(async () => {
      const result = await assignSubscriptionPlan(locale, row.table, row.id, plan);
      if (result.ok) router.refresh();
      else alert(result.error ?? t("somethingWentWrong"));
      setPendingId(null);
    });
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-xl2 border border-dashed border-ink/15 p-10 text-center dark:border-white/15">
        <p className="font-semibold">{t("partnersEmptyTitle")}</p>
        <p className="mt-1.5 text-sm text-ink/50 dark:text-sand/50">{t("partnersEmptyDescription")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => {
        const busy = isPending && pendingId === row.id;
        return (
          <div
            key={row.id}
            className="flex flex-col gap-3 rounded-xl2 border border-ink/8 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <p className="truncate font-semibold">{row.name}</p>
              <p className="text-xs capitalize text-ink/45 dark:text-sand/45">{row.table.slice(0, -1)}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                  row.partnerStatus === "official"
                    ? "bg-accent/10 text-accent-700"
                    : "bg-secondary/10 text-secondary-700 dark:text-sand/70"
                }`}
              >
                {row.partnerStatus === "official" ? t("partnerStatusOfficial") : t("partnerStatusTrial")}
              </span>

              <button
                type="button"
                onClick={() => onToggleStatus(row)}
                disabled={busy}
                className="flex h-8 items-center gap-1.5 rounded-lg border border-ink/10 px-3 text-xs font-semibold transition-colors hover:border-primary hover:text-primary disabled:opacity-60 dark:border-white/15"
              >
                {busy && <Loader2 size={12} className="animate-spin" />}
                {row.partnerStatus === "official" ? t("makeTrial") : t("makeOfficial")}
              </button>

              <select
                value={row.planTier ?? "basic"}
                onChange={(e) => onChangePlan(row, e.target.value as SubscriptionPlanId)}
                disabled={busy}
                aria-label={t("assignPlan")}
                className="h-8 rounded-lg border border-ink/10 bg-transparent px-2 text-xs font-semibold outline-none focus:border-primary disabled:opacity-60 dark:border-white/15"
              >
                {SUBSCRIPTION_PLAN_ORDER.map((id) => (
                  <option key={id} value={id}>
                    {SUBSCRIPTION_PLANS[id].name} — ${SUBSCRIPTION_PLANS[id].priceUsd}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      })}
    </div>
  );
}
