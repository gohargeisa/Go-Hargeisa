"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2, Minus, Plus, Users } from "lucide-react";
import { submitTableReservation } from "@/lib/actions/reservations";

const inputClass =
  "w-full rounded-xl border border-ink/12 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15";

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Mirrors the server-side cap in submit_table_reservation() — a fixed
 * platform sanity limit, not a per-business setting (none exists yet). */
const MAX_GUESTS = 50;

function GuestStepper({ value, onChange, label }: { value: number; onChange: (next: number) => void; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-ink/12 px-4 py-3 dark:border-white/15">
      <span className="flex items-center gap-2 text-sm font-medium">
        <Users size={15} className="text-ink/45 dark:text-sand/45" aria-hidden="true" />
        {label}
      </span>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(1, value - 1))}
          disabled={value <= 1}
          aria-label="-"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink/60 transition-colors hover:border-primary hover:text-primary disabled:opacity-30 dark:border-white/20 dark:text-sand/60"
        >
          <Minus size={13} aria-hidden="true" />
        </button>
        <span className="w-5 text-center text-sm font-bold">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(MAX_GUESTS, value + 1))}
          disabled={value >= MAX_GUESTS}
          aria-label="+"
          className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/15 text-ink/60 transition-colors hover:border-primary hover:text-primary disabled:opacity-30 dark:border-white/20 dark:text-sand/60"
        >
          <Plus size={13} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

/**
 * Reusable table-reservation REQUEST form — generic over listingType/
 * listingId, so the exact same component drives Sultan's, Beydan's (once
 * enabled), and every future restaurant/cafe's "Reserve a Table" flow. No
 * business-specific branching anywhere in here; eligibility (published +
 * reservable=true) is enforced server-side by submit_table_reservation(),
 * not by this component.
 */
export function TableReservationForm({
  listingType,
  listingId,
  locale,
  variant = "table",
  onClose,
}: {
  listingType: "restaurant" | "cafe" | "service";
  listingId: string;
  locale: string;
  variant?: "table" | "viewing";
  onClose?: () => void;
}) {
  const t = useTranslations(variant === "viewing" ? "propertyViewing" : "tableReservation");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [reservationDate, setReservationDate] = useState("");
  const [reservationTime, setReservationTime] = useState("");
  const [guestsCount, setGuestsCount] = useState(2);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [reference, setReference] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!customerName.trim() || !customerPhone.trim()) {
      setError(t("errorRequired"));
      return;
    }
    if (!reservationDate || !reservationTime) {
      setError(t("errorRequired"));
      return;
    }

    startTransition(async () => {
      const result = await submitTableReservation({
        listingType,
        listingId,
        customerName,
        customerPhone,
        reservationDate,
        reservationTime,
        guestsCount,
        notes: notes || undefined,
        locale,
      });

      if (!result.ok) {
        setError(result.error || t("errorGeneric"));
        return;
      }

      setReference(result.reservationReference);
      setSent(true);
    });
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-4 p-8 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 text-accent-600">
          <CheckCircle2 size={34} aria-hidden="true" />
        </div>
        <h3 className="font-display text-2xl font-bold">{t("successTitle")}</h3>
        <p className="max-w-md text-sm leading-relaxed text-ink/60 dark:text-sand/60">{t("successBody")}</p>
        {reference && (
          <p className="rounded-full bg-ink/5 px-4 py-1.5 text-xs font-bold tracking-wide dark:bg-white/10">{reference}</p>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="mt-2 inline-flex items-center justify-center rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
          >
            {t("close")}
          </button>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 p-1">
      <div>
        <label htmlFor="reservation-name" className="sr-only">
          {t("nameLabel")}
        </label>
        <input
          id="reservation-name"
          required
          placeholder={t("nameLabel")}
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="reservation-phone" className="sr-only">
          {t("phoneLabel")}
        </label>
        <input
          id="reservation-phone"
          required
          type="tel"
          placeholder={t("phoneLabel")}
          value={customerPhone}
          onChange={(e) => setCustomerPhone(e.target.value)}
          className={inputClass}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink/50 dark:text-sand/50">{t("dateLabel")}</label>
          <input
            required
            type="date"
            min={todayIso()}
            value={reservationDate}
            onChange={(e) => setReservationDate(e.target.value)}
            className={inputClass}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink/50 dark:text-sand/50">{t("timeLabel")}</label>
          <input
            required
            type="time"
            value={reservationTime}
            onChange={(e) => setReservationTime(e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <GuestStepper label={t("guestsLabel")} value={guestsCount} onChange={setGuestsCount} />

      <div>
        <label htmlFor="reservation-notes" className="sr-only">
          {t("notesLabel")}
        </label>
        <textarea
          id="reservation-notes"
          rows={3}
          placeholder={t("notesLabel")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className={inputClass}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-bold text-white transition-colors hover:bg-primary-700 disabled:opacity-70"
      >
        {isPending && <Loader2 size={15} className="animate-spin" />}
        {isPending ? t("submitting") : t("submit")}
      </button>
    </form>
  );
}
