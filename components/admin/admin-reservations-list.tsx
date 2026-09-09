"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Download, Eye, Loader2, Search } from "lucide-react";
import { updateReservationStatus } from "@/lib/actions/reservations";
import { formatTime12h } from "@/lib/utils/opening-hours";
import { ModalShell } from "@/components/shared/modal-shell";
import type { AdminTableReservation } from "@/lib/data/reservations";
import type { TableReservation } from "@/types";

const STATUS_FILTERS: (TableReservation["status"] | "all")[] = ["all", "pending", "confirmed", "completed", "cancelled"];
const STATUS_OPTIONS: TableReservation["status"][] = ["pending", "confirmed", "cancelled", "completed"];

const STATUS_STYLES: Record<TableReservation["status"], string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  confirmed: "bg-accent/10 text-accent-700 dark:bg-accent/15 dark:text-accent-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  completed: "bg-secondary/15 text-secondary-700 dark:bg-white/10 dark:text-sand/70",
};

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Deterministic, not locale-dependent — same fix as AdminAppointmentsList /
// ReservationsTable's own identical formatDate (toLocaleDateString(undefined,
// ...) resolves against the server process's own default ICU locale, not
// the page's language, and can render an Arabic month name on an English
// admin screen).
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTH_ABBR[m - 1]} ${d}, ${y}`;
}

function formatCreatedAt(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const datePart = formatDate(date.toISOString().slice(0, 10));
  const timePart = date.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
}

/** Every existing TableReservation field, platform-wide (Founder/Owner)
 * view — reuses the same ModalShell/field-row pattern as the owner-side
 * ReservationDetailModal (components/business/reservations-table.tsx) and
 * AdminAppointmentDetailModal (components/admin/admin-appointments-list.tsx). */
function AdminReservationDetailModal({ reservation, onClose }: { reservation: AdminTableReservation; onClose: () => void }) {
  const t = useTranslations("businessDashboard");
  const ta = useTranslations("admin");
  const locale = useLocale();
  const guestsLabel = reservation.listingType === "service" ? t("viewers") : t("guests");
  const rows: [string, string][] = [
    [t("reference"), reservation.reservationReference],
    [ta("bookingsColHotel"), reservation.businessName],
    [t("customerName"), reservation.customerName],
    [t("phone"), reservation.customerPhone],
    [t("reservationDate"), formatDate(reservation.reservationDate)],
    [t("reservationTime"), formatTime12h(reservation.reservationTime.slice(0, 5))],
    [guestsLabel, String(reservation.guestsCount)],
    [t("status"), t(`bookingStatus_${reservation.status}`)],
  ];
  if (reservation.notes) rows.push([t("notes"), reservation.notes]);
  if (reservation.createdAt) rows.push([t("createdLabel"), formatCreatedAt(reservation.createdAt, locale)]);

  return (
    <ModalShell title={t("reservationDetails")} onClose={onClose}>
      <dl className="space-y-3 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-start justify-between gap-4 border-b border-ink/8 pb-2 dark:border-white/10">
            <dt className="text-ink/50 dark:text-sand/50">{label}</dt>
            <dd className="text-end font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </ModalShell>
  );
}

function csvCell(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

function exportCsv(reservations: AdminTableReservation[]) {
  const header = ["Business", "Customer", "Phone", "Date", "Time", "Guests", "Status", "Reference", "Created"];
  const rows = reservations.map((r) => [
    r.businessName, r.customerName, r.customerPhone, r.reservationDate, r.reservationTime,
    String(r.guestsCount), r.status, r.reservationReference, r.createdAt,
  ]);
  const csv = [header, ...rows].map((row) => row.map((cell) => csvCell(String(cell))).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reservations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Platform-wide table-reservation list for the founder/admin — the missing
 * counterpart to AdminAppointmentsList/AdminBookingsList. table_reservations
 * previously had no admin read surface anywhere, so a reservation could sit
 * unseen indefinitely even though the row existed. `updateReservationStatus`
 * (the same server action the owner-side ReservationsTable already uses) is
 * reused as-is — `assertCanManageListing` already allows `role='owner'`, so
 * no new action was needed for admin status changes.
 */
export function AdminReservationsList({ reservations }: { reservations: AdminTableReservation[] }) {
  const t = useTranslations("admin");
  const tb = useTranslations("businessDashboard");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [businessFilter, setBusinessFilter] = useState("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [viewing, setViewing] = useState<AdminTableReservation | null>(null);

  function onChangeStatus(reservation: AdminTableReservation, status: TableReservation["status"]) {
    if (status === reservation.status) return;
    setPendingId(reservation.id);
    startTransition(async () => {
      const result = await updateReservationStatus(
        reservation.id,
        reservation.listingType,
        reservation.listingId,
        status,
        [window.location.pathname]
      );
      if (result.ok) router.refresh();
      else alert(result.error ?? t("somethingWentWrong"));
      setPendingId(null);
    });
  }

  const businesses = useMemo(() => {
    const map = new Map<string, string>();
    for (const r of reservations) map.set(r.listingId, r.businessName);
    return Array.from(map.entries());
  }, [reservations]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return reservations.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (businessFilter !== "all" && r.listingId !== businessFilter) return false;
      if (!needle) return true;
      return (
        r.customerName.toLowerCase().includes(needle) ||
        r.customerPhone.toLowerCase().includes(needle) ||
        r.businessName.toLowerCase().includes(needle) ||
        r.reservationReference.toLowerCase().includes(needle)
      );
    });
  }, [reservations, query, statusFilter, businessFilter]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-ink/12 bg-white px-4 py-2.5 dark:border-white/15 dark:bg-white/5 sm:max-w-sm">
          <Search size={16} className="shrink-0 text-ink/40 dark:text-sand/40" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("reservationsSearchPlaceholder")}
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
            {s === "all" ? t("allStatuses") : tb(`bookingStatus_${s}` as "bookingStatus_pending")}
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
          <p className="font-semibold">{t("noReservationsMatch")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl2 border border-ink/8 dark:border-white/10">
          <table className="w-full text-start text-sm">
            <thead className="border-b border-ink/8 bg-ink/[0.02] text-xs uppercase tracking-wide text-ink/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-sand/50">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">{t("reservationsColBusiness")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("reservationsColCustomer")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("reservationsColDateTime")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("reservationsColStatus")}</th>
                <th className="px-4 py-3 text-end font-semibold">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5 dark:divide-white/5">
              {filtered.map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.businessName}</p>
                    <p className="font-mono text-[11px] text-ink/40 dark:text-sand/40">{r.reservationReference}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{r.customerName}</p>
                    <p className="text-xs text-ink/50 dark:text-sand/50">{r.customerPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {formatDate(r.reservationDate)} · {formatTime12h(r.reservationTime.slice(0, 5))}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={r.status}
                        disabled={isPending && pendingId === r.id}
                        onChange={(e) => onChangeStatus(r, e.target.value as TableReservation["status"])}
                        className={`rounded-full border-0 px-2.5 py-1 text-[11px] font-bold capitalize outline-none disabled:opacity-60 ${STATUS_STYLES[r.status]}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {tb(`bookingStatus_${s}` as "bookingStatus_pending")}
                          </option>
                        ))}
                      </select>
                      {isPending && pendingId === r.id && <Loader2 size={12} className="animate-spin text-ink/40" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <button
                      type="button"
                      onClick={() => setViewing(r)}
                      aria-label={t("productOrdersViewDetails")}
                      title={t("productOrdersViewDetails")}
                      className="ms-auto flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink/60 transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-sand/60"
                    >
                      <Eye size={14} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewing && <AdminReservationDetailModal reservation={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
