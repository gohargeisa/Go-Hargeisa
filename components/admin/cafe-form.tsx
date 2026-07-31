"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus, X } from "lucide-react";
import { ImageUploader } from "@/components/shared/image-uploader";
import { GalleryManager } from "@/components/admin/gallery-manager";
import { PdfUploader } from "@/components/admin/pdf-uploader";
import { VideoUploader } from "@/components/shared/video-uploader";
import { Field, TagInput, inputClass } from "@/components/admin/form-shared";
import { createRecord, updateRecord } from "@/lib/actions/admin";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";
import { CAFE_GALLERY_CATEGORIES } from "@/lib/utils/gallery-categories";
import { CAFE_AMENITY_CODES } from "@/lib/utils/cafe-amenities";
import type { Locale } from "@/lib/i18n/config";
import type { GalleryImage, MediaVideo, OpeningHoursGroup } from "@/types";

export interface CafeFormInput {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  descriptionAr: string;
  descriptionSo: string;
  coverImage: string;
  logo: string;
  gallery: GalleryImage[];
  videos: MediaVideo[];
  address: string;
  lat: number;
  lng: number;
  phone?: string;
  whatsapp: string;
  email: string;
  specialDrinks: string[];
  wifi: boolean;
  workingSpace: boolean;
  openingHours: string;
  openingHoursStructured: OpeningHoursGroup[];
  priceRange: "$" | "$$" | "$$$" | "$$$$";
  amenities: string[];
  socialInstagram: string;
  socialFacebook: string;
  menuHighlights: { name: string; price: string; description?: string }[];
  menuPdfUrl: string;
  featured: boolean;
}

