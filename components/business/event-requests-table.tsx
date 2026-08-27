"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Eye } from "lucide-react";
import { WhatsAppIcon } from "@/components/shared/brand-icons";
import { sendProposal, updateEventRequestStatus } from "@/lib/actions/event-requests";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import { ModalShell } from "@/components/shared/modal-shell";
import type { EventRequest, EventRequestStatus } from "@/types";

const STATUS_STYLES: Record<EventRequestStatus, string> = {
  new: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  reviewing: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  proposal_sent: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  approved: "bg-accent/10 text-accent-700 dark:bg-accent/15 dark:text-accent-400",
  declined: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  planning: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  completed: "bg-secondary/15 text-secondary-700 dark:bg-white/10 dark:text-sand/70",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
};

const FOLLOWUP_STATUSES: EventRequestStatus[] = ["planning", "completed", "cancelled"];

function formatDate(iso: string | undefined, locale: string): string {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
}

function ProposalForm({ request, listingId, onDone }: { request: EventRequest; listingId: string; onDone: () => void }) {
  const t = useTranslations("eventRequest");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [details, setDetails] = useState(request.proposalDetails ?? "");
  const [cost, setCost] = useState(request.proposalCost?.toString() ?? "");

  function onSubmit() {
    if (!details.trim()) return;
    startTransition(async () => {
      const result = await sendProposal(request.id, listingId, { proposalDetails: details, proposalCost: cost ? Number(cost) : undefined }, ["/business/events"]);
      if (result.ok) {
        router.refresh();
        onDone();
      } else {
        alert(result.error ?? t("somethingWentWrong"));
      }
    });
  }

  return (
    <div className="space-y-3 rounded-2xl border border-ink/8 p-4 dark:border-white/10">
      <p className="text-xs font-bold uppercase tracking-wide text-ink/50 dark:text-sand/50">{t("sendProposal")}</p>
      <label className="block text-xs">
        {t("proposalDetails")}
        <textarea value={details} onChange={(e) => setDetails(e.target.value)} rows={4} className="mt-1 w-full rounded-lg border border-ink/12 bg-transparent px-2.5 py-2 text-sm outline-none focus:border-primary dark:border-white/15" />
      </label>
      <label className="block text-xs">
        {t("estimatedCostOptional")}
        <input type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/12 bg-transparent px-2.5 py-2 text-sm outline-none focus:border-primary dark:border-white/15" />
      </label>
      <button
        type="button"
        onClick={onSubmit}
        disabled={isPending || !details.trim()}
        className="w-full rounded-full bg-primary-700 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-800 disabled:opacity-60"
      >
        {t("sendProposal")}
      </button>
    </div>
  );
}

