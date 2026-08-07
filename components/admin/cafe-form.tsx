"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Plus, X } from "lucide-react";
import { ImageUploader } from "@/components/shared/image-uploader";
import { GalleryManager } from "@/components/admin/gallery-manager-lazy";
import { PdfUploader } from "@/components/admin/pdf-uploader-lazy";
import { VideoUploader } from "@/components/shared/video-uploader-lazy";
import { GoogleMapsLocationField } from "@/components/admin/google-maps-location-field";
import { Field, TagInput, inputClass } from "@/components/admin/form-shared";
import { createRecord, updateRecord } from "@/lib/actions/admin";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";
import { CAFE_GALLERY_CATEGORIES } from "@/lib/utils/gallery-categories";
import { AmenitiesPicker } from "@/components/admin/amenities-picker";
import { OpeningHoursEditor } from "@/components/shared/opening-hours-editor";
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
  googleMapsUrl?: string;
  phone?: string;
  whatsapp: string;
  email: string;
  specialDrinks: string[];
  wifi: boolean;
  workingSpace: boolean;
  openingHours: string;
  openingHoursStructured: OpeningHoursGroup[];
  is24Hours: boolean;
  temporarilyClosed: boolean;
  permanentlyClosed: boolean;
  priceRange: "$" | "$$" | "$$$" | "$$$$";
  amenitiesV2: string[];
  website: string;
  socialInstagram: string;
  socialFacebook: string;
  socialTiktok: string;
  socialSnapchat: string;
  socialX: string;
  socialYoutube: string;
  socialTelegram: string;
  menuHighlights: { name: string; price: string; description?: string }[];
  menuPdfUrl: string;
  featured: boolean;
}

const DRINK_SUGGESTIONS = ["Somali Spiced Coffee", "Somali Tea (Shaah)", "Iced Caramel Macchiato", "Cold Brew"];

