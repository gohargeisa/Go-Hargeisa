"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Check, Loader2, AlertCircle } from "lucide-react";
import { submitJoinRequest } from "@/lib/actions/business-requests";
import { ImageUploader } from "@/components/shared/image-uploader";
import { GalleryManager } from "@/components/admin/gallery-manager-lazy";
import { PdfUploader } from "@/components/admin/pdf-uploader-lazy";
import { VideoUploader } from "@/components/shared/video-uploader-lazy";
import { DocumentsUploader } from "@/components/shared/documents-uploader-lazy";
import { CoordinatesInput } from "@/components/shared/coordinates-input";
import { CustomFieldsEditor, type CustomFieldValues } from "@/components/shared/custom-fields-editor";
import { ServiceTagsPicker } from "@/components/admin/service-tags-picker";
import { PARTNER_AMENITIES, PARTNER_AMENITY_ICON, targetTableToJoinCategory } from "@/lib/utils/partner-categories";
import { DynamicIcon } from "@/lib/utils/dynamic-icon";
import { categoryDisplayName } from "@/lib/utils/category-href";
import { WEEK_DAYS_SAT_FIRST, defaultWeeklyHours } from "@/lib/utils/weekly-hours";
import type { Locale } from "@/lib/i18n/config";
import type { JoinRequestCategory, GalleryImage, MediaVideo, BusinessDocument, Coordinates, WeeklyHoursDay, Category } from "@/types";

type PriceRange = "$" | "$$" | "$$$" | "$$$$";
const PRICE_LEVELS: PriceRange[] = ["$", "$$", "$$$", "$$$$"];

const inputClass =
  "w-full rounded-2xl border border-ink/12 bg-transparent px-4 py-3 text-sm outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/15 dark:border-white/15";
const labelClass = "mb-2 block text-sm font-semibold text-ink/85 dark:text-sand/85";