function EventDetailModal({ request, listingId, onClose }: { request: EventRequest; listingId: string; onClose: () => void }) {
  const t = useTranslations("eventRequest");
  const tb = useTranslations("businessDashboard");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const showProposalForm = ["new", "reviewing", "proposal_sent"].includes(request.status);

  function onAdvance(status: EventRequestStatus) {
    startTransition(async () => {
      const result = await updateEventRequestStatus(request.id, listingId, status, ["/business/events"]);
      if (result.ok) router.refresh();
      else alert(result.error ?? t("somethingWentWrong"));
    });
  }

  return (
    <ModalShell title={t("requestDetails")} onClose={onClose}>
      <dl className="space-y-2.5 text-sm">
        {([
          [tb("customerName"), request.customerName],
          [tb("phone"), request.customerPhone],
          [t("eventType"), t(`eventType_${request.eventType}`)],
          [t("eventDate"), formatDate(request.eventDate, locale)],
          ...(request.eventLocation ? [[t("eventLocation"), request.eventLocation] as [string, string]] : []),
          ...(request.guestCount ? [[t("guestCount"), String(request.guestCount)] as [string, string]] : []),
          ...(request.budgetRange ? [[t("budgetRange"), request.budgetRange] as [string, string]] : []),
          ...(request.servicesRequired ? [[t("servicesRequired"), request.servicesRequired] as [string, string]] : []),
          ...(request.notes ? [[tb("notes"), request.notes] as [string, string]] : []),
          [tb("status"), t(`status_${request.status}`)],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4 border-b border-ink/8 pb-2 dark:border-white/10">
            <dt className="shrink-0 text-ink/50 dark:text-sand/50">{label}</dt>
            <dd className="text-end font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <a href={toWhatsAppHref(request.customerPhone)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-[#25D366] dark:border-white/20">
        <WhatsAppIcon size={12} aria-hidden="true" /> {tb("contactGuest")}
      </a>

      {request.proposalCost != null && (
        <div className="mt-4 rounded-xl2 border border-ink/8 p-3 text-sm dark:border-white/10">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink/50 dark:text-sand/50">{t("currentProposal")}</p>
          <p className="text-ink/70 dark:text-sand/70">{request.proposalDetails}</p>
          <div className="mt-1.5 flex justify-between font-bold"><span>{t("estimatedCost")}</span><span>${request.proposalCost.toFixed(2)}</span></div>
        </div>
      )}

      {request.status === "new" && (
        <button type="button" onClick={() => onAdvance("reviewing")} disabled={isPending} className="mt-3 w-full rounded-full border border-ink/15 py-2 text-sm font-semibold dark:border-white/20">
          {t("markReviewing")}
        </button>
      )}

      {showProposalForm && (
        <div className="mt-4">
          <ProposalForm request={request} listingId={listingId} onDone={onClose} />
        </div>
      )}

      {showProposalForm && (
        <button
          type="button"
          onClick={() => onAdvance("cancelled")}
          disabled={isPending}
          className="mt-3 w-full rounded-full border border-red-200 py-2 text-sm font-semibold text-red-700 dark:border-red-400/25 dark:text-red-300"
        >
          {t("cancelRequest")}
        </button>
      )}

      {request.status === "approved" && (
        <div className="mt-4">
          <label className="block text-xs font-bold uppercase tracking-wide text-ink/50 dark:text-sand/50">{t("updateStatus")}</label>
          <select
            disabled={isPending}
            onChange={(e) => onAdvance(e.target.value as EventRequestStatus)}
            defaultValue=""
            className="mt-1.5 w-full rounded-lg border border-ink/12 bg-transparent px-2.5 py-2 text-sm outline-none focus:border-primary dark:border-white/15"
          >
            <option value="" disabled>
              {t("selectStatus")}
            </option>
            {FOLLOWUP_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`status_${s}`)}
              </option>
            ))}
          </select>
        </div>
      )}
    </ModalShell>
  );
}

export function EventRequestsTable({ listingId, requests }: { listingId: string; requests: EventRequest[] }) {
  const t = useTranslations("eventRequest");
  const locale = useLocale();
  const [viewing, setViewing] = useState<EventRequest | null>(null);

  if (requests.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/15 p-10 text-center dark:border-white/15">
        <p className="text-sm font-medium text-ink/55 dark:text-sand/55">{t("noRequestsYet")}</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {requests.map((r) => (
          <div key={r.id} className="flex flex-col gap-3 rounded-2xl border border-ink/8 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="truncate font-semibold">{r.customerName} — {t(`eventType_${r.eventType}`)}</p>
              <p className="text-xs text-ink/50 dark:text-sand/50">{formatDate(r.eventDate, locale)}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLES[r.status]}`}>{t(`status_${r.status}`)}</span>
              <button type="button" onClick={() => setViewing(r)} aria-label={t("requestDetails")} className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink/60 transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-sand/60">
                <Eye size={14} aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>
      {viewing && <EventDetailModal request={viewing} listingId={listingId} onClose={() => setViewing(null)} />}
    </>
  );
}
