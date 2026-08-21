"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations, useLocale } from "next-intl";
import { Download, Eye, Loader2, Search } from "lucide-react";
import { updateAppointmentStatus } from "@/lib/actions/appointments";
import { formatTime12h } from "@/lib/utils/opening-hours";
import { ModalShell } from "@/components/shared/modal-shell";
import type { MyAppointment } from "@/lib/data/business";
import type { AppointmentStatus } from "@/types";

const STATUS_FILTERS: (AppointmentStatus | "all")[] = ["all", "pending", "confirmed", "completed", "cancelled", "rejected", "no_show"];
const STATUS_OPTIONS: AppointmentStatus[] = ["pending", "confirmed", "completed", "cancelled", "rejected", "no_show"];

const STATUS_STYLES: Record<AppointmentStatus, string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  confirmed: "bg-accent/10 text-accent-700 dark:bg-accent/15 dark:text-accent-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  completed: "bg-secondary/15 text-secondary-700 dark:bg-white/10 dark:text-sand/70",
  rejected: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  no_show: "bg-ink/10 text-ink/60 dark:bg-white/10 dark:text-sand/60",
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

function formatCreatedAt(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const datePart = formatDate(date.toISOString().slice(0, 10));
  const timePart = date.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
  return `${datePart} · ${timePart}`;
}

/** Every existing MyAppointment field, platform-wide (Founder/Owner) view —
 * reuses the same ModalShell/field-row pattern as the owner-side
 * AppointmentDetailModal (components/business/appointments-table.tsx). */
function AdminAppointmentDetailModal({ appointment, onClose }: { appointment: MyAppointment; onClose: () => void }) {
  const t = useTranslations("appointments");
  const ta = useTranslations("admin");
  const locale = useLocale();
  const rows: [string, string][] = [
    [t("patientName"), appointment.patientName],
    [t("phone"), appointment.patientPhone],
    [t("doctorLabel"), appointment.doctorName || "—"],
  ];
  if (appointment.hospitalName) rows.push([ta("bookingsColHotel"), appointment.hospitalName]);
  if (appointment.departmentName) rows.push([t("departmentLabel"), appointment.departmentName]);
  rows.push(
    [t("appointmentDate"), formatDate(appointment.appointmentDate)],
    [t("appointmentTime"), formatTime12h(appointment.appointmentTime)],
    [t("status"), t(`appointmentStatus_${appointment.status}`)]
  );
  if (appointment.notes) rows.push([t("notes"), appointment.notes]);
  if (appointment.createdAt) rows.push([t("createdLabel"), formatCreatedAt(appointment.createdAt, locale)]);

  return (
    <ModalShell title={t("appointmentDetails")} onClose={onClose}>
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

function exportCsv(appointments: MyAppointment[]) {
  const header = ["Hospital/Clinic", "Doctor", "Department", "Patient", "Phone", "Date", "Time", "Status", "Created"];
  const rows = appointments.map((a) => [
    a.hospitalName, a.doctorName, a.departmentName ?? "", a.patientName, a.patientPhone,
    a.appointmentDate, a.appointmentTime, a.status, a.createdAt,
  ]);
  const csv = [header, ...rows].map((row) => row.map((cell) => csvCell(String(cell))).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `appointments-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminAppointmentsList({ appointments }: { appointments: MyAppointment[] }) {
  const t = useTranslations("admin");
  const ta = useTranslations("appointments");
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [hospitalFilter, setHospitalFilter] = useState("all");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [viewing, setViewing] = useState<MyAppointment | null>(null);

  function onChangeStatus(appointment: MyAppointment, status: AppointmentStatus) {
    if (status === appointment.status) return;
    setPendingId(appointment.id);
    startTransition(async () => {
      const result = await updateAppointmentStatus(appointment.id, appointment.doctorId, status, [window.location.pathname]);
      if (result.ok) router.refresh();
      else alert(result.error ?? t("somethingWentWrong"));
      setPendingId(null);
    });
  }

  const hospitals = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of appointments) if (a.hospitalSlug && a.hospitalName) map.set(a.hospitalSlug, a.hospitalName);
    return Array.from(map.entries());
  }, [appointments]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return appointments.filter((a) => {
      if (statusFilter !== "all" && a.status !== statusFilter) return false;
      if (hospitalFilter !== "all" && a.hospitalSlug !== hospitalFilter) return false;
      if (!needle) return true;
      return (
        a.patientName.toLowerCase().includes(needle) ||
        a.patientPhone.toLowerCase().includes(needle) ||
        a.doctorName.toLowerCase().includes(needle) ||
        a.hospitalName.toLowerCase().includes(needle)
      );
    });
  }, [appointments, query, statusFilter, hospitalFilter]);

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
            {s === "all" ? t("allStatuses") : ta(`appointmentStatus_${s}` as "appointmentStatus_pending")}
          </button>
        ))}
        {hospitals.length > 1 && (
          <select
            value={hospitalFilter}
            onChange={(e) => setHospitalFilter(e.target.value)}
            className="h-8 rounded-full border border-ink/10 bg-transparent px-3 text-xs font-semibold outline-none dark:border-white/15"
          >
            <option value="all">{t("allHotels")}</option>
            {hospitals.map(([slug, name]) => (
              <option key={slug} value={slug}>{name}</option>
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
                <th className="px-4 py-3 text-start font-semibold">{t("bookingsColHotel")}</th>
                <th className="px-4 py-3 text-start font-semibold">{ta("doctorLabel")}</th>
                <th className="px-4 py-3 text-start font-semibold">{ta("patientName")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("bookingsColDates")}</th>
                <th className="px-4 py-3 text-start font-semibold">{t("bookingsColStatus")}</th>
                <th className="px-4 py-3 text-end font-semibold">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/5 dark:divide-white/5">
              {filtered.map((a) => (
                <tr key={a.id}>
                  <td className="px-4 py-3">
                    <p className="font-medium">{a.hospitalName || "—"}</p>
                    {a.departmentName && <p className="text-xs text-ink/50 dark:text-sand/50">{a.departmentName}</p>}
                  </td>
                  <td className="px-4 py-3">{a.doctorName || "—"}</td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{a.patientName}</p>
                    <p className="text-xs text-ink/50 dark:text-sand/50">{a.patientPhone}</p>
                  </td>
                  <td className="px-4 py-3 text-xs">
                    {formatDate(a.appointmentDate)} · {formatTime12h(a.appointmentTime)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <select
                        value={a.status}
                        disabled={isPending && pendingId === a.id}
                        onChange={(e) => onChangeStatus(a, e.target.value as AppointmentStatus)}
                        className={`rounded-full border-0 px-2.5 py-1 text-[11px] font-bold capitalize outline-none disabled:opacity-60 ${STATUS_STYLES[a.status]}`}
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>
                            {ta(`appointmentStatus_${s}` as "appointmentStatus_pending")}
                          </option>
                        ))}
                      </select>
                      {isPending && pendingId === a.id && <Loader2 size={12} className="animate-spin text-ink/40" />}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-end">
                    <button
                      type="button"
                      onClick={() => setViewing(a)}
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

      {viewing && <AdminAppointmentDetailModal appointment={viewing} onClose={() => setViewing(null)} />}
    </div>
  );
}
