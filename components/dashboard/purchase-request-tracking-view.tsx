"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { RequestStatusTimeline } from "@/components/dashboard/request-status-timeline";
import { respondToQuote } from "@/lib/actions/purchase-requests";
import type { Locale } from "@/lib/i18n/config";
import type { PurchaseRequest } from "@/types";

const HAPPY_PATH: PurchaseRequest["status"][] = [
  "pending", "reviewing", "quote_ready", "approved", "ordered", "shipped", "in_transit", "ready_for_delivery", "completed",
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function PurchaseRequestTrackingView({ locale, request }: { locale: Locale; request: PurchaseRequest }) {
  const t = useTranslations("purchaseRequest");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isOffPath = request.status === "declined" || request.status === "cancelled" || request.status === "rejected";
  const currentIndex = isOffPath ? -1 : HAPPY_PATH.indexOf(request.status);
  const stageLabels = HAPPY_PATH.map((s) => t(`status_${s}`));

  function onRespond(response: "approved" | "declined") {
    startTransition(async () => {
      const result = await respondToQuote(request.id, response);
      if (result.ok) router.refresh();
      else alert(result.error ?? t("somethingWentWrong"));
    });
  }

  return (
    <section className="container-px mx-auto max-w-2xl py-10 pt-[calc(env(safe-area-inset-top)+5.5rem)]">
      <Link href={`/${locale}/dashboard?tab=requests`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 hover:text-primary dark:text-sand/60">
        <ArrowLeft size={14} aria-hidden="true" /> {t("backToRequests")}
      </Link>

      <h1 className="font-display text-2xl font-bold">{request.productName}</h1>
      <p className="mt-1 text-sm text-ink/55 dark:text-sand/60">{t("orderNumber")}: {request.id.slice(0, 8).toUpperCase()}</p>

      {isOffPath ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-300">
          {t(`status_${request.status}`)}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-ink/8 p-5 dark:border-white/10">
          <RequestStatusTimeline stages={stageLabels} currentIndex={currentIndex} />
        </div>
      )}

      {request.status === "quote_ready" && request.quotedTotal != null && (
        <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/[0.04] p-5">
          <h2 className="font-display text-lg font-bold">{t("yourQuoteIsReady")}</h2>
          <dl className="mt-3 space-y-1.5 text-sm">
            {request.quotedProductCost != null && (
              <div className="flex justify-between"><dt className="text-ink/60 dark:text-sand/60">{t("productCost")}</dt><dd>${request.quotedProductCost.toFixed(2)}</dd></div>
            )}
            {request.quotedShippingCost != null && (
              <div className="flex justify-between"><dt className="text-ink/60 dark:text-sand/60">{t("shippingCost")}</dt><dd>${request.quotedShippingCost.toFixed(2)}</dd></div>
            )}
            {request.quotedCustomsFee != null && (
              <div className="flex justify-between"><dt className="text-ink/60 dark:text-sand/60">{t("customsFee")}</dt><dd>${request.quotedCustomsFee.toFixed(2)}</dd></div>
            )}
            {request.quotedServiceFee != null && (
              <div className="flex justify-between"><dt className="text-ink/60 dark:text-sand/60">{t("serviceFee")}</dt><dd>${request.quotedServiceFee.toFixed(2)}</dd></div>
            )}
            <div className="flex justify-between border-t border-ink/10 pt-1.5 font-bold dark:border-white/10"><dt>{t("total")}</dt><dd>${request.quotedTotal.toFixed(2)}</dd></div>
          </dl>
          {request.partnerNotesCustomer && <p className="mt-3 text-sm text-ink/65 dark:text-sand/65">{request.partnerNotesCustomer}</p>}
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => onRespond("approved")} disabled={isPending} className="flex-1 rounded-full bg-primary-700 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-800 disabled:opacity-60">
              {t("approveOrder")}
            </button>
            <button type="button" onClick={() => onRespond("declined")} disabled={isPending} className="flex-1 rounded-full border border-ink/15 py-2.5 text-sm font-semibold dark:border-white/20">
              {t("decline")}
            </button>
          </div>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-ink/8 p-5 dark:border-white/10">
        <h2 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink/50 dark:text-sand/50">{t("requestDetails")}</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4"><dt className="text-ink/50 dark:text-sand/50">{t("platform")}</dt><dd className="text-end font-medium">{t(`platform_${request.platform}`)}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-ink/50 dark:text-sand/50">{t("quantity")}</dt><dd className="text-end font-medium">{request.quantity}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-ink/50 dark:text-sand/50">{t("deliveryLocation")}</dt><dd className="text-end font-medium">{request.deliveryLocation}</dd></div>
          <div className="flex justify-between gap-4"><dt className="text-ink/50 dark:text-sand/50">{t("submitted")}</dt><dd className="text-end font-medium">{formatDate(request.createdAt)}</dd></div>
        </dl>
        {request.productUrl && (
          <a href={request.productUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
            {t("viewProductLink")} <ExternalLink size={12} aria-hidden="true" />
          </a>
        )}
      </div>
    </section>
  );
}
