"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BedDouble, CalendarCheck, Users } from "lucide-react";
import type { Booking } from "@/types";
import type { Locale } from "@/lib/i18n/config";

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
  const [filter, setFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");

  const filtered = useMemo(
    () => (filter === "all" ? bookings : bookings.filter((b) => b.status === filter)),
    [bookings, filter]
  );

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
            className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold capitalize transition-colors ${
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
        <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-primary/[0.035] px-6 text-center dark:bg-primary/[0.08]">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-sm dark:bg-ink">
            <CalendarCheck size={22} />
          </span>
          <h3 className="mt-4 font-display text-xl font-semibold">{t("emptyBookingsTitle")}</h3>
          <p className="mt-2 max-w-sm text-sm leading-6 text-ink/55 dark:text-sand/60">
            {t("emptyBookingsDescription")}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => (
            <div key={b.id} className="rounded-2xl border border-ink/8 p-5 transition-shadow hover:shadow-sm dark:border-white/10">
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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