export function JoinRequestForm({
  locale,
  serviceCategories,
  coreCategories,
}: {
  locale: Locale;
  /** Every long-tail `services` category PLUS every City Services category
   * (Hospitals & Clinics, Pharmacies, ...) — the "other" dropdown's full
   * dynamic source, combined at the call site (app/[locale]/join/page.tsx)
   * from getServiceCategories() + getCityServiceCategories(), the exact
   * same source City Services itself reads from. A City Services selection
   * is never auto-convertible (see isConvertibleCategory) — it stays an
   * admin-reviewed lead. */
  serviceCategories: Category[];
  /** The 3 owner-claimable core categories (Hotels/Restaurants/Cafes), fed
   * live from the `categories` table — see CORE_JOIN_TARGET_TABLES. */
  coreCategories: Category[];
}) {
  const t = useTranslations("joinRequest");
  const ta = useTranslations("partnerAmenities");
  const tw = useTranslations("weekdays");
  // Reuses the admin panel's own video-uploader strings (identical UI,
  // already translated in all 3 locales) instead of duplicating them here.
  const tAdmin = useTranslations("admin");

  const [category, setCategory] = useState<JoinRequestCategory>("hotel");
  const [businessName, setBusinessName] = useState("");
  const [description, setDescription] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("Hargeisa");
  const [district, setDistrict] = useState("");
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [mapsUrl, setMapsUrl] = useState("");
  const [logo, setLogo] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [gallery, setGallery] = useState<GalleryImage[]>([]);
  const [videos, setVideos] = useState<MediaVideo[]>([]);
  const [documents, setDocuments] = useState<BusinessDocument[]>([]);
  const [menuPdfUrl, setMenuPdfUrl] = useState("");
  const [bookingUrl, setBookingUrl] = useState("");
  const [openingHours, setOpeningHours] = useState<WeeklyHoursDay[]>(defaultWeeklyHours());
  const [amenities, setAmenities] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<PriceRange | undefined>(undefined);
  const [serviceCategoryId, setServiceCategoryId] = useState<string>(serviceCategories[0]?.id ?? "");
  const [customFields, setCustomFields] = useState<CustomFieldValues>({});
  const [serviceTags, setServiceTags] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const categoryAmenities = PARTNER_AMENITIES[category];
  const selectedServiceCategory = serviceCategories.find((c) => c.id === serviceCategoryId);

  function selectCategory(next: JoinRequestCategory) {
    setCategory(next);
    setAmenities([]);
    setCustomFields({});
    setServiceTags([]);
  }

  function toggleAmenity(code: string) {
    setAmenities((a) => (a.includes(code) ? a.filter((x) => x !== code) : [...a, code]));
  }

  function updateHoursDay(day: WeeklyHoursDay["day"], patch: Partial<WeeklyHoursDay>) {
    setOpeningHours((hours) => hours.map((h) => (h.day === day ? { ...h, ...patch } : h)));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!confirmed) {
      setError(t("confirmationRequiredError"));
      return;
    }
    if (category === "other" && !serviceCategoryId) {
      setError(t("selectCategoryError"));
      return;
    }
    startTransition(async () => {
      const result = await submitJoinRequest({
        category,
        categoryId: category === "other" ? serviceCategoryId || undefined : undefined,
        customFields: category === "other" ? customFields : undefined,
        serviceTags: category === "other" ? serviceTags : undefined,
        businessName,
        phone,
        whatsapp: whatsapp || undefined,
        email,
        website: website || undefined,
        instagram: instagram || undefined,
        facebook: facebook || undefined,
        address,
        city,
        district: district || undefined,
        lat: location?.lat,
        lng: location?.lng,
        mapsUrl: mapsUrl || undefined,
        description,
        logo: logo || undefined,
        coverImage: coverImage || undefined,
        gallery,
        videos,
        documents,
        menuPdfUrl: menuPdfUrl || undefined,
        bookingUrl: bookingUrl || undefined,
        openingHours,
        amenities,
        priceRange,
      });

      if (result.ok) {
        setSubmitted(true);
      } else {
        setError(result.error ?? t("somethingWentWrong"));
      }
    });
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-secondary/25 bg-secondary/5 p-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-secondary/15 text-secondary-700">
          <Check size={26} />
        </span>
        <p className="font-display text-xl font-bold">{t("successTitle")}</p>
        <p className="max-w-md text-sm leading-relaxed text-ink/60 dark:text-sand/60">{t("successDescription")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-12">
      {/* Business Type */}
      <div id="business-type" className="scroll-mt-24">
        <label className={labelClass}>{t("categoryLabel")}</label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {coreCategories.map((c) => {
            const cat = targetTableToJoinCategory(c.targetTable);
            const active = category === cat;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => selectCategory(cat)}
                aria-pressed={active}
                className={`flex flex-col items-center gap-2 rounded-2xl border p-4 text-center transition-all duration-200 ${
                  active
                    ? "border-primary bg-primary/8 shadow-soft"
                    : "border-ink/10 hover:border-primary/40 hover:bg-primary/5 dark:border-white/15"
                }`}
              >
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                    active ? "bg-primary text-white" : "bg-ink/5 text-ink/60 dark:bg-white/10 dark:text-sand/60"
                  }`}
                >
                  <DynamicIcon name={c.icon} size={20} aria-hidden="true" />
                </span>
                <span className={`text-xs font-semibold ${active ? "text-primary-700" : "text-ink/75 dark:text-sand/75"}`}>
                  {categoryDisplayName(c, locale)}
                </span>
              </button>
            );
          })}
        </div>

        {serviceCategories.length > 0 && (
          <div className="mt-4">
            <label htmlFor="jr-other-category" className={labelClass}>{t("otherCategoryLabel")}</label>
            <select
              id="jr-other-category"
              value={category === "other" ? serviceCategoryId : ""}
              onChange={(e) => {
                selectCategory("other");
                setServiceCategoryId(e.target.value);
              }}
              className={inputClass}
            >
              <option value="" disabled>{t("selectCategoryPlaceholder")}</option>
              {serviceCategories.map((c) => (
                <option key={c.id} value={c.id}>{categoryDisplayName(c, locale)}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Business Information */}
      <div>
        <h2 className="mb-5 font-display text-lg font-bold">{t("businessInfoTitle")}</h2>
        <div className="space-y-5">
          <div>
            <label htmlFor="jr-businessName" className={labelClass}>{t("businessNameLabel")}</label>
            <input id="jr-businessName" required value={businessName} onChange={(e) => setBusinessName(e.target.value)} className={inputClass} />
          </div>

          <div>
            <label htmlFor="jr-description" className={labelClass}>{t("descriptionLabel")}</label>
            <textarea
              id="jr-description"
              required
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={`${inputClass} resize-none leading-relaxed`}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="jr-phone" className={labelClass}>{t("phoneLabel")}</label>
              <input id="jr-phone" required type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
            </div>
            <div>
              <label htmlFor="jr-whatsapp" className={labelClass}>{t("whatsappLabel")}</label>
              <input id="jr-whatsapp" type="tel" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
            </div>
            <div>
              <label htmlFor="jr-email" className={labelClass}>{t("emailLabel")}</label>
              <input id="jr-email" required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <label htmlFor="jr-website" className={labelClass}>{t("websiteLabel")}</label>
              <input id="jr-website" type="url" value={website} onChange={(e) => setWebsite(e.target.value)} className={inputClass} placeholder="https://…" />
            </div>
            <div>
              <label htmlFor="jr-instagram" className={labelClass}>{t("instagramLabel")}</label>
              <input id="jr-instagram" type="url" value={instagram} onChange={(e) => setInstagram(e.target.value)} className={inputClass} placeholder="https://instagram.com/…" />
            </div>
            <div>
              <label htmlFor="jr-facebook" className={labelClass}>{t("facebookLabel")}</label>
              <input id="jr-facebook" type="url" value={facebook} onChange={(e) => setFacebook(e.target.value)} className={inputClass} placeholder="https://facebook.com/…" />
            </div>
          </div>

          {(category === "restaurant" || category === "cafe") && (
            <PdfUploader folder="join-requests/menus" value={menuPdfUrl} onChange={setMenuPdfUrl} label={t("menuPdfLabel")} />
          )}

          {category === "hotel" && (
            <div>
              <label htmlFor="jr-bookingUrl" className={labelClass}>{t("bookingUrlLabel")}</label>
              <input id="jr-bookingUrl" type="url" value={bookingUrl} onChange={(e) => setBookingUrl(e.target.value)} className={inputClass} placeholder="https://…" />
            </div>
          )}

          {category === "other" && selectedServiceCategory && selectedServiceCategory.customFieldsSchema.length > 0 && (
            <CustomFieldsEditor
              schema={selectedServiceCategory.customFieldsSchema}
              values={customFields}
              onChange={setCustomFields}
              inputClass={inputClass}
            />
          )}

          {category === "other" && selectedServiceCategory && (
            <ServiceTagsPicker
              categorySlug={selectedServiceCategory.slug}
              locale={locale}
              values={serviceTags}
              onChange={setServiceTags}
              label={selectedServiceCategory.slug === "cosmetics-beauty" ? tAdmin("businessSpecialtiesLabel") : tAdmin("serviceTagsLabel")}
            />
          )}
        </div>
      </div>

      {/* Address */}
      <div>
        <h2 className="mb-5 font-display text-lg font-bold">{t("addressTitle")}</h2>
        <div className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="jr-city" className={labelClass}>{t("cityLabel")}</label>
              <input id="jr-city" required value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label htmlFor="jr-district" className={labelClass}>{t("districtLabel")}</label>
              <input id="jr-district" value={district} onChange={(e) => setDistrict(e.target.value)} className={inputClass} placeholder={t("districtPlaceholder")} />
            </div>
          </div>

          <div>
            <label htmlFor="jr-address" className={labelClass}>{t("addressLabel")}</label>
            <input id="jr-address" required value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} placeholder={t("addressPlaceholder")} />
          </div>

          <div>
            <label className={labelClass}>{t("mapPickerLabel")}</label>
            <p className="mb-2.5 text-xs text-ink/50 dark:text-sand/50">{t("mapPickerHint")}</p>
            <CoordinatesInput
              value={location}
              onChange={setLocation}
              pasteLabel={t("coordPasteLabel")}
              pasteErrorLabel={t("coordPasteError")}
              latLabel={t("coordLatLabel")}
              lngLabel={t("coordLngLabel")}
              confirmedLabel={(lat, lng) => t("locationPickedLabel", { lat, lng })}
            />
          </div>

          <div>
            <label htmlFor="jr-mapsUrl" className={labelClass}>{t("mapsUrlLabel")}</label>
            <input id="jr-mapsUrl" type="url" value={mapsUrl} onChange={(e) => setMapsUrl(e.target.value)} className={inputClass} placeholder="https://maps.google.com/…" />
          </div>
        </div>
      </div>

      {/* Images */}
      <div>
        <h2 className="mb-5 font-display text-lg font-bold">{t("imagesTitle")}</h2>
        <div className="space-y-5">
          <div className="grid gap-6 sm:grid-cols-2">
            <ImageUploader folder="join-requests/logos" value={logo} onChange={setLogo} label={t("logoLabel")} rounded="rounded-full" />
            <ImageUploader folder="join-requests/covers" value={coverImage} onChange={setCoverImage} label={t("coverImageLabel")} />
          </div>
          <GalleryManager
            folder="join-requests/gallery"
            value={gallery}
            onChange={setGallery}
            categories={[{ value: "photo", label: t("galleryPhotoCategoryLabel") }]}
          />
        </div>
      </div>

      {/* Videos */}
      <div>
        <h2 className="mb-5 font-display text-lg font-bold">{t("videosTitle")}</h2>
        <VideoUploader
          folder="join-requests/videos"
          value={videos}
          onChange={setVideos}
          label={tAdmin("videosLabel")}
          addLabel={tAdmin("addVideoLabel")}
          hint={tAdmin("videosHint")}
          captionPlaceholder={tAdmin("videoCaptionPlaceholder")}
          removeAriaLabel={tAdmin("removeVideoAriaLabel")}
          replaceAriaLabel={tAdmin("replaceVideoAriaLabel")}
          moveEarlierAriaLabel={tAdmin("moveVideoEarlierAriaLabel")}
          moveLaterAriaLabel={tAdmin("moveVideoLaterAriaLabel")}
        />
      </div>

      {/* Documents */}
      <div>
        <h2 className="mb-5 font-display text-lg font-bold">{t("documentsTitle")}</h2>
        <DocumentsUploader
          folder="join-requests/documents"
          value={documents}
          onChange={setDocuments}
          label={t("documentsLabel")}
          hint={t("documentsHint")}
        />
      </div>

      {/* Opening Hours */}
      <div>
        <h2 className="mb-5 font-display text-lg font-bold">{t("openingHoursTitle")}</h2>
        <div className="divide-y divide-ink/8 overflow-hidden rounded-2xl border border-ink/12 dark:divide-white/10 dark:border-white/15">
          {WEEK_DAYS_SAT_FIRST.map((day) => {
            const entry = openingHours.find((h) => h.day === day)!;
            return (
              <div key={day} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:gap-4">
                <span className="w-full shrink-0 text-sm font-semibold sm:w-32">{tw(day)}</span>
                <div className="flex flex-1 flex-wrap items-center gap-3">
                  <input
                    type="time"
                    aria-label={`${tw(day)} ${tAdmin("hoursOpenLabel")}`}
                    value={entry.open}
                    disabled={entry.closed}
                    onChange={(e) => updateHoursDay(day, { open: e.target.value })}
                    className={`${inputClass} w-auto py-2 disabled:opacity-40`}
                  />
                  <span className="text-ink/40 dark:text-sand/40">–</span>
                  <input
                    type="time"
                    aria-label={`${tw(day)} ${tAdmin("hoursCloseLabel")}`}
                    value={entry.close}
                    disabled={entry.closed}
                    onChange={(e) => updateHoursDay(day, { close: e.target.value })}
                    className={`${inputClass} w-auto py-2 disabled:opacity-40`}
                  />
                  <label className="ms-auto flex items-center gap-2 text-xs font-semibold text-ink/60 dark:text-sand/60">
                    <input
                      type="checkbox"
                      checked={entry.closed}
                      onChange={(e) => updateHoursDay(day, { closed: e.target.checked })}
                    />
                    {t("closedToggleLabel")}
                  </label>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Amenities */}
      {categoryAmenities && categoryAmenities.length > 0 && (
        <div>
          <h2 className="mb-5 font-display text-lg font-bold">{t("amenitiesTitle")}</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {categoryAmenities.map((code) => {
              const Icon = PARTNER_AMENITY_ICON[code];
              const active = amenities.includes(code);
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => toggleAmenity(code)}
                  aria-pressed={active}
                  className={`flex items-center gap-2.5 rounded-2xl border p-3.5 text-start text-sm font-medium transition-colors ${
                    active
                      ? "border-primary bg-primary/8 text-primary-800"
                      : "border-ink/10 text-ink/70 hover:border-primary/40 dark:border-white/15 dark:text-sand/70"
                  }`}
                >
                  <Icon size={17} className="shrink-0" aria-hidden="true" />
                  {ta(code)}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Pricing */}
      <div>
        <h2 className="mb-5 font-display text-lg font-bold">{t("pricingTitle")}</h2>
        <div className="grid grid-cols-4 gap-3">
          {PRICE_LEVELS.map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setPriceRange(level)}
              aria-pressed={priceRange === level}
              className={`rounded-2xl border p-4 text-center font-display text-lg font-bold transition-colors ${
                priceRange === level
                  ? "border-primary bg-primary/8 text-primary-800"
                  : "border-ink/10 text-ink/60 hover:border-primary/40 dark:border-white/15 dark:text-sand/60"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      {/* Final */}
      <div className="space-y-5 border-t border-ink/8 pt-8 dark:border-white/10">
        <label className="flex items-start gap-3 text-sm text-ink/75 dark:text-sand/75">
          <input
            type="checkbox"
            required
            checked={confirmed}
            onChange={(e) => setConfirmed(e.target.checked)}
            className="mt-0.5 shrink-0"
          />
          {t("confirmationLabel")}
        </label>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/15 dark:text-red-300">
            <AlertCircle size={16} className="shrink-0" aria-hidden="true" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3.5 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(245,158,11,0.3)] transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-[0_14px_30px_rgba(245,158,11,0.4)] disabled:translate-y-0 disabled:opacity-70 disabled:shadow-none sm:w-auto"
        >
          {isPending && <Loader2 size={14} className="animate-spin" />} {t("submitButton")}
        </button>
      </div>
    </form>
  );
}
