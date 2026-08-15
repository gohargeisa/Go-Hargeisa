"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { updateRecord } from "@/lib/actions/admin";

export interface RestaurantOrderingSettingsInitial {
  reservable: boolean;
  onlineOrderingEnabled: boolean;
  onlineOrderUrl: string;
  phoneOrderingEnabled: boolean;
}

/**
 * Restaurant-only Reservations & Ordering settings — the business-dashboard
 * equivalent of HotelBookingSettingsForm, following the exact same pattern
 * (column-driven, generic updateRecord action, no per-restaurant branching).
 * Table Reservations, Online Ordering, and Phone Ordering are three
 * independent booleans (restaurants.reservable/online_ordering_enabled/
 * phone_ordering_enabled) — any combination, including all off, is valid.
 * The public restaurant page (lib/utils/restaurant-cta.ts +
 * restaurant.reservable) reads these same columns directly, so a change here
 * is reflected immediately with no separate "publish" step.
 */
export function RestaurantOrderingSettingsForm({
  restaurantId,
  initial,
  currentPath,
}: {
  restaurantId: string;
  initial: RestaurantOrderingSettingsInitial;
  currentPath: string;
}) {
  const t = useTranslations("businessDashboard");
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof RestaurantOrderingSettingsInitial>(key: K, value: RestaurantOrderingSettingsInitial[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload = {
      reservable: form.reservable,
      online_ordering_enabled: form.onlineOrderingEnabled,
      online_order_url: form.onlineOrderUrl || null,
      phone_ordering_enabled: form.phoneOrderingEnabled,
    };

    startTransition(async () => {
      const result = await updateRecord("restaurants", restaurantId, payload, [currentPath], currentPath);
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
        <h2 className="font-display text-lg font-bold">{t("orderingSettingsTitle")}</h2>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("orderingSettingsSubtitle")}</p>
      </div>

      <label className="flex items-start gap-3 rounded-2xl border border-ink/12 p-4 dark:border-white/15">
        <input
          type="checkbox"
          checked={form.reservable}
          onChange={(e) => update("reservable", e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0"
        />
        <span>
          <span className="block font-semibold">{t("tableReservationsLabel")}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-ink/55 dark:text-sand/55">
            {t("tableReservationsDescription")}
          </span>
        </span>
      </label>

      <label className="flex items-start gap-3 rounded-2xl border border-ink/12 p-4 dark:border-white/15">
        <input
          type="checkbox"
          checked={form.onlineOrderingEnabled}
          onChange={(e) => update("onlineOrderingEnabled", e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0"
        />
        <span>
          <span className="block font-semibold">{t("onlineOrderingLabel")}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-ink/55 dark:text-sand/55">
            {t("onlineOrderingDescription")}
          </span>
        </span>
      </label>

      {form.onlineOrderingEnabled && (
        <div className="ms-4">
          <label className="mb-1.5 block text-sm font-semibold">{t("onlineOrderingUrlLabel")}</label>
          <input
            type="url"
            value={form.onlineOrderUrl}
            onChange={(e) => update("onlineOrderUrl", e.target.value)}
            className={inputClass}
            placeholder="https://…"
          />
        </div>
      )}

      <label className="flex items-start gap-3 rounded-2xl border border-ink/12 p-4 dark:border-white/15">
        <input
          type="checkbox"
          checked={form.phoneOrderingEnabled}
          onChange={(e) => update("phoneOrderingEnabled", e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0"
        />
        <span>
          <span className="block font-semibold">{t("phoneOrderingLabel")}</span>
          <span className="mt-0.5 block text-xs leading-relaxed text-ink/55 dark:text-sand/55">
            {t("phoneOrderingDescription")}
          </span>
        </span>
      </label>

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
