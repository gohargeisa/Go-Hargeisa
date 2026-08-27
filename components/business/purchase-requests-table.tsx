"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Eye, ExternalLink } from "lucide-react";
import { WhatsAppIcon } from "@/components/shared/brand-icons";
import { submitQuote, updatePurchaseRequestStatus } from "@/lib/actions/purchase-requests";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import { ModalShell } from "@/components/shared/modal-shell";
import type { PurchaseRequest, PurchaseRequestStatus } from "@/types";

const STATUS_STYLES: Record<PurchaseRequestStatus, string> = {
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

/** Once a quote exists (quote_ready or later), the owner can only move the
 * request forward through fulfillment — never back into "reviewing", and
 * never straight to "quote_ready" again (submitQuote owns that transition,
 * see the form below). */
const FULFILLMENT_STATUSES: PurchaseRequestStatus[] = ["ordered", "shipped", "in_transit", "ready_for_delivery", "completed", "cancelled"];

function formatDate(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
}

function QuoteForm({ request, listingId, onDone }: { request: PurchaseRequest; listingId: string; onDone: () => void }) {
  const t = useTranslations("purchaseRequest");
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [productCost, setProductCost] = useState(request.quotedProductCost?.toString() ?? "");
  const [shippingCost, setShippingCost] = useState(request.quotedShippingCost?.toString() ?? "");
  const [customsFee, setCustomsFee] = useState(request.quotedCustomsFee?.toString() ?? "");
  const [serviceFee, setServiceFee] = useState(request.quotedServiceFee?.toString() ?? "");
  const [expiresAt, setExpiresAt] = useState(request.quoteExpiresAt?.slice(0, 10) ?? "");
  const [noteForCustomer, setNoteForCustomer] = useState(request.partnerNotesCustomer ?? "");

  const total =
    (Number(productCost) || 0) + (Number(shippingCost) || 0) + (Number(customsFee) || 0) + (Number(serviceFee) || 0);

  function onSubmit() {
    startTransition(async () => {
      const result = await submitQuote(
        request.id,
        listingId,
        {
          quotedProductCost: productCost ? Number(productCost) : undefined,
          quotedShippingCost: shippingCost ? Number(shippingCost) : undefined,
          quotedCustomsFee: customsFee ? Number(customsFee) : undefined,
          quotedServiceFee: serviceFee ? Number(serviceFee) : undefined,
          quoteExpiresAt: expiresAt || undefined,
          partnerNotesCustomer: noteForCustomer || undefined,
        },
        ["/business/requests"]
      );
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
      <p className="text-xs font-bold uppercase tracking-wide text-ink/50 dark:text-sand/50">{t("createQuote")}</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="text-xs">
          {t("productCost")}
          <input type="number" min="0" step="0.01" value={productCost} onChange={(e) => setProductCost(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/12 bg-transparent px-2.5 py-2 text-sm outline-none focus:border-primary dark:border-white/15" />
        </label>
        <label className="text-xs">
          {t("shippingCost")}
          <input type="number" min="0" step="0.01" value={shippingCost} onChange={(e) => setShippingCost(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/12 bg-transparent px-2.5 py-2 text-sm outline-none focus:border-primary dark:border-white/15" />
        </label>
        <label className="text-xs">
          {t("customsFee")}
          <input type="number" min="0" step="0.01" value={customsFee} onChange={(e) => setCustomsFee(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/12 bg-transparent px-2.5 py-2 text-sm outline-none focus:border-primary dark:border-white/15" />
        </label>
        <label className="text-xs">
          {t("serviceFee")}
          <input type="number" min="0" step="0.01" value={serviceFee} onChange={(e) => setServiceFee(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/12 bg-transparent px-2.5 py-2 text-sm outline-none focus:border-primary dark:border-white/15" />
        </label>
      </div>
      <label className="block text-xs">
        {t("quoteExpiresOptional")}
        <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="mt-1 w-full rounded-lg border border-ink/12 bg-transparent px-2.5 py-2 text-sm outline-none focus:border-primary dark:border-white/15" />
      </label>
      <label className="block text-xs">
        {t("noteForCustomerOptional")}
        <textarea value={noteForCustomer} onChange={(e) => setNoteForCustomer(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border border-ink/12 bg-transparent px-2.5 py-2 text-sm outline-none focus:border-primary dark:border-white/15" />
      </label>
      <div className="flex items-center justify-between rounded-lg bg-ink/[0.03] px-3 py-2 text-sm font-bold dark:bg-white/5">
        <span>{t("total")}</span>
        <span>${total.toFixed(2)}</span>
      </div>
      <button
        type="button"
        onClick={onSubmit}
        disabled={isPending}
        className="w-full rounded-full bg-primary-700 py-2.5 text-sm font-bold text-white transition-colors hover:bg-primary-800 disabled:opacity-60"
      >
        {t("sendQuote")}
      </button>
    </div>
  );
}

function RequestDetailModal({ request, listingId, onClose }: { request: PurchaseRequest; listingId: string; onClose: () => void }) {
  const t = useTranslations("purchaseRequest");
  const tb = useTranslations("businessDashboard");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const showQuoteForm = ["pending", "reviewing", "quote_ready"].includes(request.status);

  function onAdvance(status: PurchaseRequestStatus) {
    startTransition(async () => {
      const result = await updatePurchaseRequestStatus(request.id, listingId, status, ["/business/requests"]);
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
          [t("productName"), request.productName],
          [t("platform"), t(`platform_${request.platform}`)],
          [t("quantity"), String(request.quantity)],
          ...(request.size ? [[t("size"), request.size] as [string, string]] : []),
          ...(request.color ? [[t("color"), request.color] as [string, string]] : []),
          ...(request.variant ? [[t("variant"), request.variant] as [string, string]] : []),
          [t("deliveryLocation"), request.deliveryLocation],
          ...(request.notes ? [[tb("notes"), request.notes] as [string, string]] : []),
          [tb("status"), t(`status_${request.status}`)],
          [tb("createdLabel"), formatDate(request.createdAt, locale)],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4 border-b border-ink/8 pb-2 dark:border-white/10">
            <dt className="shrink-0 text-ink/50 dark:text-sand/50">{label}</dt>
            <dd className="text-end font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="mt-3 flex flex-wrap gap-2">
        {request.productUrl && (
          <a href={request.productUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold dark:border-white/20">
            <ExternalLink size={12} aria-hidden="true" /> {t("viewProductLink")}
          </a>
        )}
        {request.imageUrl && (
          <a href={request.imageUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold dark:border-white/20">
            {t("viewScreenshot")}
          </a>
        )}
        <a href={toWhatsAppHref(request.customerPhone)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-1.5 text-xs font-semibold text-[#25D366] dark:border-white/20">
          <WhatsAppIcon size={12} aria-hidden="true" /> {tb("contactGuest")}
        </a>
      </div>

      {request.quotedTotal != null && (
        <div className="mt-4 rounded-xl2 border border-ink/8 p-3 text-sm dark:border-white/10">
          <p className="mb-1.5 text-xs font-bold uppercase tracking-wide text-ink/50 dark:text-sand/50">{t("currentQuote")}</p>
          <div className="flex justify-between font-bold"><span>{t("total")}</span><span>${request.quotedTotal.toFixed(2)}</span></div>
        </div>
      )}

      {request.status === "pending" && (
        <button type="button" onClick={() => onAdvance("reviewing")} disabled={isPending} className="mt-3 w-full rounded-full border border-ink/15 py-2 text-sm font-semibold dark:border-white/20">
          {t("markReviewing")}
        </button>
      )}

      {showQuoteForm && (
        <div className="mt-4">
          <QuoteForm request={request} listingId={listingId} onDone={onClose} />
        </div>
      )}

      {showQuoteForm && (
        <button
          type="button"
          onClick={() => onAdvance("rejected")}
          disabled={isPending}
          className="mt-3 w-full rounded-full border border-red-200 py-2 text-sm font-semibold text-red-700 dark:border-red-400/25 dark:text-red-300"
        >
          {t("rejectRequest")}
        </button>
      )}

      {FULFILLMENT_STATUSES.includes(request.status) || request.status === "approved" ? (
        <div className="mt-4">
          <label className="block text-xs font-bold uppercase tracking-wide text-ink/50 dark:text-sand/50">{t("updateFulfillment")}</label>
          <select
            value={FULFILLMENT_STATUSES.includes(request.status) ? request.status : ""}
            disabled={isPending}
            onChange={(e) => onAdvance(e.target.value as PurchaseRequestStatus)}
            className="mt-1.5 w-full rounded-lg border border-ink/12 bg-transparent px-2.5 py-2 text-sm outline-none focus:border-primary dark:border-white/15"
          >
            <option value="" disabled>
              {t("selectStatus")}
            </option>
            {FULFILLMENT_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`status_${s}`)}
              </option>
            ))}
          </select>
        </div>
      ) : null}
    </ModalShell>
  );
}

export function PurchaseRequestsTable({ listingId, requests }: { listingId: string; requests: PurchaseRequest[] }) {
  const t = useTranslations("purchaseRequest");
  const locale = useLocale();
  const [viewing, setViewing] = useState<PurchaseRequest | null>(null);

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
              <p className="truncate font-semibold">{r.productName}</p>
              <p className="text-xs text-ink/50 dark:text-sand/50">{r.customerName} · {formatDate(r.createdAt, locale)}</p>
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
      {viewing && <RequestDetailModal request={viewing} listingId={listingId} onClose={() => setViewing(null)} />}
    </>
  );
}
