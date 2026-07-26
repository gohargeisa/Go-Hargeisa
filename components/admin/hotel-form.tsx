"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/shared/image-uploader";
import { Field, TagInput, inputClass } from "@/components/admin/form-shared";
import { createRecord, updateRecord } from "@/lib/actions/admin";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";
import type { Locale } from "@/lib/i18n/config";

export interface HotelFormInput {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  coverImage: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  priceRange: "$" | "$$" | "$$$" | "$$$$";
  amenities: string[];
  featured: boolean;
}

const AMENITY_SUGGESTIONS = [
  "Free WiFi", "Parking", "Restaurant", "Generator Backup", "Conference Room",
  "Room Service", "Air Conditioning", "Gym", "Garden", "Airport Shuttle",
];

export function HotelForm({
  locale,
  mode,
  hotelId,
  initial,
}: {
  locale: Locale;
  mode: "create" | "edit";
  hotelId?: string;
  initial?: Partial<HotelFormInput>;
}) {
  const t = useTranslations("admin");
  const [form, setForm] = useState<HotelFormInput>({
    slug: initial?.slug ?? "",
    name: initial?.name ?? "",
    shortDescription: initial?.shortDescription ?? "",
    description: initial?.description ?? "",
    coverImage: initial?.coverImage ?? "",
    address: initial?.address ?? "",
    lat: initial?.lat ?? 9.5624,
    lng: initial?.lng ?? 44.065,
    phone: initial?.phone ?? "",
    website: initial?.website ?? "",
    priceRange: initial?.priceRange ?? "$$",
    amenities: initial?.amenities ?? [],
    featured: initial?.featured ?? false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);
  useUnsavedChangesWarning(dirty);

  function update<K extends keyof HotelFormInput>(key: K, value: HotelFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.coverImage) {
      setError(t("uploadCoverImageError"));
      return;
    }

    const payload = {
      slug: form.slug,
      name: form.name,
      short_description: form.shortDescription,
      description: form.description,
      cover_image: form.coverImage,
      gallery: [],
      address: form.address,
      lat: form.lat,
      lng: form.lng,
      phone: form.phone || null,
      website: form.website || null,
      price_range: form.priceRange,
      amenities: form.amenities,
      featured: form.featured,
    };
    const revalidatePaths = [`/${locale}/admin/hotels`, `/${locale}/hotels`, `/${locale}`];
    const redirectTo = `/${locale}/admin/hotels`;

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createRecord("hotels", payload, revalidatePaths, redirectTo)
          : await updateRecord("hotels", hotelId!, payload, revalidatePaths, redirectTo);
      // On success the action redirects server-side and never returns here.
      if (result && !result.ok) setError(result.error ?? t("somethingWentWrong"));
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <ImageUploader folder="hotels" value={form.coverImage} onChange={(url) => update("coverImage", url)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("hotelNameLabel")}>
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("urlSlugLabel")}>
          <input required value={form.slug} onChange={(e) => update("slug", e.target.value)} className={inputClass} placeholder="ambassador-hotel-hargeisa" />
        </Field>
      </div>

      <Field label={t("shortDescriptionLabel")}>
        <input required value={form.shortDescription} onChange={(e) => update("shortDescription", e.target.value)} className={inputClass} />
      </Field>

      <Field label={t("fullDescriptionLabel")}>
        <textarea required rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} className={inputClass} />
      </Field>

      <Field label={t("addressLabel")}>
        <input required value={form.address} onChange={(e) => update("address", e.target.value)} className={inputClass} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("latitudeLabel")}>
          <input required type="number" step="0.0001" value={form.lat} onChange={(e) => update("lat", Number(e.target.value))} className={inputClass} />
        </Field>
        <Field label={t("longitudeLabel")}>
          <input required type="number" step="0.0001" value={form.lng} onChange={(e) => update("lng", Number(e.target.value))} className={inputClass} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label={t("phoneLabel")}>
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("websiteLabel")}>
          <input value={form.website} onChange={(e) => update("website", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("priceRangeLabel")}>
          <select value={form.priceRange} onChange={(e) => update("priceRange", e.target.value as HotelFormInput["priceRange"])} className={inputClass}>
            <option value="$">$</option>
            <option value="$$">$$</option>
            <option value="$$$">$$$</option>
            <option value="$$$$">$$$$</option>
          </select>
        </Field>
      </div>

      <TagInput label={t("amenitiesLabel")} values={form.amenities} onChange={(v) => update("amenities", v)} placeholder={t("tagInputPlaceholder")} suggestions={AMENITY_SUGGESTIONS} />

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} />
        {t("featureOnHomepage")}
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-70"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />}
        {mode === "create" ? t("publishHotel") : t("saveChanges")}
      </button>
    </form>
  );
}
