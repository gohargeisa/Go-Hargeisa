"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/shared/image-uploader";
import { GalleryManager } from "@/components/admin/gallery-manager";
import { serviceCategorySupportsGallery } from "@/lib/config/gallery-eligibility";
import { VideoUploader } from "@/components/shared/video-uploader";
import { OpeningHoursEditor } from "@/components/shared/opening-hours-editor";
import { GoogleMapsLocationField } from "@/components/admin/google-maps-location-field";
import { Field, TagInput, inputClass } from "@/components/admin/form-shared";
import { createRecord, updateRecord } from "@/lib/actions/admin";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";
import { SERVICE_GALLERY_CATEGORIES } from "@/lib/utils/gallery-categories";
import type { Locale } from "@/lib/i18n/config";
import type { Category, GalleryImage, MediaVideo, OpeningHoursGroup, ServiceCategory } from "@/types";

// The legacy service_category enum has no value for categories added after
// the `categories` table existed (Flower Shops, Real Estate, ...) — this
// lets the form keep writing the deprecated `category` column for the
// original categories only, purely so serviceCategorySupportsGallery (still
// enum-keyed, out of scope for this migration) keeps working for them.
const LEGACY_ENUM_BY_SLUG: Partial<Record<string, ServiceCategory>> = {
  hospitals: "hospital", pharmacies: "pharmacy", "dental-clinics": "dental_clinic", banks: "bank",
  atms: "atm", "currency-exchange": "currency_exchange", "gas-stations": "gas_station", "car-rentals": "car_rental",
  mosques: "mosque", schools: "school", universities: "university", gyms: "gym", "tour-companies": "tour_company",
  apartments: "apartment", supermarkets: "supermarket", clinics: "clinic", "government-offices": "government_office",
};

export interface ServiceFormInput {
  slug: string;
  name: string;
  shortDescription: string;
  description: string;
  coverImage: string;
  logo: string;
  gallery: GalleryImage[];
  videos: MediaVideo[];
  address: string;
  lat: number;
  lng: number;
  googleMapsUrl?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  website?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  openingHours: string;
  openingHoursStructured: OpeningHoursGroup[];
  services: string[];
  categoryId: string;
  featured: boolean;
}

