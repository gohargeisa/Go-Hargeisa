"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/shared/image-uploader";
import { GalleryManager } from "@/components/admin/gallery-manager-lazy";
import { VideoUploader } from "@/components/shared/video-uploader-lazy";
import { GoogleMapsLocationField } from "@/components/admin/google-maps-location-field";
import { OpeningHoursEditor } from "@/components/shared/opening-hours-editor";
import { AmenitiesPicker } from "@/components/admin/amenities-picker";
import { Field, inputClass } from "@/components/admin/form-shared";
import { createRecord, updateRecord } from "@/lib/actions/admin";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";
import { EVENT_GALLERY_CATEGORIES } from "@/lib/utils/gallery-categories";
import type { Locale } from "@/lib/i18n/config";
import type { GalleryImage, MediaVideo, OpeningHoursGroup } from "@/types";

export interface EventFormInput {
  slug: string;
  title: string;
  description: string;
  coverImage: string;
  gallery: GalleryImage[];
  videos: MediaVideo[];
  category: "cultural" | "national" | "business" | "sports" | "concert";
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
  location: string;
  lat: number;
  lng: number;
  googleMapsUrl?: string;
  ticketInfo?: string;
  amenitiesV2: string[];
  openingHoursStructured: OpeningHoursGroup[];
  is24Hours: boolean;
  temporarilyClosed: boolean;
  permanentlyClosed: boolean;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  socialInstagram: string;
  socialFacebook: string;
  socialTiktok: string;
  socialSnapchat: string;
  socialX: string;
  socialYoutube: string;
  socialTelegram: string;
}