const DRINK_SUGGESTIONS = ["Somali Spiced Coffee", "Somali Tea (Shaah)", "Iced Caramel Macchiato", "Cold Brew"];
const WEEKDAYS: OpeningHoursGroup["days"][number][] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

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
  const t = useTranslations("admin");
  const tw = useTranslations("weekdays");
  const ta = useTranslations("cafeAmenities");
  const [form, setForm] = useState<CafeFormInput>({
    slug: initial?.slug ?? "",
    name: initial?.name ?? "",
    shortDescription: initial?.shortDescription ?? "",
    description: initial?.description ?? "",
    descriptionAr: initial?.descriptionAr ?? "",
    descriptionSo: initial?.descriptionSo ?? "",
    coverImage: initial?.coverImage ?? "",
    logo: initial?.logo ?? "",
    gallery: initial?.gallery ?? [],
    videos: initial?.videos ?? [],
    address: initial?.address ?? "",
    lat: initial?.lat ?? 9.5624,
    lng: initial?.lng ?? 44.065,
    phone: initial?.phone ?? "",
    whatsapp: initial?.whatsapp ?? "",
    email: initial?.email ?? "",
    specialDrinks: initial?.specialDrinks ?? [],
    wifi: initial?.wifi ?? true,
    workingSpace: initial?.workingSpace ?? false,
    openingHours: initial?.openingHours ?? "",
    openingHoursStructured: initial?.openingHoursStructured ?? [],
    priceRange: initial?.priceRange ?? "$$",
    amenities: initial?.amenities ?? [],
    socialInstagram: initial?.socialInstagram ?? "",
    socialFacebook: initial?.socialFacebook ?? "",
    menuHighlights: initial?.menuHighlights ?? [],
    menuPdfUrl: initial?.menuPdfUrl ?? "",
    featured: initial?.featured ?? false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [dirty, setDirty] = useState(false);
  useUnsavedChangesWarning(dirty);

  function update<K extends keyof CafeFormInput>(key: K, value: CafeFormInput[K]) {
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

  function toggleAmenity(code: string) {
    update(
      "amenities",
      form.amenities.includes(code) ? form.amenities.filter((a) => a !== code) : [...form.amenities, code]
    );
  }

  function addHoursGroup() {
    update("openingHoursStructured", [...form.openingHoursStructured, { days: [], open: "09:00", close: "18:00" }]);
  }
  function updateHoursGroup(i: number, patch: Partial<OpeningHoursGroup>) {
    update(
      "openingHoursStructured",
      form.openingHoursStructured.map((g, idx) => (idx === i ? { ...g, ...patch } : g))
    );
  }
  function removeHoursGroup(i: number) {
    update("openingHoursStructured", form.openingHoursStructured.filter((_, idx) => idx !== i));
  }
  function toggleHoursGroupDay(i: number, day: OpeningHoursGroup["days"][number]) {
    const group = form.openingHoursStructured[i];
    const days = group.days.includes(day) ? group.days.filter((d) => d !== day) : [...group.days, day];
    updateHoursGroup(i, { days });
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
      description_ar: form.descriptionAr || null,
      description_so: form.descriptionSo || null,
      cover_image: form.coverImage,
      logo_url: form.logo || null,
      gallery: form.gallery,
      videos: form.videos,
      address: form.address,
      lat: form.lat,
      lng: form.lng,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      special_drinks: form.specialDrinks,
      wifi: form.wifi,
      working_space: form.workingSpace,
      opening_hours: form.openingHours,
      opening_hours_structured: form.openingHoursStructured,
      price_range: form.priceRange,
      amenities: form.amenities,
      social_instagram: form.socialInstagram || null,
      social_facebook: form.socialFacebook || null,
      menu: form.menuHighlights,
      menu_pdf_url: form.menuPdfUrl || null,
      featured: form.featured,
    };
    const revalidatePaths = [`/${locale}/admin/cafes`, `/${locale}/cafes`, `/${locale}`];
    const redirectTo = `/${locale}/admin/cafes`;

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createRecord("cafes", payload, revalidatePaths, redirectTo)
          : await updateRecord("cafes", cafeId!, payload, revalidatePaths, redirectTo);
      if (result && !result.ok) setError(result.error ?? t("somethingWentWrong"));
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <ImageUploader folder="cafes" value={form.coverImage} onChange={(url) => update("coverImage", url)} label="Cover image" />
        <ImageUploader folder="cafes/logos" value={form.logo} onChange={(url) => update("logo", url)} label="Cafe logo" rounded="rounded-full" />
      </div>

      <GalleryManager
        folder="cafes/gallery"
        value={form.gallery}
        onChange={(v) => update("gallery", v)}
        categories={CAFE_GALLERY_CATEGORIES}
        coverUrl={form.coverImage}
        onSetCover={(url) => update("coverImage", url)}
        setCoverLabel={t("setAsCoverLabel")}
        coverBadgeLabel={t("coverBadgeLabel")}
      />

      <VideoUploader
        folder="cafes/videos"
        value={form.videos}
        onChange={(v) => update("videos", v)}
        label={t("videosLabel")}
        addLabel={t("addVideoLabel")}
        hint={t("videosHint")}
        captionPlaceholder={t("videoCaptionPlaceholder")}
        removeAriaLabel={t("removeVideoAriaLabel")}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("cafeNameLabel")}>
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("urlSlugLabel")}>
          <input required value={form.slug} onChange={(e) => update("slug", e.target.value)} className={inputClass} placeholder="kob-cafe" />
        </Field>
      </div>

      <Field label={t("shortDescriptionLabel")}>
        <input required value={form.shortDescription} onChange={(e) => update("shortDescription", e.target.value)} className={inputClass} />
      </Field>

      <Field label={t("fullDescriptionLabel")}>
        <textarea required rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} className={inputClass} />
      </Field>

      <Field label={t("fullDescriptionArLabel")}>
        <textarea dir="rtl" rows={4} value={form.descriptionAr} onChange={(e) => update("descriptionAr", e.target.value)} className={inputClass} />
      </Field>

      <Field label={t("fullDescriptionSoLabel")}>
        <textarea rows={4} value={form.descriptionSo} onChange={(e) => update("descriptionSo", e.target.value)} className={inputClass} />
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

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("phoneLabel")}>
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("priceRangeLabel")}>
          <select value={form.priceRange} onChange={(e) => update("priceRange", e.target.value as CafeFormInput["priceRange"])} className={inputClass}>
            <option value="$">$</option>
            <option value="$$">$$</option>
            <option value="$$$">$$$</option>
            <option value="$$$$">$$$$</option>
          </select>
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("whatsappLabel")}>
          <input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
        </Field>
        <Field label={t("emailLabel")}>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("socialInstagramLabel")}>
          <input value={form.socialInstagram} onChange={(e) => update("socialInstagram", e.target.value)} className={inputClass} placeholder="https://instagram.com/…" />
        </Field>
        <Field label={t("socialFacebookLabel")}>
          <input value={form.socialFacebook} onChange={(e) => update("socialFacebook", e.target.value)} className={inputClass} placeholder="https://facebook.com/…" />
        </Field>
      </div>

      <Field label={t("openingHoursLabel")}>
        <input value={form.openingHours} onChange={(e) => update("openingHours", e.target.value)} className={inputClass} placeholder="6:00 AM – 9:00 PM" />
      </Field>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold">{t("structuredHoursLabel")}</label>
          <button type="button" onClick={addHoursGroup} className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
            <Plus size={13} /> {t("addHoursGroupLabel")}
          </button>
        </div>
        <div className="space-y-3">
          {form.openingHoursStructured.map((group, i) => (
            <div key={i} className="rounded-xl border border-ink/12 dark:border-white/15 p-3 space-y-2.5">
              <div className="flex flex-wrap gap-1.5">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleHoursGroupDay(i, day)}
                    className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                      group.days.includes(day)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-ink/12 text-ink/50 dark:border-white/15 dark:text-sand/50"
                    }`}
                  >
                    {tw(day)}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  value={group.open}
                  onChange={(e) => updateHoursGroup(i, { open: e.target.value })}
                  aria-label={t("hoursOpenLabel")}
                  className={`${inputClass} w-auto`}
                />
                <span className="text-ink/40 dark:text-sand/40">–</span>
                <input
                  type="time"
                  value={group.close}
                  onChange={(e) => updateHoursGroup(i, { close: e.target.value })}
                  aria-label={t("hoursCloseLabel")}
                  className={`${inputClass} w-auto`}
                />
                <button type="button" onClick={() => removeHoursGroup(i)} aria-label={t("removeHoursGroupAriaLabel")} className="ms-auto shrink-0 text-ink/40 hover:text-red-500">
                  <X size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <TagInput label={t("specialDrinksLabel")} values={form.specialDrinks} onChange={(v) => update("specialDrinks", v)} placeholder={t("tagInputPlaceholder")} suggestions={DRINK_SUGGESTIONS} />

      <div>
        <label className="mb-2 block text-sm font-semibold">{t("amenitiesLabel")}</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CAFE_AMENITY_CODES.map((code) => (
            <label key={code} className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.amenities.includes(code)} onChange={() => toggleAmenity(code)} />
              {ta(code)}
            </label>
          ))}
        </div>
      </div>

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
              <input value={item.price} onChange={(e) => updateMenuItem(i, { price: e.target.value })} placeholder="$4" className={`${inputClass} w-24 shrink-0`} />
              <button type="button" onClick={() => removeMenuItem(i)} aria-label={t("removeMenuItemAriaLabel")} className="shrink-0 text-ink/40 hover:text-red-500">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <PdfUploader
        folder="cafes/menus"
        value={form.menuPdfUrl}
        onChange={(url) => update("menuPdfUrl", url)}
        label="PDF menu (optional, shown alongside the interactive menu)"
      />

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={form.wifi} onChange={(e) => update("wifi", e.target.checked)} />
          {t("freeWifi")}
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={form.workingSpace} onChange={(e) => update("workingSpace", e.target.checked)} />
          {t("goodWorkingSpace")}
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
        {mode === "create" ? t("publishCafe") : t("saveChanges")}
      </button>
    </form>
  );
}
