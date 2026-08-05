"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { BedDouble, CalendarCheck, Loader2, Printer, Users, X } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { cancelMyBooking } from "@/lib/actions/bookings";
import type { Booking } from "@/types";
import type { Locale } from "@/lib/i18n/config";

const CANCELLATION_WINDOW_HOURS = 24;

function isCancellable(b: Booking): boolean {
  if (b.status !== "pending" && b.status !== "confirmed") return false;
  const hoursUntilCheckIn = (new Date(`${b.checkIn}T00:00:00`).getTime() - Date.now()) / 3_600_000;
  return hoursUntilCheckIn > CANCELLATION_WINDOW_HOURS;
}

const STATUS_FILTERS: (Booking["status"] | "all")[] = ["all", "pending", "confirmed", "cancelled", "completed"];

const STATUS_STYLES: Record<Booking["status"], string> = {
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-400/15 dark:text-amber-300",
  confirmed: "bg-accent/10 text-accent-700 dark:bg-accent/15 dark:text-accent-400",
  cancelled: "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300",
  completed: "bg-secondary/15 text-secondary-700 dark:bg-white/10 dark:text-sand/70",
};

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function BookingsPanel({ locale, bookings }: { locale: Locale; bookings: Booking[] }) {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const filtered = useMemo(
    () => (filter === "all" ? bookings : bookings.filter((b) => b.status === filter)),
    [bookings, filter]
  );

  function onCancel(id: string) {
    if (!confirm(t("cancelBookingConfirm"))) return;
    setCancellingId(id);
    startTransition(async () => {
      const result = await cancelMyBooking(id, locale);
      if (result.ok) router.refresh();
      else alert(result.error ?? t("genericError"));
      setCancellingId(null);
    });
  }

  return (
    <div>
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">{t("bookingsEyebrow")}</p>
        <h2 className="mt-1 font-display text-2xl font-semibold">{t("bookingsTitle")}</h2>
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
            {s === "all" ? t("bookingsFilterAll") : t(`bookingStatus_${s}`)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={CalendarCheck} title={t("emptyBookingsTitle")} description={t("emptyBookingsDescription")} />
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div key={b.id} className="rounded-xl2 border border-ink/8 p-5 transition-shadow duration-300 ease-premium hover:shadow-soft dark:border-white/10">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  {b.hotelSlug ? (
                    <Link href={`/${locale}/hotels/${b.hotelSlug}`} className="text-sm font-semibold hover:text-primary">
                      {b.hotelName ?? t("bookingsHotel")}
                    </Link>
                  ) : (
                    <p className="text-sm font-semibold">{b.hotelName ?? t("bookingsHotel")}</p>
                  )}
                  {b.roomName && (
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-ink/55 dark:text-sand/60">
                      <BedDouble size={12} aria-hidden="true" /> {b.roomName}
                    </p>
                  )}
                </div>
                <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ${STATUS_STYLES[b.status]}`}>
                  {t(`bookingStatus_${b.status}`)}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-ink/60 dark:text-sand/60">
                <span>
                  {formatDate(b.checkIn)} → {formatDate(b.checkOut)}
                </span>
                <span className="inline-flex items-center gap-1">
                  <Users size={12} aria-hidden="true" />
                  {b.adults} {t("bookingsAdultsWord")}
                  {b.children > 0 ? ` · ${b.children} ${t("bookingsChildrenWord")}` : ""}
                </span>
              </div>

              {b.bookingReference && (
                <p className="mt-2 font-mono text-[11px] text-ink/40 dark:text-sand/40">{b.bookingReference}</p>
              )}

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Link
                  href={`/${locale}/dashboard/bookings/${b.id}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 px-3.5 py-1.5 text-xs font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/15"
                >
                  <Printer size={12} aria-hidden="true" /> {t("printConfirmation")}
                </Link>
                {isCancellable(b) && (
                  <button
                    type="button"
                    onClick={() => onCancel(b.id)}
                    disabled={isPending && cancellingId === b.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 px-3.5 py-1.5 text-xs font-semibold text-red-600 transition-colors hover:border-red-500 disabled:opacity-60 dark:border-white/15"
                  >
                    {isPending && cancellingId === b.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} aria-hidden="true" />}
                    {t("cancelBooking")}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
