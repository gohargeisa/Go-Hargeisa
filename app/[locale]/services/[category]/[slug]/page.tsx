import { safeJsonLd } from "@/lib/utils/json-ld";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ExternalLink, MapPin, Navigation } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getServiceBySlug, getAllServiceSlugs, getServices } from "@/lib/data/services";
import { getCategoryBySlug } from "@/lib/data/categories";
import { getSiteSettings } from "@/lib/actions/settings";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ViewTracker } from "@/components/shared/view-tracker";
import { HotelHeaderTop } from "@/components/shared/hotel-header-top";
import { HotelActionBar } from "@/components/shared/hotel-action-bar";
import { HotelGallerySlider } from "@/components/shared/hotel-gallery-slider";
import { HotelNavTabs, type HotelNavTab } from "@/components/shared/hotel-nav-tabs";
import { BusinessPhotoGallery } from "@/components/shared/business-photo-gallery";
import { SERVICE_GALLERY_CATEGORIES } from "@/lib/utils/gallery-categories";
import { ServiceActionCard } from "@/components/shared/service-action-card";
import { ServiceCard } from "@/components/shared/service-card";
import { ReviewsSection } from "@/components/shared/reviews-section";
import { ReviewForm } from "@/components/shared/review-form";
import { getMyReviewForListing } from "@/lib/data/reviews";
import { resolveMapsUrl, resolveDirectionsUrl } from "@/lib/utils/google-maps";
import { Reveal } from "@/components/home/reveal";
import { serviceHref, singularize } from "@/lib/utils/service-categories";
import { CustomFieldsDisplay } from "@/components/shared/custom-fields-display";
import { ServiceTypedFieldsDisplay } from "@/components/shared/service-typed-fields-display";
import { SERVICES_PUBLIC_ENABLED } from "@/lib/config/features";

const TYPED_FIELD_CATEGORIES = new Set(["apartments", "real-estate", "electronics", "transportation"]);

/** Whether this service's category is one of the typed-column categories
 * AND at least one of its fields actually has a value — mirrors the
 * customFieldsSchema-driven `hasDetails` check above but for the newer
 * typed-column categories (see 20260812000001_..._fields.sql), which don't
 * use customFieldsSchema at all. */
function hasTypedDetails(service: import("@/types").Service, categorySlug: string): boolean {
  if (!TYPED_FIELD_CATEGORIES.has(categorySlug)) return false;
  const candidates: unknown[] =
    categorySlug === "apartments"
      ? [service.apartmentType, service.bedrooms, service.monthlyRent, service.dailyRent, service.parkingAvailable, service.petPolicy]
      : categorySlug === "real-estate"
        ? [service.propertyType, service.listingPurpose, service.price, service.realEstateBedrooms, service.areaSqm]
        : categorySlug === "electronics"
          ? [service.electronicsBusinessType, service.sellsNew, service.sellsUsed, service.warrantyAvailable, (service.brandsAvailable ?? []).length > 0]
          : [service.transportationType, service.vehicleCount, service.driverAvailable, service.rentalAvailable];
  return candidates.some((v) => v !== undefined && v !== false && v !== "");
}

export const revalidate = 3600;

export async function generateStaticParams() {
  // Services is temporarily hidden from the public site — see
  // lib/config/features.ts. Returning no params here means no detail pages
  // get statically generated while disabled.
  if (!SERVICES_PUBLIC_ENABLED) return [];
  const services = await getAllServiceSlugs();
  return services.map(({ slug, categorySlug }) => ({ category: categorySlug, slug }));
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; category: string; slug: string };
}): Promise<Metadata> {
  if (!SERVICES_PUBLIC_ENABLED) return {};
  const service = await getServiceBySlug(slug);
  if (!service) return {};
  return {
    title: `${service.name} — ${singularize(service.categoryLabel)} in Hargeisa`,
    description: service.shortDescription,
    openGraph: { images: [service.coverImage] },
    alternates: localeAlternates(locale as Locale, serviceHref(service.categorySlug, service.slug)),
  };
}

