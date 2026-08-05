"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/shared/image-uploader";
import { GalleryManager } from "@/components/admin/gallery-manager";
import { VideoUploader } from "@/components/shared/video-uploader";
import { HOTEL_GALLERY_CATEGORIES } from "@/lib/utils/gallery-categories";
import { HotelRoomsManager, type HotelRoomManagerRow } from "@/components/admin/hotel-rooms-manager";
import { GoogleMapsLocationField } from "@/components/admin/google-maps-location-field";
import { Field, TagInput, inputClass } from "@/components/admin/form-shared";
import { AmenitiesPicker } from "@/components/admin/amenities-picker";
import { OpeningHoursEditor } from "@/components/shared/opening-hours-editor";
import { createRecord, updateRecord } from "@/lib/actions/admin";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";
import type { Locale } from "@/lib/i18n/config";
import type { GalleryImage, MediaVideo, HotelBookingMode, HotelExternalBookingOption, OpeningHoursGroup } from "@/types";

const EXTERNAL_BOOKING_OPTIONS: HotelExternalBookingOption[] = ["website", "booking_com", "whatsapp", "custom_url"];

export interface HotelFormInput {
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
  website?: string;
  whatsapp?: string;
  email?: string;
  socialInstagram?: string;
  socialFacebook?: string;
  socialTiktok?: string;
  socialSnapchat?: string;
  socialX?: string;
  socialYoutube?: string;
  socialTelegram?: string;
  priceRange: "$" | "$$" | "$$$" | "$$$$";
  amenities: string[];
  amenitiesV2: string[];
  openingHoursStructured: OpeningHoursGroup[];
  is24Hours: boolean;
  temporarilyClosed: boolean;
  permanentlyClosed: boolean;
  checkInTime: string;
  checkOutTime: string;
  languages: string[];
  restaurantId: string;
  cafeId: string;
  featured: boolean;
  bookingMode: HotelBookingMode;
  externalBookingOption: HotelExternalBookingOption | "";
  externalBookingUrl: string;
  bookingWhatsapp: string;
  bookingComUrl: string;
}

const AMENITY_SUGGESTIONS = [
  "Free WiFi", "Parking", "Restaurant", "Generator Backup", "Conference Room",
  "Room Service", "Air Conditioning", "Gym", "Garden", "Airport Shuttle",
];

const LANGUAGE_SUGGESTIONS = ["English", "Somali", "Arabic"];