export function EventForm({
  locale,
  mode,
  eventId,
  initial,
}: {
  locale: Locale;
  mode: "create" | "edit";
  eventId?: string;
  initial?: Partial<EventFormInput>;
}) {
  const t = useTranslations("admin");
  const tw = useTranslations("weekdays");
  const [form, setForm] = useState<EventFormInput>({
    slug: initial?.slug ?? "",
    title: initial?.title ?? "",
    description: initial?.description ?? "",
    coverImage: initial?.coverImage ?? "",
    gallery: initial?.gallery ?? [],
    videos: initial?.videos ?? [],
    category: initial?.category ?? "cultural",
    startDate: initial?.startDate ?? "",
    endDate: initial?.endDate ?? "",
    location: initial?.location ?? "",
    lat: initial?.lat ?? 9.5624,
    lng: initial?.lng ?? 44.065,
    googleMapsUrl: initial?.googleMapsUrl ?? "",
    ticketInfo: initial?.ticketInfo ?? "",
    amenitiesV2: initial?.amenitiesV2 ?? [],
    openingHoursStructured: initial?.openingHoursStructured ?? [],
    is24Hours: initial?.is24Hours ?? false,
    temporarilyClosed: initial?.temporarilyClosed ?? false,
    permanentlyClosed: initial?.permanentlyClosed ?? false,
    phone: initial?.phone ?? "",
    whatsapp: initial?.whatsapp ?? "",
    email: initial?.email ?? "",
    website: initial?.website ?? "",
    socialInstagram: initial?.socialInstagram ?? "",
    socialFacebook: initial?.socialFacebook ?? "",
    socialTiktok: initial?.socialTiktok ?? "",
    socialSnapchat: initial?.socialSnapchat ?? "",
    socialX: initial?.socialX ?? "",
    socialYoutube: initial?.socialYoutube ?? "",
    socialTelegram: initial?.socialTelegram ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [dirty, setDirty] = useState(false);
  useUnsavedChangesWarning(dirty);

  function update<K extends keyof EventFormInput>(key: K, value: EventFormInput[K]) {
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
    if (!form.startDate || !form.endDate) {
      setError(t("pleaseSetDates"));
      return;
    }

    const payload = {
      slug: form.slug,
      title: form.title,
      description: form.description,
      cover_image: form.coverImage,
      gallery: form.gallery,
      videos: form.videos,
      category: form.category,
      start_date: new Date(form.startDate).toISOString(),
      end_date: new Date(form.endDate).toISOString(),
      location: form.location,
      lat: form.lat,
      lng: form.lng,
      google_maps_url: form.googleMapsUrl || null,
      ticket_info: form.ticketInfo || null,
      amenities_v2: form.amenitiesV2,
      opening_hours_structured: form.openingHoursStructured,
      is_24_hours: form.is24Hours,
      temporarily_closed: form.temporarilyClosed,
      permanently_closed: form.permanentlyClosed,
      phone: form.phone || null,
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      website: form.website || null,
      social_instagram: form.socialInstagram || null,
      social_facebook: form.socialFacebook || null,
      social_tiktok: form.socialTiktok || null,
      social_snapchat: form.socialSnapchat || null,
      social_x: form.socialX || null,
      social_youtube: form.socialYoutube || null,
      social_telegram: form.socialTelegram || null,
    };
    const revalidatePaths = [`/${locale}/admin/events`, `/${locale}/events`, `/${locale}`];
    const redirectTo = `/${locale}/admin/events`;

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createRecord("events", payload, revalidatePaths, redirectTo)
          : await updateRecord("events", eventId!, payload, revalidatePaths, redirectTo);
      if (result && !result.ok) setError(result.error ?? t("somethingWentWrong"));
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <ImageUploader folder="events" value={form.coverImage} onChange={(url) => update("coverImage", url)} />

      <GalleryManager
        folder="events/gallery"
        value={form.gallery}
        onChange={(v) => update("gallery", v)}
        categories={EVENT_GALLERY_CATEGORIES}
        coverUrl={form.coverImage}
        onSetCover={(url) => update("coverImage", url)}
        setCoverLabel={t("setAsCoverLabel")}
        coverBadgeLabel={t("coverBadgeLabel")}
      />

      <VideoUploader
        folder="events/videos"
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
        <Field label={t("eventTitleLabel")}>
          <input required value={form.title} onChange={(e) => update("title", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("urlSlugLabel")}>
          <input required value={form.slug} onChange={(e) => update("slug", e.target.value)} className={inputClass} placeholder="hargeisa-book-fair" />
        </Field>
      </div>

      <Field label={t("fullDescriptionLabel")}>
        <textarea required rows={4} value={form.description} onChange={(e) => update("description", e.target.value)} className={inputClass} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("startDateLabel")}>
          <input required type="date" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("endDateLabel")}>
          <input required type="date" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} className={inputClass} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("locationLabel")}>
          <input required value={form.location} onChange={(e) => update("location", e.target.value)} className={inputClass} placeholder="Freedom Park" />
        </Field>
        <Field label={t("categoryLabel")}>
          <select value={form.category} onChange={(e) => update("category", e.target.value as EventFormInput["category"])} className={inputClass}>
            <option value="cultural">{t("categoryCultural")}</option>
            <option value="national">{t("categoryNational")}</option>
            <option value="business">{t("categoryBusiness")}</option>
            <option value="sports">{t("categorySports")}</option>
            <option value="concert">{t("categoryConcert")}</option>
          </select>
        </Field>
      </div>

      <GoogleMapsLocationField
        googleMapsUrl={form.googleMapsUrl ?? ""}
        onGoogleMapsUrlChange={(url) => update("googleMapsUrl", url)}
        lat={form.lat}
        lng={form.lng}
        onCoordsChange={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))}
      />

      <Field label={t("ticketInfoLabel")} hint={t("ticketInfoHint")}>
        <input value={form.ticketInfo} onChange={(e) => update("ticketInfo", e.target.value)} className={inputClass} />
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("phoneLabel")}>
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
        </Field>
        <Field label={t("whatsappLabel")}>
          <input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("emailLabel")}>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("websiteLabel")}>
          <input type="url" value={form.website} onChange={(e) => update("website", e.target.value)} className={inputClass} placeholder="https://…" />
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

      <AmenitiesPicker listingType="event" values={form.amenitiesV2} onChange={(v) => update("amenitiesV2", v)} label={t("amenitiesLabel")} />

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

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-70"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />}
        {mode === "create" ? t("publishEvent") : t("saveChanges")}
      </button>
    </form>
  );
}
