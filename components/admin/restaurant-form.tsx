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
import { RESTAURANT_GALLERY_CATEGORIES } from "@/lib/utils/gallery-categories";
import { OpeningHoursEditor } from "@/components/shared/opening-hours-editor";
import { AmenitiesPicker } from "@/components/admin/amenities-picker";
import { AssignedOwnerField, type AssignedOwner } from "@/components/admin/assigned-owner-field";
import { FeaturedPartnerPromoEditor } from "@/components/admin/featured-partner-promo-editor";
import { RESTAURANT_TYPE_ORDER, restaurantTypeLabel } from "@/lib/config/restaurant-attributes";
import { LANGUAGE_SPOKEN_OPTIONS, languageSpokenLabel } from "@/lib/config/hotel-attributes";
import type { Locale } from "@/lib/i18n/config";
import type { GalleryImage, MediaVideo, OpeningHoursGroup } from "@/types";

export interface RestaurantFormInput {
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
  cuisine: string[];
  priceRange: "$" | "$$" | "$$$";
  openingHours: string;
  openingHoursStructured: OpeningHoursGroup[];
  is24Hours: boolean;
  temporarilyClosed: boolean;
  permanentlyClosed: boolean;
  menuHighlights: { name: string; price: string; description?: string }[];
  menuPdfUrl: string;
  reservable: boolean;
  featured: boolean;
  isPartner: boolean;
  amenitiesV2: string[];
  restaurantType: string;
  seatingCapacity?: number;
  numberOfTables?: number;
  onlineOrderUrl: string;
  onlineOrderingEnabled: boolean;
  phoneOrderingEnabled: boolean;
  languages: string[];
}

const CUISINE_SUGGESTIONS = ["Somali", "Grill", "International", "Seafood", "Fast Food", "Ethiopian"];

