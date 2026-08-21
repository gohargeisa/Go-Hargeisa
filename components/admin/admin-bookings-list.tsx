"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Download, Eye, Loader2, Search } from "lucide-react";
import { updateBookingStatus } from "@/lib/actions/business";
import { ModalShell } from "@/components/shared/modal-shell";
import type { Booking } from "@/types";

const STATUS_FILTERS: (Booking["status"] | "all")[] = ["all", "pending", "confirmed", "cancelled", "completed"];

const STATUS_STYLES: Record<Booking["status"], string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  confirmed: "bg-accent/10 text-accent-700 dark:bg-accent/15 dark:text-accent-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  completed: "bg-secondary/15 text-secondary-700 dark:bg-white/10 dark:text-sand/70",
};

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Deterministic, not locale-dependent — toLocaleDateString(undefined, ...)
// resolves against the server process's own default ICU locale, not the
// page's language, and can render Arabic month names on an English admin
// screen (see components/business/reservations-table.tsx's identical fix).
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTH_ABBR[m - 1]} ${d}, ${y}`;
}

function formatDateTime(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const datePart = formatDate(date.toISOString().slice(0, 10));
  const timePart = date.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
}

function nightsBetween(checkIn: string, checkOut: string): number | null {
  const start = new Date(`${checkIn}T00:00:00`);
  const end = new Date(`${checkOut}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
  const diff = Math.round((end.getTime() - start.getTime()) / 86400000);
  return diff > 0 ? diff : null;
}

/** Every existing Booking field, platform-wide (Founder/Owner) view — reuses
 * the same ModalShell/field-row pattern as the owner-side BookingDetailModal
 * (components/business/bookings-table.tsx) instead of a separate admin-only
 * detail UI. */