export function ServiceForm({
  locale,
  mode,
  serviceId,
  initial,
  categories,
}: {
  locale: Locale;
  mode: "create" | "edit";
  serviceId?: string;
  initial?: Partial<ServiceFormInput>;
  /** Every `services`-vertical category from the `categories` table — the
   * category picker below reads only from this, never a hardcoded list. */
  categories: Category[];
}) {
  const t = useTranslations("admin");
  const tw = useTranslations("weekdays");
  const [form, setForm] = useState<ServiceFormInput>({
    slug: initial?.slug ?? "",
    name: initial?.name ?? "",
    shortDescription: initial?.shortDescription ?? "",
    description: initial?.description ?? "",
    coverImage: initial?.coverImage ?? "",
    logo: initial?.logo ?? "",
    gallery: initial?.gallery ?? [],
    videos: initial?.videos ?? [],
    address: initial?.address ?? "",
    lat: initial?.lat ?? 9.5624,
    lng: initial?.lng ?? 44.065,
    googleMapsUrl: initial?.googleMapsUrl ?? "",
    phone: initial?.phone ?? "",
    whatsapp: initial?.whatsapp ?? "",
    email: initial?.email ?? "",
    website: initial?.website ?? "",
    socialInstagram: initial?.socialInstagram ?? "",
    socialFacebook: initial?.socialFacebook ?? "",
    openingHours: initial?.openingHours ?? "",
    openingHoursStructured: initial?.openingHoursStructured ?? [],
    services: initial?.services ?? [],
    categoryId: initial?.categoryId ?? categories[0]?.id ?? "",
    featured: initial?.featured ?? false,
  });
  const [error, setError] = useState<string | null>(null);
  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const legacyEnum = selectedCategory ? LEGACY_ENUM_BY_SLUG[selectedCategory.slug] : undefined;
  const gallerySupported = legacyEnum ? serviceCategorySupportsGallery(legacyEnum) : false;
  const [isPending, startTransition] = useTransition();
  const [dirty, setDirty] = useState(false);
  useUnsavedChangesWarning(dirty);

  function update<K extends keyof ServiceFormInput>(key: K, value: ServiceFormInput[K]) {
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
      logo_url: form.logo || null,
      gallery: form.gallery,
      videos: form.videos,
      address: form.address,
      lat: form.lat,
      lng: form.lng,
      google_maps_url: form.googleMapsUrl || null,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      website: form.website || null,
      social_instagram: form.socialInstagram || null,
      social_facebook: form.socialFacebook || null,
      opening_hours: form.openingHours || null,
      opening_hours_structured: form.openingHoursStructured,
      services: form.services,
      category_id: form.categoryId || null,
      category: legacyEnum ?? null,
      featured: form.featured,
    };
    const revalidatePaths = [`/${locale}/admin/services`, `/${locale}/services`, `/${locale}`];
    const redirectTo = `/${locale}/admin/services`;

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createRecord("services", payload, revalidatePaths, redirectTo)
          : await updateRecord("services", serviceId!, payload, revalidatePaths, redirectTo);
      if (result && !result.ok) setError(result.error ?? t("somethingWentWrong"));
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <div className="grid gap-6 sm:grid-cols-2">
        <ImageUploader folder="services" value={form.coverImage} onChange={(url) => update("coverImage", url)} label="Cover image" />
        <ImageUploader folder="services/logos" value={form.logo} onChange={(url) => update("logo", url)} label="Logo" rounded="rounded-full" />
      </div>

      {gallerySupported ? (
        <GalleryManager
          folder="services/gallery"
          value={form.gallery}
          onChange={(v) => update("gallery", v)}
          categories={SERVICE_GALLERY_CATEGORIES}
          coverUrl={form.coverImage}
          onSetCover={(url) => update("coverImage", url)}
          setCoverLabel={t("setAsCoverLabel")}
          coverBadgeLabel={t("coverBadgeLabel")}
        />
      ) : (
        <p className="text-xs text-ink/45 dark:text-sand/45">{t("galleryNotAvailableForCategory")}</p>
      )}

      <VideoUploader
        folder="services/videos"
        value={form.videos}
        onChange={(v) => update("videos", v)}
        label={t("videosLabel")}
        addLabel={t("addVideoLabel")}
        hint={t("videosHint")}
        captionPlaceholder={t("videoCaptionPlaceholder")}
        removeAriaLabel={t("removeVideoAriaLabel")}
        replaceAriaLabel={t("replaceVideoAriaLabel")}
        moveEarlierAriaLabel={t("moveVideoEarlierAriaLabel")}
        moveLaterAriaLabel={t("moveVideoLaterAriaLabel")}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("serviceNameLabel")}>
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("urlSlugLabel")}>
          <input required value={form.slug} onChange={(e) => update("slug", e.target.value)} className={inputClass} placeholder="edna-adan-hospital" />
        </Field>
      </div>

      <Field label={t("categoryLabel")}>
        <select value={form.categoryId} onChange={(e) => update("categoryId", e.target.value)} className={inputClass}>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t("shortDescriptionLabel")}>
        <input required value={form.shortDescription} onChange={(e) => update("shortDescription", e.target.value)} className={inputClass} />
      </Field>
      <Field label={t("fullDescriptionLabel")}>
        <textarea required rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} className={inputClass} />
      </Field>

      <Field label={t("addressLabel")}>
        <input required value={form.address} onChange={(e) => update("address", e.target.value)} className={inputClass} />
      </Field>

      <GoogleMapsLocationField
        googleMapsUrl={form.googleMapsUrl ?? ""}
        onGoogleMapsUrlChange={(url) => update("googleMapsUrl", url)}
        lat={form.lat}
        lng={form.lng}
        onCoordsChange={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("phoneLabel")}>
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("whatsappLabel")}>
          <input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
        </Field>
        <Field label={t("emailLabel")}>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("websiteLabel")}>
          <input value={form.website} onChange={(e) => update("website", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("socialInstagramLabel")}>
          <input type="url" value={form.socialInstagram} onChange={(e) => update("socialInstagram", e.target.value)} className={inputClass} placeholder="https://instagram.com/…" />
        </Field>
        <Field label={t("socialFacebookLabel")}>
          <input type="url" value={form.socialFacebook} onChange={(e) => update("socialFacebook", e.target.value)} className={inputClass} placeholder="https://facebook.com/…" />
        </Field>
      </div>

      <OpeningHoursEditor
        value={form.openingHoursStructured}
        onChange={(v) => update("openingHoursStructured", v)}
        dayLabel={tw}
        title={t("structuredHoursLabel")}
        addLabel={t("addHoursGroupLabel")}
        openLabel={t("hoursOpenLabel")}
        closeLabel={t("hoursCloseLabel")}
        removeAriaLabel={t("removeHoursGroupAriaLabel")}
      />

      <TagInput
        label={t("servicesOfferedLabel")}
        values={form.services}
        onChange={(v) => update("services", v)}
        placeholder="X-ray, Emergency Care, Lab Tests…"
      />

      <label className="flex items-center gap-2 text-sm font-medium">
        <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} />
        {t("featureOnHomepage")}
      </label>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 disabled:opacity-70"
      >
        {isPending ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
        {mode === "create" ? t("publishService") : t("saveChanges")}
      </button>
    </form>
  );
}
