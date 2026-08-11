"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  BedDouble,
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  Star,
  Users,
} from "lucide-react";
import { submitBookingRequest } from "@/lib/actions/bookings";
import { amenityIcon } from "@/lib/utils/amenity-icon";
import { roomTypeLabel } from "@/lib/utils/room-type";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import { buildWhatsAppBookingMessage } from "@/lib/utils/whatsapp-booking-message";
import type { Locale } from "@/lib/i18n/config";
import type { HotelRoom } from "@/types";

const inputClass =
  "w-full rounded-xl border border-ink/12 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function nightsBetween(checkIn: string, checkOut: string): number {
  if (!checkIn || !checkOut) return 0;
  const a = new Date(`${checkIn}T00:00:00`);
  const b = new Date(`${checkOut}T00:00:00`);
  const diff = Math.round((b.getTime() - a.getTime()) / 86_400_000);
  return diff > 0 ? diff : 0;
}

function money(n: number): string {
  return `$${n.toFixed(2)}`;
}

/** Sun/Sat nights use a room's weekendPrice when set; a discountPrice (when
 * set) overrides whichever nightly rate would otherwise apply. Mirrors the
 * fields added to hotel_rooms for Phase 5.5 (weekend_price, discount_price). */
function nightlyRate(room: HotelRoom | undefined, date: string): number {
  if (!room) return 0;
  if (room.discountPrice) return room.discountPrice;
  const day = new Date(`${date}T00:00:00`).getDay();
  if (room.weekendPrice && (day === 0 || day === 6)) return room.weekendPrice;
  return room.pricePerNight ?? 0;
}

function computeSubtotal(room: HotelRoom | undefined, checkIn: string, checkOut: string, roomsCount: number): number {
  if (!room || !checkIn || !checkOut) return 0;
  let total = 0;
  let cursor = checkIn;
  while (cursor < checkOut) {
    total += nightlyRate(room, cursor);
    cursor = addDaysIso(cursor, 1);
  }
  return total * roomsCount;
}

