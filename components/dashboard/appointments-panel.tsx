"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { CalendarCheck, Loader2, Stethoscope, X } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { cancelMyAppointment } from "@/lib/actions/appointments";
import { formatTime12h } from "@/lib/utils/opening-hours";
import type { MyAppointment } from "@/lib/data/business";
import type { Locale } from "@/lib/i18n/config";

function isCancellable(a: MyAppointment): boolean {
  return a.status === "pending" || a.status === "confirmed";
}

const STATUS_FILTERS: (MyAppointment["status"] | "all")[] = ["all", "pending", "confirmed", "completed", "cancelled", "rejected", "no_show"];

const STATUS_STYLES: Record<MyAppointment["status"], string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  confirmed: "bg-accent/10 text-accent-700 dark:bg-accent/15 dark:text-accent-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  completed: "bg-secondary/15 text-secondary-700 dark:bg-white/10 dark:text-sand/70",
  rejected: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  no_show: "bg-ink/10 text-ink/60 dark:bg-white/10 dark:text-sand/60",
};

const MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Deterministic, not locale-dependent — toLocaleDateString(undefined, ...)
// resolves the server's locale differently from the client's, producing a
// React hydration mismatch (see components/business/reservations-table.tsx).
function formatDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${MONTH_ABBR[m - 1]} ${d}, ${y}`;
}

export function AppointmentsPanel({ locale, appointments }: { locale: Locale; appointments: MyAppointment[] }) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () => (filter === "all" ? appointments : appointments.filter((a) => a.status === filter)),
    [appointments, filter]
  );

  function onCancel(id: string) {
    if (!confirm(t("cancelAppointmentConfirm"))) return;
    setCancellingId(id);
    startTransition(async () => {
      const result = await cancelMyAppointment(id, locale);
      if (result.ok) router.refresh();
      else alert(result.error ?? t("genericError"));
      setCancellingId(null);
    });
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary-700">{t("appointmentsEyebrow")}</p>
        <h2 className="mt-1 font-display text-2xl font-semibold">{t("appointmentsTitle")}</h2>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            aria-pressed={filter === s}
            className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition-all duration-300 ease-premium ${
              filter === s
                ? "border-transparent bg-primary text-white"
                : "border-ink/10 text-ink/60 hover:border-primary/40 hover:text-primary dark:border-white/15 dark:text-sand/60"
            }`}
          >
            {s === "all" ? t("bookingsFilterAll") : t(`appointmentStatus_${s}`)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CalendarCheck} title={t("emptyAppointmentsTitle")} description={t("emptyAppointmentsDescription")} />
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => (
            <div key={a.id} className="rounded-xl2 border border-ink/8 p-5 transition-shadow duration-300 ease-premium hover:shadow-soft dark:border-white/10">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  {a.hospitalSlug ? (
                    <Link href={`/${locale}/city-services/${a.hospitalSlug}`} className="text-sm font-semibold hover:text-primary">
                      {a.hospitalName}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold">{a.hospitalName}</p>
                  )}
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink/55 dark:text-sand/60">
                    <Stethoscope size={12} aria-hidden="true" /> {a.doctorName}
                    {a.departmentName ? ` · ${a.departmentName}` : ""}
                  </p>
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS_STYLES[a.status]}`}>
                  {t(`appointmentStatus_${a.status}`)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink/60 dark:text-sand/60">
                <span>
                  {formatDate(a.appointmentDate)} · {formatTime12h(a.appointmentTime)}
                </span>
              </div>

              {isCancellable(a) && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onCancel(a.id)}
                    disabled={isPending && cancellingId === a.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 px-3.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:border-red-500 disabled:opacity-60 dark:border-white/15"
                  >
                    {isPending && cancellingId === a.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} aria-hidden="true" />}
                    {t("cancelAppointment")}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
