"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus, X } from "lucide-react";
import { ImageUploader } from "@/components/shared/image-uploader";
import { GalleryManager } from "@/components/admin/gallery-manager";
import { PdfUploader } from "@/components/admin/pdf-uploader";
import { Field, TagInput, inputClass } from "@/components/admin/form-shared";
import { createRecord, updateRecord } from "@/lib/actions/admin";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";
import { RESTAURANT_GALLERY_CATEGORIES } from "@/lib/utils/gallery-categories";
import type { Locale } from "@/lib/i18n/config";
import type { GalleryImage } from "@/types";

export interface RestaurantFormInput {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  coverImage: string;
  logo: string;
  gallery: GalleryImage[];
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  website?: string;
  cuisine: string[];
  priceRange: "$" | "$$" | "$$$";
  openingHours: string;
  menuHighlights: { name: string; price: string; description?: string }[];
  menuPdfUrl: string;
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
  const t = useTranslations("admin");
  const [form, setForm] = useState<RestaurantFormInput>({
    slug: initial?.slug ?? "",
    name: initial?.name ?? "",
    shortDescription: initial?.shortDescription ?? "",
    description: initial?.description ?? "",
    coverImage: initial?.coverImage ?? "",
    logo: initial?.logo ?? "",
    gallery: initial?.gallery ?? [],
    address: initial?.address ?? "",
    lat: initial?.lat ?? 9.5624,
    lng: initial?.lng ?? 44.065,
    phone: initial?.phone ?? "",
    website: initial?.website ?? "",
    cuisine: initial?.cuisine ?? [],
    priceRange: initial?.priceRange ?? "$$",
    openingHours: initial?.openingHours ?? "",
    menuHighlights: initial?.menuHighlights ?? [],
    menuPdfUrl: initial?.menuPdfUrl ?? "",
    reservable: initial?.reservable ?? false,
    featured: initial?.featured ?? false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [dirty, setDirty] = useState(false);
  useUnsavedChangesWarning(dirty);

  function update<K extends keyof RestaurantFormInput>(key: K, value: RestaurantFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
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
      setError(t("uploadCoverImageError"));
      return;
    }

    const payload = {
      slug: form.slug,
      name: form.name,
      short_description: form.shortDescription,
      description: form.description,
      cover_image: form.coverImage,
      logo_url: form.logo || null,
      gallery: form.gallery,
      address: form.address,
      lat: form.lat,
      lng: form.lng,
      phone: form.phone || null,
      website: form.website || null,
      cuisine: form.cuisine,
      price_range: form.priceRange,
      opening_hours: form.openingHours,
      menu: form.menuHighlights,
      menu_pdf_url: form.menuPdfUrl || null,
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
      if (result && !result.ok) setError(result.error ?? t("somethingWentWrong"));
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <ImageUploader folder="restaurants" value={form.coverImage} onChange={(url) => update("coverImage", url)} label="Cover image" />
        <ImageUploader folder="restaurants/logos" value={form.logo} onChange={(url) => update("logo", url)} label="Restaurant logo" rounded="rounded-full" />
      </div>

      <GalleryManager
        folder="restaurants/gallery"
        value={form.gallery}
        onChange={(v) => update("gallery", v)}
        categories={RESTAURANT_GALLERY_CATEGORIES}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("restaurantNameLabel")}>
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("urlSlugLabel")}>
          <input required value={form.slug} onChange={(e) => update("slug", e.target.value)} className={inputClass} placeholder="xafow-restaurant" />
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
        <Field label={t("openingHoursLabel")}>
          <input value={form.openingHours} onChange={(e) => update("openingHours", e.target.value)} className={inputClass} placeholder="7:00 AM – 11:00 PM" />
        </Field>
        <Field label={t("priceRangeLabel")}>
          <select value={form.priceRange} onChange={(e) => update("priceRange", e.target.value as RestaurantFormInput["priceRange"])} className={inputClass}>
            <option value="$">$</option>
            <option value="$$">$$</option>
            <option value="$$$">$$$</option>
          </select>
        </Field>
      </div>

      <TagInput label={t("cuisineLabel")} values={form.cuisine} onChange={(v) => update("cuisine", v)} placeholder={t("tagInputPlaceholder")} suggestions={CUISINE_SUGGESTIONS} />

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold">{t("menuHighlightsLabel")}</label>
          <button type="button" onClick={addMenuItem} className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            <Plus size={13} /> {t("addItemLabel")}
          </button>
        </div>
        <div className="space-y-2">
          {form.menuHighlights.map((item, i) => (
            <div key={i} className="flex items-center gap-2">
              <input value={item.name} onChange={(e) => updateMenuItem(i, { name: e.target.value })} placeholder={t("dishNamePlaceholder")} className={inputClass} />
              <input value={item.price} onChange={(e) => updateMenuItem(i, { price: e.target.value })} placeholder="$8" className={`${inputClass} w-24 shrink-0`} />
              <button type="button" onClick={() => removeMenuItem(i)} aria-label={t("removeMenuItemAriaLabel")} className="shrink-0 text-ink/40 hover:text-red-500">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <PdfUploader
        folder="restaurants/menus"
        value={form.menuPdfUrl}
        onChange={(url) => update("menuPdfUrl", url)}
        label="PDF menu (optional, shown alongside the interactive menu)"
      />

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={form.reservable} onChange={(e) => update("reservable", e.target.checked)} />
          {t("acceptsReservations")}
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} />
          {t("featureOnHomepage")}
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-70"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />}
        {mode === "create" ? t("publishRestaurant") : t("saveChanges")}
      </button>
    </form>
  );
}
