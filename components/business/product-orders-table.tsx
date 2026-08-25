"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Check, ChevronDown, Trash2, X } from "lucide-react";
import { WhatsAppIcon } from "@/components/shared/brand-icons";
import { OrderItemThumb } from "@/components/shared/order-item-thumb";
import { updateProductOrderStatus, deleteOldProductOrders, deleteProductOrder } from "@/lib/actions/product-orders";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import type { ProductOrder, OrderableListingType } from "@/types";

const STATUS_STYLES: Record<ProductOrder["status"], string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  confirmed: "bg-accent/10 text-accent-700 dark:bg-accent/15 dark:text-accent-400",
  preparing: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  ready: "bg-purple-100 text-purple-700 dark:bg-purple-400/15 dark:text-purple-300",
  out_for_delivery: "bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  completed: "bg-secondary/15 text-secondary-700 dark:bg-white/10 dark:text-sand/70",
};

/** Orders in one of these states can never be swept up by "delete old
 * orders" — matches deleteOldProductOrders' own server-side filter exactly,
 * so the UI's displayed count always agrees with what the action actually
 * deletes. Also what separates the "Active" section from "Completed/Old". */
const DELETABLE_STATUSES: ProductOrder["status"][] = ["completed", "cancelled"];

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTH_ABBR[m - 1]} ${d}, ${y}`;
}

/** Full order timestamp (createdAt is a real ISO datetime, unlike
 * preferredDate which is date-only) — shown in the card header so "when was
 * this placed" is always visible without expanding. Explicit locale (not
 * `undefined`) so the AM/PM designator always matches the page's own
 * language instead of whatever locale the server process defaults to. */
function formatDateTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const datePart = `${MONTH_ABBR[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  const timePart = date.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
}

/**
 * The ONE contextual next-step button for a given status — the full
 * New/Pending → Confirmed → Preparing → Ready → Out for Delivery (delivery
 * orders only) → Completed sequence. No generic status dropdown exists
 * anymore; this function is the only way any order's status advances
 * through the UI (Cancel is the only other mutation, and it's its own
 * explicit, contextual button, not a menu pick). Pickup orders skip the
 * out_for_delivery leg entirely — "Ready" goes straight to "Completed" —
 * since there's no delivery to track. Nothing is auto-completed: Ready and
 * Preparing both require an explicit owner tap to advance further.
 */
function nextStep(order: ProductOrder): { status: ProductOrder["status"]; labelKey: string } | null {
  switch (order.status) {
    case "pending":
      return { status: "confirmed", labelKey: "confirmOrderAction" };
    case "confirmed":
      return { status: "preparing", labelKey: "startPreparingAction" };
    case "preparing":
      return { status: "ready", labelKey: "markReadyAction" };
    case "ready":
      return order.fulfillmentType === "delivery"
        ? { status: "out_for_delivery", labelKey: "markOutForDeliveryAction" }
        : { status: "completed", labelKey: "markCompletedAction" };
    case "out_for_delivery":
      return { status: "completed", labelKey: "markDeliveredAction" };
    default:
      return null;
  }
}

/** Cancel is only offered while an order is still active. Once it's out for
 * delivery, cancelling no longer makes sense (contact the customer instead). */
function canCancel(status: ProductOrder["status"]): boolean {
  return status === "pending" || status === "confirmed" || status === "preparing" || status === "ready";
}

function OrderCard({
  order,
  isExpanded,
  onToggle,
  isPending,
  onStatusChange,
  onDelete,
  contactHref,
  t,
  tp,
  locale,
}: {
  order: ProductOrder;
  isExpanded: boolean;
  onToggle: () => void;
  isPending: boolean;
  onStatusChange: (order: ProductOrder, status: ProductOrder["status"]) => void;
  onDelete?: (order: ProductOrder) => void;
  contactHref: (order: ProductOrder) => string;
  t: ReturnType<typeof useTranslations>;
  tp: ReturnType<typeof useTranslations>;
  locale: string;
}) {
  const step = nextStep(order);
  const itemCount = order.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="rounded-2xl border border-ink/8 bg-white shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
      <button type="button" onClick={onToggle} aria-expanded={isExpanded} className="flex w-full items-start justify-between gap-2 p-4 text-start">
        <div className="flex min-w-0 items-start gap-2.5">
          {order.items[0] && <OrderItemThumb src={order.items[0].productImage} alt={order.items[0].productName} size={36} />}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <p className="truncate font-semibold">{order.customerName}</p>
              {order.status === "pending" && (
                <span className="inline-flex items-center rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                  {t("newOrderBadge")}
                </span>
              )}
            </div>
            <p className="text-xs text-ink/50 dark:text-sand/50">
              {order.customerPhone} · {t("itemCountLabel", { count: itemCount })}
              {order.total != null ? ` · $${order.total.toFixed(2)}` : ""}
            </p>
            <p className="font-mono text-[11px] text-ink/40 dark:text-sand/40">
              {order.orderReference} · {formatDateTime(order.createdAt, locale)}
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS_STYLES[order.status]}`}>
            {t(`bookingStatus_${order.status}`)}
          </span>
          <ChevronDown size={16} aria-hidden="true" className={`text-ink/40 transition-transform dark:text-sand/40 ${isExpanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {isExpanded && (
        <div className="border-t border-ink/8 p-4 pt-3.5 dark:border-white/10">
          <div className="space-y-1 rounded-xl bg-ink/[0.02] p-3 text-xs dark:bg-white/[0.03]">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center gap-2.5 py-1">
                <OrderItemThumb src={item.productImage} alt={item.productName} size={44} />
                <span className="min-w-0 flex-1 truncate text-ink/70 dark:text-sand/70">
                  {item.productName}
                  {item.variantName ? ` (${item.variantName})` : ""} × {item.quantity}
                  {item.quantity > 1 && <span className="text-ink/40 dark:text-sand/40"> (${item.unitPrice.toFixed(2)} {tp("unitPriceLabel").toLowerCase()})</span>}
                  {item.addons.length > 0 && <span className="text-ink/40 dark:text-sand/40"> ({item.addons.map((a) => a.name).join(", ")})</span>}
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <span className="block text-ink/40 dark:text-sand/40">
                      {item.selectedOptions.map((so) => `${so.label}: ${so.valueLabel}`).join(" · ")}
                    </span>
                  )}
                </span>
                <span className="shrink-0 font-semibold">${item.lineTotal.toFixed(2)}</span>
              </div>
            ))}
            <div className="flex items-center justify-between border-t border-ink/8 pt-1.5 dark:border-white/10">
              <span className="text-ink/60 dark:text-sand/60">{tp("subtotalLabel")}</span>
              <span>${order.subtotal.toFixed(2)}</span>
            </div>
            {!!order.taxAmount && (
              <div className="flex items-center justify-between text-ink/60 dark:text-sand/60">
                <span>{order.taxRate ? tp("taxLabel", { rate: (order.taxRate * 100).toFixed(order.taxRate * 100 % 1 === 0 ? 0 : 1) }) : tp("taxLabelZero")}</span>
                <span>${order.taxAmount.toFixed(2)}</span>
              </div>
            )}
            {order.total != null && order.total !== order.subtotal && (
              <div className="flex items-center justify-between font-bold">
                <span>{tp("totalLabel")}</span>
                <span>${order.total.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs text-ink/60 dark:text-sand/60 sm:grid-cols-3">
            <p>
              {tp("fulfillmentLabel")}: {order.fulfillmentType === "delivery" ? tp("fulfillmentDelivery") : tp("fulfillmentPickup")}
            </p>
            {order.deliveryAddress && <p className="col-span-2">{tp("deliveryAddressLabel")}: {order.deliveryAddress}</p>}
            {formatDate(order.preferredDate) && <p>{tp("preferredDateLabel")}: {formatDate(order.preferredDate)}</p>}
            {order.preferredTime && <p>{tp("preferredTimeLabel")}: {order.preferredTime}</p>}
            {order.recipientName && <p>{tp("recipientNameLabel")}: {order.recipientName}</p>}
            {order.recipientPhone && <p>{tp("recipientPhoneLabel")}: {order.recipientPhone}</p>}
            {order.occasion && <p>{tp("occasionLabel")}: {order.occasion}</p>}
            {order.messageNote && <p className="col-span-2 sm:col-span-3">{tp("messageNoteLabel")}: {order.messageNote}</p>}
            {order.notes && <p className="col-span-2 sm:col-span-3">{t("notes")}: {order.notes}</p>}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {canCancel(order.status) && (
              <button
                type="button"
                onClick={() => onStatusChange(order, "cancelled")}
                disabled={isPending}
                className="flex items-center justify-center gap-1 rounded-full border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-500 disabled:opacity-60"
              >
                <X size={13} aria-hidden="true" /> {order.status === "pending" ? t("reject") : t("cancelOrderAction")}
              </button>
            )}
            {step && (
              <button
                type="button"
                onClick={() => onStatusChange(order, step.status)}
                disabled={isPending}
                className="flex flex-1 items-center justify-center gap-1 rounded-full bg-primary-700 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary-800 disabled:opacity-60"
              >
                <Check size={13} aria-hidden="true" /> {t(step.labelKey)}
              </button>
            )}
            <a
              href={contactHref(order)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-1 rounded-full border border-ink/15 px-3 py-2 text-xs font-semibold dark:border-white/20"
            >
              <WhatsAppIcon size={13} aria-hidden="true" /> {t("contactGuest")}
            </a>
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(order)}
                disabled={isPending}
                className="flex items-center justify-center gap-1 rounded-full border border-ink/15 px-3 py-2 text-xs font-semibold text-ink/50 transition-colors hover:border-red-400 hover:text-red-600 disabled:opacity-60 dark:border-white/20 dark:text-sand/50"
              >
                <Trash2 size={13} aria-hidden="true" /> {t("deleteOrderAction")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Owner-side product order management — same list pattern as
 * ReservationsTable/BookingsTable, generic over any OrderableListingType
 * (Restaurant, Cafe, Flower Shop, Perfume Shop, ...). Each order can hold
 * multiple line items (order.items) — the universal cart's whole point —
 * so this renders the full basket, not one product. Category-specific
 * fields (recipient/occasion/card message/delivery time for flowers &
 * cakes, vs. nothing extra for a cafe/restaurant order) are NOT hardcoded
 * here — they render purely because the underlying data is only ever
 * populated for gift-oriented categories in the first place (see
 * checkout-form.tsx's hasGiftItem gate), so a restaurant order simply has
 * nothing to show in those rows.
 *
 * Two sections: Active (pending/confirmed/preparing/ready/out_for_delivery
 * — anything not yet completed/cancelled) and Completed/Old (completed/
 * cancelled) — an order moves itself into the second section the moment
 * its status becomes terminal, with no separate action needed. The
 * Completed/Old section starts collapsed (nothing there needs attention);
 * Active always shows.
 *
 * updateProductOrderStatus/deleteOldProductOrders re-check ownership
 * themselves (assertCanManageListing) — this component trusts the server,
 * not the other way around.
 */
export function ProductOrdersTable({
  listingType,
  listingId,
  orders,
  revalidatePath,
}: {
  listingType: OrderableListingType;
  listingId: string;
  orders: ProductOrder[];
  revalidatePath: string;
}) {
  const t = useTranslations("businessDashboard");
  const tp = useTranslations("productOrder");
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeletingOld, startDeleteOld] = useTransition();
  const [oldSectionOpen, setOldSectionOpen] = useState(false);
  // New orders open automatically (immediately actionable); everything else
  // starts collapsed so a long order history doesn't bury what's new.
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(orders.filter((o) => o.status === "pending").map((o) => o.id)));

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function onStatusChange(order: ProductOrder, status: ProductOrder["status"]) {
    startTransition(async () => {
      await updateProductOrderStatus(order.id, listingType, listingId, status, [revalidatePath]);
      router.refresh();
    });
  }

  function onDeleteOne(order: ProductOrder) {
    if (!confirm(t("confirmDeleteOrder"))) return;
    startTransition(async () => {
      const result = await deleteProductOrder(order.id, listingType, listingId, [revalidatePath]);
      if (!result.ok) alert(result.error ?? t("somethingWentWrong"));
      router.refresh();
    });
  }

  const activeOrders = useMemo(() => orders.filter((o) => !DELETABLE_STATUSES.includes(o.status)), [orders]);
  const oldOrders = useMemo(() => orders.filter((o) => DELETABLE_STATUSES.includes(o.status)), [orders]);

  function onDeleteOld() {
    if (oldOrders.length === 0) return;
    if (!confirm(t("confirmDeleteOldOrders", { count: oldOrders.length }))) return;
    startDeleteOld(async () => {
      const result = await deleteOldProductOrders(listingType, listingId, [revalidatePath]);
      if (!result.ok) alert(result.error ?? t("somethingWentWrong"));
      router.refresh();
    });
  }

  function contactHref(order: ProductOrder): string {
    return toWhatsAppHref(order.customerPhone, `Hi ${order.customerName}, this is regarding your order (${order.orderReference}).`);
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/15 p-10 text-center dark:border-white/15">
        <p className="text-sm font-medium text-ink/55 dark:text-sand/55">{t("noOrdersYet")}</p>
        <p className="mt-1 text-xs text-ink/40 dark:text-sand/40">{t("noOrdersYetDescription")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {activeOrders.length > 0 ? (
        <div className="space-y-3">
          {activeOrders.map((o) => (
            <OrderCard
              key={o.id}
              order={o}
              isExpanded={expanded.has(o.id)}
              onToggle={() => toggleExpanded(o.id)}
              isPending={isPending}
              onStatusChange={onStatusChange}
              contactHref={contactHref}
              t={t}
              tp={tp}
              locale={locale}
            />
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink/45 dark:text-sand/45">{t("noActiveOrders")}</p>
      )}

      {oldOrders.length > 0 && (
        <div className="border-t border-ink/8 pt-4 dark:border-white/10">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => setOldSectionOpen((v) => !v)}
              aria-expanded={oldSectionOpen}
              className="flex items-center gap-1.5 text-sm font-semibold text-ink/70 dark:text-sand/70"
            >
              <ChevronDown size={15} aria-hidden="true" className={`transition-transform ${oldSectionOpen ? "rotate-180" : ""}`} />
              {t("completedOldOrdersSection", { count: oldOrders.length })}
            </button>
            <button
              type="button"
              onClick={onDeleteOld}
              disabled={isDeletingOld}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3.5 py-2 text-xs font-semibold text-ink/60 transition-colors hover:border-red-400 hover:text-red-600 disabled:opacity-60 dark:border-white/20 dark:text-sand/60"
            >
              <Trash2 size={13} aria-hidden="true" />
              {t("deleteOldOrdersAction", { count: oldOrders.length })}
            </button>
          </div>

          {oldSectionOpen && (
            <div className="mt-3 space-y-3">
              {oldOrders.map((o) => (
                <OrderCard
                  key={o.id}
                  order={o}
                  isExpanded={expanded.has(o.id)}
                  onToggle={() => toggleExpanded(o.id)}
                  isPending={isPending}
                  onStatusChange={onStatusChange}
                  onDelete={onDeleteOne}
                  contactHref={contactHref}
                  t={t}
                  tp={tp}
                  locale={locale}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
