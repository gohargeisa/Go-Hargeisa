"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, X } from "lucide-react";
import { submitBookingRequest } from "@/lib/actions/bookings";
import type { HotelRoom } from "@/types";

const inputClass =
  "w-full rounded-xl border border-ink/12 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15";

export function BookingRequestModal({
  hotelId,
  hotelName,
  rooms = [],
  preselectedRoomId,
  onClose,
}: {
  hotelId: string;
  hotelName: string;
  rooms?: HotelRoom[];
  preselectedRoomId?: string;
  onClose: () => void;
}) {
  const t = useTranslations("bookingRequest");
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestsCount, setGuestsCount] = useState(1);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [roomId, setRoomId] = useState(preselectedRoomId ?? "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!guestName.trim() || !checkIn || !checkOut) {
      setError(t("required"));
      return;
    }
    startTransition(async () => {
      const result = await submitBookingRequest({
        hotelId,
        roomId: roomId || undefined,
        guestName,
        guestPhone: guestPhone || undefined,
        guestEmail: guestEmail || undefined,
        guestsCount,
        checkIn,
        checkOut,
        notes: notes || undefined,
      });
      if (result.ok) setSent(true);
      else setError(result.error || t("error"));
    });
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={t("modalTitle")}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl dark:bg-ink"
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-display text-lg font-bold">{t("modalTitle")}</h3>
            <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("modalSubtitle", { name: hotelName })}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/5 dark:bg-white/10"
          >
            <X size={16} aria-hidden="true" />
          </button>
        </div>

        {sent ? (
          <p className="rounded-xl2 border border-accent/30 bg-accent/5 p-4 text-sm text-accent-700">
            {t("success", { name: hotelName })}
          </p>
        ) : (
          <form onSubmit={onSubmit} className="space-y-3">
            <input
              required
              placeholder={t("guestNameLabel")}
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className={inputClass}
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="tel"
                placeholder={t("guestPhoneLabel")}
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
                className={inputClass}
              />
              <input
                type="number"
                min={1}
                placeholder={t("guestsCountLabel")}
                value={guestsCount}
                onChange={(e) => setGuestsCount(Number(e.target.value) || 1)}
                className={inputClass}
              />
            </div>
            <input
              type="email"
              placeholder={t("guestEmailLabel")}
              value={guestEmail}
              onChange={(e) => setGuestEmail(e.target.value)}
              className={inputClass}
            />
            {rooms.length > 0 && (
              <select value={roomId} onChange={(e) => setRoomId(e.target.value)} className={inputClass}>
                <option value="">{t("anyRoom")}</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/50 dark:text-sand/50">
                  {t("checkInLabel")}
                </label>
                <input
                  required
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-ink/50 dark:text-sand/50">
                  {t("checkOutLabel")}
                </label>
                <input
                  required
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>
            <textarea
              rows={2}
              placeholder={t("notesLabel")}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />

            {error && <p className="text-sm text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={isPending}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-70"
            >
              {isPending && <Loader2 size={14} className="animate-spin" />}
              {isPending ? t("submitting") : t("submit")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
