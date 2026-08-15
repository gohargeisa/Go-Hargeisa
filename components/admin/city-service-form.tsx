"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { ImageUploader } from "@/components/shared/image-uploader";
import { GalleryManager } from "@/components/admin/gallery-manager-lazy";
import { VideoUploader } from "@/components/shared/video-uploader-lazy";
import { PdfUploader } from "@/components/admin/pdf-uploader";
import { getDocumentLabelGroup } from "@/lib/utils/business-document";
import { GoogleMapsLocationField } from "@/components/admin/google-maps-location-field";
import { OpeningHoursEditor } from "@/components/shared/opening-hours-editor";
import { AmenitiesPicker } from "@/components/admin/amenities-picker";
import { ServiceTagsPicker } from "@/components/admin/service-tags-picker";
import { Field, inputClass, TagInput } from "@/components/admin/form-shared";
import {
  SCHOOL_TYPE_ORDER,
  schoolTypeLabel,
  CURRICULUM_ORDER,
  curriculumLabel,
  EDUCATION_LEVEL_ORDER,
  educationLevelLabel,
  UNIVERSITY_TYPE_ORDER,
  universityTypeLabel,
  DEGREE_LEVEL_ORDER,
  degreeLevelLabel,
  FACULTY_ORDER,
  facultyLabel,
  SCHOOL_FACILITY_CODES,
  UNIVERSITY_FACILITY_CODES,
  EDUCATION_FACILITY_ICON,
  educationFacilityLabel,
} from "@/lib/config/education-attributes";
import { SALON_TYPE_ORDER, salonTypeLabel, SHOP_TYPE_ORDER, shopTypeLabel } from "@/lib/config/salon-attributes";
import { LANGUAGE_SPOKEN_OPTIONS, languageSpokenLabel } from "@/lib/config/hotel-attributes";
import { STORE_TYPE_ORDER, storeTypeLabel } from "@/lib/config/retail-store-attributes";
import { RENTAL_TYPE_ORDER, rentalTypeLabel, VEHICLE_TYPE_ORDER, vehicleTypeLabel } from "@/lib/config/car-rental-attributes";
import { CLINIC_TYPE_ORDER, clinicTypeLabel } from "@/lib/config/clinic-attributes";
import { GARAGE_TYPE_ORDER, garageTypeLabel } from "@/lib/config/auto-repair-attributes";
import {
  GYM_TYPE_ORDER,
  gymTypeLabel,
  CLASS_OFFERED_ORDER,
  classOfferedLabel,
  GYM_FACILITY_ORDER,
  GYM_FACILITY_ICON,
  gymFacilityLabel,
} from "@/lib/config/gym-attributes";
import { AssignedOwnerField, type AssignedOwner } from "@/components/admin/assigned-owner-field";
import { createCityService, updateCityService } from "@/lib/actions/city-services";
import { useUnsavedChangesWarning } from "@/lib/hooks/use-unsaved-changes-warning";
import { SERVICE_GALLERY_CATEGORIES } from "@/lib/utils/gallery-categories";
import { GroupedCategorySelect } from "@/components/shared/grouped-category-select";
import type { Locale } from "@/lib/i18n/config";
import type { Category, GalleryImage, MediaVideo, OpeningHoursGroup } from "@/types";

export interface CityServiceFormInput {
  categoryId: string;
  name: string;
  nameAr: string;
  nameSo: string;
  description: string;
  descriptionAr: string;
  descriptionSo: string;
  phone: string;
  whatsapp: string;
  email: string;
  openingHours: string;
  mapsUrl: string;
  website: string;
  image: string;
  logoUrl: string;
  gallery: GalleryImage[];
  videos: MediaVideo[];
  documentUrl: string;
  lat: number;
  lng: number;
  amenitiesV2: string[];
  serviceTags: string[];
  openingHoursStructured: OpeningHoursGroup[];
  is24Hours: boolean;
  temporarilyClosed: boolean;
  permanentlyClosed: boolean;
  socialInstagram: string;
  socialFacebook: string;
  socialTiktok: string;
  socialSnapchat: string;
  socialX: string;
  socialYoutube: string;
  socialTelegram: string;
  status: "draft" | "published";
  featured: boolean;
  isPartner: boolean;
  // Schools + Universities
  schoolType: string;
  curriculum: string;
  educationLevels: string[];
  ageRangeGrades: string;
  numberOfClassrooms?: number;
  universityType: string;
  degreeLevels: string[];
  facultiesOffered: string[];
  numberOfBuildings?: number;
  educationFacilities: string[];
  numberOfStudents?: number;
  numberOfTeachers?: number;
  admissionsOpen: boolean;
  admissionPhone: string;
  admissionWhatsapp: string;
  admissionUrl: string;
  applicationUrl: string;
  numberOfFloors?: number;
  yearEstablished?: number;
  languages: string[];
  // Women's Beauty Salons + Men's Barbershops
  salonType: string;
  shopType: string;
  staffCount?: number;
  walkInsAccepted: boolean;
  homeServiceAvailable: boolean;
  // Cosmetics & Women's Beauty + Perfumes
  storeType: string;
  brands: string[];
  // Car Rental
  rentalType: string;
  vehicleTypes: string[];
  minimumRentalPeriod: string;
  driversLicenseRequired: boolean;
  depositRequired: boolean;
  fleetSize?: number;
  // Clinics / Medical Clinics (Dental Clinic is now one clinicType value)
  clinicType: string;
  numberOfTreatmentRooms?: number;
  insuranceAccepted: string[];
  // Auto Repair & Car Services
  garageType: string;
  // Gym / Fitness Center
  gymType: string;
  classesOffered: string[];
  membershipOptions: string[];
  personalTrainingAvailable: boolean;
  groupClassesAvailable: boolean;
  gymFacilities: string[];
  trainersAvailable: boolean;
  femaleTrainersAvailable: boolean;
  maleTrainersAvailable: boolean;
  trialMembershipAvailable: boolean;
}

