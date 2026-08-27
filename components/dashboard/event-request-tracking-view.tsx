"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import { RequestStatusTimeline } from "@/components/dashboard/request-status-timeline";
import { respondToProposal } from "@/lib/actions/event-requests";
import type { Locale } from "@/lib/i18n/config";
import type { EventRequest } from "@/types";

const HAPPY_PATH: EventRequest["status"][] = ["new", "reviewing", "proposal_sent", "approved", "planning", "completed"];

function formatDate(iso: string | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function EventRequestTrackingView({ locale, request }: { locale: Locale; request: EventRequest }) {
  const t = useTranslations("eventRequest");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const isOffPath = request.status === "declined" || request.status === "cancelled";
  const currentIndex = isOffPath ? -1 : HAPPY_PATH.indexOf(request.status);
  const stageLabels = HAPPY_PATH.map((s) => t(`status_${s}`));

  function onRespond(response: "approved" | "declined") {
    startTransition(async () => {
      const result = await respondToProposal(request.id, response);
      if (result.ok) router.refresh();
      else alert(result.error ?? t("somethingWentWrong"));
    });
  }

  return (
    <section className="container-px mx-auto max-w-2xl py-10 pt-[calc(env(safe-area-inset-top)+5.5rem)]">
      <Link href={`/${locale}/dashboard?tab=requests`} className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 hover:text-primary dark:text-sand/60">
        <ArrowLeft size={14} aria-hidden="true" /> {t("backToRequests")}
      </Link>

      <h1 className="font-display text-2xl font-bold">{t(`eventType_${request.eventType}`)}</h1>
      <p className="mt-1 text-sm text-ink/55 dark:text-sand/60">{t("eventDate")}: {formatDate(request.eventDate)}</p>

      {isOffPath ? (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 dark:border-red-400/25 dark:bg-red-400/10 dark:text-red-300">
          {t(`status_${request.status}`)}
        </div>
      ) : (
        <div className="mt-6 rounded-2xl border border-ink/8 p-5 dark:border-white/10">
          <RequestStatusTimeline stages={stageLabels} currentIndex={currentIndex} />
        </div>
      )}

      {request.status === "proposal_sent" && (
        <div className="mt-6 rounded-2xl border border-primary/20 bg-primary/[0.04] p-5">
          <h2 className="font-display text-lg font-bold">{t("proposalReady")}</h2>
          <p className="mt-2 text-sm text-ink/70 dark:text-sand/70">{request.proposalDetails}</p>
          {request.proposalCost != null && (
            <div className="mt-2 flex justify-between border-t border-ink/10 pt-2 text-sm font-bold dark:border-white/10">
              <span>{t("estimatedCost")}</span><span>${request.proposalCost.toFixed(2)}</span>
            </div>
          )}
          <div className="mt-4 flex gap-2">
            <button type="button" onClick={() => onRespond("approved")} disabled={isPending} className="flex-1 rounded-full bg-primary-700 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-800 disabled:opacity-60">
              {t("approveProposal")}
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
          {request.eventLocation && (
            <div className="flex justify-between gap-4"><dt className="text-ink/50 dark:text-sand/50">{t("eventLocation")}</dt><dd className="text-end font-medium">{request.eventLocation}</dd></div>
          )}
          {request.guestCount != null && (
            <div className="flex justify-between gap-4"><dt className="text-ink/50 dark:text-sand/50">{t("guestCount")}</dt><dd className="text-end font-medium">{request.guestCount}</dd></div>
          )}
          <div className="flex justify-between gap-4"><dt className="text-ink/50 dark:text-sand/50">{t("submitted")}</dt><dd className="text-end font-medium">{formatDate(request.createdAt)}</dd></div>
        </dl>
      </div>
    </section>
  );
}
