"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowLeft, BedDouble, CalendarCheck, MapPin, Printer, Users } from "lucide-react";
import type { Booking } from "@/types";
import type { Locale } from "@/lib/i18n/config";

function formatDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "long", day: "numeric", year: "numeric" });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-dashed border-ink/10 py-2.5 text-sm last:border-0 dark:border-white/10">
      <span className="text-ink/55 dark:text-sand/55">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

export function BookingConfirmationView({
  locale,
  booking,
  labels,
}: {
  locale: Locale;
  booking: Booking;
  labels: { printButton: string; backToDashboard: string };
}) {
  const t = useTranslations("dashboard");

  return (
    <section className="container-px mx-auto py-10 md:py-14">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 print:hidden">
        <Link
          href={`/${locale}/dashboard?tab=bookings`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/60 hover:text-primary dark:text-sand/60"
        >
          <ArrowLeft size={15} aria-hidden="true" /> {labels.backToDashboard}
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
        >
          <Printer size={15} aria-hidden="true" /> {labels.printButton}
        </button>
      </div>

      <div className="mx-auto mt-6 max-w-2xl rounded-3xl border border-ink/10 bg-white p-8 shadow-premium dark:border-white/10 dark:bg-ink print:border-0 print:shadow-none">
        <div className="flex items-center justify-between border-b border-ink/8 pb-5 dark:border-white/10">
          <div>
            <p className="font-display text-xl font-bold">Go Hargeisa</p>
            <p className="text-xs text-ink/50 dark:text-sand/50">{t("bookingConfirmationSubtitle")}</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-accent-600">
            <CalendarCheck size={22} aria-hidden="true" />
          </div>
        </div>

        <div className="mt-5">
          <h1 className="font-display text-2xl font-bold">{booking.hotelName ?? t("bookingsHotel")}</h1>
          {booking.roomName && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-ink/60 dark:text-sand/60">
              <BedDouble size={14} aria-hidden="true" /> {booking.roomName}
            </p>
          )}
          {booking.bookingReference && (
            <p className="mt-2 inline-flex items-center rounded-full bg-ink/5 px-3 py-1 font-mono text-xs font-bold dark:bg-white/10">
              {booking.bookingReference}
            </p>
          )}
        </div>

        <div className="mt-6 space-y-0.5">
          <Row label={t("checkInLabel")} value={formatDate(booking.checkIn)} />
          <Row label={t("checkOutLabel")} value={formatDate(booking.checkOut)} />
          <Row
            label={t("bookingsAdultsWord")}
            value={`${booking.adults}${booking.children > 0 ? ` · ${booking.children} ${t("bookingsChildrenWord")}` : ""}`}
          />
          <Row label={t("roomsLabel")} value={String(booking.roomsCount)} />
          <Row label={t("statusLabel")} value={t(`bookingStatus_${booking.status}`)} />
          <Row label={t("guestNameLabel")} value={booking.guestName} />
          {booking.guestPhone && <Row label={t("guestPhoneLabel")} value={booking.guestPhone} />}
          {booking.guestEmail && <Row label={t("guestEmailLabel")} value={booking.guestEmail} />}
          {booking.guestCountry && <Row label={t("guestCountryLabel")} value={booking.guestCountry} />}
          {booking.notes && <Row label={t("specialRequestsLabel")} value={booking.notes} />}
        </div>

        {booking.hotelSlug && (
          <div className="mt-6 flex flex-wrap gap-2 print:hidden">
            <Link
              href={`/${locale}/hotels/${booking.hotelSlug}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 px-4 py-2 text-xs font-semibold hover:border-primary hover:text-primary dark:border-white/15"
            >
              <MapPin size={12} aria-hidden="true" /> {t("bookingsHotel")}
            </Link>
          </div>
        )}

        <p className="mt-8 flex items-center gap-1.5 text-xs text-ink/40 dark:text-sand/40">
          <Users size={12} aria-hidden="true" /> {t("bookingConfirmationFooter")}
        </p>
      </div>
    </section>
  );
}
