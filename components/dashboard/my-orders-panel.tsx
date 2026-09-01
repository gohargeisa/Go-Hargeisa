"use client";

import { useTranslations } from "next-intl";
import { ShoppingBag, CalendarClock, Users } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import type { CustomerProductOrder } from "@/lib/data/product-orders";
import type { CustomerTableReservation } from "@/lib/data/reservations";
import type { ProductOrderStatus } from "@/types";
import type { Locale } from "@/lib/i18n/config";

/** Same palette the business/admin order tables use. Table reservations only
 * ever use pending/confirmed/cancelled/completed, so those four are shared. */
const STATUS_STYLES: Record<ProductOrderStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  confirmed: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  preparing: "bg-blue-100 text-blue-700 dark:bg-blue-400/15 dark:text-blue-300",
  ready: "bg-accent/10 text-accent-700 dark:bg-accent/15 dark:text-accent-400",
  out_for_delivery: "bg-accent/10 text-accent-700 dark:bg-accent/15 dark:text-accent-400",
  completed: "bg-secondary/15 text-secondary-700 dark:bg-white/10 dark:text-sand/70",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
};

function formatDate(iso: string): string {
  const d = new Date(iso.length <= 10 ? `${iso}T00:00:00` : iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function itemName(item: CustomerProductOrder["items"][number], locale: string): string {
  return (locale === "ar" && item.productNameAr) || (locale === "so" && item.productNameSo) || item.productName;
}

/**
 * A signed-in shopper's own universal-cart orders (product_orders) and
 * restaurant/cafe table reservations (table_reservations), newest first.
 * Deliberately no status filter — the whole reason this panel exists is that
 * a placed order / requested table was invisible in the dashboard; every
 * record the shopper has must always be shown, never hidden behind a filter.
 */
export function MyOrdersPanel({
  locale,
  orders,
  reservations,
}: {
  locale: Locale;
  orders: CustomerProductOrder[];
  reservations: CustomerTableReservation[];
}) {
  const t = useTranslations("dashboard");
  const tp = useTranslations("productOrder");

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">{t("ordersEyebrow")}</p>
        <h2 className="mt-1 font-display text-2xl font-semibold">{t("ordersTitle")}</h2>
      </div>

      <div className="mb-8">
        <h3 className="mb-3 text-sm font-bold text-ink/70 dark:text-sand/70">{t("ordersProductSubheading")}</h3>
        {orders.length === 0 ? (
          <EmptyState icon={ShoppingBag} title={t("emptyOrdersTitle")} description={t("emptyOrdersDescription")} />
        ) : (
          <div className="space-y-3">
            {orders.map((o) => {
              const itemCount = o.items.reduce((n, i) => n + i.quantity, 0);
              const summary = o.items.map((i) => `${itemName(i, locale)} × ${i.quantity}`).join(" · ");
              return (
                <div key={o.id} className="rounded-xl2 border border-ink/8 p-5 dark:border-white/10">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p dir="auto" className="break-words text-sm font-semibold">{o.businessName}</p>
                      <p className="mt-0.5 text-xs text-ink/55 dark:text-sand/60">
                        <span dir="ltr">{o.orderReference}</span> · {formatDate(o.createdAt)}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLES[o.status]}`}>
                      {t(`bookingStatus_${o.status}` as const)}
                    </span>
                  </div>

                  {summary && <p dir="auto" className="mt-2.5 break-words text-xs text-ink/60 dark:text-sand/60">{summary}</p>}

                  <div className="mt-2.5 flex items-center justify-between border-t border-ink/8 pt-2.5 text-xs dark:border-white/10">
                    <span className="text-ink/55 dark:text-sand/55">
                      {t("ordersItemCount", { count: itemCount })} ·{" "}
                      {o.fulfillmentType === "delivery" ? tp("fulfillmentDelivery") : tp("fulfillmentPickup")}
                    </span>
                    <span className="font-bold" dir="ltr">
                      ${(o.total ?? o.subtotal).toFixed(2)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h3 className="mb-3 text-sm font-bold text-ink/70 dark:text-sand/70">{t("ordersReservationSubheading")}</h3>
        {reservations.length === 0 ? (
          <EmptyState icon={CalendarClock} title={t("emptyReservationsTitle")} description={t("emptyReservationsDescription")} />
        ) : (
          <div className="space-y-3">
            {reservations.map((r) => (
              <div key={r.id} className="rounded-xl2 border border-ink/8 p-5 dark:border-white/10">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p dir="auto" className="break-words text-sm font-semibold">{r.businessName}</p>
                    <p className="mt-0.5 text-xs text-ink/55 dark:text-sand/60">
                      <span dir="ltr">{r.reservationReference}</span>
                    </p>
                  </div>
                  <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_STYLES[r.status]}`}>
                    {t(`bookingStatus_${r.status}` as const)}
                  </span>
                </div>

                <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-ink/8 pt-2.5 text-xs text-ink/55 dark:border-white/10 dark:text-sand/55">
                  <span className="inline-flex items-center gap-1.5">
                    <CalendarClock size={12} aria-hidden="true" />
                    {formatDate(r.reservationDate)} · <span dir="ltr">{r.reservationTime}</span>
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users size={12} aria-hidden="true" />
                    {t("ordersGuestCount", { count: r.guestsCount })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
