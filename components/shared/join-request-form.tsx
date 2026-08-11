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
import {
  HOTEL_TYPE_ORDER,
  hotelTypeLabel,
  starRatingLabel,
  STAR_RATING_OPTIONS,
  LANGUAGE_SPOKEN_OPTIONS,
  languageSpokenLabel,
  type HotelType,
} from "@/lib/config/hotel-attributes";
import { ROOM_TYPE_ORDER, roomTypeLabel } from "@/lib/utils/room-type";
import {
  RESTAURANT_TYPE_ORDER,
  restaurantTypeLabel,
  CUISINE_ORDER,
  cuisineLabel,
  type RestaurantType,
  type CuisineCode,
} from "@/lib/config/restaurant-attributes";
import { CAFE_TYPE_ORDER, cafeTypeLabel, type CafeType } from "@/lib/config/cafe-attributes";
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
  type SchoolType,
  type Curriculum,
  type EducationLevel,
  type UniversityType,
  type DegreeLevel,
  type Faculty,
  type EducationFacility,
} from "@/lib/config/education-attributes";
import {
  SALON_TYPE_ORDER,
  salonTypeLabel,
  SHOP_TYPE_ORDER,
  shopTypeLabel,
  type SalonType,
  type ShopType,
} from "@/lib/config/salon-attributes";
import { AMENITIES_BY_LISTING_TYPE, AMENITY_ICON } from "@/lib/config/amenities";
import type { Locale } from "@/lib/i18n/config";
import type { JoinRequestCategory, GalleryImage, MediaVideo, BusinessDocument, Coordinates, WeeklyHoursDay, Category, RoomType } from "@/types";

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
  const tAmenity = useTranslations("amenities");
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
  const [bookingWhatsapp, setBookingWhatsapp] = useState("");
  const [bookingComUrl, setBookingComUrl] = useState("");
  const [checkInTime, setCheckInTime] = useState("");
  const [checkOutTime, setCheckOutTime] = useState("");
  const [hotelType, setHotelType] = useState<HotelType | "">("");
  const [starRating, setStarRating] = useState<number | undefined>(undefined);
  const [estimatedRoomCount, setEstimatedRoomCount] = useState<number | undefined>(undefined);
  const [roomTypesOffered, setRoomTypesOffered] = useState<RoomType[]>([]);
  const [numberOfFloors, setNumberOfFloors] = useState<number | undefined>(undefined);
  const [yearEstablished, setYearEstablished] = useState<number | undefined>(undefined);
  const [languagesSpoken, setLanguagesSpoken] = useState<string[]>([]);
  // Restaurant
  const [restaurantType, setRestaurantType] = useState<RestaurantType | "">("");
  const [cuisine, setCuisine] = useState<CuisineCode[]>([]);
  const [numberOfTables, setNumberOfTables] = useState<number | undefined>(undefined);
  const [onlineOrderUrl, setOnlineOrderUrl] = useState("");
  const [is24Hours, setIs24Hours] = useState(false);
  // Restaurant + Cafe (shared column)
  const [seatingCapacity, setSeatingCapacity] = useState<number | undefined>(undefined);
  // Cafe
  const [cafeType, setCafeType] = useState<CafeType | "">("");
  // Schools
  const [schoolType, setSchoolType] = useState<SchoolType | "">("");
  const [curriculum, setCurriculum] = useState<Curriculum | "">("");
  const [educationLevels, setEducationLevels] = useState<EducationLevel[]>([]);
  const [ageRangeGrades, setAgeRangeGrades] = useState("");
  const [numberOfClassrooms, setNumberOfClassrooms] = useState<number | undefined>(undefined);
  // Universities
  const [universityType, setUniversityType] = useState<UniversityType | "">("");
  const [degreeLevels, setDegreeLevels] = useState<DegreeLevel[]>([]);
  const [facultiesOffered, setFacultiesOffered] = useState<Faculty[]>([]);
  const [numberOfBuildings, setNumberOfBuildings] = useState<number | undefined>(undefined);
  // Schools + Universities (shared columns) — every count below is optional
  // and off by default; none are gender-split.
  const [educationFacilities, setEducationFacilities] = useState<EducationFacility[]>([]);
  const [numberOfStudents, setNumberOfStudents] = useState<number | undefined>(undefined);
  const [numberOfTeachers, setNumberOfTeachers] = useState<number | undefined>(undefined);
  const [admissionsOpen, setAdmissionsOpen] = useState(true);
  const [admissionPhone, setAdmissionPhone] = useState("");
  const [admissionWhatsapp, setAdmissionWhatsapp] = useState("");
  const [admissionUrl, setAdmissionUrl] = useState("");
  const [applicationUrl, setApplicationUrl] = useState("");
  // Women's Beauty Salons (women-only)
  const [salonType, setSalonType] = useState<SalonType | "">("");
  // Men's Barbershops (men-only)
  const [shopType, setShopType] = useState<ShopType | "">("");
  // Salons + Barbershops (shared columns)
  const [staffCount, setStaffCount] = useState<number | undefined>(undefined);
  const [walkInsAccepted, setWalkInsAccepted] = useState(false);
  const [homeServiceAvailable, setHomeServiceAvailable] = useState(false);
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

  const isHotel = category === "hotel";
  const isRestaurant = category === "restaurant";
  const isCafe = category === "cafe";
  const isSchool = category === "other" && selectedServiceCategory?.slug === "school";
  const isUniversity = category === "other" && selectedServiceCategory?.slug === "university";
  const isSalon = category === "other" && selectedServiceCategory?.slug === "beauty-salon";
  const isBarbershop = category === "other" && selectedServiceCategory?.slug === "men-barbershop";

  /** Clears every field specific to Restaurant/Cafe/School/University/Salon/
   * Barbershop — called on any category or "other"-subcategory change so
   * stale values from a previously-selected category are never carried
   * into a different one, even though submission already gates on the
   * currently-active category and would never send them regardless. */
  function resetSpecializedFields() {
    setRestaurantType("");
    setCuisine([]);
    setNumberOfTables(undefined);
    setOnlineOrderUrl("");
    setIs24Hours(false);
    setSeatingCapacity(undefined);
    setCafeType("");
    setSchoolType("");
    setCurriculum("");
    setEducationLevels([]);
    setAgeRangeGrades("");
    setNumberOfClassrooms(undefined);
    setUniversityType("");
    setDegreeLevels([]);
    setFacultiesOffered([]);
    setNumberOfBuildings(undefined);
    setEducationFacilities([]);
    setNumberOfStudents(undefined);
    setNumberOfTeachers(undefined);
    setAdmissionsOpen(true);
    setAdmissionPhone("");
    setAdmissionWhatsapp("");
    setAdmissionUrl("");
    setApplicationUrl("");
    setSalonType("");
    setShopType("");
    setStaffCount(undefined);
    setWalkInsAccepted(false);
    setHomeServiceAvailable(false);
  }

  function selectCategory(next: JoinRequestCategory) {
    setCategory(next);
    setAmenities([]);
    setCustomFields({});
    setServiceTags([]);
    resetSpecializedFields();
    if (next !== "hotel") {
      setBookingWhatsapp("");
      setBookingComUrl("");
      setCheckInTime("");
      setCheckOutTime("");
      setHotelType("");
      setStarRating(undefined);
      setEstimatedRoomCount(undefined);
      setRoomTypesOffered([]);
      // numberOfFloors/yearEstablished/languagesSpoken are deliberately NOT
      // cleared here — Restaurant, Schools, and Universities reuse these
      // exact same fields (see business-requests.ts), so a value entered
      // while browsing one category legitimately carries over rather than
      // being force-cleared; submission still only sends them for the
      // category currently selected.
    }
  }

  function selectOtherCategory(categoryId: string) {
    selectCategory("other");
    setServiceCategoryId(categoryId);
  }

  function toggleAmenity(code: string) {
    setAmenities((a) => (a.includes(code) ? a.filter((x) => x !== code) : [...a, code]));
  }

  function toggleRoomType(type: RoomType) {
    setRoomTypesOffered((types) => (types.includes(type) ? types.filter((t) => t !== type) : [...types, type]));
  }

  function toggleLanguageSpoken(value: string) {
    setLanguagesSpoken((values) => (values.includes(value) ? values.filter((v) => v !== value) : [...values, value]));
  }

  function toggleCuisine(code: CuisineCode) {
    setCuisine((codes) => (codes.includes(code) ? codes.filter((c) => c !== code) : [...codes, code]));
  }

  function toggleEducationLevel(value: EducationLevel) {
    setEducationLevels((values) => (values.includes(value) ? values.filter((v) => v !== value) : [...values, value]));
  }

  function toggleDegreeLevel(value: DegreeLevel) {
    setDegreeLevels((values) => (values.includes(value) ? values.filter((v) => v !== value) : [...values, value]));
  }

  function toggleFaculty(value: Faculty) {
    setFacultiesOffered((values) => (values.includes(value) ? values.filter((v) => v !== value) : [...values, value]));
  }

  function toggleEducationFacility(code: EducationFacility) {
    setEducationFacilities((codes) => (codes.includes(code) ? codes.filter((c) => c !== code) : [...codes, code]));
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
        bookingWhatsapp: isHotel ? bookingWhatsapp || undefined : undefined,
        bookingComUrl: isHotel ? bookingComUrl || undefined : undefined,
        checkInTime: isHotel ? checkInTime || undefined : undefined,
        checkOutTime: isHotel ? checkOutTime || undefined : undefined,
        hotelType: isHotel ? hotelType || undefined : undefined,
        starRating: isHotel ? starRating : undefined,
        estimatedRoomCount: isHotel ? estimatedRoomCount : undefined,
        roomTypesOffered: isHotel ? roomTypesOffered : undefined,
        numberOfFloors: isHotel || isSchool || isUniversity ? numberOfFloors : undefined,
        yearEstablished: isHotel || isSchool || isUniversity ? yearEstablished : undefined,
        languagesSpoken: isHotel || isRestaurant || isSchool || isUniversity ? languagesSpoken : undefined,
        openingHours,
        amenities,
        priceRange,
        // Restaurant
        restaurantType: isRestaurant ? restaurantType || undefined : undefined,
        cuisine: isRestaurant ? cuisine : undefined,
        numberOfTables: isRestaurant ? numberOfTables : undefined,
        onlineOrderUrl: isRestaurant ? onlineOrderUrl || undefined : undefined,
        is24Hours: isRestaurant ? is24Hours : undefined,
        // Restaurant + Cafe
        seatingCapacity: isRestaurant || isCafe ? seatingCapacity : undefined,
        // Cafe
        cafeType: isCafe ? cafeType || undefined : undefined,
        // Schools
        schoolType: isSchool ? schoolType || undefined : undefined,
        curriculum: isSchool ? curriculum || undefined : undefined,
        educationLevels: isSchool ? educationLevels : undefined,
        ageRangeGrades: isSchool ? ageRangeGrades || undefined : undefined,
        numberOfClassrooms: isSchool ? numberOfClassrooms : undefined,
        // Universities
        universityType: isUniversity ? universityType || undefined : undefined,
        degreeLevels: isUniversity ? degreeLevels : undefined,
        facultiesOffered: isUniversity ? facultiesOffered : undefined,
        numberOfBuildings: isUniversity ? numberOfBuildings : undefined,
        // Schools + Universities
        educationFacilities: isSchool || isUniversity ? educationFacilities : undefined,
        numberOfStudents: isSchool || isUniversity ? numberOfStudents : undefined,
        numberOfTeachers: isSchool || isUniversity ? numberOfTeachers : undefined,
        admissionsOpen: isSchool || isUniversity ? admissionsOpen : undefined,
        admissionPhone: isSchool || isUniversity ? admissionPhone || undefined : undefined,
        admissionWhatsapp: isSchool || isUniversity ? admissionWhatsapp || undefined : undefined,
        admissionUrl: isSchool || isUniversity ? admissionUrl || undefined : undefined,
        applicationUrl: isSchool || isUniversity ? applicationUrl || undefined : undefined,
        // Women's Beauty Salons
        salonType: isSalon ? salonType || undefined : undefined,
        // Men's Barbershops
        shopType: isBarbershop ? shopType || undefined : undefined,
        // Salons + Barbershops
        staffCount: isSalon || isBarbershop ? staffCount : undefined,
        walkInsAccepted: isSalon || isBarbershop ? walkInsAccepted : undefined,
        homeServiceAvailable: isSalon || isBarbershop ? homeServiceAvailable : undefined,
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
              onChange={(e) => selectOtherCategory(e.target.value)}
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
            <div className="space-y-5">
              <div>
                <label htmlFor="jr-bookingUrl" className={labelClass}>{t("bookingUrlLabel")}</label>
                <input id="jr-bookingUrl" type="url" value={bookingUrl} onChange={(e) => setBookingUrl(e.target.value)} className={inputClass} placeholder="https://…" />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="jr-bookingWhatsapp" className={labelClass}>{tAdmin("bookingWhatsappLabel")}</label>
                  <input id="jr-bookingWhatsapp" type="tel" value={bookingWhatsapp} onChange={(e) => setBookingWhatsapp(e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
                </div>
                <div>
                  <label htmlFor="jr-bookingComUrl" className={labelClass}>{tAdmin("bookingComUrlLabel")}</label>
                  <input id="jr-bookingComUrl" type="url" value={bookingComUrl} onChange={(e) => setBookingComUrl(e.target.value)} className={inputClass} placeholder="https://booking.com/…" />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="jr-checkIn" className={labelClass}>{t("checkInLabel")}</label>
                  <input id="jr-checkIn" value={checkInTime} onChange={(e) => setCheckInTime(e.target.value)} className={inputClass} placeholder="14:00" />
                </div>
                <div>
                  <label htmlFor="jr-checkOut" className={labelClass}>{t("checkOutLabel")}</label>
                  <input id="jr-checkOut" value={checkOutTime} onChange={(e) => setCheckOutTime(e.target.value)} className={inputClass} placeholder="12:00" />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="jr-hotelType" className={labelClass}>{t("hotelTypeLabel")}</label>
                  <select
                    id="jr-hotelType"
                    value={hotelType}
                    onChange={(e) => setHotelType(e.target.value as HotelType | "")}
                    className={inputClass}
                  >
                    <option value="" disabled>{t("selectHotelTypePlaceholder")}</option>
                    {HOTEL_TYPE_ORDER.map((type) => (
                      <option key={type} value={type}>{hotelTypeLabel(type, locale)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="jr-starRating" className={labelClass}>{t("starRatingLabel")}</label>
                  <select
                    id="jr-starRating"
                    value={starRating ?? ""}
                    onChange={(e) => setStarRating(e.target.value ? Number(e.target.value) : undefined)}
                    className={inputClass}
                  >
                    <option value="" disabled>{t("selectStarRatingPlaceholder")}</option>
                    {STAR_RATING_OPTIONS.map((n) => (
                      <option key={n} value={n}>{starRatingLabel(n, locale)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="jr-roomCount" className={labelClass}>{t("roomCountLabel")}</label>
                <input
                  id="jr-roomCount"
                  type="number"
                  min={1}
                  value={estimatedRoomCount ?? ""}
                  onChange={(e) => setEstimatedRoomCount(e.target.value ? Number(e.target.value) : undefined)}
                  className={inputClass}
                />
              </div>

              <div>
                <label className={labelClass}>{t("roomTypesLabel")}</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {ROOM_TYPE_ORDER.map((type) => (
                    <label key={type} className="flex items-center gap-2 text-sm font-medium">
                      <input type="checkbox" checked={roomTypesOffered.includes(type)} onChange={() => toggleRoomType(type)} />
                      {roomTypeLabel(type, locale)}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="jr-numberOfFloors" className={labelClass}>{t("numberOfFloorsLabel")}</label>
                  <input
                    id="jr-numberOfFloors"
                    type="number"
                    min={1}
                    value={numberOfFloors ?? ""}
                    onChange={(e) => setNumberOfFloors(e.target.value ? Number(e.target.value) : undefined)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="jr-yearEstablished" className={labelClass}>{t("yearEstablishedLabel")}</label>
                  <input
                    id="jr-yearEstablished"
                    type="number"
                    min={1900}
                    max={new Date().getFullYear()}
                    value={yearEstablished ?? ""}
                    onChange={(e) => setYearEstablished(e.target.value ? Number(e.target.value) : undefined)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>{t("languagesSpokenLabel")}</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {LANGUAGE_SPOKEN_OPTIONS.map((value) => (
                    <label key={value} className="flex items-center gap-2 text-sm font-medium">
                      <input type="checkbox" checked={languagesSpoken.includes(value)} onChange={() => toggleLanguageSpoken(value)} />
                      {languageSpokenLabel(value, locale)}
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}

          {isRestaurant && (
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="jr-restaurantType" className={labelClass}>{t("restaurantTypeLabel")}</label>
                  <select
                    id="jr-restaurantType"
                    value={restaurantType}
                    onChange={(e) => setRestaurantType(e.target.value as RestaurantType | "")}
                    className={inputClass}
                  >
                    <option value="" disabled>{t("selectRestaurantTypePlaceholder")}</option>
                    {RESTAURANT_TYPE_ORDER.map((type) => (
                      <option key={type} value={type}>{restaurantTypeLabel(type, locale)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="jr-onlineOrderUrl" className={labelClass}>{t("onlineOrderUrlLabel")}</label>
                  <input id="jr-onlineOrderUrl" type="url" value={onlineOrderUrl} onChange={(e) => setOnlineOrderUrl(e.target.value)} className={inputClass} placeholder="https://…" />
                </div>
              </div>

              <div>
                <label className={labelClass}>{t("cuisineLabel")}</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {CUISINE_ORDER.map((code) => (
                    <label key={code} className="flex items-center gap-2 text-sm font-medium">
                      <input type="checkbox" checked={cuisine.includes(code)} onChange={() => toggleCuisine(code)} />
                      {cuisineLabel(code, locale)}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="jr-seatingCapacity" className={labelClass}>{t("seatingCapacityLabel")}</label>
                  <input
                    id="jr-seatingCapacity"
                    type="number"
                    min={1}
                    value={seatingCapacity ?? ""}
                    onChange={(e) => setSeatingCapacity(e.target.value ? Number(e.target.value) : undefined)}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label htmlFor="jr-numberOfTables" className={labelClass}>{t("numberOfTablesLabel")}</label>
                  <input
                    id="jr-numberOfTables"
                    type="number"
                    min={1}
                    value={numberOfTables ?? ""}
                    onChange={(e) => setNumberOfTables(e.target.value ? Number(e.target.value) : undefined)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>{t("languagesSpokenLabel")}</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {LANGUAGE_SPOKEN_OPTIONS.map((value) => (
                    <label key={value} className="flex items-center gap-2 text-sm font-medium">
                      <input type="checkbox" checked={languagesSpoken.includes(value)} onChange={() => toggleLanguageSpoken(value)} />
                      {languageSpokenLabel(value, locale)}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>{t("amenitiesTitle")}</label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {AMENITIES_BY_LISTING_TYPE.restaurant.map((code) => {
                    const Icon = AMENITY_ICON[code];
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
                        {tAmenity(code)}
                      </button>
                    );
                  })}
                </div>
                <label className="mt-3 flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={is24Hours} onChange={(e) => setIs24Hours(e.target.checked)} />
                  {t("is24HoursLabel")}
                </label>
              </div>
            </div>
          )}

          {isCafe && (
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="jr-cafeType" className={labelClass}>{t("cafeTypeLabel")}</label>
                  <select
                    id="jr-cafeType"
                    value={cafeType}
                    onChange={(e) => setCafeType(e.target.value as CafeType | "")}
                    className={inputClass}
                  >
                    <option value="" disabled>{t("selectCafeTypePlaceholder")}</option>
                    {CAFE_TYPE_ORDER.map((type) => (
                      <option key={type} value={type}>{cafeTypeLabel(type, locale)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="jr-cafeSeatingCapacity" className={labelClass}>{t("seatingCapacityLabel")}</label>
                  <input
                    id="jr-cafeSeatingCapacity"
                    type="number"
                    min={1}
                    value={seatingCapacity ?? ""}
                    onChange={(e) => setSeatingCapacity(e.target.value ? Number(e.target.value) : undefined)}
                    className={inputClass}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>{t("amenitiesTitle")}</label>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {AMENITIES_BY_LISTING_TYPE.cafe.map((code) => {
                    const Icon = AMENITY_ICON[code];
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
                        {tAmenity(code)}
                      </button>
                    );
                  })}
                </div>
              </div>
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

          {isSchool && (
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="jr-schoolType" className={labelClass}>{t("schoolTypeLabel")}</label>
                  <select id="jr-schoolType" value={schoolType} onChange={(e) => setSchoolType(e.target.value as SchoolType | "")} className={inputClass}>
                    <option value="" disabled>{t("selectSchoolTypePlaceholder")}</option>
                    {SCHOOL_TYPE_ORDER.map((type) => (
                      <option key={type} value={type}>{schoolTypeLabel(type, locale)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="jr-curriculum" className={labelClass}>{t("curriculumLabel")}</label>
                  <select id="jr-curriculum" value={curriculum} onChange={(e) => setCurriculum(e.target.value as Curriculum | "")} className={inputClass}>
                    <option value="" disabled>{t("selectCurriculumPlaceholder")}</option>
                    {CURRICULUM_ORDER.map((value) => (
                      <option key={value} value={value}>{curriculumLabel(value, locale)}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className={labelClass}>{t("educationLevelsLabel")}</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {EDUCATION_LEVEL_ORDER.map((value) => (
                    <label key={value} className="flex items-center gap-2 text-sm font-medium">
                      <input type="checkbox" checked={educationLevels.includes(value)} onChange={() => toggleEducationLevel(value)} />
                      {educationLevelLabel(value, locale)}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="jr-ageRangeGrades" className={labelClass}>{t("ageRangeGradesLabel")}</label>
                <input id="jr-ageRangeGrades" value={ageRangeGrades} onChange={(e) => setAgeRangeGrades(e.target.value)} className={inputClass} />
              </div>

              <div className="grid gap-5 sm:grid-cols-3">
                <div>
                  <label htmlFor="jr-numberOfClassrooms" className={labelClass}>{t("numberOfClassroomsLabel")}</label>
                  <input id="jr-numberOfClassrooms" type="number" min={0} value={numberOfClassrooms ?? ""} onChange={(e) => setNumberOfClassrooms(e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="jr-schoolFloors" className={labelClass}>{t("numberOfFloorsLabel")}</label>
                  <input id="jr-schoolFloors" type="number" min={0} value={numberOfFloors ?? ""} onChange={(e) => setNumberOfFloors(e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="jr-yearEstablishedSchool" className={labelClass}>{t("yearEstablishedLabel")}</label>
                  <input id="jr-yearEstablishedSchool" type="number" min={1900} max={new Date().getFullYear()} value={yearEstablished ?? ""} onChange={(e) => setYearEstablished(e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="jr-numberOfStudentsSchool" className={labelClass}>{t("numberOfStudentsLabel")}</label>
                  <input id="jr-numberOfStudentsSchool" type="number" min={0} value={numberOfStudents ?? ""} onChange={(e) => setNumberOfStudents(e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="jr-numberOfTeachersSchool" className={labelClass}>{t("numberOfTeachersLabel")}</label>
                  <input id="jr-numberOfTeachersSchool" type="number" min={0} value={numberOfTeachers ?? ""} onChange={(e) => setNumberOfTeachers(e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>{t("languagesOfInstructionLabel")}</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {LANGUAGE_SPOKEN_OPTIONS.map((value) => (
                    <label key={value} className="flex items-center gap-2 text-sm font-medium">
                      <input type="checkbox" checked={languagesSpoken.includes(value)} onChange={() => toggleLanguageSpoken(value)} />
                      {languageSpokenLabel(value, locale)}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>{t("schoolFacilitiesLabel")}</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {SCHOOL_FACILITY_CODES.map((code) => {
                    const Icon = EDUCATION_FACILITY_ICON[code];
                    return (
                      <label key={code} className="flex items-center gap-2 text-sm font-medium">
                        <input type="checkbox" checked={educationFacilities.includes(code)} onChange={() => toggleEducationFacility(code)} />
                        <Icon size={14} className="shrink-0 text-ink/50 dark:text-sand/50" aria-hidden="true" />
                        {educationFacilityLabel(code, locale)}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-ink/10 p-4 dark:border-white/15">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" checked={admissionsOpen} onChange={(e) => setAdmissionsOpen(e.target.checked)} />
                  {t("admissionsOpenLabel")}
                </label>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="jr-admissionPhoneSchool" className={labelClass}>{t("admissionPhoneLabel")}</label>
                    <input id="jr-admissionPhoneSchool" type="tel" value={admissionPhone} onChange={(e) => setAdmissionPhone(e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
                  </div>
                  <div>
                    <label htmlFor="jr-admissionWhatsappSchool" className={labelClass}>{t("admissionWhatsappLabel")}</label>
                    <input id="jr-admissionWhatsappSchool" type="tel" value={admissionWhatsapp} onChange={(e) => setAdmissionWhatsapp(e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="jr-admissionUrlSchool" className={labelClass}>{t("admissionUrlLabel")}</label>
                    <input id="jr-admissionUrlSchool" type="url" value={admissionUrl} onChange={(e) => setAdmissionUrl(e.target.value)} className={inputClass} placeholder="https://…" />
                  </div>
                  <div>
                    <label htmlFor="jr-applicationUrlSchool" className={labelClass}>{t("applicationUrlLabel")}</label>
                    <input id="jr-applicationUrlSchool" type="url" value={applicationUrl} onChange={(e) => setApplicationUrl(e.target.value)} className={inputClass} placeholder="https://…" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {isUniversity && (
            <div className="space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="jr-universityType" className={labelClass}>{t("universityTypeLabel")}</label>
                  <select id="jr-universityType" value={universityType} onChange={(e) => setUniversityType(e.target.value as UniversityType | "")} className={inputClass}>
                    <option value="" disabled>{t("selectUniversityTypePlaceholder")}</option>
                    {UNIVERSITY_TYPE_ORDER.map((type) => (
                      <option key={type} value={type}>{universityTypeLabel(type, locale)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="jr-numberOfBuildings" className={labelClass}>{t("numberOfBuildingsLabel")}</label>
                  <input id="jr-numberOfBuildings" type="number" min={0} value={numberOfBuildings ?? ""} onChange={(e) => setNumberOfBuildings(e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>{t("degreeLevelsLabel")}</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {DEGREE_LEVEL_ORDER.map((value) => (
                    <label key={value} className="flex items-center gap-2 text-sm font-medium">
                      <input type="checkbox" checked={degreeLevels.includes(value)} onChange={() => toggleDegreeLevel(value)} />
                      {degreeLevelLabel(value, locale)}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>{t("facultiesOfferedLabel")}</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {FACULTY_ORDER.map((value) => (
                    <label key={value} className="flex items-center gap-2 text-sm font-medium">
                      <input type="checkbox" checked={facultiesOffered.includes(value)} onChange={() => toggleFaculty(value)} />
                      {facultyLabel(value, locale)}
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="jr-yearEstablishedUni" className={labelClass}>{t("yearEstablishedLabel")}</label>
                  <input id="jr-yearEstablishedUni" type="number" min={1900} max={new Date().getFullYear()} value={yearEstablished ?? ""} onChange={(e) => setYearEstablished(e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="jr-numberOfStudentsUni" className={labelClass}>{t("numberOfStudentsLabel")}</label>
                  <input id="jr-numberOfStudentsUni" type="number" min={0} value={numberOfStudents ?? ""} onChange={(e) => setNumberOfStudents(e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="jr-numberOfTeachersUni" className={labelClass}>{t("numberOfFacultyLabel")}</label>
                  <input id="jr-numberOfTeachersUni" type="number" min={0} value={numberOfTeachers ?? ""} onChange={(e) => setNumberOfTeachers(e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
                </div>
              </div>

              <div>
                <label className={labelClass}>{t("languagesOfInstructionLabel")}</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {LANGUAGE_SPOKEN_OPTIONS.map((value) => (
                    <label key={value} className="flex items-center gap-2 text-sm font-medium">
                      <input type="checkbox" checked={languagesSpoken.includes(value)} onChange={() => toggleLanguageSpoken(value)} />
                      {languageSpokenLabel(value, locale)}
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelClass}>{t("campusFacilitiesLabel")}</label>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {UNIVERSITY_FACILITY_CODES.map((code) => {
                    const Icon = EDUCATION_FACILITY_ICON[code];
                    return (
                      <label key={code} className="flex items-center gap-2 text-sm font-medium">
                        <input type="checkbox" checked={educationFacilities.includes(code)} onChange={() => toggleEducationFacility(code)} />
                        <Icon size={14} className="shrink-0 text-ink/50 dark:text-sand/50" aria-hidden="true" />
                        {educationFacilityLabel(code, locale)}
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-3 rounded-2xl border border-ink/10 p-4 dark:border-white/15">
                <label className="flex items-center gap-2 text-sm font-semibold">
                  <input type="checkbox" checked={admissionsOpen} onChange={(e) => setAdmissionsOpen(e.target.checked)} />
                  {t("admissionsOpenLabel")}
                </label>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="jr-admissionPhoneUni" className={labelClass}>{t("admissionPhoneLabel")}</label>
                    <input id="jr-admissionPhoneUni" type="tel" value={admissionPhone} onChange={(e) => setAdmissionPhone(e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
                  </div>
                  <div>
                    <label htmlFor="jr-admissionWhatsappUni" className={labelClass}>{t("admissionWhatsappLabel")}</label>
                    <input id="jr-admissionWhatsappUni" type="tel" value={admissionWhatsapp} onChange={(e) => setAdmissionWhatsapp(e.target.value)} className={inputClass} placeholder="+252 63 000 0000" />
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="jr-admissionUrlUni" className={labelClass}>{t("admissionUrlLabel")}</label>
                    <input id="jr-admissionUrlUni" type="url" value={admissionUrl} onChange={(e) => setAdmissionUrl(e.target.value)} className={inputClass} placeholder="https://…" />
                  </div>
                  <div>
                    <label htmlFor="jr-applicationUrlUni" className={labelClass}>{t("applicationUrlLabel")}</label>
                    <input id="jr-applicationUrlUni" type="url" value={applicationUrl} onChange={(e) => setApplicationUrl(e.target.value)} className={inputClass} placeholder="https://…" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {isSalon && (
            <div className="space-y-5">
              <div>
                <label htmlFor="jr-salonType" className={labelClass}>{t("salonTypeLabel")}</label>
                <select id="jr-salonType" value={salonType} onChange={(e) => setSalonType(e.target.value as SalonType | "")} className={inputClass}>
                  <option value="" disabled>{t("selectSalonTypePlaceholder")}</option>
                  {SALON_TYPE_ORDER.map((type) => (
                    <option key={type} value={type}>{salonTypeLabel(type, locale)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="jr-staffCountSalon" className={labelClass}>{t("numberOfStylistsLabel")}</label>
                <input id="jr-staffCountSalon" type="number" min={0} value={staffCount ?? ""} onChange={(e) => setStaffCount(e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={walkInsAccepted} onChange={(e) => setWalkInsAccepted(e.target.checked)} />
                  {t("walkInsAcceptedLabel")}
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={homeServiceAvailable} onChange={(e) => setHomeServiceAvailable(e.target.checked)} />
                  {t("homeServiceAvailableLabel")}
                </label>
              </div>
            </div>
          )}

          {isBarbershop && (
            <div className="space-y-5">
              <div>
                <label htmlFor="jr-shopType" className={labelClass}>{t("shopTypeLabel")}</label>
                <select id="jr-shopType" value={shopType} onChange={(e) => setShopType(e.target.value as ShopType | "")} className={inputClass}>
                  <option value="" disabled>{t("selectShopTypePlaceholder")}</option>
                  {SHOP_TYPE_ORDER.map((type) => (
                    <option key={type} value={type}>{shopTypeLabel(type, locale)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="jr-staffCountBarber" className={labelClass}>{t("numberOfBarbersLabel")}</label>
                <input id="jr-staffCountBarber" type="number" min={0} value={staffCount ?? ""} onChange={(e) => setStaffCount(e.target.value ? Number(e.target.value) : undefined)} className={inputClass} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={walkInsAccepted} onChange={(e) => setWalkInsAccepted(e.target.checked)} />
                  {t("walkInsAcceptedLabel")}
                </label>
                <label className="flex items-center gap-2 text-sm font-medium">
                  <input type="checkbox" checked={homeServiceAvailable} onChange={(e) => setHomeServiceAvailable(e.target.checked)} />
                  {t("homeServiceAvailableLabel")}
                </label>
              </div>
            </div>
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
