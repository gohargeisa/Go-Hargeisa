"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, MessageCircle, X } from "lucide-react";
import { updateProductOrderStatus } from "@/lib/actions/product-orders";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import type { ProductOrder, OrderableListingType } from "@/types";

const STATUS_OPTIONS: ProductOrder["status"][] = ["pending", "confirmed", "preparing", "ready", "out_for_delivery", "completed", "cancelled"];

const STATUS_STYLES: Record<ProductOrder["status"], string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  confirmed: "bg-accent/10 text-accent-700 dark:bg-accent/15 dark:text-accent-400",
  preparing: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  ready: "bg-purple-100 text-purple-700 dark:bg-purple-400/15 dark:text-purple-300",
  out_for_delivery: "bg-indigo-100 text-indigo-700 dark:bg-indigo-400/15 dark:text-indigo-300",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  completed: "bg-secondary/15 text-secondary-700 dark:bg-white/10 dark:text-sand/70",
};

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTH_ABBR[m - 1]} ${d}, ${y}`;
}

/**
 * Owner-side product order management — same list-with-status-dropdown
 * pattern as ReservationsTable/BookingsTable, generic over any
 * OrderableListingType (Restaurant, Cafe, Flower Shop, Perfume Shop, ...).
 * Each order can hold multiple line items (order.items) — the universal
 * cart's whole point — so this renders the full basket, not one product.
 * updateProductOrderStatus re-checks ownership itself (assertCanManageListing).
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
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onStatusChange(order: ProductOrder, status: ProductOrder["status"]) {
    startTransition(async () => {
      await updateProductOrderStatus(order.id, listingType, listingId, status, [revalidatePath]);
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
    <div className="space-y-3">
      {orders.map((o) => (
        <div key={o.id} className="rounded-2xl border border-ink/8 bg-white p-4 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate font-semibold">{o.customerName}</p>
              <p className="text-xs text-ink/50 dark:text-sand/50">{o.customerPhone}</p>
              <p className="font-mono text-[11px] text-ink/40 dark:text-sand/40">{o.orderReference}</p>
            </div>
            <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS_STYLES[o.status]}`}>
              {t(`bookingStatus_${o.status}`)}
            </span>
          </div>

          <div className="mt-3 space-y-1 rounded-xl bg-ink/[0.02] p-3 text-xs dark:bg-white/[0.03]">
            {o.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2">
                <span className="truncate text-ink/70 dark:text-sand/70">
                  {item.productName} × {item.quantity}
                  {item.addons.length > 0 && <span className="text-ink/40 dark:text-sand/40"> ({item.addons.map((a) => a.name).join(", ")})</span>}
                </span>
                <span className="shrink-0 font-semibold">${item.lineTotal.toFixed(2)}</span>
              </div>
            ))}
            {o.total != null && (
              <div className="flex items-center justify-between border-t border-ink/8 pt-1.5 font-bold dark:border-white/10">
                <span>{tp("totalLabel")}</span>
                <span>${o.total.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div className="mt-3 grid grid-cols-2 gap-y-1.5 text-xs text-ink/60 dark:text-sand/60 sm:grid-cols-3">
            <p>
              {tp("fulfillmentLabel")}: {o.fulfillmentType === "delivery" ? tp("fulfillmentDelivery") : tp("fulfillmentPickup")}
            </p>
            {o.deliveryAddress && <p className="col-span-2">{tp("deliveryAddressLabel")}: {o.deliveryAddress}</p>}
            {formatDate(o.preferredDate) && <p>{tp("preferredDateLabel")}: {formatDate(o.preferredDate)}</p>}
            {o.recipientName && <p>{tp("recipientNameLabel")}: {o.recipientName}</p>}
            {o.recipientPhone && <p>{tp("recipientPhoneLabel")}: {o.recipientPhone}</p>}
            {o.occasion && <p>{tp("occasionLabel")}: {o.occasion}</p>}
            {o.messageNote && <p className="col-span-2 sm:col-span-3">{tp("messageNoteLabel")}: {o.messageNote}</p>}
            {o.notes && <p className="col-span-2 sm:col-span-3">{t("notes")}: {o.notes}</p>}
          </div>
          <div className="mt-3 flex gap-2">
            {o.status === "pending" && (
              <>
                <button
                  type="button"
                  onClick={() => onStatusChange(o, "confirmed")}
                  disabled={isPending}
                  className="flex flex-1 items-center justify-center gap-1 rounded-full border border-accent-600/30 py-2 text-xs font-semibold text-accent-700 dark:text-accent-400"
                >
                  <Check size={13} aria-hidden="true" /> {t("confirm")}
                </button>
                <button
                  type="button"
                  onClick={() => onStatusChange(o, "cancelled")}
                  disabled={isPending}
                  className="flex flex-1 items-center justify-center gap-1 rounded-full border border-red-500/30 py-2 text-xs font-semibold text-red-500"
                >
                  <X size={13} aria-hidden="true" /> {t("reject")}
                </button>
              </>
            )}
            <a
              href={contactHref(o)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-1 items-center justify-center gap-1 rounded-full border border-ink/15 py-2 text-xs font-semibold dark:border-white/20"
            >
              <MessageCircle size={13} aria-hidden="true" /> {t("contactGuest")}
            </a>
            <select
              value={o.status}
              disabled={isPending}
              onChange={(e) => onStatusChange(o, e.target.value as ProductOrder["status"])}
              className={`rounded-full border-0 px-2.5 py-1 text-xs font-bold capitalize outline-none ${STATUS_STYLES[o.status]}`}
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {t(`bookingStatus_${s}`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  );
}
