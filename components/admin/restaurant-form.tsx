"use client";

import { useState, useTransition } from "react";
import { Loader2, Plus, X } from "lucide-react";
import { ImageUploader } from "@/components/shared/image-uploader";
import { Field, TagInput, inputClass } from "@/components/admin/form-shared";
import { createRecord, updateRecord } from "@/lib/actions/admin";
import type { Locale } from "@/lib/i18n/config";

export interface RestaurantFormInput {
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
  cuisine: string[];
  priceRange: "$" | "$$" | "$$$";
  openingHours: string;
  menuHighlights: { name: string; price: string; description?: string }[];
  reservable: boolean;
  featured: boolean;
}

const CUISINE_SUGGESTIONS = ["Somali", "Grill", "International", "Seafood", "Fast Food", "Ethiopian"];

export function RestaurantForm({
  locale,
  mode,
  restaurantId,
  initial,
}: {
  locale: Locale;
  mode: "create" | "edit";
  restaurantId?: string;
  initial?: Partial<RestaurantFormInput>;
}) {
  const [form, setForm] = useState<RestaurantFormInput>({
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
    cuisine: initial?.cuisine ?? [],
    priceRange: initial?.priceRange ?? "$$",
    openingHours: initial?.openingHours ?? "",
    menuHighlights: initial?.menuHighlights ?? [],
    reservable: initial?.reservable ?? false,
    featured: initial?.featured ?? false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function update<K extends keyof RestaurantFormInput>(key: K, value: RestaurantFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addMenuItem() {
    update("menuHighlights", [...form.menuHighlights, { name: "", price: "" }]);
  }
  function updateMenuItem(i: number, patch: Partial<{ name: string; price: string; description?: string }>) {
    update(
      "menuHighlights",
      form.menuHighlights.map((item, idx) => (idx === i ? { ...item, ...patch } : item))
    );
  }
  function removeMenuItem(i: number) {
    update("menuHighlights", form.menuHighlights.filter((_, idx) => idx !== i));
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
      cuisine: form.cuisine,
      price_range: form.priceRange,
      opening_hours: form.openingHours,
      menu: form.menuHighlights,
      reservable: form.reservable,
      featured: form.featured,
    };
    const revalidatePaths = [`/${locale}/admin/restaurants`, `/${locale}/restaurants`, `/${locale}`];
    const redirectTo = `/${locale}/admin/restaurants`;

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createRecord("restaurants", payload, revalidatePaths, redirectTo)
          : await updateRecord("restaurants", restaurantId!, payload, revalidatePaths, redirectTo);
      if (result && !result.ok) setError(result.error ?? "Something went wrong.");
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <ImageUploader folder="restaurants" value={form.coverImage} onChange={(url) => update("coverImage", url)} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Restaurant name">
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} />
        </Field>
        <Field label="URL slug">
          <input required value={form.slug} onChange={(e) => update("slug", e.target.value)} className={inputClass} placeholder="xafow-restaurant" />
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
        <Field label="Opening hours">
          <input value={form.openingHours} onChange={(e) => update("openingHours", e.target.value)} className={inputClass} placeholder="7:00 AM – 11:00 PM" />
        </Field>
        <Field label="Price range">
          <select value={form.priceRange} onChange={(e) => update("priceRange", e.target.value as RestaurantFormInput["priceRange"])} className={inputClass}>
            <option value="$">$</option>
            <option value="$$">$$</option>
            <option value="$$$">$$$</option>
          </select>
        </Field>
      </div>

      <TagInput label="Cuisine" values={form.cuisine} onChange={(v) => update("cuisine", v)} placeholder="Type and press Enter…" suggestions={CUISINE_SUGGESTIONS} />

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold">Menu highlights</label>
          <button type="button" onClick={addMenuItem} className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            <Plus size={13} /> Add item
          </button>
        </div>
        <div className="space-y-2">
          {form.menuHighlights.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={item.name} onChange={(e) => updateMenuItem(i, { name: e.target.value })} placeholder="Dish name" className={inputClass} />
              <input value={item.price} onChange={(e) => updateMenuItem(i, { price: e.target.value })} placeholder="$8" className={`${inputClass} w-24 shrink-0`} />
              <button type="button" onClick={() => removeMenuItem(i)} aria-label="Remove menu item" className="shrink-0 text-ink/40 hover:text-red-500">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={form.reservable} onChange={(e) => update("reservable", e.target.checked)} />
          Accepts reservations
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
        {mode === "create" ? "Publish Restaurant" : "Save Changes"}
      </button>
    </form>
  );
}