export function RestaurantForm({
  locale,
  mode,
  restaurantId,
  initial,
  canFeature = true,
  canAssignOwner = false,
  initialOwner = null,
}: {
  locale: Locale;
  mode: "create" | "edit";
  restaurantId?: string;
  initial?: Partial<RestaurantFormInput>;
  // Only the platform owner may toggle homepage featuring — business
  // owners reach this same form (requireListingsAccess) to manage their
  // own listing, but self-promoting to "featured" isn't theirs to grant.
  canFeature?: boolean;
  // Same owner-only gate as canFeature — a business_owner never sees the
  // Assigned Owner field at all (see AssignedOwnerField's own doc comment).
  canAssignOwner?: boolean;
  initialOwner?: AssignedOwner | null;
}) {
  const t = useTranslations("admin");
  const tw = useTranslations("weekdays");
  const [form, setForm] = useState<RestaurantFormInput>({
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
    cuisine: initial?.cuisine ?? [],
    priceRange: initial?.priceRange ?? "$$",
    openingHours: initial?.openingHours ?? "",
    openingHoursStructured: initial?.openingHoursStructured ?? [],
    is24Hours: initial?.is24Hours ?? false,
    temporarilyClosed: initial?.temporarilyClosed ?? false,
    permanentlyClosed: initial?.permanentlyClosed ?? false,
    menuHighlights: initial?.menuHighlights ?? [],
    menuPdfUrl: initial?.menuPdfUrl ?? "",
    reservable: initial?.reservable ?? false,
    featured: initial?.featured ?? false,
    isPartner: initial?.isPartner ?? false,
    amenitiesV2: initial?.amenitiesV2 ?? [],
    restaurantType: initial?.restaurantType ?? "",
    seatingCapacity: initial?.seatingCapacity,
    numberOfTables: initial?.numberOfTables,
    onlineOrderUrl: initial?.onlineOrderUrl ?? "",
    onlineOrderingEnabled: initial?.onlineOrderingEnabled ?? false,
    phoneOrderingEnabled: initial?.phoneOrderingEnabled ?? false,
    languages: initial?.languages ?? [],
  });
  const [owner, setOwner] = useState<AssignedOwner | null>(initialOwner);
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
      // Only meaningful on create — an edit's owner changes are persisted
      // immediately by AssignedOwnerField via transferOwnership/
      // removeOwnership, not through this payload (updateRecord never
      // reads owner_id at all, so a business_owner submitting this form
      // has no field here that could change ownership).
      owner_id: mode === "create" ? owner?.id ?? null : undefined,
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
      cuisine: form.cuisine,
      price_range: form.priceRange,
      opening_hours: form.openingHours,
      opening_hours_structured: form.openingHoursStructured,
      is_24_hours: form.is24Hours,
      temporarily_closed: form.temporarilyClosed,
      permanently_closed: form.permanentlyClosed,
      menu: form.menuHighlights,
      menu_pdf_url: form.menuPdfUrl || null,
      reservable: form.reservable,
      featured: form.featured,
      is_partner: form.isPartner,
      amenities_v2: form.amenitiesV2,
      restaurant_type: form.restaurantType || null,
      seating_capacity: form.seatingCapacity ?? null,
      number_of_tables: form.numberOfTables ?? null,
      online_order_url: form.onlineOrderUrl || null,
      online_ordering_enabled: form.onlineOrderingEnabled,
      phone_ordering_enabled: form.phoneOrderingEnabled,
      languages: form.languages,
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
        coverUrl={form.coverImage}
        onSetCover={(url) => update("coverImage", url)}
        setCoverLabel={t("setAsCoverLabel")}
        coverBadgeLabel={t("coverBadgeLabel")}
      />

      <VideoUploader
        folder="restaurants/videos"
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
        <Field label="Restaurant type">
          <select value={form.restaurantType} onChange={(e) => update("restaurantType", e.target.value)} className={inputClass}>
            <option value="">—</option>
            {RESTAURANT_TYPE_ORDER.map((type) => (
              <option key={type} value={type}>{restaurantTypeLabel(type, locale)}</option>
            ))}
          </select>
        </Field>
        <Field label="Online ordering URL">
          <input type="url" value={form.onlineOrderUrl} onChange={(e) => update("onlineOrderUrl", e.target.value)} className={inputClass} placeholder="https://…" />
        </Field>
      </div>

      <div className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={form.onlineOrderingEnabled}
            onChange={(e) => update("onlineOrderingEnabled", e.target.checked)}
          />
          {t("acceptsOnlineOrders")}
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            checked={form.phoneOrderingEnabled}
            onChange={(e) => update("phoneOrderingEnabled", e.target.checked)}
          />
          {t("acceptsPhoneOrders")}
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Seating capacity">
          <input type="number" min={1} value={form.seatingCapacity ?? ""} onChange={(e) => update("seatingCapacity", e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
        </Field>
        <Field label="Number of tables">
          <input type="number" min={1} value={form.numberOfTables ?? ""} onChange={(e) => update("numberOfTables", e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
        </Field>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold">Languages spoken</label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {LANGUAGE_SPOKEN_OPTIONS.map((value) => (
            <label key={value} className="flex items-center gap-2 text-sm font-medium">
              <input
                type="checkbox"
                checked={form.languages.includes(value)}
                onChange={() =>
                  update("languages", form.languages.includes(value) ? form.languages.filter((v) => v !== value) : [...form.languages, value])
                }
              />
              {languageSpokenLabel(value, locale)}
            </label>
          ))}
        </div>
      </div>

      <AmenitiesPicker listingType="restaurant" values={form.amenitiesV2} onChange={(v) => update("amenitiesV2", v)} label={t("amenitiesLabel")} />

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

      <TagInput label={t("cuisineLabel")} values={form.cuisine} onChange={(v) => update("cuisine", v)} placeholder={t("tagInputPlaceholder")} suggestions={CUISINE_SUGGESTIONS} />

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
        {canFeature && (
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.featured} onChange={(e) => update("featured", e.target.checked)} />
            {t("featureOnHomepage")}
          </label>
        )}
        {canFeature && (
          <label className="flex items-center gap-2 text-sm font-medium">
            <input type="checkbox" checked={form.isPartner} onChange={(e) => update("isPartner", e.target.checked)} />
            {t("goHargeisaPartner")}
          </label>
        )}
        {canFeature && mode === "edit" && restaurantId && form.isPartner && (
          <FeaturedPartnerPromoEditor listingType="restaurant" listingId={restaurantId} />
        )}
      </div>

      {canAssignOwner && (
        <AssignedOwnerField
          locale={locale}
          mode={mode}
          listingType="restaurant"
          listingId={restaurantId}
          value={owner}
          onChange={setOwner}
        />
      )}

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
