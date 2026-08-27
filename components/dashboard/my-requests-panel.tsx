"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { PackageSearch, PartyPopper } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import type { Locale } from "@/lib/i18n/config";
import type { PurchaseRequest, EventRequest, PurchaseRequestStatus, EventRequestStatus } from "@/types";

const PURCHASE_STATUS_STYLES: Record<PurchaseRequestStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  reviewing: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  quote_ready: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  approved: "bg-accent/10 text-accent-700 dark:bg-accent/15 dark:text-accent-400",
  declined: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  ordered: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  shipped: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  in_transit: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  ready_for_delivery: "bg-secondary/15 text-secondary-700 dark:bg-white/10 dark:text-sand/70",
  completed: "bg-secondary/15 text-secondary-700 dark:bg-white/10 dark:text-sand/70",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  rejected: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
};

const EVENT_STATUS_STYLES: Record<EventRequestStatus, string> = {
  new: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  reviewing: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  proposal_sent: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  approved: "bg-accent/10 text-accent-700 dark:bg-accent/15 dark:text-accent-400",
  declined: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  planning: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  completed: "bg-secondary/15 text-secondary-700 dark:bg-white/10 dark:text-sand/70",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function MyRequestsPanel({
  locale,
  purchaseRequests,
  eventRequests,
}: {
  locale: Locale;
  purchaseRequests: PurchaseRequest[];
  eventRequests: EventRequest[];
}) {
  const t = useTranslations("dashboard");
  const tp = useTranslations("purchaseRequest");
  const te = useTranslations("eventRequest");

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">{t("requestsEyebrow")}</p>
        <h2 className="mt-1 font-display text-2xl font-semibold">{t("requestsTitle")}</h2>
      </div>

      <div className="mb-8">
        <h3 className="mb-3 text-sm font-bold text-ink/70 dark:text-sand/70">{t("requestsPurchaseSubheading")}</h3>
        {purchaseRequests.length === 0 ? (
          <EmptyState icon={PackageSearch} title={t("emptyPurchaseRequestsTitle")} description={t("emptyPurchaseRequestsDescription")} />
        ) : (
          <div className="space-y-3">
            {purchaseRequests.map((r) => (
              <Link
                key={r.id}
                href={`/${locale}/dashboard/requests/${r.id}`}
                className="block rounded-xl2 border border-ink/8 p-5 transition-shadow duration-300 ease-premium hover:shadow-soft dark:border-white/10"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{r.productName}</p>
                    <p className="mt-0.5 text-xs text-ink/55 dark:text-sand/60">{formatDate(r.createdAt)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${PURCHASE_STATUS_STYLES[r.status]}`}>
                    {tp(`status_${r.status}`)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-ink/70 dark:text-sand/70">{t("requestsEventSubheading")}</h3>
        {eventRequests.length === 0 ? (
          <EmptyState icon={PartyPopper} title={t("emptyEventRequestsTitle")} description={t("emptyEventRequestsDescription")} />
        ) : (
          <div className="space-y-3">
            {eventRequests.map((r) => (
              <Link
                key={r.id}
                href={`/${locale}/dashboard/events/${r.id}`}
                className="block rounded-xl2 border border-ink/8 p-5 transition-shadow duration-300 ease-premium hover:shadow-soft dark:border-white/10"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{te(`eventType_${r.eventType}`)}</p>
                    <p className="mt-0.5 text-xs text-ink/55 dark:text-sand/60">{formatDate(r.createdAt)}</p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${EVENT_STATUS_STYLES[r.status]}`}>
                    {te(`status_${r.status}`)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
