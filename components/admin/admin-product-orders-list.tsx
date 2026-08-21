"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { ChevronDown, Download, Loader2, Search, Trash2 } from "lucide-react";
import { OrderItemThumb } from "@/components/shared/order-item-thumb";
import { updateProductOrderStatus, deleteProductOrder } from "@/lib/actions/product-orders";
import type { AdminProductOrder } from "@/lib/data/product-orders";
import type { ProductOrder } from "@/types";

const STATUS_FILTERS: (ProductOrder["status"] | "all")[] = [
  "all", "pending", "confirmed", "preparing", "ready", "out_for_delivery", "completed", "cancelled",
];

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

// Explicit locale (not `undefined`) so the AM/PM designator always matches
// the page's own language instead of whatever locale the server process
// happens to default to (seen live: an English admin page rendering the
// Arabic "ص" marker because the host's default ICU locale is Arabic).
function formatDateTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const datePart = `${MONTH_ABBR[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  const timePart = date.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
}

function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTH_ABBR[m - 1]} ${d}, ${y}`;
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function exportCsv(orders: AdminProductOrder[]) {
  const header = ["Reference", "Business", "Customer", "Phone", "Items", "Total", "Status", "Created"];
  const rows = orders.map((o) => [
    o.orderReference,
    o.businessName,
    o.customerName,
    o.customerPhone,
    o.items
      .map((i) => {
        const config = i.selectedOptions?.length ? ` [${i.selectedOptions.map((so) => `${so.label}: ${so.valueLabel}`).join(", ")}]` : "";
        return `${i.productName}${i.variantName ? ` (${i.variantName})` : ""} x${i.quantity}${config}`;
      })
      .join("; "),
    o.total != null ? o.total.toFixed(2) : "",
    o.status,
    o.createdAt,
  ]);
  const csv = [header, ...rows].map((row) => row.map((cell) => csvCell(String(cell))).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `product-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Platform-wide product orders — same search/filter/status-change shape as
 * AdminBookingsList, generalized: "hotel" filter becomes "business" (any
 * OrderableListingType), "dates" column becomes the line-item basket.
 */
export function AdminProductOrdersList({ orders }: { orders: AdminProductOrder[] }) {
  const t = useTranslations("admin");
  const tp = useTranslations("productOrder");
  const locale = useLocale();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [businessFilter, setBusinessFilter] = useState("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function onChangeStatus(order: AdminProductOrder, status: ProductOrder["status"]) {
    setPendingId(order.id);
    startTransition(async () => {
      const result = await updateProductOrderStatus(order.id, order.listingType, order.listingId, status, [window.location.pathname]);
      if (result.ok) router.refresh();
      else alert(result.error ?? t("somethingWentWrong"));
      setPendingId(null);
    });
  }

  function onDeleteOrder(order: AdminProductOrder) {
    if (!confirm(t("confirmDeleteProductOrder", { reference: order.orderReference }))) return;
    setDeletingId(order.id);
    startTransition(async () => {
      const result = await deleteProductOrder(order.id, order.listingType, order.listingId, [window.location.pathname]);
      if (result.ok) {
        if (expandedId === order.id) setExpandedId(null);
        router.refresh();
      } else {
        alert(result.error ?? t("somethingWentWrong"));
      }
      setDeletingId(null);
    });
  }

  const businesses = useMemo(() => {
    const map = new Map<string, string>();
    for (const o of orders) map.set(o.listingId, o.businessName);
    return Array.from(map.entries());
  }, [orders]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (businessFilter !== "all" && o.listingId !== businessFilter) return false;
      if (!needle) return true;
      return (
        o.customerName.toLowerCase().includes(needle) ||
        o.orderReference.toLowerCase().includes(needle) ||
        o.customerPhone.toLowerCase().includes(needle) ||
        o.businessName.toLowerCase().includes(needle)
      );
    });
  }, [orders, query, statusFilter, businessFilter]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-ink/12 bg-white px-4 py-2.5 dark:border-white/15 dark:bg-white/5 sm:max-w-sm">
          <Search size={16} className="shrink-0 text-ink/40 dark:text-sand/40" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("productOrdersSearchPlaceholder")}
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink/40 dark:placeholder:text-sand/40"
          />
        </div>
        <button
          type="button"
          onClick={() => exportCsv(filtered)}
          disabled={filtered.length === 0}
          className="inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/12 px-4 py-2.5 text-sm font-semibold transition-colors hover:border-primary hover:text-primary disabled:opacity-50 dark:border-white/15"
        >
          <Download size={14} aria-hidden="true" /> {t("exportCsv")}
        </button>
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
              statusFilter === s
                ? "border-transparent bg-primary text-white"
                : "border-ink/10 text-ink/60 hover:border-primary/40 dark:border-white/15 dark:text-sand/60"
            }`}
          >
            {s === "all" ? t("allStatuses") : t(`bookingStatus_${s}` as "bookingStatus_pending")}
          </button>
        ))}
        {businesses.length > 1 && (
          <select
            value={businessFilter}
            onChange={(e) => setBusinessFilter(e.target.value)}
            className="h-8 rounded-full border border-ink/10 bg-transparent px-3 text-xs font-semibold outline-none dark:border-white/15"
          >
            <option value="all">{t("allBusinesses")}</option>
            {businesses.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl2 border border-dashed border-ink/15 p-10 text-center dark:border-white/15">
          <p className="font-semibold">{t("noProductOrdersMatch")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl2 border border-ink/8 dark:border-white/10">
          <table className="w-full text-start text-sm">
            <thead className="border-b border-ink/8 bg-ink/[0.02] text-xs uppercase tracking-wide text-ink/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-sand/50">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">{t("productOrdersColReference")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("productOrdersColBusiness")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("productOrdersColCustomer")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("productOrdersColItems")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("productOrdersColTotal")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("productOrdersColStatus")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5 dark:divide-white/5">
              {filtered.map((o) => {
                const isExpanded = expandedId === o.id;
                return (
                <Fragment key={o.id}>
                  <tr>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => setExpandedId(isExpanded ? null : o.id)}
                        aria-expanded={isExpanded}
                        aria-label={isExpanded ? t("productOrdersHideDetails") : t("productOrdersViewDetails")}
                        className="flex items-center gap-1.5 font-mono text-xs hover:text-primary"
                      >
                        <ChevronDown size={13} aria-hidden="true" className={`shrink-0 transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                        {o.orderReference}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.businessName}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium">{o.customerName}</p>
                      <p className="text-xs text-ink/50 dark:text-sand/50">{o.customerPhone}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {o.items.map((i) => (
                        <div key={i.id} className="mb-1.5 flex items-center gap-2 last:mb-0">
                          <OrderItemThumb src={i.productImage} alt={i.productName} size={28} />
                          <div>
                            <span>
                              {i.productName}
                              {i.variantName ? ` (${i.variantName})` : ""} ×{i.quantity}
                            </span>
                            {i.selectedOptions && i.selectedOptions.length > 0 && (
                              <span className="block text-ink/45 dark:text-sand/45">
                                {i.selectedOptions.map((so) => `${so.label}: ${so.valueLabel}`).join(" · ")}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </td>
                    <td className="px-4 py-3 font-semibold">{o.total != null ? `$${o.total.toFixed(2)}` : "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <select
                          value={o.status}
                          disabled={isPending && pendingId === o.id}
                          onChange={(e) => onChangeStatus(o, e.target.value as ProductOrder["status"])}
                          className={`rounded-full border-0 px-2.5 py-1 text-[11px] font-bold capitalize outline-none disabled:opacity-60 ${STATUS_STYLES[o.status]}`}
                        >
                          {(["pending", "confirmed", "preparing", "ready", "out_for_delivery", "completed", "cancelled"] as const).map((s) => (
                            <option key={s} value={s}>
                              {t(`bookingStatus_${s}` as "bookingStatus_pending")}
                            </option>
                          ))}
                        </select>
                        {isPending && pendingId === o.id && <Loader2 size={12} className="animate-spin text-ink/40" />}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr>
                      <td colSpan={6} className="border-t border-ink/8 bg-ink/[0.015] px-4 py-4 dark:border-white/10 dark:bg-white/[0.02]">
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          <div className="space-y-1.5 text-xs">
                            {o.items.map((i) => (
                              <div key={i.id} className="flex items-center gap-2.5">
                                <OrderItemThumb src={i.productImage} alt={i.productName} size={40} />
                                <span className="min-w-0 flex-1 text-ink/70 dark:text-sand/70">
                                  {i.productName}{i.variantName ? ` (${i.variantName})` : ""} × {i.quantity}
                                  <span className="text-ink/40 dark:text-sand/40"> (${i.unitPrice.toFixed(2)} {tp("unitPriceLabel").toLowerCase()})</span>
                                  {i.addons.length > 0 && <span className="text-ink/40 dark:text-sand/40"> ({i.addons.map((a) => a.name).join(", ")})</span>}
                                </span>
                                <span className="shrink-0 font-semibold">${i.lineTotal.toFixed(2)}</span>
                              </div>
                            ))}
                            <div className="flex items-center justify-between border-t border-ink/8 pt-1 dark:border-white/10">
                              <span className="text-ink/60 dark:text-sand/60">{tp("subtotalLabel")}</span>
                              <span>${o.subtotal.toFixed(2)}</span>
                            </div>
                            {/* No delivery-fee column exists on product_orders today — subtotal
                                and total are currently always equal. Both are still shown as
                                distinct rows (rather than collapsing one into the other) so this
                                keeps working correctly the moment a delivery fee is introduced. */}
                            <div className="flex items-center justify-between font-bold">
                              <span>{tp("totalLabel")}</span>
                              <span>${(o.total ?? o.subtotal).toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="space-y-1 text-xs text-ink/60 dark:text-sand/60">
                            <p>{t("productOrdersStatusLabel")}: {t(`bookingStatus_${o.status}` as "bookingStatus_pending")}</p>
                            <p>{t("productOrdersCreatedAtLabel")}: {formatDateTime(o.createdAt, locale)}</p>
                            <p>{tp("fulfillmentLabel")}: {o.fulfillmentType === "delivery" ? tp("fulfillmentDelivery") : tp("fulfillmentPickup")}</p>
                            {o.deliveryAddress && <p>{tp("deliveryAddressLabel")}: {o.deliveryAddress}</p>}
                            {formatDate(o.preferredDate) && <p>{tp("preferredDateLabel")}: {formatDate(o.preferredDate)}</p>}
                            {o.preferredTime && <p>{tp("preferredTimeLabel")}: {o.preferredTime}</p>}
                          </div>
                          {(o.recipientName || o.recipientPhone || o.occasion || o.messageNote || o.notes) && (
                            <div className="space-y-1 text-xs text-ink/60 dark:text-sand/60">
                              {o.recipientName && <p>{tp("recipientNameLabel")}: {o.recipientName}</p>}
                              {o.recipientPhone && <p>{tp("recipientPhoneLabel")}: {o.recipientPhone}</p>}
                              {o.occasion && <p>{tp("occasionLabel")}: {o.occasion}</p>}
                              {o.messageNote && <p>{tp("messageNoteLabel")}: {o.messageNote}</p>}
                              {o.notes && <p>{t("productOrdersNotesLabel")}: {o.notes}</p>}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-ink/8 pt-3 dark:border-white/10">
                          <button
                            type="button"
                            onClick={() => onDeleteOrder(o)}
                            disabled={deletingId === o.id || (o.status !== "completed" && o.status !== "cancelled")}
                            className="inline-flex items-center gap-1.5 rounded-full border border-red-200 px-3.5 py-2 text-xs font-semibold text-red-600 transition-colors hover:border-red-400 hover:bg-red-50 disabled:opacity-40 dark:border-red-400/30 dark:text-red-300 dark:hover:bg-red-400/10"
                          >
                            {deletingId === o.id ? <Loader2 size={13} className="animate-spin" aria-hidden="true" /> : <Trash2 size={13} aria-hidden="true" />}
                            {t("productOrdersDeleteAction")}
                          </button>
                          {o.status !== "completed" && o.status !== "cancelled" && (
                            <span className="text-xs text-ink/40 dark:text-sand/40">{t("productOrdersDeleteHint")}</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
