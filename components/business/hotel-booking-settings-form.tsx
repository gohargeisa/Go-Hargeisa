"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { updateRecord } from "@/lib/actions/admin";
import type { HotelBookingMode, HotelExternalBookingOption } from "@/types";

export interface HotelBookingSettingsInitial {
  bookingMode: HotelBookingMode;
  externalBookingOption: HotelExternalBookingOption | "";
  externalBookingUrl: string;
  bookingWhatsapp: string;
  bookingComUrl: string;
  website: string;
}

const EXTERNAL_OPTIONS: HotelExternalBookingOption[] = ["website", "booking_com", "whatsapp", "custom_url"];

/**
 * Hotel-only Booking Settings — lets a hotel owner (or, via the identical
 * fields in components/admin/hotel-form.tsx, the platform owner as an
 * override) switch between Go Hargeisa's own booking-request flow and
 * redirecting guests to an external channel. Column-driven (hotels.booking_mode
 * etc.) — no per-hotel code branching, so this scales to any number of
 * hotels. Reuses the same generic updateRecord action every other business
 * dashboard form already uses.
 */
export function HotelBookingSettingsForm({
  hotelId,
  initial,
  currentPath,
}: {
  hotelId: string;
  initial: HotelBookingSettingsInitial;
  currentPath: string;
}) {
  const t = useTranslations("businessDashboard");
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof HotelBookingSettingsInitial>(key: K, value: HotelBookingSettingsInitial[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      booking_mode: form.bookingMode,
      external_booking_option: form.bookingMode === "external" ? form.externalBookingOption || null : null,
      external_booking_url: form.externalBookingUrl || null,
      booking_whatsapp: form.bookingWhatsapp || null,
      booking_com_url: form.bookingComUrl || null,
      website: form.website || null,
    };

    startTransition(async () => {
      const result = await updateRecord("hotels", hotelId, payload, [currentPath], currentPath);
      if (result && !result.ok) setError(result.error ?? "Something went wrong.");
    });
  }

  const inputClass =
    "w-full rounded-xl border border-ink/12 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15";

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-5 rounded-2xl border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03] sm:p-6"
    >
      <div>
        <h2 className="font-display text-lg font-bold">{t("bookingSettingsTitle")}</h2>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("bookingSettingsSubtitle")}</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {(["go_hargeisa", "external"] as HotelBookingMode[]).map((mode) => {
          const active = form.bookingMode === mode;
          return (
            <button
              key={mode}
              type="button"
              onClick={() => update("bookingMode", mode)}
              aria-pressed={active}
              className={`rounded-2xl border p-4 text-start transition-all duration-200 ${
                active
                  ? "border-primary bg-primary/5 dark:bg-primary/10"
                  : "border-ink/12 hover:border-ink/25 dark:border-white/15"
              }`}
            >
              <div className="flex items-center gap-2">
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    active ? "border-primary bg-primary text-white" : "border-ink/25 dark:border-white/25"
                  }`}
                >
                  {active && <Check size={12} aria-hidden="true" />}
                </span>
                <span className="font-semibold">
                  {mode === "go_hargeisa" ? t("bookingModeGoHargeisa") : t("bookingModeExternal")}
                </span>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-ink/55 dark:text-sand/55">
                {mode === "go_hargeisa" ? t("bookingModeGoHargeisaDescription") : t("bookingModeExternalDescription")}
              </p>
            </button>
          );
        })}
      </div>

      {form.bookingMode === "external" && (
        <div className="space-y-4 rounded-2xl border border-ink/8 p-4 dark:border-white/10">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">{t("externalBookingOptionLabel")}</label>
            <select
              value={form.externalBookingOption}
              onChange={(e) => update("externalBookingOption", e.target.value as HotelExternalBookingOption)}
              className={inputClass}
            >
              <option value="">—</option>
              {EXTERNAL_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {t(`externalOption_${option}`)}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">{t("websiteLabel")}</label>
              <input value={form.website} onChange={(e) => update("website", e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">{t("bookingComUrlLabel")}</label>
              <input
                value={form.bookingComUrl}
                onChange={(e) => update("bookingComUrl", e.target.value)}
                className={inputClass}
                placeholder="https://www.booking.com/hotel/…"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">{t("bookingWhatsappLabel")}</label>
              <input
                value={form.bookingWhatsapp}
                onChange={(e) => update("bookingWhatsapp", e.target.value)}
                className={inputClass}
                placeholder="+252 63 …"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold">{t("externalBookingUrlLabel")}</label>
              <input
                value={form.externalBookingUrl}
                onChange={(e) => update("externalBookingUrl", e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-70"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />} {t("saveChanges")}
      </button>
    </form>
  );
}
