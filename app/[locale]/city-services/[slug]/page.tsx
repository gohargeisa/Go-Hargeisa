import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MapPin, Navigation, ExternalLink, Phone as PhoneIcon, MessageCircle, Mail, Globe, Wrench, GraduationCap, Send, ShoppingBag, FileText } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getCityServiceBySlug, getAllCityServiceSlugs, getCityServicesGroupedByCategory } from "@/lib/data/city-services";
import { getCategoryById } from "@/lib/data/categories";
import { getProductsForListing } from "@/lib/data/products";
import { ProductsSection } from "@/components/shared/products-section";
import { getDoctorsForListing, getDepartmentsForListing } from "@/lib/data/doctors";
import { DoctorsSection } from "@/components/shared/doctors-section";
import { categoryDisplayName } from "@/lib/utils/category-href";
import { getMyReviewForListing } from "@/lib/data/reviews";
import { isListingFavorited } from "@/lib/data/favorites";
import { getNearbyListings } from "@/lib/data/nearby";
import { HotelHeaderTop } from "@/components/shared/hotel-header-top";
import { HotelGallerySlider } from "@/components/shared/hotel-gallery-slider";
import { HotelNavTabs, type HotelNavTab } from "@/components/shared/hotel-nav-tabs";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { BusinessPhotoGallery } from "@/components/shared/business-photo-gallery";
import { SERVICE_GALLERY_CATEGORIES } from "@/lib/utils/gallery-categories";
import { VideoGallery } from "@/components/shared/video-gallery";
import { AddToTripButton } from "@/components/shared/add-to-trip-button";
import { PartnerAcquisitionCta } from "@/components/shared/partner-acquisition-cta";
import { isMedicalAppointmentCategory } from "@/lib/utils/appointment-domain";
import { ClaimBusinessButton } from "@/components/shared/claim-business-button";
import { AmenitiesSection, hasAmenities } from "@/components/shared/amenities-section";
import { ServiceTagsSection, hasServiceTags } from "@/components/shared/service-tags-section";
import { SocialLinks } from "@/components/shared/social-links";
import { OpenStatusBadge } from "@/components/shared/open-status-badge";
import { formatDayRange, formatTime12h } from "@/lib/utils/opening-hours";
import { ReviewsSection } from "@/components/shared/reviews-section";
import { ReviewForm } from "@/components/shared/review-form";
import { ShareButton } from "@/components/shared/share-button";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { NearbyListings } from "@/components/shared/nearby-listings";
import { CityServiceCard } from "@/components/shared/city-service-card";
import { SecondaryButton, PrimaryButton } from "@/components/shared/buttons";
import { resolveMapsUrl, resolveDirectionsUrl } from "@/lib/utils/google-maps";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import { normalizeExternalUrl } from "@/lib/utils/normalize-url";
import { Reveal } from "@/components/home/reveal";
import { safeJsonLd } from "@/lib/utils/json-ld";
import { CityServiceTypedFieldsDisplay } from "@/components/shared/city-service-typed-fields-display";
import { getPrimaryActionGroup } from "@/lib/utils/business-primary-action";
import { getDocumentLabelGroup } from "@/lib/utils/business-document";
import type { CityService } from "@/types";

export const revalidate = 3600;

/** Whether Hospital/Pharmacy's typed columns (see
 * 20260812000002_hospital_pharmacy_fields.sql) have at least one value set —
 * gates the "Details" tab the same way hasDetails does on the services
 * detail page. */