export default async function ServiceDetailPage({
  params: { locale, category: categorySlug, slug },
}: {
  params: { locale: Locale; category: string; slug: string };
}) {
  if (!SERVICES_PUBLIC_ENABLED) notFound();

  const service = await getServiceBySlug(slug);
  if (!service) notFound();

  // The category segment in the URL must actually match the service's real
  // category — otherwise /services/banks/some-hospital-slug would silently
  // render instead of 404ing.
  if (categorySlug !== service.categorySlug) notFound();

  const t = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const td = await getTranslations("detail");
  const th = await getTranslations("hotelDetail");
  const serviceCategory = await getCategoryBySlug(service.categorySlug);
  const [allServices, siteSettings, myReview] = await Promise.all([
    serviceCategory ? getServices({ categoryId: serviceCategory.id }) : Promise.resolve([]),
    getSiteSettings(),
    getMyReviewForListing("service", service.id),
  ]);
  const similarServices = allServices.filter((s) => s.id !== service.id).slice(0, 4);
  const whatsappFallback = (siteSettings as { whatsapp_number?: string } | null)?.whatsapp_number ?? undefined;

  const googleMapsHref = resolveMapsUrl(service.location);
  const directionsHref = resolveDirectionsUrl(service.location);

  // Medical/financial/civic/utility categories (hospitals, pharmacies,
  // banks, mosques, etc.) only ever get the single cover photo — a photo
  // gallery doesn't suit them the way it does tourism/leisure categories.
  const galleryEligible = serviceCategory?.supportsGallery ?? false;
  const galleryImages = galleryEligible ? service.gallery : [];

  const hasDetails = Boolean(
    (serviceCategory && serviceCategory.customFieldsSchema.some((f) => service.customFields[f.key] !== undefined && service.customFields[f.key] !== "")) ||
      hasTypedDetails(service, service.categorySlug)
  );

  const navTabs: HotelNavTab[] = [
    { id: "overview", label: td("overview") },
    ...(hasDetails ? [{ id: "details", label: td("details") }] : []),
    ...(service.services.length > 0 ? [{ id: "services", label: "Services" }] : []),
    ...(galleryImages.length > 0 ? [{ id: "gallery", label: t("gallery") }] : []),
    { id: "reviews", label: t("reviews") },
    { id: "location", label: td("location") },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: service.name,
    description: service.shortDescription,
    image: service.coverImage,
    address: { "@type": "PostalAddress", streetAddress: service.address, addressLocality: "Hargeisa" },
    telephone: service.phone,
    url: service.website,
    ...(service.reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: service.rating, reviewCount: service.reviewCount } }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <ViewTracker listingType="service" listingId={service.id} />

      <Breadcrumbs
        items={[
          { label: tNav("services"), href: `/${locale}/services` },
          { label: service.categoryLabel, href: `/${locale}/services/${service.categorySlug}` },
          { label: service.name, href: `/${locale}${serviceHref(service.categorySlug, service.slug)}` },
        ]}
      />

      <HotelHeaderTop
        logo={service.logo}
        name={service.name}
        rating={service.rating}
        reviewCount={service.reviewCount}
        categoryLabel={singularize(service.categoryLabel)}
      />

      <HotelActionBar
        locale={locale}
        listingType="service"
        listingId={service.id}
        name={service.name}
        phone={service.phone}
        website={service.website}
        whatsappFallback={whatsappFallback}
        showPrimary={false}
      />

      <HotelGallerySlider cover={service.coverImage} images={galleryImages} alt={service.name} />

      <div className="mt-8">
        <HotelNavTabs tabs={navTabs} />
      </div>

      <div className="container-px mx-auto grid gap-10 pb-28 pt-10 lg:grid-cols-3 lg:gap-12 lg:pb-10">
        <div className="space-y-14 lg:col-span-2">
          <Reveal>
            <section id="overview" aria-labelledby="overview-heading" className="scroll-mt-36">
              <h2 id="overview-heading" className="mb-5 font-display text-2xl font-semibold">
                {td("overview")}
              </h2>
              <p className="leading-relaxed text-ink/75 dark:text-sand/75">{service.description}</p>
            </section>
          </Reveal>

          {hasDetails && serviceCategory && (
            <Reveal>
              <section id="details" aria-labelledby="details-heading" className="scroll-mt-36">
                <h2 id="details-heading" className="mb-5 font-display text-2xl font-semibold">
                  {td("details")}
                </h2>
                <CustomFieldsDisplay category={serviceCategory} values={service.customFields} />
                <div className="mt-4">
                  <ServiceTypedFieldsDisplay service={service} categorySlug={service.categorySlug} locale={locale} />
                </div>
              </section>
            </Reveal>
          )}

          {service.services.length > 0 && (
            <Reveal>
              <section id="services" aria-labelledby="services-heading" className="scroll-mt-36">
                <h2 id="services-heading" className="mb-5 font-display text-2xl font-semibold">
                  Services
                </h2>
                <ul className="flex flex-wrap gap-2.5">
                  {service.services.map((item) => (
                    <li
                      key={item}
                      className="inline-flex items-center gap-2 rounded-xl2 border border-ink/8 bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-primary/30 dark:border-white/10 dark:bg-white/[0.03] dark:text-sand"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          )}

          {galleryImages.length > 0 && (
            <Reveal>
              <section id="gallery" aria-labelledby="photo-gallery-heading" className="scroll-mt-36">
                <h2 id="photo-gallery-heading" className="mb-5 font-display text-2xl font-semibold">
                  {th("photoGallery")}
                </h2>
                <BusinessPhotoGallery images={galleryImages} alt={service.name} categories={SERVICE_GALLERY_CATEGORIES} />
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
                  {service.address}
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {directionsHref && (
                    <a
                      href={directionsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
                    >
                      <Navigation size={14} aria-hidden="true" />
                      {th("directions")}
                    </a>
                  )}
                  {googleMapsHref && (
                    <a
                      href={googleMapsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
                    >
                      {td("openInGoogleMaps")}
                      <ExternalLink size={14} aria-hidden="true" />
                    </a>
                  )}
                </div>
              </div>
            </section>
          </Reveal>

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
                pathToRevalidate={`/${locale}${serviceHref(service.categorySlug, service.slug)}`}
              />
              <div className="mt-6">
                <ReviewForm
                  key={myReview?.id ?? "new"}
                  listingType="service"
                  listingId={service.id}
                  locale={locale}
                  pathToRevalidate={`/${locale}${serviceHref(service.categorySlug, service.slug)}`}
                  existingReview={myReview}
                />
              </div>
            </section>
          </Reveal>
        </div>

        <aside className="hidden h-fit rounded-xl3 border border-ink/8 p-6 shadow-card dark:border-white/10 lg:sticky lg:top-24 lg:block">
          <ServiceActionCard
            serviceId={service.id}
            name={service.name}
            openingHours={service.openingHours}
            hoursLabel={t("openingHours")}
            phone={service.phone}
            callLabel={th("call")}
            locale={locale}
          />
        </aside>
      </div>

      {similarServices.length > 0 && (
        <section className="border-t border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-white/[0.03] sm:py-20">
          <div className="container-px mx-auto">
            <Reveal>
              <h2 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">{td("youMayAlsoLike")}</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
                {similarServices.map((s) => (
                  <div key={s.id} className="min-w-[272px] sm:min-w-0">
                    <ServiceCard
                      href={`/${locale}${serviceHref(s.categorySlug, s.slug)}`}
                      image={s.coverImage}
                      name={s.name}
                      address={s.address}
                      rating={s.rating}
                      reviewCount={s.reviewCount}
                      services={s.services}
                      phone={s.phone}
                      categoryLabel={s.categoryLabel}
                      categoryIcon={s.categoryIcon}
                      categoryColor={s.categoryColor}
                      serviceId={s.id}
                      locale={locale}
                    />
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
}
