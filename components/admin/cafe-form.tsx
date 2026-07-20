"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/shared/image-uploader";
import { Field, TagInput, inputClass } from "@/components/admin/form-shared";
import { createRecord, updateRecord } from "@/lib/actions/admin";
import type { Locale } from "@/lib/i18n/config";

export interface CafeFormInput {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  coverImage: string;
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  specialDrinks: string[];
  wifi: boolean;
  workingSpace: boolean;
  openingHours: string;
  featured: boolean;
}

const DRINK_SUGGESTIONS = ["Somali Spiced Coffee", "Somali Tea (Shaah)", "Iced Caramel Macchiato", "Cold Brew"];

export function CafeForm({
  locale,
  mode,
  cafeId,
  initial,
}: {
  locale: Locale;
  mode: "create" | "edit";
  cafeId?: string;
  initial?: Partial<CafeFormInput>;
}) {
  const [form, setForm] = useState<CafeFormInput>({
    slug: initial?.slug ?? "",
    name: initial?.name ?? "",
    shortDescription: initial?.shortDescription ?? "",
    description: initial?.description ?? "",
    coverImage: initial?.coverImage ?? "",
    address: initial?.address ?? "",
    lat: initial?.lat ?? 9.5624,
    lng: initial?.lng ?? 44.065,
    phone: initial?.phone ?? "",
    specialDrinks: initial?.specialDrinks ?? [],
    wifi: initial?.wifi ?? true,
    workingSpace: initial?.workingSpace ?? false,
    openingHours: initial?.openingHours ?? "",
    featured: initial?.featured ?? false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof CafeFormInput>(key: K, value: CafeFormInput[K]) {
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
      special_drinks: form.specialDrinks,
      wifi: form.wifi,
      working_space: form.workingSpace,
      opening_hours: form.openingHours,
      featured: form.featured,
    };
    const revalidatePaths = [`/${locale}/admin/cafes`, `/${locale}/cafes`, `/${locale}`];
    const redirectTo = `/${locale}/admin/cafes`;

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createRecord("cafes", payload, revalidatePaths, redirectTo)
          : await updateRecord("cafes", cafeId!, payload, revalidatePaths, redirectTo);
      if (result && !result.ok) setError(result.error ?? "Something went wrong.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <ImageUploader folder="cafes" value={form.coverImage} onChange={(url) => update("coverImage", url)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Cafe name">
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} />
        </Field>
        <Field label="URL slug">
          <input required value={form.slug} onChange={(e) => update("slug", e.target.value)} className={inputClass} placeholder="kob-cafe" />
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Phone">
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass} />
        </Field>
        <Field label="Opening hours">
          <input value={form.openingHours} onChange={(e) => update("openingHours", e.target.value)} className={inputClass} placeholder="6:00 AM – 9:00 PM" />
        </Field>
      </div>

      <TagInput label="Special drinks" values={form.specialDrinks} onChange={(v) => update("specialDrinks", v)} placeholder="Type and press Enter…" suggestions={DRINK_SUGGESTIONS} />

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={form.wifi} onChange={(e) => update("wifi", e.target.checked)} />
          Free WiFi
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={form.workingSpace} onChange={(e) => update("workingSpace", e.target.checked)} />
          Good working space
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} />
          Feature on homepage
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-70"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />}
        {mode === "create" ? "Publish Cafe" : "Save Changes"}
      </button>
    </form>
  );
}
