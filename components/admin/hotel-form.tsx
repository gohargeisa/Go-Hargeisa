"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/shared/image-uploader";
import { Field, TagInput, inputClass } from "@/components/admin/form-shared";
import { createRecord, updateRecord } from "@/lib/actions/admin";
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

  function update<K extends keyof HotelFormInput>(key: K, value: HotelFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!form.coverImage) {
      setError("Please upload a cover image.");
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
      if (result && !result.ok) setError(result.error ?? "Something went wrong.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <ImageUploader folder="hotels" value={form.coverImage} onChange={(url) => update("coverImage", url)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Hotel name">
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} />
        </Field>
        <Field label="URL slug">
          <input required value={form.slug} onChange={(e) => update("slug", e.target.value)} className={inputClass} placeholder="ambassador-hotel-hargeisa" />
        </Field>
      </div>

      <Field label="Short description">
        <input required value={form.shortDescription} onChange={(e) => update("shortDescription", e.target.value)} className={inputClass} />
      </Field>

      <Field label="Full description">
        <textarea required rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} className={inputClass} />
      </Field>

      <Field label="Address">
        <input required value={form.address} onChange={(e) => update("address", e.target.value)} className={inputClass} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Latitude">
          <input required type="number" step="0.0001" value={form.lat} onChange={(e) => update("lat", Number(e.target.value))} className={inputClass} />
        </Field>
        <Field label="Longitude">
          <input required type="number" step="0.0001" value={form.lng} onChange={(e) => update("lng", Number(e.target.value))} className={inputClass} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Phone">
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Website">
          <input value={form.website} onChange={(e) => update("website", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Price range">
          <select value={form.priceRange} onChange={(e) => update("priceRange", e.target.value as HotelFormInput["priceRange"])} className={inputClass}>
            <option value="$">$</option>
            <option value="$$">$$</option>
            <option value="$$$">$$$</option>
            <option value="$$$$">$$$$</option>
          </select>
        </Field>
      </div>

      <TagInput label="Amenities" values={form.amenities} onChange={(v) => update("amenities", v)} placeholder="Type and press Enter…" suggestions={AMENITY_SUGGESTIONS} />

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} />
        Feature on homepage
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-70"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />}
        {mode === "create" ? "Publish Hotel" : "Save Changes"}
      </button>
    </form>
  );
}
