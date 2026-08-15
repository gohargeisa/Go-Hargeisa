"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Check, MessageCircle, X } from "lucide-react";
import { updateProductOrderStatus } from "@/lib/actions/product-orders";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import type { ProductOrder } from "@/types";

const STATUS_OPTIONS: ProductOrder["status"][] = ["pending", "confirmed", "cancelled", "completed"];

const STATUS_STYLES: Record<ProductOrder["status"], string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  confirmed: "bg-accent/10 text-accent-700 dark:bg-accent/15 dark:text-accent-400",
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
 * Owner-side product order/request management — same list-with-status-
 * dropdown pattern as ReservationsTable/BookingsTable, generic over
 * listingType/listingId. updateProductOrderStatus re-checks ownership
 * itself (assertCanManageListing).
 */
export function ProductOrdersTable({
  listingType,
  listingId,
  orders,
  revalidatePath,
}: {
  listingType: "city_service" | "service";
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
