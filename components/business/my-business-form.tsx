"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus, X } from "lucide-react";
import { updateRecord } from "@/lib/actions/admin";
import { ImageUploader } from "@/components/shared/image-uploader";
import { OpeningHoursEditor } from "@/components/shared/opening-hours-editor";
import type { BusinessListingType, OpeningHoursGroup } from "@/types";

const TABLE_BY_TYPE: Record<BusinessListingType, "hotels" | "restaurants" | "cafes" | "services"> = {
  hotel: "hotels",
  restaurant: "restaurants",
  cafe: "cafes",
  service: "services",
};

/** whatsapp/email/social columns exist on all four listing tables (services
 * gained them in the Phase 9 CMS expansion) — price_range is the one field
 * among this group that services genuinely doesn't have. */
const HAS_PRICE_RANGE: Record<BusinessListingType, boolean> = {
  hotel: true,
  restaurant: true,
  cafe: true,
  service: false,
};

export interface MyBusinessFormInitial {
  name: string;
  shortDescription: string;
  description: string;
  address: string;
  phone: string;
  website: string;
  whatsapp?: string;
  email?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  googleMapsUrl?: string;
  priceRange?: "$" | "$$" | "$$$" | "$$$$";
  checkInTime?: string;
  checkOutTime?: string;
  openingHours?: string;
  openingHoursStructured?: OpeningHoursGroup[];
  menuHighlights?: { name: string; price: string; description?: string }[];
  menuPdfUrl?: string;
}

const PRICE_LEVELS: NonNullable<MyBusinessFormInitial["priceRange"]>[] = ["$", "$$", "$$$", "$$$$"];

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
  const tw = useTranslations("weekdays");
  const [form, setForm] = useState<MyBusinessFormInitial>({
    ...initial,
    priceRange: initial.priceRange ?? "$$",
    openingHoursStructured: initial.openingHoursStructured ?? [],
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasPriceRange = HAS_PRICE_RANGE[listingType];

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
    payload.whatsapp = form.whatsapp || null;
    payload.email = form.email || null;
    payload.social_instagram = form.socialInstagram || null;
    payload.social_facebook = form.socialFacebook || null;
    payload.google_maps_url = form.googleMapsUrl || null;
    if (hasPriceRange) payload.price_range = form.priceRange;
    // cafes has no `website` column at all — every other type does.
    if (listingType !== "cafe") payload.website = form.website || null;

    if (listingType === "hotel") {
      payload.check_in_time = form.checkInTime || null;
      payload.check_out_time = form.checkOutTime || null;
    } else if (listingType === "restaurant") {
      payload.opening_hours = form.openingHours || null;
      payload.opening_hours_structured = form.openingHoursStructured ?? [];
      payload.menu = form.menuHighlights ?? [];
      payload.menu_pdf_url = form.menuPdfUrl || null;
    } else if (listingType === "cafe") {
      payload.opening_hours = form.openingHours || null;
      payload.opening_hours_structured = form.openingHoursStructured ?? [];
      payload.menu = form.menuHighlights ?? [];
      payload.menu_pdf_url = form.menuPdfUrl || null;
    } else {
      payload.opening_hours = form.openingHours || null;
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

      <div>
        <label className="mb-1.5 block text-sm font-semibold">{t("mapsUrlLabel")}</label>
        <input
          type="url"
          value={form.googleMapsUrl ?? ""}
          onChange={(e) => update("googleMapsUrl", e.target.value)}
          className={inputClass}
          placeholder="https://maps.google.com/?q=…"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t("whatsappLabel")}</label>
          <input value={form.whatsapp ?? ""} onChange={(e) => update("whatsapp", e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t("emailLabel")}</label>
          <input type="email" value={form.email ?? ""} onChange={(e) => update("email", e.target.value)} className={inputClass} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t("socialInstagramLabel")}</label>
          <input type="url" value={form.socialInstagram ?? ""} onChange={(e) => update("socialInstagram", e.target.value)} className={inputClass} placeholder="https://instagram.com/…" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t("socialFacebookLabel")}</label>
          <input type="url" value={form.socialFacebook ?? ""} onChange={(e) => update("socialFacebook", e.target.value)} className={inputClass} placeholder="https://facebook.com/…" />
        </div>
      </div>

      {hasPriceRange && (
        <div>
          <label className="mb-1.5 block text-sm font-semibold">{t("priceRangeLabel")}</label>
          <div className="grid grid-cols-4 gap-2">
            {PRICE_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => update("priceRange", level)}
                className={`rounded-xl border py-2 text-center font-display text-sm font-bold transition-colors ${
                  form.priceRange === level
                    ? "border-primary bg-primary/8 text-primary-800"
                    : "border-ink/12 text-ink/60 hover:border-primary/40 dark:border-white/15 dark:text-sand/60"
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>
      )}

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

      {(listingType === "restaurant" || listingType === "cafe") && (
        <OpeningHoursEditor
          value={form.openingHoursStructured ?? []}
          onChange={(v) => update("openingHoursStructured", v)}
          dayLabel={tw}
          title={t("openingHoursByDay")}
          addLabel={t("addHoursGroupLabel")}
          openLabel={t("hoursOpenLabel")}
          closeLabel={t("hoursCloseLabel")}
          removeAriaLabel={t("removeHoursGroupAriaLabel")}
        />
      )}

      {listingType !== "hotel" && listingType !== "service" && (
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-semibold">{t("menuHighlightsLabel")}</label>
            <button
              type="button"
              onClick={addMenuItem}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700"
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
