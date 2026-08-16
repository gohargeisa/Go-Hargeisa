"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Download, Loader2, Search } from "lucide-react";
import { updateProductOrderStatus } from "@/lib/actions/product-orders";
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
    o.items.map((i) => `${i.productName} x${i.quantity}`).join("; "),
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
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [businessFilter, setBusinessFilter] = useState("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onChangeStatus(order: AdminProductOrder, status: ProductOrder["status"]) {
    setPendingId(order.id);
    startTransition(async () => {
      const result = await updateProductOrderStatus(order.id, order.listingType, order.listingId, status, [window.location.pathname]);
      if (result.ok) router.refresh();
      else alert(result.error ?? t("somethingWentWrong"));
      setPendingId(null);
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
              {filtered.map((o) => (
                <tr key={o.id}>
                  <td className="px-4 py-3 font-mono text-xs">{o.orderReference}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.businessName}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.customerName}</p>
                    <p className="text-xs text-ink/50 dark:text-sand/50">{o.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {o.items.map((i) => `${i.productName} ×${i.quantity}`).join(", ")}
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
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