export function CityServiceForm({
  locale,
  mode,
  serviceId,
  initial,
  categories,
  canAssignOwner = false,
  initialOwner = null,
}: {
  locale: Locale;
  mode: "create" | "edit";
  serviceId?: string;
  initial?: Partial<CityServiceFormInput>;
  /** Every City Services category (target_table='city_services', excluding
   * the single "City Services" nav-entry row) — the picker below reads only
   * from this, never a hardcoded list. See lib/data/categories.ts's
   * getCityServiceCategories(). */
  categories: Category[];
  /** Only true for role='owner' (site admin) — a business_owner editing
   * their own assigned listing never sees the Assigned Owner field at all,
   * so they have no way to reassign ownership themselves. */
  canAssignOwner?: boolean;
  initialOwner?: AssignedOwner | null;
}) {
  const t = useTranslations("admin");
  const tc = useTranslations("common");
  const tw = useTranslations("weekdays");
  const router = useRouter();
  const [owner, setOwner] = useState<AssignedOwner | null>(initialOwner);
  const [form, setForm] = useState<CityServiceFormInput>({
    categoryId: initial?.categoryId ?? categories[0]?.id ?? "",
    name: initial?.name ?? "",
    nameAr: initial?.nameAr ?? "",
    nameSo: initial?.nameSo ?? "",
    description: initial?.description ?? "",
    descriptionAr: initial?.descriptionAr ?? "",
    descriptionSo: initial?.descriptionSo ?? "",
    phone: initial?.phone ?? "",
    whatsapp: initial?.whatsapp ?? "",
    email: initial?.email ?? "",
    openingHours: initial?.openingHours ?? "",
    mapsUrl: initial?.mapsUrl ?? "",
    website: initial?.website ?? "",
    image: initial?.image ?? "",
    logoUrl: initial?.logoUrl ?? "",
    gallery: initial?.gallery ?? [],
    videos: initial?.videos ?? [],
    documentUrl: initial?.documentUrl ?? "",
    lat: initial?.lat ?? 9.5624,
    lng: initial?.lng ?? 44.065,
    amenitiesV2: initial?.amenitiesV2 ?? [],
    serviceTags: initial?.serviceTags ?? [],
    openingHoursStructured: initial?.openingHoursStructured ?? [],
    is24Hours: initial?.is24Hours ?? false,
    temporarilyClosed: initial?.temporarilyClosed ?? false,
    permanentlyClosed: initial?.permanentlyClosed ?? false,
    socialInstagram: initial?.socialInstagram ?? "",
    socialFacebook: initial?.socialFacebook ?? "",
    socialTiktok: initial?.socialTiktok ?? "",
    socialSnapchat: initial?.socialSnapchat ?? "",
    socialX: initial?.socialX ?? "",
    socialYoutube: initial?.socialYoutube ?? "",
    socialTelegram: initial?.socialTelegram ?? "",
    status: initial?.status ?? "draft",
    featured: initial?.featured ?? false,
    isPartner: initial?.isPartner ?? false,
    schoolType: initial?.schoolType ?? "",
    curriculum: initial?.curriculum ?? "",
    educationLevels: initial?.educationLevels ?? [],
    ageRangeGrades: initial?.ageRangeGrades ?? "",
    numberOfClassrooms: initial?.numberOfClassrooms,
    universityType: initial?.universityType ?? "",
    degreeLevels: initial?.degreeLevels ?? [],
    facultiesOffered: initial?.facultiesOffered ?? [],
    numberOfBuildings: initial?.numberOfBuildings,
    educationFacilities: initial?.educationFacilities ?? [],
    numberOfStudents: initial?.numberOfStudents,
    numberOfTeachers: initial?.numberOfTeachers,
    admissionsOpen: initial?.admissionsOpen ?? true,
    admissionPhone: initial?.admissionPhone ?? "",
    admissionWhatsapp: initial?.admissionWhatsapp ?? "",
    admissionUrl: initial?.admissionUrl ?? "",
    applicationUrl: initial?.applicationUrl ?? "",
    numberOfFloors: initial?.numberOfFloors,
    yearEstablished: initial?.yearEstablished,
    languages: initial?.languages ?? [],
    salonType: initial?.salonType ?? "",
    shopType: initial?.shopType ?? "",
    staffCount: initial?.staffCount,
    walkInsAccepted: initial?.walkInsAccepted ?? false,
    homeServiceAvailable: initial?.homeServiceAvailable ?? false,
    storeType: initial?.storeType ?? "",
    brands: initial?.brands ?? [],
    rentalType: initial?.rentalType ?? "",
    vehicleTypes: initial?.vehicleTypes ?? [],
    minimumRentalPeriod: initial?.minimumRentalPeriod ?? "",
    driversLicenseRequired: initial?.driversLicenseRequired ?? false,
    depositRequired: initial?.depositRequired ?? false,
    fleetSize: initial?.fleetSize,
    clinicType: initial?.clinicType ?? "",
    numberOfTreatmentRooms: initial?.numberOfTreatmentRooms,
    insuranceAccepted: initial?.insuranceAccepted ?? [],
    garageType: initial?.garageType ?? "",
    gymType: initial?.gymType ?? "",
    classesOffered: initial?.classesOffered ?? [],
    membershipOptions: initial?.membershipOptions ?? [],
    personalTrainingAvailable: initial?.personalTrainingAvailable ?? false,
    groupClassesAvailable: initial?.groupClassesAvailable ?? false,
    gymFacilities: initial?.gymFacilities ?? [],
    trainersAvailable: initial?.trainersAvailable ?? false,
    femaleTrainersAvailable: initial?.femaleTrainersAvailable ?? false,
    maleTrainersAvailable: initial?.maleTrainersAvailable ?? false,
    trialMembershipAvailable: initial?.trialMembershipAvailable ?? false,
  });
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const [dirty, setDirty] = useState(false);
  useUnsavedChangesWarning(dirty);

  const selectedCategory = categories.find((c) => c.id === form.categoryId);
  const featureEligible = selectedCategory?.supportsNewFeatures ?? true;
  const gallerySupported = selectedCategory?.supportsGallery ?? false;
  const isSchool = selectedCategory?.slug === "school";
  const isUniversity = selectedCategory?.slug === "university";
  const isSalon = selectedCategory?.slug === "beauty-salon";
  const isBarbershop = selectedCategory?.slug === "men-barbershop";
  const isCosmetics = selectedCategory?.slug === "cosmetics-beauty";
  const isPerfume = selectedCategory?.slug === "perfume-shop";
  const isCarRental = selectedCategory?.slug === "car-rental";
  // Dental Clinic is now one clinicType value ("dental") within the unified
  // Clinics category (slug "clinic"), not a separate top-level category —
  // the dental-clinic slug itself is deactivated and can no longer be
  // selected here.
  const isClinic = selectedCategory?.slug === "clinic";
  const isAutoRepair = selectedCategory?.slug === "auto-repair";
  const isGym = selectedCategory?.slug === "gym";

  function update<K extends keyof CityServiceFormInput>(key: K, value: CityServiceFormInput[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const payload = {
      categoryId: form.categoryId,
      // Only meaningful on create — an edit's owner changes are persisted
      // immediately by AssignedOwnerField via transferOwnership/
      // removeOwnership, not through this payload (updateCityService never
      // reads ownerId at all, so a business_owner submitting this form has
      // no field here that could change ownership).
      ownerId: mode === "create" ? owner?.id ?? null : undefined,
      name: form.name,
      nameAr: form.nameAr || undefined,
      nameSo: form.nameSo || undefined,
      description: form.description || undefined,
      descriptionAr: form.descriptionAr || undefined,
      descriptionSo: form.descriptionSo || undefined,
      phone: form.phone || undefined,
      whatsapp: form.whatsapp || undefined,
      email: form.email || undefined,
      openingHours: form.openingHours || undefined,
      mapsUrl: form.mapsUrl || undefined,
      website: form.website || undefined,
      image: form.image || undefined,
      logoUrl: form.logoUrl || undefined,
      gallery: form.gallery,
      videos: featureEligible ? form.videos : [],
      documentUrl: featureEligible ? form.documentUrl || undefined : undefined,
      lat: form.lat,
      lng: form.lng,
      amenitiesV2: featureEligible ? form.amenitiesV2 : [],
      serviceTags: form.serviceTags,
      openingHoursStructured: featureEligible ? form.openingHoursStructured : [],
      is24Hours: featureEligible ? form.is24Hours : false,
      temporarilyClosed: featureEligible ? form.temporarilyClosed : false,
      permanentlyClosed: featureEligible ? form.permanentlyClosed : false,
      socialInstagram: featureEligible ? form.socialInstagram || undefined : undefined,
      socialFacebook: featureEligible ? form.socialFacebook || undefined : undefined,
      socialTiktok: featureEligible ? form.socialTiktok || undefined : undefined,
      socialSnapchat: featureEligible ? form.socialSnapchat || undefined : undefined,
      socialX: featureEligible ? form.socialX || undefined : undefined,
      socialYoutube: featureEligible ? form.socialYoutube || undefined : undefined,
      socialTelegram: featureEligible ? form.socialTelegram || undefined : undefined,
      status: form.status,
      featured: form.featured,
      isPartner: form.isPartner,
      schoolType: isSchool ? form.schoolType || undefined : undefined,
      curriculum: isSchool ? form.curriculum || undefined : undefined,
      educationLevels: isSchool ? form.educationLevels : undefined,
      ageRangeGrades: isSchool ? form.ageRangeGrades || undefined : undefined,
      numberOfClassrooms: isSchool ? form.numberOfClassrooms : undefined,
      universityType: isUniversity ? form.universityType || undefined : undefined,
      degreeLevels: isUniversity ? form.degreeLevels : undefined,
      facultiesOffered: isUniversity ? form.facultiesOffered : undefined,
      numberOfBuildings: isUniversity ? form.numberOfBuildings : undefined,
      educationFacilities: isSchool || isUniversity ? form.educationFacilities : undefined,
      numberOfStudents: isSchool || isUniversity ? form.numberOfStudents : undefined,
      numberOfTeachers: isSchool || isUniversity ? form.numberOfTeachers : undefined,
      admissionsOpen: isSchool || isUniversity ? form.admissionsOpen : undefined,
      admissionPhone: isSchool || isUniversity ? form.admissionPhone || undefined : undefined,
      admissionWhatsapp: isSchool || isUniversity ? form.admissionWhatsapp || undefined : undefined,
      admissionUrl: isSchool || isUniversity ? form.admissionUrl || undefined : undefined,
      applicationUrl: isSchool || isUniversity ? form.applicationUrl || undefined : undefined,
      numberOfFloors: isSchool || isUniversity ? form.numberOfFloors : undefined,
      yearEstablished: isSchool || isUniversity ? form.yearEstablished : undefined,
      salonType: isSalon ? form.salonType || undefined : undefined,
      shopType: isBarbershop ? form.shopType || undefined : undefined,
      staffCount: isSalon || isBarbershop || isAutoRepair ? form.staffCount : undefined,
      walkInsAccepted: isSalon || isBarbershop || isAutoRepair ? form.walkInsAccepted : undefined,
      homeServiceAvailable: isSalon || isBarbershop || isAutoRepair ? form.homeServiceAvailable : undefined,
      storeType: isCosmetics || isPerfume ? form.storeType || undefined : undefined,
      brands: isCosmetics || isPerfume || isAutoRepair ? form.brands : undefined,
      rentalType: isCarRental ? form.rentalType || undefined : undefined,
      vehicleTypes: isCarRental ? form.vehicleTypes : undefined,
      minimumRentalPeriod: isCarRental ? form.minimumRentalPeriod || undefined : undefined,
      driversLicenseRequired: isCarRental ? form.driversLicenseRequired : undefined,
      depositRequired: isCarRental ? form.depositRequired : undefined,
      fleetSize: isCarRental ? form.fleetSize : undefined,
      clinicType: isClinic ? form.clinicType || undefined : undefined,
      numberOfTreatmentRooms: isClinic ? form.numberOfTreatmentRooms : undefined,
      insuranceAccepted: isClinic ? form.insuranceAccepted : undefined,
      languages: isSchool || isUniversity || isClinic ? form.languages : undefined,
      garageType: isAutoRepair ? form.garageType || undefined : undefined,
      gymType: isGym ? form.gymType || undefined : undefined,
      classesOffered: isGym ? form.classesOffered : undefined,
      membershipOptions: isGym ? form.membershipOptions : undefined,
      personalTrainingAvailable: isGym ? form.personalTrainingAvailable : undefined,
      groupClassesAvailable: isGym ? form.groupClassesAvailable : undefined,
      gymFacilities: isGym ? form.gymFacilities : undefined,
      trainersAvailable: isGym ? form.trainersAvailable : undefined,
      femaleTrainersAvailable: isGym ? form.femaleTrainersAvailable : undefined,
      maleTrainersAvailable: isGym ? form.maleTrainersAvailable : undefined,
      trialMembershipAvailable: isGym ? form.trialMembershipAvailable : undefined,
    };

    startTransition(async () => {
      const result =
        mode === "create"
          ? await createCityService(locale, payload)
          : await updateCityService(locale, serviceId!, payload);

      if (result.ok) {
        setDirty(false);
        router.push(`/${locale}/admin/city-services`);
      } else {
        setError(result.error ?? t("somethingWentWrong"));
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="max-w-2xl space-y-6">
      <ImageUploader folder="city-services" value={form.image} onChange={(url) => update("image", url)} />

      <ImageUploader
        folder="city-services/logos"
        value={form.logoUrl}
        onChange={(url) => update("logoUrl", url)}
        label="Business Logo (optional)"
        rounded="rounded-full"
      />

      {gallerySupported ? (
        <GalleryManager
          folder="city-services/gallery"
          value={form.gallery}
          onChange={(v) => update("gallery", v)}
          categories={SERVICE_GALLERY_CATEGORIES}
          coverUrl={form.image}
          onSetCover={(url) => update("image", url)}
          setCoverLabel={t("setAsCoverLabel")}
          coverBadgeLabel={t("coverBadgeLabel")}
        />
      ) : (
        <p className="text-xs text-ink/45 dark:text-sand/45">{t("galleryNotAvailableForCategory")}</p>
      )}

      {featureEligible && (
        <VideoUploader
          folder="city-services/videos"
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
      )}

      {featureEligible && (
        <PdfUploader
          folder="city-services"
          value={form.documentUrl}
          onChange={(url) => update("documentUrl", url)}
          label={tc(`document_${getDocumentLabelGroup({ listingType: "city_service", categorySlug: selectedCategory?.slug })}` as "document_generic")}
        />
      )}

      {canAssignOwner && (
        <AssignedOwnerField
          locale={locale}
          mode={mode}
          listingType="city_service"
          listingId={serviceId}
          value={owner}
          onChange={setOwner}
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("cityServiceNameLabel")}>
          <input required value={form.name} onChange={(e) => update("name", e.target.value)} className={inputClass} />
        </Field>
        <GroupedCategorySelect
          categories={categories}
          value={form.categoryId}
          onChange={(id) => update("categoryId", id)}
          locale={locale}
          groupLabel={t("cityServiceCategoryLabel")}
          groupPlaceholder={t("cityServiceCategoryGroupPlaceholder")}
          subcategoryLabel={t("cityServiceSubcategoryLabel")}
          subcategoryPlaceholder={t("cityServiceSubcategoryPlaceholder")}
          inputClassName={inputClass}
          labelClassName="mb-1.5 block text-sm font-semibold"
          idPrefix="admin-city-service-category"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("cityServiceNameArLabel")}>
          <input dir="rtl" value={form.nameAr} onChange={(e) => update("nameAr", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("cityServiceNameSoLabel")}>
          <input value={form.nameSo} onChange={(e) => update("nameSo", e.target.value)} className={inputClass} />
        </Field>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("phoneLabel")}>
          <input value={form.phone} onChange={(e) => update("phone", e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
        </Field>
        <Field label={t("whatsappLabel")}>
          <input value={form.whatsapp} onChange={(e) => update("whatsapp", e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
        </Field>
        <Field label={t("emailLabel")}>
          <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)} className={inputClass} />
        </Field>
        <Field label={t("websiteLabel")}>
          <input
            type="url"
            value={form.website}
            onChange={(e) => update("website", e.target.value)}
            className={inputClass}
            placeholder="https://…"
          />
        </Field>
      </div>

      {featureEligible && (
        <>
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
        </>
      )}

      <Field label={t("openingHoursShortLabel")} hint={t("openingHoursShortHint")}>
        <input value={form.openingHours} onChange={(e) => update("openingHours", e.target.value)} className={inputClass} placeholder="Sat–Thu, 8:00 AM – 6:00 PM" />
      </Field>

      {featureEligible && (
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
      )}

      <GoogleMapsLocationField
        googleMapsUrl={form.mapsUrl}
        onGoogleMapsUrlChange={(url) => update("mapsUrl", url)}
        lat={form.lat}
        lng={form.lng}
        onCoordsChange={(lat, lng) => setForm((f) => ({ ...f, lat, lng }))}
      />

      <Field label={t("cityServiceDescriptionLabel")}>
        <textarea
          rows={3}
          value={form.description}
          onChange={(e) => update("description", e.target.value)}
          className={inputClass}
        />
      </Field>

      <Field label={t("fullDescriptionArLabel")}>
        <textarea dir="rtl" rows={3} value={form.descriptionAr} onChange={(e) => update("descriptionAr", e.target.value)} className={inputClass} />
      </Field>

      <Field label={t("fullDescriptionSoLabel")}>
        <textarea rows={3} value={form.descriptionSo} onChange={(e) => update("descriptionSo", e.target.value)} className={inputClass} />
      </Field>

      {featureEligible && (
        <AmenitiesPicker listingType="city_service" values={form.amenitiesV2} onChange={(v) => update("amenitiesV2", v)} label={t("amenitiesLabel")} />
      )}

      <ServiceTagsPicker
        categorySlug={selectedCategory?.slug}
        locale={locale}
        values={form.serviceTags}
        onChange={(v) => update("serviceTags", v)}
        label={selectedCategory?.slug === "cosmetics-beauty" ? t("businessSpecialtiesLabel") : t("serviceTagsLabel")}
      />

      {isSchool && (
        <div className="space-y-4 rounded-2xl border border-ink/10 p-4 dark:border-white/15">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="School type">
              <select value={form.schoolType} onChange={(e) => update("schoolType", e.target.value)} className={inputClass}>
                <option value="">—</option>
                {SCHOOL_TYPE_ORDER.map((type) => (
                  <option key={type} value={type}>{schoolTypeLabel(type, locale)}</option>
                ))}
              </select>
            </Field>
            <Field label="Curriculum">
              <select value={form.curriculum} onChange={(e) => update("curriculum", e.target.value)} className={inputClass}>
                <option value="">—</option>
                {CURRICULUM_ORDER.map((value) => (
                  <option key={value} value={value}>{curriculumLabel(value, locale)}</option>
                ))}
              </select>
            </Field>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Education levels</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {EDUCATION_LEVEL_ORDER.map((value) => (
                <label key={value} className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.educationLevels.includes(value)}
                    onChange={() => update("educationLevels", form.educationLevels.includes(value) ? form.educationLevels.filter((v) => v !== value) : [...form.educationLevels, value])}
                  />
                  {educationLevelLabel(value, locale)}
                </label>
              ))}
            </div>
          </div>

          <Field label="Age range / grades served">
            <input value={form.ageRangeGrades} onChange={(e) => update("ageRangeGrades", e.target.value)} className={inputClass} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Number of classrooms">
              <input type="number" min={0} value={form.numberOfClassrooms ?? ""} onChange={(e) => update("numberOfClassrooms", e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
            </Field>
            <Field label="Number of floors">
              <input type="number" min={0} value={form.numberOfFloors ?? ""} onChange={(e) => update("numberOfFloors", e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
            </Field>
            <Field label="Year established">
              <input type="number" min={1900} max={new Date().getFullYear()} value={form.yearEstablished ?? ""} onChange={(e) => update("yearEstablished", e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Number of students (optional)">
              <input type="number" min={0} value={form.numberOfStudents ?? ""} onChange={(e) => update("numberOfStudents", e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
            </Field>
            <Field label="Number of teachers (optional)">
              <input type="number" min={0} value={form.numberOfTeachers ?? ""} onChange={(e) => update("numberOfTeachers", e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
            </Field>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Languages of instruction</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {LANGUAGE_SPOKEN_OPTIONS.map((value) => (
                <label key={value} className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.languages.includes(value)}
                    onChange={() => update("languages", form.languages.includes(value) ? form.languages.filter((v) => v !== value) : [...form.languages, value])}
                  />
                  {languageSpokenLabel(value, locale)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">School facilities</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {SCHOOL_FACILITY_CODES.map((code) => {
                const Icon = EDUCATION_FACILITY_ICON[code];
                return (
                  <label key={code} className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={form.educationFacilities.includes(code)}
                      onChange={() => update("educationFacilities", form.educationFacilities.includes(code) ? form.educationFacilities.filter((c) => c !== code) : [...form.educationFacilities, code])}
                    />
                    <Icon size={14} className="shrink-0 text-ink/50 dark:text-sand/50" aria-hidden="true" />
                    {educationFacilityLabel(code, locale)}
                  </label>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={form.admissionsOpen} onChange={(e) => update("admissionsOpen", e.target.checked)} />
            Admissions open
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Admission phone">
              <input value={form.admissionPhone} onChange={(e) => update("admissionPhone", e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
            </Field>
            <Field label="Admission WhatsApp">
              <input value={form.admissionWhatsapp} onChange={(e) => update("admissionWhatsapp", e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Admission info URL">
              <input type="url" value={form.admissionUrl} onChange={(e) => update("admissionUrl", e.target.value)} className={inputClass} placeholder="https://…" />
            </Field>
            <Field label="Application URL">
              <input type="url" value={form.applicationUrl} onChange={(e) => update("applicationUrl", e.target.value)} className={inputClass} placeholder="https://…" />
            </Field>
          </div>
        </div>
      )}

      {isUniversity && (
        <div className="space-y-4 rounded-2xl border border-ink/10 p-4 dark:border-white/15">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="University type">
              <select value={form.universityType} onChange={(e) => update("universityType", e.target.value)} className={inputClass}>
                <option value="">—</option>
                {UNIVERSITY_TYPE_ORDER.map((type) => (
                  <option key={type} value={type}>{universityTypeLabel(type, locale)}</option>
                ))}
              </select>
            </Field>
            <Field label="Number of buildings (optional)">
              <input type="number" min={0} value={form.numberOfBuildings ?? ""} onChange={(e) => update("numberOfBuildings", e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
            </Field>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Degree levels offered</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {DEGREE_LEVEL_ORDER.map((value) => (
                <label key={value} className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.degreeLevels.includes(value)}
                    onChange={() => update("degreeLevels", form.degreeLevels.includes(value) ? form.degreeLevels.filter((v) => v !== value) : [...form.degreeLevels, value])}
                  />
                  {degreeLevelLabel(value, locale)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Faculties / programs offered</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {FACULTY_ORDER.map((value) => (
                <label key={value} className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.facultiesOffered.includes(value)}
                    onChange={() => update("facultiesOffered", form.facultiesOffered.includes(value) ? form.facultiesOffered.filter((v) => v !== value) : [...form.facultiesOffered, value])}
                  />
                  {facultyLabel(value, locale)}
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Year established">
              <input type="number" min={1900} max={new Date().getFullYear()} value={form.yearEstablished ?? ""} onChange={(e) => update("yearEstablished", e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
            </Field>
            <Field label="Number of students (optional)">
              <input type="number" min={0} value={form.numberOfStudents ?? ""} onChange={(e) => update("numberOfStudents", e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
            </Field>
            <Field label="Number of faculty (optional)">
              <input type="number" min={0} value={form.numberOfTeachers ?? ""} onChange={(e) => update("numberOfTeachers", e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
            </Field>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Languages of instruction</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {LANGUAGE_SPOKEN_OPTIONS.map((value) => (
                <label key={value} className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.languages.includes(value)}
                    onChange={() => update("languages", form.languages.includes(value) ? form.languages.filter((v) => v !== value) : [...form.languages, value])}
                  />
                  {languageSpokenLabel(value, locale)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Campus facilities</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {UNIVERSITY_FACILITY_CODES.map((code) => {
                const Icon = EDUCATION_FACILITY_ICON[code];
                return (
                  <label key={code} className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={form.educationFacilities.includes(code)}
                      onChange={() => update("educationFacilities", form.educationFacilities.includes(code) ? form.educationFacilities.filter((c) => c !== code) : [...form.educationFacilities, code])}
                    />
                    <Icon size={14} className="shrink-0 text-ink/50 dark:text-sand/50" aria-hidden="true" />
                    {educationFacilityLabel(code, locale)}
                  </label>
                );
              })}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold">
            <input type="checkbox" checked={form.admissionsOpen} onChange={(e) => update("admissionsOpen", e.target.checked)} />
            Admissions open
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Admission phone">
              <input value={form.admissionPhone} onChange={(e) => update("admissionPhone", e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
            </Field>
            <Field label="Admission WhatsApp">
              <input value={form.admissionWhatsapp} onChange={(e) => update("admissionWhatsapp", e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Admission info URL">
              <input type="url" value={form.admissionUrl} onChange={(e) => update("admissionUrl", e.target.value)} className={inputClass} placeholder="https://…" />
            </Field>
            <Field label="Application URL">
              <input type="url" value={form.applicationUrl} onChange={(e) => update("applicationUrl", e.target.value)} className={inputClass} placeholder="https://…" />
            </Field>
          </div>
        </div>
      )}

      {isSalon && (
        <div className="space-y-4 rounded-2xl border border-ink/10 p-4 dark:border-white/15">
          <Field label="Salon type">
            <select value={form.salonType} onChange={(e) => update("salonType", e.target.value)} className={inputClass}>
              <option value="">—</option>
              {SALON_TYPE_ORDER.map((type) => (
                <option key={type} value={type}>{salonTypeLabel(type, locale)}</option>
              ))}
            </select>
          </Field>
          <Field label="Number of stylists (optional)">
            <input type="number" min={0} value={form.staffCount ?? ""} onChange={(e) => update("staffCount", e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
          </Field>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.walkInsAccepted} onChange={(e) => update("walkInsAccepted", e.target.checked)} />
              Walk-ins accepted
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.homeServiceAvailable} onChange={(e) => update("homeServiceAvailable", e.target.checked)} />
              Home service available
            </label>
          </div>
        </div>
      )}

      {isBarbershop && (
        <div className="space-y-4 rounded-2xl border border-ink/10 p-4 dark:border-white/15">
          <Field label="Shop type">
            <select value={form.shopType} onChange={(e) => update("shopType", e.target.value)} className={inputClass}>
              <option value="">—</option>
              {SHOP_TYPE_ORDER.map((type) => (
                <option key={type} value={type}>{shopTypeLabel(type, locale)}</option>
              ))}
            </select>
          </Field>
          <Field label="Number of barbers (optional)">
            <input type="number" min={0} value={form.staffCount ?? ""} onChange={(e) => update("staffCount", e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
          </Field>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.walkInsAccepted} onChange={(e) => update("walkInsAccepted", e.target.checked)} />
              Walk-ins accepted
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.homeServiceAvailable} onChange={(e) => update("homeServiceAvailable", e.target.checked)} />
              Home service available
            </label>
          </div>
        </div>
      )}

      {(isCosmetics || isPerfume) && (
        <div className="space-y-4 rounded-2xl border border-ink/10 p-4 dark:border-white/15">
          <Field label="Store type">
            <select value={form.storeType} onChange={(e) => update("storeType", e.target.value)} className={inputClass}>
              <option value="">—</option>
              {STORE_TYPE_ORDER.map((type) => (
                <option key={type} value={type}>{storeTypeLabel(type, locale)}</option>
              ))}
            </select>
          </Field>
          <TagInput label="Brands carried" values={form.brands} onChange={(v) => update("brands", v)} placeholder="Type a brand and press Enter" />
        </div>
      )}

      {isCarRental && (
        <div className="space-y-4 rounded-2xl border border-ink/10 p-4 dark:border-white/15">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Rental type">
              <select value={form.rentalType} onChange={(e) => update("rentalType", e.target.value)} className={inputClass}>
                <option value="">—</option>
                {RENTAL_TYPE_ORDER.map((type) => (
                  <option key={type} value={type}>{rentalTypeLabel(type, locale)}</option>
                ))}
              </select>
            </Field>
            <Field label="Fleet size (optional)">
              <input type="number" min={0} value={form.fleetSize ?? ""} onChange={(e) => update("fleetSize", e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
            </Field>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Vehicle types available</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {VEHICLE_TYPE_ORDER.map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.vehicleTypes.includes(type)}
                    onChange={() => update("vehicleTypes", form.vehicleTypes.includes(type) ? form.vehicleTypes.filter((v) => v !== type) : [...form.vehicleTypes, type])}
                  />
                  {vehicleTypeLabel(type, locale)}
                </label>
              ))}
            </div>
          </div>

          <Field label="Minimum rental period (optional)">
            <input value={form.minimumRentalPeriod} onChange={(e) => update("minimumRentalPeriod", e.target.value)} className={inputClass} placeholder="e.g. 1 day" />
          </Field>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.driversLicenseRequired} onChange={(e) => update("driversLicenseRequired", e.target.checked)} />
              Driver&apos;s license required
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.depositRequired} onChange={(e) => update("depositRequired", e.target.checked)} />
              Deposit required
            </label>
          </div>
        </div>
      )}

      {isClinic && (
        <div className="space-y-4 rounded-2xl border border-ink/10 p-4 dark:border-white/15">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Clinic type">
              <select value={form.clinicType} onChange={(e) => update("clinicType", e.target.value)} className={inputClass}>
                <option value="">—</option>
                {CLINIC_TYPE_ORDER.map((type) => (
                  <option key={type} value={type}>{clinicTypeLabel(type, locale)}</option>
                ))}
              </select>
            </Field>
            <Field label="Number of treatment rooms (optional)">
              <input type="number" min={0} value={form.numberOfTreatmentRooms ?? ""} onChange={(e) => update("numberOfTreatmentRooms", e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
            </Field>
          </div>

          {form.clinicType === "dental" && (
            <ServiceTagsPicker
              categorySlug="dental-clinic"
              locale={locale}
              values={form.serviceTags}
              onChange={(v) => update("serviceTags", v)}
              label="Dental services offered"
            />
          )}

          <TagInput label="Accepted insurance providers" values={form.insuranceAccepted} onChange={(v) => update("insuranceAccepted", v)} placeholder="Type an insurance provider and press Enter" />

          <div>
            <label className="mb-2 block text-sm font-semibold">Languages spoken</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {LANGUAGE_SPOKEN_OPTIONS.map((value) => (
                <label key={value} className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.languages.includes(value)}
                    onChange={() => update("languages", form.languages.includes(value) ? form.languages.filter((v) => v !== value) : [...form.languages, value])}
                  />
                  {languageSpokenLabel(value, locale)}
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {isAutoRepair && (
        <div className="space-y-4 rounded-2xl border border-ink/10 p-4 dark:border-white/15">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Garage type">
              <select value={form.garageType} onChange={(e) => update("garageType", e.target.value)} className={inputClass}>
                <option value="">—</option>
                {GARAGE_TYPE_ORDER.map((type) => (
                  <option key={type} value={type}>{garageTypeLabel(type, locale)}</option>
                ))}
              </select>
            </Field>
            <Field label="Number of mechanics (optional)">
              <input type="number" min={0} value={form.staffCount ?? ""} onChange={(e) => update("staffCount", e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
            </Field>
          </div>

          <TagInput label="Brands serviced" values={form.brands} onChange={(v) => update("brands", v)} placeholder="Type a brand and press Enter" />

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.walkInsAccepted} onChange={(e) => update("walkInsAccepted", e.target.checked)} />
              Walk-ins accepted
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.homeServiceAvailable} onChange={(e) => update("homeServiceAvailable", e.target.checked)} />
              Mobile / home service available
            </label>
          </div>
        </div>
      )}

      {isGym && (
        <div className="space-y-4 rounded-2xl border border-ink/10 p-4 dark:border-white/15">
          <Field label="Gym type">
            <select value={form.gymType} onChange={(e) => update("gymType", e.target.value)} className={inputClass}>
              <option value="">—</option>
              {GYM_TYPE_ORDER.map((type) => (
                <option key={type} value={type}>{gymTypeLabel(type, locale)}</option>
              ))}
            </select>
          </Field>

          <TagInput label="Membership options" values={form.membershipOptions} onChange={(v) => update("membershipOptions", v)} placeholder="e.g. Monthly, Annual, Day Pass — press Enter" />

          <div>
            <label className="mb-2 block text-sm font-semibold">Classes offered</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {CLASS_OFFERED_ORDER.map((code) => (
                <label key={code} className="flex items-center gap-2 text-sm font-medium">
                  <input
                    type="checkbox"
                    checked={form.classesOffered.includes(code)}
                    onChange={() => update("classesOffered", form.classesOffered.includes(code) ? form.classesOffered.filter((c) => c !== code) : [...form.classesOffered, code])}
                  />
                  {classOfferedLabel(code, locale)}
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold">Gym facilities</label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {GYM_FACILITY_ORDER.map((code) => {
                const Icon = GYM_FACILITY_ICON[code];
                return (
                  <label key={code} className="flex items-center gap-2 text-sm font-medium">
                    <input
                      type="checkbox"
                      checked={form.gymFacilities.includes(code)}
                      onChange={() => update("gymFacilities", form.gymFacilities.includes(code) ? form.gymFacilities.filter((c) => c !== code) : [...form.gymFacilities, code])}
                    />
                    <Icon size={14} className="shrink-0 text-ink/50 dark:text-sand/50" aria-hidden="true" />
                    {gymFacilityLabel(code, locale)}
                  </label>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.personalTrainingAvailable} onChange={(e) => update("personalTrainingAvailable", e.target.checked)} />
              Personal training available
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.groupClassesAvailable} onChange={(e) => update("groupClassesAvailable", e.target.checked)} />
              Group classes available
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.trainersAvailable} onChange={(e) => update("trainersAvailable", e.target.checked)} />
              Trainers available
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.femaleTrainersAvailable} onChange={(e) => update("femaleTrainersAvailable", e.target.checked)} />
              Female trainers available
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.maleTrainersAvailable} onChange={(e) => update("maleTrainersAvailable", e.target.checked)} />
              Male trainers available
            </label>
            <label className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={form.trialMembershipAvailable} onChange={(e) => update("trialMembershipAvailable", e.target.checked)} />
              Trial membership available
            </label>
          </div>
        </div>
      )}

      <Field label={t("statusLabel")}>
        <select value={form.status} onChange={(e) => update("status", e.target.value as "draft" | "published")} className={inputClass}>
          <option value="draft">{t("statusDraft")}</option>
          <option value="published">{t("statusPublished")}</option>
        </select>
      </Field>

      <label className="flex items-center gap-2.5 text-sm font-semibold">
        <input
          type="checkbox"
          checked={form.featured}
          onChange={(e) => update("featured", e.target.checked)}
          className="h-4 w-4 rounded border-ink/25 text-primary focus:ring-primary dark:border-white/25"
        />
        {t("cityServiceFeaturedLabel")}
      </label>

      {/* Manual, admin-only "GO HARGEISA PARTNER" badge control — never
          automatic. This whole form is already admin-gated (requireAdmin),
          so no extra role check is needed here, unlike the hotel/restaurant/
          cafe forms which are also reused by business-owner dashboards. */}
      <label className="flex items-center gap-2.5 text-sm font-semibold">
        <input
          type="checkbox"
          checked={form.isPartner}
          onChange={(e) => update("isPartner", e.target.checked)}
          className="h-4 w-4 rounded border-ink/25 text-primary focus:ring-primary dark:border-white/25"
        />
        {t("goHargeisaPartner")}
      </label>
      <p className="-mt-4 text-xs text-ink/45 dark:text-sand/45">{t("cityServiceFeaturedHint")}</p>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-70"
      >
        {isPending && <Loader2 size={14} className="animate-spin" />}
        {mode === "create" ? t("saveCityService") : t("saveChanges")}
      </button>
    </form>
  );
}