function hasTypedDetails(service: CityService, categorySlug: string): boolean {
  if (categorySlug === "hospital") {
    return [
      service.hospitalType, service.bedsCount, service.doctorsCount, service.nursesCount,
      service.departmentsCount, service.operatingRoomsCount, service.visitingHours,
      service.emergencyDepartment, service.icuAvailable, service.pharmacyOnsite,
      service.laboratoryOnsite, service.radiologyOnsite, service.ambulanceAvailable,
      service.maternityDepartment, service.pediatricDepartment,
    ].some((v) => v !== undefined && v !== false && v !== "");
  }
  if (categorySlug === "pharmacy") {
    return [
      service.pharmacyType, service.pharmacyEmergencyContact,
      service.pharmacyDeliveryAvailable, service.prescriptionRequired, service.homeDelivery,
    ].some((v) => v !== undefined && v !== false && v !== "");
  }
  if (categorySlug === "clinic") {
    const values: (string | number | boolean | undefined)[] = [
      service.clinicType, service.numberOfTreatmentRooms,
      service.insuranceAccepted?.length, service.languages?.length,
    ];
    return values.some((v) => v !== undefined && v !== false && v !== 0 && v !== "");
  }
  if (categorySlug === "school") {
    const values: (string | number | boolean | undefined)[] = [
      service.schoolType, service.curriculum, service.educationLevels?.length, service.ageRangeGrades,
      service.numberOfClassrooms, service.numberOfStudents, service.numberOfTeachers,
      service.languages?.length, service.admissionsOpen, service.educationFacilities?.length,
    ];
    return values.some((v) => v !== undefined && v !== false && v !== 0 && v !== "");
  }
  if (categorySlug === "university") {
    const values: (string | number | boolean | undefined)[] = [
      service.universityType, service.degreeLevels?.length, service.facultiesOffered?.length,
      service.numberOfBuildings, service.numberOfStudents, service.numberOfTeachers,
      service.languages?.length, service.admissionsOpen, service.educationFacilities?.length,
    ];
    return values.some((v) => v !== undefined && v !== false && v !== 0 && v !== "");
  }
  if (categorySlug === "beauty-salon") {
    const values: (string | number | boolean | undefined)[] = [service.salonType, service.staffCount, service.walkInsAccepted, service.homeServiceAvailable];
    return values.some((v) => v !== undefined && v !== false && v !== 0 && v !== "");
  }
  if (categorySlug === "men-barbershop") {
    const values: (string | number | boolean | undefined)[] = [service.shopType, service.staffCount, service.walkInsAccepted, service.homeServiceAvailable];
    return values.some((v) => v !== undefined && v !== false && v !== 0 && v !== "");
  }
  if (categorySlug === "perfume-shop" || categorySlug === "cosmetics-beauty") {
    const values: (string | number | boolean | undefined)[] = [service.storeType, service.brands?.length];
    return values.some((v) => v !== undefined && v !== false && v !== 0 && v !== "");
  }
  return false;
}

export async function generateStaticParams() {
  const slugs = await getAllCityServiceSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}): Promise<Metadata> {
  const service = await getCityServiceBySlug(slug, locale);
  if (!service) return {};
  return {
    title: `${service.name} — Hargeisa City Services`,
    description: service.description ?? undefined,
    openGraph: service.image ? { images: [service.image] } : undefined,
    alternates: localeAlternates(locale, `/city-services/${service.slug}`),
  };
}