export function CafeForm({
  locale,
  mode,
  cafeId,
  initial,
  canFeature = true,
}: {
  locale: Locale;
  mode: "create" | "edit";
  cafeId?: string;
  initial?: Partial<CafeFormInput>;
  // Only the platform owner may toggle homepage featuring — business
  // owners reach this same form (requireListingsAccess) to manage their
  // own listing, but self-promoting to "featured" isn't theirs to grant.
  canFeature?: boolean;
}) {
  const t = useTranslations("admin");
  const tw = useTranslations("weekdays");
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
    googleMapsUrl: initial?.googleMapsUrl ?? "",
    phone: initial?.phone ?? "",
    whatsapp: initial?.whatsapp ?? "",
    email: initial?.email ?? "",
    specialDrinks: initial?.specialDrinks ?? [],
    wifi: initial?.wifi ?? true,
    workingSpace: initial?.workingSpace ?? false,
    openingHours: initial?.openingHours ?? "",
    openingHoursStructured: initial?.openingHoursStructured ?? [],
    is24Hours: initial?.is24Hours ?? false,
    temporarilyClosed: initial?.temporarilyClosed ?? false,
    permanentlyClosed: initial?.permanentlyClosed ?? false,
    priceRange: initial?.priceRange ?? "$$",
    amenitiesV2: initial?.amenitiesV2 ?? [],
    website: initial?.website ?? "",
    socialInstagram: initial?.socialInstagram ?? "",
    socialFacebook: initial?.socialFacebook ?? "",
    socialTiktok: initial?.socialTiktok ?? "",
    socialSnapchat: initial?.socialSnapchat ?? "",
    socialX: initial?.socialX ?? "",
    socialYoutube: initial?.socialYoutube ?? "",
    socialTelegram: initial?.socialTelegram ?? "",
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
      google_maps_url: form.googleMapsUrl || null,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      special_drinks: form.specialDrinks,
      wifi: form.wifi,
      working_space: form.workingSpace,
      opening_hours: form.openingHours,
      opening_hours_structured: form.openingHoursStructured,
      is_24_hours: form.is24Hours,
      temporarily_closed: form.temporarilyClosed,
      permanently_closed: form.permanentlyClosed,
      price_range: form.priceRange,
      amenities_v2: form.amenitiesV2,
      website: form.website || null,
      social_instagram: form.socialInstagram || null,
      social_facebook: form.socialFacebook || null,
      social_tiktok: form.socialTiktok || null,
      social_snapchat: form.socialSnapchat || null,
      social_x: form.socialX || null,
      social_youtube: form.socialYoutube || null,
      social_telegram: form.socialTelegram || null,
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
        replaceAriaLabel={t("replaceVideoAriaLabel")}
        moveEarlierAriaLabel={t("moveVideoEarlierAriaLabel")}
        moveLaterAriaLabel={t("moveVideoLaterAriaLabel")}
        pasteUrlPlaceholder={t("pasteVideoUrlPlaceholder")}
        addUrlLabel={t("addVideoUrlLabel")}
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

      <Field label={t("websiteLabel")}>
        <input type="url" value={form.website} onChange={(e) => update("website", e.target.value)} className={inputClass} placeholder="https://…" />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("socialInstagramLabel")}>
          <input value={form.socialInstagram} onChange={(e) => update("socialInstagram", e.target.value)} className={inputClass} placeholder="https://instagram.com/…" />
        </Field>
        <Field label={t("socialFacebookLabel")}>
          <input value={form.socialFacebook} onChange={(e) => update("socialFacebook", e.target.value)} className={inputClass} placeholder="https://facebook.com/…" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("socialTiktokLabel")}>
          <input value={form.socialTiktok} onChange={(e) => update("socialTiktok", e.target.value)} className={inputClass} placeholder="https://tiktok.com/@…" />
        </Field>
        <Field label={t("socialSnapchatLabel")}>
          <input value={form.socialSnapchat} onChange={(e) => update("socialSnapchat", e.target.value)} className={inputClass} placeholder="https://snapchat.com/add/…" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("socialXLabel")}>
          <input value={form.socialX} onChange={(e) => update("socialX", e.target.value)} className={inputClass} placeholder="https://x.com/…" />
        </Field>
        <Field label={t("socialYoutubeLabel")}>
          <input value={form.socialYoutube} onChange={(e) => update("socialYoutube", e.target.value)} className={inputClass} placeholder="https://youtube.com/@…" />
        </Field>
      </div>

      <Field label={t("socialTelegramLabel")}>
        <input value={form.socialTelegram} onChange={(e) => update("socialTelegram", e.target.value)} className={inputClass} placeholder="https://t.me/…" />
      </Field>

      <Field label={t("openingHoursLabel")}>
        <input value={form.openingHours} onChange={(e) => update("openingHours", e.target.value)} className={inputClass} placeholder="6:00 AM – 9:00 PM" />
      </Field>

      <OpeningHoursEditor
        value={form.openingHoursStructured}
        onChange={(v) => update("openingHoursStructured", v)}
        dayLabel={tw}
        title={t("structuredHoursLabel")}
        addLabel={t("addHoursGroupLabel")}
        openLabel={t("hoursOpenLabel")}
        closeLabel={t("hoursCloseLabel")}
        removeAriaLabel={t("removeHoursGroupAriaLabel")}
        is24Hours={form.is24Hours}
        onIs24HoursChange={(v) => update("is24Hours", v)}
        is24HoursLabel={t("is24HoursLabel")}
        temporarilyClosed={form.temporarilyClosed}
        onTemporarilyClosedChange={(v) => update("temporarilyClosed", v)}
        temporarilyClosedLabel={t("temporarilyClosedLabel")}
        permanentlyClosed={form.permanentlyClosed}
        onPermanentlyClosedChange={(v) => update("permanentlyClosed", v)}
        permanentlyClosedLabel={t("permanentlyClosedLabel")}
      />

      <TagInput label={t("specialDrinksLabel")} values={form.specialDrinks} onChange={(v) => update("specialDrinks", v)} placeholder={t("tagInputPlaceholder")} suggestions={DRINK_SUGGESTIONS} />

      <AmenitiesPicker listingType="cafe" values={form.amenitiesV2} onChange={(v) => update("amenitiesV2", v)} label={t("amenitiesLabel")} />

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold">{t("menuHighlightsLabel")}</label>
          <button type="button" onClick={addMenuItem} className="inline-flex items-center gap-1 text-xs font-semibold text-primary-700">
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
        {canFeature && (
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} />
            {t("featureOnHomepage")}
          </label>
        )}
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
