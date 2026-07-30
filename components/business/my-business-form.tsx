"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus, X } from "lucide-react";
import { updateRecord } from "@/lib/actions/admin";
import { ImageUploader } from "@/components/shared/image-uploader";
import type { BusinessListingType } from "@/types";

const TABLE_BY_TYPE: Record<BusinessListingType, "hotels" | "restaurants" | "cafes" | "services"> = {
  hotel: "hotels",
  restaurant: "restaurants",
  cafe: "cafes",
  service: "services",
};

export interface MyBusinessFormInitial {
  name: string;
  shortDescription: string;
  description: string;
  address: string;
  phone: string;
  website: string;
  checkInTime?: string;
  checkOutTime?: string;
  openingHours?: string;
  menuHighlights?: { name: string; price: string; description?: string }[];
  menuPdfUrl?: string;
}

/** Core-info editor reusing the same generic updateRecord server action every admin form already uses — new presentation, reused logic. */
export function MyBusinessForm({
  listingType,
  listingId,
  initial,
  currentPath,
}: {
  listingType: BusinessListingType;
  listingId: string;
  initial: MyBusinessFormInitial;
  currentPath: string;
}) {
  const t = useTranslations("businessDashboard");
  const [form, setForm] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof MyBusinessFormInitial>(key: K, value: MyBusinessFormInitial[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addMenuItem() {
    update("menuHighlights", [...(form.menuHighlights ?? []), { name: "", price: "" }]);
  }
  function updateMenuItem(i: number, patch: Partial<{ name: string; price: string; description?: string }>) {
    update(
      "menuHighlights",
      (form.menuHighlights ?? []).map((item, idx) => (idx === i ? { ...item, ...patch } : item))
    );
  }
  function removeMenuItem(i: number) {
    update("menuHighlights", (form.menuHighlights ?? []).filter((_, idx) => idx !== i));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const payload: Record<string, unknown> = {
      name: form.name,
      short_description: form.shortDescription,
      description: form.description,
      address: form.address,
      phone: form.phone || null,
    };
    if (listingType === "hotel") {
      payload.website = form.website || null;
      payload.check_in_time = form.checkInTime || null;
      payload.check_out_time = form.checkOutTime || null;
    } else if (listingType === "restaurant") {
      payload.website = form.website || null;
      payload.opening_hours = form.openingHours || null;
      payload.menu = form.menuHighlights ?? [];
      payload.menu_pdf_url = form.menuPdfUrl || null;
    } else {
      payload.opening_hours = form.openingHours || null;
      payload.menu = form.menuHighlights ?? [];
      payload.menu_pdf_url = form.menuPdfUrl || null;
    }

    startTransition(async () => {
      // On success updateRecord redirects server-side (to this same page,
      // since currentPath is both the revalidate target and redirectTo) and
      // never returns here — only the failure path reaches this line.
      const result = await updateRecord(TABLE_BY_TYPE[listingType], listingId, payload, [currentPath], currentPath);
      if (result && !result.ok) setError(result.error ?? "Something went wrong.");
    });
  }

  const inputClass =
    "w-full rounded-xl border border-ink/12 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/15";

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 rounded-2xl border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03] sm:p-6"
    >
      <div>
        <label className="mb-1.5 block text-sm font-semibold">{t("businessName")}</label>
        <input required value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">{t("shortDescription")}</label>
        <input
          required
          value={form.shortDescription}
          onChange={(e) => update("shortDescription", e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">{t("fullDescription")}</label>
        <textarea
          required
          rows={4}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          className={inputClass}
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-semibold">{t("addressLabel")}</label>
        <input required value={form.address} onChange={(e) => update("address", e.target.value)} className={inputClass} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t("phoneLabel")}</label>
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass} />
        </div>
        {listingType !== "cafe" && (
          <div>
            <label className="mb-1.5 block text-sm font-semibold">{t("websiteLabel")}</label>
            <input value={form.website} onChange={(e) => update("website", e.target.value)} className={inputClass} />
          </div>
        )}
      </div>

      {listingType === "hotel" ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">{t("checkIn")}</label>
            <input
              value={form.checkInTime ?? ""}
              onChange={(e) => update("checkInTime", e.target.value)}
              className={inputClass}
              placeholder="14:00"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-semibold">{t("checkOut")}</label>
            <input
              value={form.checkOutTime ?? ""}
              onChange={(e) => update("checkOutTime", e.target.value)}
              className={inputClass}
              placeholder="12:00"
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t("openingHoursLabel")}</label>
          <input
            value={form.openingHours ?? ""}
            onChange={(e) => update("openingHours", e.target.value)}
            className={inputClass}
            placeholder="9:00 AM – 10:00 PM"
          />
        </div>
      )}

      {listingType !== "hotel" && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-semibold">{t("menuHighlightsLabel")}</label>
            <button
              type="button"
              onClick={addMenuItem}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary"
            >
              <Plus size={13} /> {t("addItemLabel")}
            </button>
          </div>
          <div className="space-y-2">
            {(form.menuHighlights ?? []).map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={item.name}
                  onChange={(e) => updateMenuItem(i, { name: e.target.value })}
                  placeholder={t("dishNamePlaceholder")}
                  className={inputClass}
                />
                <input
                  value={item.price}
                  onChange={(e) => updateMenuItem(i, { price: e.target.value })}
                  placeholder="$8"
                  className={`${inputClass} w-24 shrink-0`}
                />
                <button
                  type="button"
                  onClick={() => removeMenuItem(i)}
                  aria-label={t("removeMenuItemAriaLabel")}
                  className="shrink-0 text-ink/40 hover:text-red-500"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4">
            <ImageUploader
              folder={TABLE_BY_TYPE[listingType]}
              value={form.menuPdfUrl ?? ""}
              onChange={(url) => update("menuPdfUrl", url)}
              label={t("menuPdfLabel")}
            />
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