export default async function CityServiceDetailPage({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}) {
  const service = await getCityServiceBySlug(slug, locale);
  if (!service) notFound();

  const category = await getCategoryById(service.categoryId);
  if (!category) notFound();

  const t = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const td = await getTranslations("detail");
  const th = await getTranslations("hotelDetail");
  const tw = await getTranslations("weekdays");
  const tl = await getTranslations("listings");
  const tn = await getTranslations("nearby");
  const tp = await getTranslations("products");
  const ta = await getTranslations("appointments");

  const featureEligible = category.supportsNewFeatures;
  const galleryEligible = category.supportsGallery;
  const categoryLabel = categoryDisplayName(category, locale);
  const productsEligible = category.supportsProducts;
  const appointmentsEligible = category.supportsAppointments;
  // "dental-clinic" was the old standalone category slug before Dental was
  // folded into Clinics as one clinicType value — real dental listings today
  // are category.slug === "clinic" with clinicType === "dental".
  const isDental = category.slug === "dental-clinic" || (category.slug === "clinic" && service.clinicType === "dental");
  const isMedical = isMedicalAppointmentCategory(category.slug);
  const primaryActionGroup = getPrimaryActionGroup(category.slug, productsEligible);
  const documentLabelGroup = getDocumentLabelGroup({ listingType: "city_service", categorySlug: category.slug });
  const documentLabelKey = `document_${documentLabelGroup}` as const;

  const [myReview, isFavorited, nearbyPlaces, allGroups, products, doctors, departments] = await Promise.all([
    featureEligible ? getMyReviewForListing("city_service", service.id) : Promise.resolve(null),
    featureEligible ? isListingFavorited("city_service", service.id) : Promise.resolve(false),
    getNearbyListings({ lat: service.coords.lat, lng: service.coords.lng, excludeType: "city_service", excludeId: service.id }),
    getCityServicesGroupedByCategory(locale),
    productsEligible ? getProductsForListing(service.id) : Promise.resolve([]),
    appointmentsEligible ? getDoctorsForListing(service.id) : Promise.resolve([]),
    appointmentsEligible ? getDepartmentsForListing(service.id) : Promise.resolve([]),
  ]);
  const moreInCategory = (allGroups.find((g) => g.category.id === service.categoryId)?.items ?? [])
    .filter((s) => s.id !== service.id)
    .slice(0, 4);

  const showTypedDetails = hasTypedDetails(service, category.slug);
  const hasStructuredHours = !!service.openingHoursStructured && service.openingHoursStructured.length > 0;
  const hasHoursInfo = featureEligible && (hasStructuredHours || service.is24Hours || service.temporarilyClosed || service.permanentlyClosed);
  const serviceWhatsappHref = service.whatsapp ? toWhatsAppHref(service.whatsapp, `Hi, I'd like to know more about ${service.name}.`) : undefined;
  const serviceWebsiteHref = service.website ? normalizeExternalUrl(service.website) : undefined;

  // Category-aware primary action, mutually exclusive with the doctor/staff
  // appointment button above it — see lib/utils/business-primary-action.ts.
  // "product_order" scrolls to the universal cart/Products section (see
  // product_orders table) once the listing actually has products; otherwise
  // (and for every other non-appointment category) it falls back to the same
  // real contact channels already computed above, just wrapped in a
  // category-appropriate label (Book Service / Inquire Now / Request
  // Booking / Contact Us) instead of a second flat Call/WhatsApp row.
  const showDoctorPrimary = appointmentsEligible && doctors.length > 0;
  const showOrderPrimary = !showDoctorPrimary && primaryActionGroup === "product_order" && products.length > 0;
  const showCatalogSecondary = productsEligible && products.length > 0;
  const genericPrimaryAction = serviceWhatsappHref
    ? { href: serviceWhatsappHref, external: true }
    : service.phone
      ? { href: `tel:${service.phone}`, external: false }
      : serviceWebsiteHref
        ? { href: serviceWebsiteHref, external: true }
        : undefined;
  const showGenericPrimary = !showDoctorPrimary && !showOrderPrimary && !!genericPrimaryAction;
  const genericGroup = primaryActionGroup === "product_order" ? "contact" : primaryActionGroup;

  const navTabs: HotelNavTab[] = [
    { id: "overview", label: td("overview") },
    ...(productsEligible && products.length > 0 ? [{ id: "products", label: tp("title") }] : []),
    ...(showTypedDetails ? [{ id: "details", label: td("details") }] : []),
    ...(appointmentsEligible && doctors.length > 0 ? [{ id: "doctors", label: ta(isMedical ? "doctorsTitle" : "staffLabel") }] : []),
    ...(galleryEligible && service.gallery.length > 0 ? [{ id: "gallery", label: t("gallery") }] : []),
    ...(featureEligible && service.videos && service.videos.length > 0 ? [{ id: "videos", label: td("videoGallery") }] : []),
    ...(hasHoursInfo ? [{ id: "hours", label: td("openingHoursByDay") }] : []),
    ...(hasServiceTags(service.serviceTags) ? [{ id: "services-offered", label: t("servicesOffered") }] : []),
    ...(featureEligible && hasAmenities(service.amenitiesV2) ? [{ id: "amenities", label: t("amenities") }] : []),
    { id: "location", label: td("location") },
    ...(featureEligible ? [{ id: "reviews", label: t("reviews") }] : []),
  ];

  const googleMapsHref = resolveMapsUrl(service.coords, service.mapsUrl);
  const directionsHref = resolveDirectionsUrl(service.coords);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: service.name,
    description: service.description ?? undefined,
    image: service.image ?? undefined,
    telephone: service.phone ?? undefined,
    ...(featureEligible && service.reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: service.rating, reviewCount: service.reviewCount } }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <Breadcrumbs
        items={[
          { label: tNav("cityServices"), href: `/${locale}/city-services` },
          { label: service.name, href: `/${locale}/city-services/${service.slug}` },
        ]}
      />

      <HotelHeaderTop
        logo={service.logoUrl}
        name={service.name}
        rating={service.rating}
        reviewCount={service.reviewCount}
        categoryLabel={categoryLabel}
        showRating={featureEligible}
        locale={locale}
        isPartner={service.isPartner}
        fallbackIcon={category.icon}
        fallbackColor={category.color}
        logoFit="contain"
      />

      {showDoctorPrimary || showOrderPrimary || showGenericPrimary || showCatalogSecondary || service.phone || serviceWhatsappHref || service.email || serviceWebsiteHref ? (
        <Reveal delay={0.05}>
          <div className="container-px mx-auto mt-6 flex flex-wrap items-center justify-center gap-3">
            {showDoctorPrimary && (
              <PrimaryButton href={`/${locale}/city-services/${service.slug}/book`} size="sm">
                {isMedical ? (isDental ? ta("bookADentist") : ta("bookADoctor")) : ta("bookAppointmentButton")}
              </PrimaryButton>
            )}
            {showOrderPrimary && (
              <PrimaryButton href="#products" size="sm">
                <ShoppingBag size={15} aria-hidden="true" />
                {t("viewProducts")}
              </PrimaryButton>
            )}
            {!showOrderPrimary && showCatalogSecondary && (
              <SecondaryButton href="#products" size="sm">
                <ShoppingBag size={15} aria-hidden="true" />
                {t("viewProducts")}
              </SecondaryButton>
            )}
            {showGenericPrimary && genericPrimaryAction && (
              <PrimaryButton href={genericPrimaryAction.href} external={genericPrimaryAction.external} size="sm">
                {genericGroup === "car_service" ? (
                  <Wrench size={15} aria-hidden="true" />
                ) : genericGroup === "education" ? (
                  <GraduationCap size={15} aria-hidden="true" />
                ) : genericGroup === "travel" ? (
                  <Send size={15} aria-hidden="true" />
                ) : (
                  <MessageCircle size={15} aria-hidden="true" />
                )}
                {genericGroup === "car_service"
                  ? t("bookService")
                  : genericGroup === "education"
                    ? t("inquireNow")
                    : genericGroup === "travel"
                      ? t("requestBooking")
                      : t("contactUs")}
              </PrimaryButton>
            )}
            {service.phone && (
              <SecondaryButton href={`tel:${service.phone}`} size="sm">
                <PhoneIcon size={15} aria-hidden="true" />
                {th("call")}
              </SecondaryButton>
            )}
            {serviceWhatsappHref && (
              <SecondaryButton href={serviceWhatsappHref} external size="sm">
                <MessageCircle size={15} aria-hidden="true" />
                {th("whatsapp")}
              </SecondaryButton>
            )}
            {serviceWebsiteHref && (
              <SecondaryButton href={serviceWebsiteHref} external size="sm">
                <Globe size={15} aria-hidden="true" />
                {th("website")}
              </SecondaryButton>
            )}
            {service.email && (
              <SecondaryButton href={`mailto:${service.email}`} size="sm">
                <Mail size={15} aria-hidden="true" />
                {th("email")}
              </SecondaryButton>
            )}
            {service.documentUrl && (
              <SecondaryButton href={service.documentUrl} external size="sm">
                <FileText size={15} aria-hidden="true" />
                {t(documentLabelKey)}
              </SecondaryButton>
            )}
          </div>
        </Reveal>
      ) : null}

      {featureEligible && (
        <SocialLinks
          instagram={service.socialInstagram}
          facebook={service.socialFacebook}
          tiktok={service.socialTiktok}
          snapchat={service.socialSnapchat}
          x={service.socialX}
          youtube={service.socialYoutube}
          telegram={service.socialTelegram}
          labels={{
            instagram: td("followInstagram"),
            facebook: td("followFacebook"),
            tiktok: td("followTiktok"),
            snapchat: td("followSnapchat"),
            x: td("followX"),
            youtube: td("followYoutube"),
            telegram: td("followTelegram"),
          }}
          className="container-px mx-auto mt-3 justify-center"
        />
      )}

      {service.image && (
        <HotelGallerySlider
          cover={service.image}
          images={galleryEligible ? service.gallery : []}
          alt={service.name}
          productOriented={productsEligible}
        />
      )}

      <div className="mt-8">
        <HotelNavTabs tabs={navTabs} />
      </div>

      <div className="container-px mx-auto grid gap-10 py-10 lg:grid-cols-3 lg:gap-12">
        <div className="lg:col-span-2 space-y-14">
          {service.description && (
            <Reveal>
              <section id="overview" aria-labelledby="overview-heading" className="scroll-mt-36">
                <h2 id="overview-heading" className="mb-5 font-display text-2xl font-semibold">
                  {td("overview")}
                </h2>
                <p className="leading-relaxed text-ink/75 dark:text-sand/75">{service.description}</p>
              </section>
            </Reveal>
          )}

          {productsEligible && products.length > 0 && (
            <Reveal>
              <section id="products" aria-labelledby="products-heading" className="scroll-mt-36">
                <h2 id="products-heading" className="mb-5 font-display text-2xl font-semibold">
                  {tp("title")}
                </h2>
                <ProductsSection
                  products={products}
                  storeName={service.name}
                  business={{ listingType: "city_service", listingId: service.id, businessName: service.name, deliveryEnabled: true, addons: [] }}
                  locale={locale}
                />
              </section>
            </Reveal>
          )}

          {showTypedDetails && (
            <Reveal>
              <section id="details" aria-labelledby="details-heading" className="scroll-mt-36">
                <h2 id="details-heading" className="mb-5 font-display text-2xl font-semibold">
                  {td("details")}
                </h2>
                <CityServiceTypedFieldsDisplay service={service} categorySlug={category.slug} locale={locale} />
              </section>
            </Reveal>
          )}

          {appointmentsEligible && doctors.length > 0 && (
            <Reveal>
              <section id="doctors" aria-labelledby="doctors-heading" className="scroll-mt-36">
                <h2 id="doctors-heading" className="mb-5 font-display text-2xl font-semibold">
                  {ta(isMedical ? "doctorsTitle" : "staffLabel")}
                </h2>
                <DoctorsSection
                  doctors={doctors}
                  departments={departments}
                  locale={locale}
                  bookHref={(doctorId) => `/${locale}/city-services/${service.slug}/book?doctor=${doctorId}`}
                  bookLabel={ta("bookAppointment")}
                  isMedical={isMedical}
                />
              </section>
            </Reveal>
          )}

          {galleryEligible && service.gallery.length > 0 && (
            <Reveal>
              <section id="gallery" aria-labelledby="photo-gallery-heading" className="scroll-mt-36">
                <h2 id="photo-gallery-heading" className="mb-5 font-display text-2xl font-semibold">
                  {th("photoGallery")}
                </h2>
                <BusinessPhotoGallery images={service.gallery} alt={service.name} categories={SERVICE_GALLERY_CATEGORIES} />
              </section>
            </Reveal>
          )}

          {featureEligible && service.videos && service.videos.length > 0 && (
            <Reveal>
              <section id="videos" aria-labelledby="video-gallery-heading" className="scroll-mt-36">
                <h2 id="video-gallery-heading" className="mb-5 font-display text-2xl font-semibold">
                  {td("videoGallery")}
                </h2>
                <VideoGallery videos={service.videos} watchOnLabel={(platform) => td("watchOn", { platform })} />
              </section>
            </Reveal>
          )}

          {hasHoursInfo && (
            <Reveal>
              <section id="hours" aria-labelledby="hours-heading" className="scroll-mt-36">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <h2 id="hours-heading" className="font-display text-2xl font-semibold">
                    🕒 {td("openingHoursByDay")}
                  </h2>
                  <OpenStatusBadge
                    groups={service.openingHoursStructured ?? []}
                    is24Hours={service.is24Hours}
                    temporarilyClosed={service.temporarilyClosed}
                    permanentlyClosed={service.permanentlyClosed}
                  />
                </div>
                {hasStructuredHours ? (
                  <div className="divide-y divide-ink/8 overflow-hidden rounded-xl2 border border-ink/8 dark:divide-white/10 dark:border-white/10">
                    {service.openingHoursStructured!.map((group, i) => (
                      <div key={i} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
                        <span className="min-w-0 break-words text-sm font-semibold">{formatDayRange(group.days, tw)}</span>
                        <span className="shrink-0 text-sm text-ink/70 dark:text-sand/70">
                          {formatTime12h(group.open)} – {formatTime12h(group.close)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : service.openingHours ? (
                  <p className="text-sm text-ink/70 dark:text-sand/70">{service.openingHours}</p>
                ) : null}
              </section>
            </Reveal>
          )}

          {hasServiceTags(service.serviceTags) && (
            <Reveal>
              <section id="services-offered" aria-labelledby="services-offered-heading" className="scroll-mt-36">
                <h2 id="services-offered-heading" className="mb-5 font-display text-2xl font-semibold">
                  {t("servicesOffered")}
                </h2>
                <ServiceTagsSection tags={service.serviceTags} />
              </section>
            </Reveal>
          )}

          {featureEligible && hasAmenities(service.amenitiesV2) && (
            <Reveal>
              <section id="amenities" aria-labelledby="amenities-heading" className="scroll-mt-36">
                <h2 id="amenities-heading" className="mb-5 font-display text-2xl font-semibold">
                  {t("amenities")}
                </h2>
                <AmenitiesSection amenities={service.amenitiesV2} />
              </section>
            </Reveal>
          )}

          <Reveal>
            <section id="location" aria-labelledby="location-heading" className="scroll-mt-36">
              <h2 id="location-heading" className="mb-5 font-display text-2xl font-semibold">
                {td("location")}
              </h2>
              <div className="flex flex-col gap-4 rounded-xl3 border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:items-center sm:justify-between">
                <p className="flex items-center gap-2 text-sm text-ink/70 dark:text-sand/70">
                  <MapPin size={16} className="shrink-0 text-primary" aria-hidden="true" />
                  {categoryLabel}
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {directionsHref && (
                    <PrimaryButton href={directionsHref} external size="sm">
                      <Navigation size={14} aria-hidden="true" />
                      {th("directions")}
                    </PrimaryButton>
                  )}
                  {googleMapsHref && (
                    <SecondaryButton href={googleMapsHref} external size="sm">
                      {td("openInGoogleMaps")}
                      <ExternalLink size={14} aria-hidden="true" />
                    </SecondaryButton>
                  )}
                </div>
              </div>
            </section>
          </Reveal>

          {featureEligible && (
            <Reveal>
              <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-36">
                <h2 id="reviews-heading" className="mb-5 font-display text-2xl font-semibold">
                  {t("reviews")}
                </h2>
                <ReviewsSection
                  rating={service.rating}
                  reviewCount={service.reviewCount}
                  reviews={service.reviews}
                  locale={locale}
                  pathToRevalidate={`/${locale}/city-services/${service.slug}`}
                />
                <div className="mt-6">
                  <ReviewForm
                    key={myReview?.id ?? "new"}
                    listingType="city_service"
                    listingId={service.id}
                    locale={locale}
                    pathToRevalidate={`/${locale}/city-services/${service.slug}`}
                    allowPhotos
                    existingReview={myReview}
                  />
                </div>
              </section>
            </Reveal>
          )}
        </div>

        <aside className="h-fit space-y-3 rounded-xl3 border border-ink/8 p-6 shadow-card dark:border-white/10 lg:sticky lg:top-24">
          <AddToTripButton locale={locale} listingType="city_service" listingId={service.id} />
          <ShareButton title={service.name} />
          {featureEligible && (
            <FavoriteButton
              listingType="city_service"
              listingId={service.id}
              locale={locale}
              initiallyFavorited={isFavorited}
              count={service.favoriteCount}
              showSpinner={false}
              size={15}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
              addLabel={tl("addToFavorites", { name: service.name })}
              removeLabel={tl("removeFromFavorites", { name: service.name })}
            />
          )}
          <ClaimBusinessButton
            listingType="city_service"
            listingId={service.id}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-ink/15 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
          />
        </aside>
      </div>

      {nearbyPlaces.length > 0 && (
        <section className="border-t border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-white/[0.03] sm:py-20">
          <div className="container-px mx-auto">
            <Reveal>
              <h2 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">{tn("nearbyPlaces")}</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <NearbyListings listings={nearbyPlaces} locale={locale} distanceLabel={(km) => tn("distanceAway", { km })} />
            </Reveal>
          </div>
        </section>
      )}

      {moreInCategory.length > 0 && (
        <section className="border-t border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-white/[0.03] sm:py-20">
          <div className="container-px mx-auto">
            <Reveal>
              <h2 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">{categoryLabel}</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {moreInCategory.map((s) => (
                  <CityServiceCard key={s.id} service={s} category={category} locale={locale} />
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <PartnerAcquisitionCta locale={locale} />
    </>
  );
}