function Stepper({ label, value, min, onChange }: { label: string; value: number; min: number; onChange: (next: number) => void }) {
  const t = useTranslations("bookingRequest");
  return (
    <div className="flex items-center justify-between rounded-xl border border-ink/12 px-4 py-3 dark:border-white/15">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          aria-label={t("decreaseAriaLabel", { label })}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-primary hover:text-primary disabled:opacity-30 dark:border-white/20 dark:text-white"
        >
          <Minus size={14} aria-hidden="true" />
        </button>
        <span className="w-5 text-center text-sm font-bold tabular-nums">{value}</span>
        <button
          type="button"
          onClick={() => onChange(value + 1)}
          aria-label={t("increaseAriaLabel", { label })}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
        >
          <Plus size={14} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

function RoomOptionCard({ room, locale, selected, onSelect }: { room: HotelRoom; locale: Locale; selected: boolean; onSelect: () => void }) {
  const t = useTranslations("bookingRequest");
  const visibleFeatures = room.features.slice(0, 3);
  const extraCount = room.features.length - visibleFeatures.length;

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={!room.isAvailable}
      aria-pressed={selected}
      className={`flex w-full items-start gap-3 rounded-2xl border p-3.5 text-start transition-all duration-200 ${
        !room.isAvailable
          ? "cursor-not-allowed border-ink/8 opacity-50 dark:border-white/10"
          : selected
            ? "border-primary bg-primary/5 dark:bg-primary/10"
            : "border-ink/12 hover:border-primary/40 dark:border-white/15"
      }`}
    >
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink/5 dark:bg-white/10">
        {room.image ? (
          <Image src={room.image} alt={room.name} fill sizes="64px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink/25 dark:text-white/25">
            <BedDouble size={22} aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-bold">{room.name}</p>
          <span className="inline-flex items-center rounded-full bg-ink/8 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink/60 dark:bg-white/10 dark:text-sand/60">
            {roomTypeLabel(room.roomType, locale)}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink/55 dark:text-sand/55">
          <span className="inline-flex items-center gap-1">
            <Users size={12} aria-hidden="true" /> {t("guestsCount", { count: room.maxGuests })}
          </span>
          {room.bedType && (
            <span className="inline-flex items-center gap-1">
              <BedDouble size={12} aria-hidden="true" /> {room.bedType}
            </span>
          )}
        </div>

        {visibleFeatures.length > 0 && (
          <ul className="mt-1.5 flex flex-wrap gap-1.5">
            {visibleFeatures.map((f) => {
              const Icon = amenityIcon(f);
              return (
                <li
                  key={f}
                  className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-medium text-ink/60 dark:bg-white/10 dark:text-sand/60"
                >
                  <Icon size={10} aria-hidden="true" />
                  {f}
                </li>
              );
            })}
            {extraCount > 0 && (
              <li className="inline-flex items-center rounded-full bg-ink/5 px-2 py-0.5 text-[10px] font-medium text-ink/50 dark:bg-white/10 dark:text-sand/50">
                {t("moreFeaturesCount", { count: extraCount })}
              </li>
            )}
          </ul>
        )}

        <div className="mt-2 flex items-center justify-between">
          {room.pricePerNight ? (
            <p className="text-sm font-bold text-primary-700">
              {room.discountPrice ? (
                <>
                  {money(room.discountPrice)}
                  <span className="ms-1.5 text-xs font-medium text-ink/40 line-through dark:text-sand/40">{money(room.pricePerNight)}</span>
                </>
              ) : (
                money(room.pricePerNight)
              )}
              <span className="ms-1 text-xs font-medium text-ink/45 dark:text-sand/45">/night</span>
            </p>
          ) : (
            <p className="text-xs font-semibold text-ink/40 dark:text-sand/40">{t("contactForPricing")}</p>
          )}
          <span className={`text-[11px] font-semibold ${room.isAvailable ? "text-accent-700 dark:text-accent-400" : "text-red-500"}`}>
            {room.isAvailable ? t("availableBadge") : t("unavailableBadge")}
          </span>
        </div>
      </div>
    </button>
  );
}

function SummaryLine({ label, value, bold = false }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm">
      <span className={bold ? "font-bold" : "text-ink/60 dark:text-sand/60"}>{label}</span>
      <span className={bold ? "font-bold" : "font-medium"}>{value}</span>
    </div>
  );
}

/**
 * Shared core of the booking flow — dates/guests/room selection, guest
 * info, live price summary, submit. Rendered two ways: inside the fixed
 * modal chrome (components/shared/booking-request-modal.tsx, kept for the
 * quick-book entry points — per-room cards, the mobile sticky bar) and
 * directly on the page at /hotels/[slug]/book (the two primary "Book Now"
 * CTAs — the hotel action bar and the sidebar booking card — navigate
 * there instead of opening the modal). Same validation, same
 * submitBookingRequest call, so behavior can't drift between the two.
 */
export function BookingForm({
  locale,
  hotelId,
  hotelName,
  hotelRating,
  rooms = [],
  preselectedRoomId,
  whatsappNumber,
  onClose,
  onSuccess,
}: {
  locale: Locale;
  hotelId: string;
  hotelName: string;
  hotelRating?: number;
  rooms?: HotelRoom[];
  preselectedRoomId?: string;
  whatsappNumber?: string;
  /** Modal usage only — omit on the dedicated page. */
  onClose?: () => void;
  onSuccess?: () => void;
}) {
  const t = useTranslations("bookingRequest");

  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestCountry, setGuestCountry] = useState("");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [roomsCount, setRoomsCount] = useState(1);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomId, setRoomId] = useState(preselectedRoomId ?? "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [bookingReference, setBookingReference] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedRoom = rooms.find((r) => r.id === roomId);
  const nights = useMemo(() => nightsBetween(checkIn, checkOut), [checkIn, checkOut]);
  const subtotal = useMemo(() => computeSubtotal(selectedRoom, checkIn, checkOut, roomsCount), [selectedRoom, checkIn, checkOut, roomsCount]);
  const effectiveNightlyRate = selectedRoom ? (selectedRoom.discountPrice ?? selectedRoom.pricePerNight ?? 0) : 0;
  // No tax system is configured yet — kept as an explicit, honest $0 line
  // rather than a fabricated rate, ready to wire up once one exists.
  const taxes = 0;
  const total = subtotal + taxes;

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!guestName.trim() || !guestPhone.trim()) {
      setError(t("required"));
      return;
    }
    if (!checkIn || !checkOut) {
      setError(t("required"));
      return;
    }
    if (checkOut <= checkIn) {
      setError(t("invalidRange"));
      return;
    }
    if (selectedRoom && !selectedRoom.isAvailable) {
      setError(t("roomUnavailable"));
      return;
    }

    startTransition(async () => {
      const result = await submitBookingRequest({
        hotelId,
        roomId: roomId || undefined,
        guestName,
        guestPhone,
        guestEmail: guestEmail || undefined,
        guestCountry: guestCountry || undefined,
        adults,
        children,
        roomsCount,
        checkIn,
        checkOut,
        notes: notes || undefined,
        locale,
      });

      if (!result.ok) {
        setError(result.error || t("error"));
        return;
      }

      if (whatsappNumber) {
        const message = buildWhatsAppBookingMessage({
          hotelName,
          roomName: selectedRoom?.name,
          checkIn,
          checkOut,
          nights,
          adults,
          children,
          roomsCount,
          guestName,
          guestPhone,
          guestEmail: guestEmail || undefined,
          specialRequests: notes || undefined,
          bookingReference: result.bookingReference,
        });
        window.open(toWhatsAppHref(whatsappNumber, message), "_blank", "noopener,noreferrer");
      }

      setBookingReference(result.bookingReference);
      setSent(true);
      onSuccess?.();
    });
  }

  if (sent) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent-600">
          <CheckCircle2 size={34} aria-hidden="true" />
        </div>
        <h3 className="font-display text-2xl font-bold">{t("successTitle")}</h3>
        <p className="max-w-md text-sm leading-relaxed text-ink/60 dark:text-sand/60">
          {whatsappNumber ? t("successWhatsapp") : t("successBody", { name: hotelName })}
        </p>
        {bookingReference && (
          <p className="rounded-full bg-ink/5 px-4 py-1.5 text-xs font-bold tracking-wide dark:bg-white/10">{bookingReference}</p>
        )}
        <div className="mt-2 flex w-full max-w-xs flex-col gap-2.5 sm:flex-row">
          <Link
            href={`/${locale}/dashboard?tab=bookings`}
            className="inline-flex flex-1 items-center justify-center rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
          >
            {t("viewMyBookings")}
          </Link>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-ink/15 px-5 py-3 text-sm font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
            >
              {t("close")}
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-1 flex-col overflow-hidden lg:flex-row">
      <div className="flex-1 space-y-6 overflow-y-auto p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="font-display text-lg font-bold sm:text-xl">{hotelName}</h2>
          {typeof hotelRating === "number" && hotelRating > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary-800">
              <Star size={12} fill="currentColor" aria-hidden="true" />
              {hotelRating.toFixed(1)}
            </span>
          )}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
              selectedRoom && !selectedRoom.isAvailable
                ? "bg-red-100 text-red-700 dark:bg-red-400/15 dark:text-red-300"
                : "bg-accent/10 text-accent-700 dark:bg-accent/15 dark:text-accent-400"
            }`}
          >
            <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
            {selectedRoom && !selectedRoom.isAvailable ? t("statusUnavailable") : t("statusAccepting")}
          </span>
        </div>

        {rooms.length > 0 && (
          <section>
            <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink/50 dark:text-sand/50">{t("roomSectionTitle")}</h3>
            <div className="space-y-2.5">
              {rooms.map((room) => (
                <RoomOptionCard key={room.id} room={room} locale={locale} selected={roomId === room.id} onSelect={() => setRoomId(room.id === roomId ? "" : room.id)} />
              ))}
            </div>
          </section>
        )}

        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink/50 dark:text-sand/50">{t("guestSectionTitle")}</h3>
          <div className="space-y-3">
            <label htmlFor="booking-guest-name" className="sr-only">{t("guestNameLabel")}</label>
            <input
              id="booking-guest-name"
              required
              placeholder={t("guestNameLabel")}
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className={inputClass}
            />
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="booking-guest-phone" className="sr-only">{t("guestPhoneLabel")}</label>
                <input
                  id="booking-guest-phone"
                  required
                  type="tel"
                  placeholder={t("guestPhoneLabel")}
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="booking-guest-email" className="sr-only">{t("guestEmailLabel")}</label>
                <input
                  id="booking-guest-email"
                  type="email"
                  placeholder={t("guestEmailLabel")}
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <div>
              <label htmlFor="booking-guest-country" className="sr-only">{t("guestCountryLabel")}</label>
              <input
                id="booking-guest-country"
                placeholder={t("guestCountryLabel")}
                value={guestCountry}
                onChange={(e) => setGuestCountry(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink/50 dark:text-sand/50">{t("detailsSectionTitle")}</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink/50 dark:text-sand/50">{t("checkInLabel")}</label>
              <input
                required
                type="date"
                min={todayIso()}
                value={checkIn}
                onChange={(e) => {
                  const next = e.target.value;
                  setCheckIn(next);
                  if (checkOut && checkOut <= next) setCheckOut(addDaysIso(next, 1));
                }}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink/50 dark:text-sand/50">{t("checkOutLabel")}</label>
              <input
                required
                type="date"
                min={checkIn ? addDaysIso(checkIn, 1) : todayIso()}
                value={checkOut}
                onChange={(e) => setCheckOut(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
          {nights > 0 && <p className="mt-2 text-xs font-semibold text-primary-700">{t("nightsCount", { count: nights })}</p>}

          <div className="mt-4 grid gap-2.5 sm:grid-cols-3">
            <Stepper label={t("adultsLabel")} value={adults} min={1} onChange={setAdults} />
            <Stepper label={t("childrenLabel")} value={children} min={0} onChange={setChildren} />
            <Stepper label={t("roomsLabel")} value={roomsCount} min={1} onChange={setRoomsCount} />
          </div>
        </section>

        <section>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-ink/50 dark:text-sand/50">{t("requestsSectionTitle")}</h3>
          <label htmlFor="booking-notes" className="sr-only">{t("requestsPlaceholder")}</label>
          <textarea
            id="booking-notes"
            rows={4}
            placeholder={t("requestsPlaceholder")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className={inputClass}
          />
        </section>
      </div>

      <aside className="shrink-0 border-t border-ink/8 bg-ink/[0.02] p-5 dark:border-white/10 dark:bg-white/[0.03] sm:p-6 lg:w-[340px] lg:overflow-y-auto lg:border-t-0 lg:border-s">
        <h3 className="mb-3 font-display text-base font-bold">{t("summaryTitle")}</h3>
        <div className="space-y-2 rounded-2xl border border-ink/8 bg-white p-4 dark:border-white/10 dark:bg-ink/60">
          <SummaryLine label={t("summaryHotel")} value={hotelName} />
          <SummaryLine label={t("summaryRoom")} value={selectedRoom?.name ?? t("anyRoom")} />
          <SummaryLine label={t("checkInLabel")} value={checkIn || "—"} />
          <SummaryLine label={t("checkOutLabel")} value={checkOut || "—"} />
          <SummaryLine label={t("summaryNights")} value={String(nights)} />
          <SummaryLine label={t("adultsLabel")} value={String(adults)} />
          <SummaryLine label={t("childrenLabel")} value={String(children)} />
          <SummaryLine label={t("roomsLabel")} value={String(roomsCount)} />
          <div className="my-2 border-t border-dashed border-ink/10 dark:border-white/15" />
          <SummaryLine label={t("summaryPricePerNight")} value={effectiveNightlyRate ? money(effectiveNightlyRate) : "—"} />
          <SummaryLine label={t("summaryTaxes")} value={money(taxes)} />
          <div className="my-2 border-t border-ink/10 dark:border-white/15" />
          <SummaryLine label={t("summaryTotal")} value={money(total)} bold />
        </div>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:opacity-70"
        >
          {isPending && <Loader2 size={15} className="animate-spin" />}
          {isPending ? t("submitting") : t("submit")}
        </button>
      </aside>
    </form>
  );
}