export function HotelForm({
  locale,
  mode,
  hotelId,
  initial,
  restaurantOptions = [],
  cafeOptions = [],
  initialRooms = [],
  canFeature = true,
}: {
  locale: Locale;
  mode: "create" | "edit";
  hotelId?: string;
  initial?: Partial<HotelFormInput>;
  restaurantOptions?: { id: string; name: string }[];
  cafeOptions?: { id: string; name: string }[];
  initialRooms?: HotelRoomManagerRow[];
  // Only the platform owner may toggle homepage featuring — business
  // owners reach this same form (requireListingsAccess) to manage their
  // own listing, but self-promoting to "featured" isn't theirs to grant.
  canFeature?: boolean;
}) {
  const t = useTranslations("admin");
  const tw = useTranslations("weekdays");
  const [form, setForm] = useState<HotelFormInput>({
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
    website: initial?.website ?? "",
    whatsapp: initial?.whatsapp ?? "",
    email: initial?.email ?? "",
    socialInstagram: initial?.socialInstagram ?? "",
    socialFacebook: initial?.socialFacebook ?? "",
    socialTiktok: initial?.socialTiktok ?? "",
    socialSnapchat: initial?.socialSnapchat ?? "",
    socialX: initial?.socialX ?? "",
    socialYoutube: initial?.socialYoutube ?? "",
    socialTelegram: initial?.socialTelegram ?? "",
    priceRange: initial?.priceRange ?? "$$",
    amenities: initial?.amenities ?? [],
    amenitiesV2: initial?.amenitiesV2 ?? [],
    openingHoursStructured: initial?.openingHoursStructured ?? [],
    is24Hours: initial?.is24Hours ?? false,
    temporarilyClosed: initial?.temporarilyClosed ?? false,
    permanentlyClosed: initial?.permanentlyClosed ?? false,
    checkInTime: initial?.checkInTime ?? "",
    checkOutTime: initial?.checkOutTime ?? "",
    languages: initial?.languages ?? [],
    restaurantId: initial?.restaurantId ?? "",
    cafeId: initial?.cafeId ?? "",
    featured: initial?.featured ?? false,
    bookingMode: initial?.bookingMode ?? "go_hargeisa",
    externalBookingOption: initial?.externalBookingOption ?? "",
    externalBookingUrl: initial?.externalBookingUrl ?? "",
    bookingWhatsapp: initial?.bookingWhatsapp ?? "",
    bookingComUrl: initial?.bookingComUrl ?? "",
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
      logo_url: form.logo || null,
      gallery: form.gallery,
      videos: form.videos,
      address: form.address,
      lat: form.lat,
      lng: form.lng,
      google_maps_url: form.googleMapsUrl || null,
      phone: form.phone || null,
      website: form.website || null,
      whatsapp: form.whatsapp || null,
      email: form.email || null,
      social_instagram: form.socialInstagram || null,
      social_facebook: form.socialFacebook || null,
      social_tiktok: form.socialTiktok || null,
      social_snapchat: form.socialSnapchat || null,
      social_x: form.socialX || null,
      social_youtube: form.socialYoutube || null,
      social_telegram: form.socialTelegram || null,
      price_range: form.priceRange,
      amenities: form.amenities,
      amenities_v2: form.amenitiesV2,
      opening_hours_structured: form.openingHoursStructured,
      is_24_hours: form.is24Hours,
      temporarily_closed: form.temporarilyClosed,
      permanently_closed: form.permanentlyClosed,
      check_in_time: form.checkInTime || null,
      check_out_time: form.checkOutTime || null,
      languages: form.languages,
      restaurant_id: form.restaurantId || null,
      cafe_id: form.cafeId || null,
      featured: form.featured,
      booking_mode: form.bookingMode,
      external_booking_option: form.bookingMode === "external" ? form.externalBookingOption || null : null,
      external_booking_url: form.externalBookingUrl || null,
      booking_whatsapp: form.bookingWhatsapp || null,
      booking_com_url: form.bookingComUrl || null,
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
    <div className="max-w-2xl space-y-10">
      <form onSubmit={onSubmit} className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <ImageUploader folder="hotels" value={form.coverImage} onChange={(url) => update("coverImage", url)} label="Cover image" />
          <ImageUploader folder="hotels/logos" value={form.logo} onChange={(url) => update("logo", url)} label="Hotel logo" rounded="rounded-full" />
        </div>

        <GalleryManager
          folder="hotels/gallery"
          value={form.gallery}
          onChange={(v) => update("gallery", v)}
          categories={HOTEL_GALLERY_CATEGORIES}
          coverUrl={form.coverImage}
          onSetCover={(url) => update("coverImage", url)}
          setCoverLabel={t("setAsCoverLabel")}
          coverBadgeLabel={t("coverBadgeLabel")}
        />

        <VideoUploader
          folder="hotels/videos"
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

        <GoogleMapsLocationField
          googleMapsUrl={form.googleMapsUrl ?? ""}
          onGoogleMapsUrlChange={(url) => update("googleMapsUrl", url)}
          lat={form.lat}
          lng={form.lng}
          onCoordsChange={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))}
        />

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
            <input type="url" value={form.socialInstagram} onChange={(e) => update("socialInstagram", e.target.value)} className={inputClass} placeholder="https://instagram.com/…" />
          </Field>
          <Field label={t("socialFacebookLabel")}>
            <input type="url" value={form.socialFacebook} onChange={(e) => update("socialFacebook", e.target.value)} className={inputClass} placeholder="https://facebook.com/…" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("socialTiktokLabel")}>
            <input type="url" value={form.socialTiktok} onChange={(e) => update("socialTiktok", e.target.value)} className={inputClass} placeholder="https://tiktok.com/@…" />
          </Field>
          <Field label={t("socialSnapchatLabel")}>
            <input type="url" value={form.socialSnapchat} onChange={(e) => update("socialSnapchat", e.target.value)} className={inputClass} placeholder="https://snapchat.com/add/…" />
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t("socialXLabel")}>
            <input type="url" value={form.socialX} onChange={(e) => update("socialX", e.target.value)} className={inputClass} placeholder="https://x.com/…" />
          </Field>
          <Field label={t("socialYoutubeLabel")}>
            <input type="url" value={form.socialYoutube} onChange={(e) => update("socialYoutube", e.target.value)} className={inputClass} placeholder="https://youtube.com/@…" />
          </Field>
        </div>

        <Field label={t("socialTelegramLabel")}>
          <input type="url" value={form.socialTelegram} onChange={(e) => update("socialTelegram", e.target.value)} className={inputClass} placeholder="https://t.me/…" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Check-in time" hint="e.g. 14:00 or 2:00 PM">
            <input value={form.checkInTime} onChange={(e) => update("checkInTime", e.target.value)} className={inputClass} placeholder="14:00" />
          </Field>
          <Field label="Check-out time" hint="e.g. 12:00 or noon">
            <input value={form.checkOutTime} onChange={(e) => update("checkOutTime", e.target.value)} className={inputClass} placeholder="12:00" />
          </Field>
        </div>

        <div className="space-y-4 rounded-2xl border border-ink/8 p-4 dark:border-white/10">
          <div>
            <p className="font-semibold">{t("bookingSettingsLabel")}</p>
            <p className="mt-0.5 text-xs text-ink/50 dark:text-sand/50">{t("bookingSettingsAdminHint")}</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {(["go_hargeisa", "external"] as HotelBookingMode[]).map((mode) => {
              const active = form.bookingMode === mode;
              return (
                <button
                  key={mode}
                  type="button"
                  onClick={() => update("bookingMode", mode)}
                  aria-pressed={active}
                  className={`flex items-center gap-2 rounded-xl border p-3 text-start text-sm transition-all duration-200 ${
                    active ? "border-primary bg-primary/5 dark:bg-primary/10" : "border-ink/12 dark:border-white/15"
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      active ? "border-primary bg-primary text-white" : "border-ink/25 dark:border-white/25"
                    }`}
                  >
                    {active && <Check size={12} aria-hidden="true" />}
                  </span>
                  <span className="font-medium">
                    {mode === "go_hargeisa" ? t("bookingModeGoHargeisa") : t("bookingModeExternal")}
                  </span>
                </button>
              );
            })}
          </div>

          {form.bookingMode === "external" && (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("externalBookingOptionLabel")}>
                <select
                  value={form.externalBookingOption}
                  onChange={(e) => update("externalBookingOption", e.target.value as HotelExternalBookingOption)}
                  className={inputClass}
                >
                  <option value="">—</option>
                  {EXTERNAL_BOOKING_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {t(`externalOption_${option}`)}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label={t("bookingComUrlLabel")}>
                <input value={form.bookingComUrl} onChange={(e) => update("bookingComUrl", e.target.value)} className={inputClass} />
              </Field>
              <Field label={t("bookingWhatsappLabel")}>
                <input value={form.bookingWhatsapp} onChange={(e) => update("bookingWhatsapp", e.target.value)} className={inputClass} />
              </Field>
              <Field label={t("externalBookingUrlLabel")}>
                <input value={form.externalBookingUrl} onChange={(e) => update("externalBookingUrl", e.target.value)} className={inputClass} />
              </Field>
            </div>
          )}
        </div>

        <TagInput label="Languages spoken" values={form.languages} onChange={(v) => update("languages", v)} placeholder="English, Somali, Arabic…" suggestions={LANGUAGE_SUGGESTIONS} />

        <TagInput label={t("amenitiesLabel")} values={form.amenities} onChange={(v) => update("amenities", v)} placeholder={t("tagInputPlaceholder")} suggestions={AMENITY_SUGGESTIONS} />

        <AmenitiesPicker listingType="hotel" values={form.amenitiesV2} onChange={(v) => update("amenitiesV2", v)} label={t("amenitiesV2Label")} />

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

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="On-site restaurant" hint="Optional — links to an existing restaurant listing">
            <select value={form.restaurantId} onChange={(e) => update("restaurantId", e.target.value)} className={inputClass}>
              <option value="">None</option>
              {restaurantOptions.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </Field>
          <Field label="On-site cafe" hint="Optional — links to an existing cafe listing">
            <select value={form.cafeId} onChange={(e) => update("cafeId", e.target.value)} className={inputClass}>
              <option value="">None</option>
              {cafeOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>

        {canFeature && (
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} />
            {t("featureOnHomepage")}
          </label>
        )}

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

      {mode === "edit" && hotelId && (
        <HotelRoomsManager
          hotelId={hotelId}
          initialRooms={initialRooms}
          revalidatePaths={[`/${locale}/hotels/${form.slug}`, `/${locale}/admin/hotels/${hotelId}/edit`]}
        />
      )}
    </div>
  );
}