function AdminBookingDetailModal({ booking, onClose }: { booking: Booking; onClose: () => void }) {
  const t = useTranslations("businessDashboard");
  const ta = useTranslations("admin");
  const locale = useLocale();
  const nights = nightsBetween(booking.checkIn, booking.checkOut);
  const rows: [string, string][] = [];
  if (booking.bookingReference) rows.push([t("reference"), booking.bookingReference]);
  if (booking.hotelName) rows.push([ta("bookingsColHotel"), booking.hotelName]);
  rows.push(
    [t("guestName"), booking.guestName],
    [t("room"), booking.roomName ?? "—"],
    [t("adults"), String(booking.adults)],
    [t("children"), String(booking.children)],
    [t("rooms"), String(booking.roomsCount)],
    [t("checkIn"), formatDate(booking.checkIn)],
    [t("checkOut"), formatDate(booking.checkOut)]
  );
  if (nights !== null) rows.push([t("nights"), String(nights)]);
  rows.push([t("status"), t(`bookingStatus_${booking.status}`)]);
  if (booking.guestPhone) rows.push([t("phone"), booking.guestPhone]);
  if (booking.guestEmail) rows.push([t("email"), booking.guestEmail]);
  if (booking.guestCountry) rows.push([t("guestCountry"), booking.guestCountry]);
  if (booking.paymentStatus) rows.push([t("paymentStatus"), t(`paymentStatus_${booking.paymentStatus}`)]);
  if (booking.notes) rows.push([t("notes"), booking.notes]);
  if (booking.createdAt) rows.push([t("createdLabel"), formatDateTime(booking.createdAt, locale)]);

  return (
    <ModalShell title={t("bookingDetails")} onClose={onClose}>
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

function exportCsv(bookings: Booking[]) {
  const header = [
    "Reference", "Hotel", "Room", "Guest", "Phone", "Email", "Country",
    "Check-in", "Check-out", "Adults", "Children", "Rooms", "Status", "Created",
  ];
  const rows = bookings.map((b) => [
    b.bookingReference ?? "", b.hotelName ?? "", b.roomName ?? "", b.guestName, b.guestPhone ?? "",
    b.guestEmail ?? "", b.guestCountry ?? "", b.checkIn, b.checkOut, String(b.adults), String(b.children),
    String(b.roomsCount), b.status, b.createdAt,
  ]);
  const csv = [header, ...rows].map((row) => row.map((cell) => csvCell(String(cell))).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bookings-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminBookingsList({ bookings }: { bookings: Booking[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [hotelFilter, setHotelFilter] = useState("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [viewing, setViewing] = useState<Booking | null>(null);

  function onChangeStatus(booking: Booking, status: Booking["status"]) {
    if (!booking.hotelId || status === booking.status) return;
    setPendingId(booking.id);
    startTransition(async () => {
      const result = await updateBookingStatus(booking.id, booking.hotelId!, status, [window.location.pathname]);
      if (result.ok) router.refresh();
      else alert(result.error ?? t("somethingWentWrong"));
      setPendingId(null);
    });
  }

  const hotels = useMemo(() => {
    const map = new Map<string, string>();
    for (const b of bookings) if (b.hotelId && b.hotelName) map.set(b.hotelId, b.hotelName);
    return Array.from(map.entries());
  }, [bookings]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return bookings.filter((b) => {
      if (statusFilter !== "all" && b.status !== statusFilter) return false;
      if (hotelFilter !== "all" && b.hotelId !== hotelFilter) return false;
      if (!needle) return true;
      return (
        b.guestName.toLowerCase().includes(needle) ||
        (b.bookingReference ?? "").toLowerCase().includes(needle) ||
        (b.guestPhone ?? "").toLowerCase().includes(needle) ||
        (b.guestEmail ?? "").toLowerCase().includes(needle) ||
        (b.hotelName ?? "").toLowerCase().includes(needle)
      );
    });
  }, [bookings, query, statusFilter, hotelFilter]);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-ink/12 bg-white px-4 py-2.5 dark:border-white/15 dark:bg-white/5 sm:max-w-sm">
          <Search size={16} className="shrink-0 text-ink/40 dark:text-sand/40" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("bookingsSearchPlaceholder")}
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
        {hotels.length > 1 && (
          <select
            value={hotelFilter}
            onChange={(e) => setHotelFilter(e.target.value)}
            className="h-8 rounded-full border border-ink/10 bg-transparent px-3 text-xs font-semibold outline-none dark:border-white/15"
          >
            <option value="all">{t("allHotels")}</option>
            {hotels.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl2 border border-dashed border-ink/15 p-10 text-center dark:border-white/15">
          <p className="font-semibold">{t("noBookingsMatch")}</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl2 border border-ink/8 dark:border-white/10">
          <table className="w-full text-start text-sm">
            <thead className="border-b border-ink/8 bg-ink/[0.02] text-xs uppercase tracking-wide text-ink/50 dark:border-white/10 dark:bg-white/[0.03] dark:text-sand/50">
              <tr>
                <th className="px-4 py-3 text-start font-semibold">{t("bookingsColReference")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("bookingsColHotel")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("bookingsColGuest")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("bookingsColDates")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("bookingsColStatus")}</th>
                <th className="px-4 py-3 text-end font-semibold">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5 dark:divide-white/5">
              {filtered.map((b) => (
                <tr key={b.id}>
                  <td className="px-4 py-3 font-mono text-xs">{b.bookingReference ?? "—"}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{b.hotelName ?? "—"}</p>
                    {b.roomName && <p className="text-xs text-ink/50 dark:text-sand/50">{b.roomName}</p>}
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{b.guestName}</p>
                    <p className="text-xs text-ink/50 dark:text-sand/50">{b.guestPhone ?? b.guestEmail ?? "—"}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={b.status}
                        disabled={!b.hotelId || (isPending && pendingId === b.id)}
                        onChange={(e) => onChangeStatus(b, e.target.value as Booking["status"])}
                        className={`rounded-full border-0 px-2.5 py-1 text-[11px] font-bold capitalize outline-none disabled:opacity-60 ${STATUS_STYLES[b.status]}`}
                      >
                        {(["pending", "confirmed", "cancelled", "completed"] as const).map((s) => (
                          <option key={s} value={s}>
                            {t(`bookingStatus_${s}` as "bookingStatus_pending")}
                          </option>
                        ))}
                      </select>
                      {isPending && pendingId === b.id && <Loader2 size={12} className="animate-spin text-ink/40" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <button
                      type="button"
                      onClick={() => setViewing(b)}
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

      {viewing && <AdminBookingDetailModal booking={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
