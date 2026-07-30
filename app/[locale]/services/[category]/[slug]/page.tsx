import { safeJsonLd } from "@/lib/utils/json-ld";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ExternalLink, MapPin, Navigation } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getServiceBySlug, getAllServiceSlugs, getServices } from "@/lib/data/services";
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
import { SingleLocationMapLoader } from "@/components/map/single-location-map-loader";
import { Reveal } from "@/components/home/reveal";
import {
  categoryFromSlug,
  serviceHref,
  SERVICE_CATEGORY_LABELS,
  SERVICE_CATEGORY_SINGULAR_LABELS,
  SERVICE_CATEGORY_SLUGS,
} from "@/lib/utils/service-categories";
import { SERVICES_PUBLIC_ENABLED } from "@/lib/config/features";

export const revalidate = 3600;

export async function generateStaticParams() {
  // Services is temporarily hidden from the public site — see
  // lib/config/features.ts. Returning no params here means no detail pages
  // get statically generated while disabled.
  if (!SERVICES_PUBLIC_ENABLED) return [];
  const services = await getAllServiceSlugs();
  return services.map(({ slug, category }) => ({ category: SERVICE_CATEGORY_SLUGS[category], slug }));
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
    title: `${service.name} — ${SERVICE_CATEGORY_SINGULAR_LABELS[service.category]} in Hargeisa`,
    description: service.shortDescription,
    openGraph: { images: [service.coverImage] },
    alternates: localeAlternates(locale as Locale, serviceHref(service.category, service.slug)),
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
  if (categoryFromSlug(categorySlug) !== service.category) notFound();

  const t = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const td = await getTranslations("detail");
  const th = await getTranslations("hotelDetail");
  const [allServices, siteSettings] = await Promise.all([getServices({ category: service.category }), getSiteSettings()]);
  const similarServices = allServices.filter((s) => s.id !== service.id).slice(0, 4);
  const whatsappFallback = (siteSettings as { whatsapp_number?: string } | null)?.whatsapp_number ?? undefined;

  const hasCoordinates = Number.isFinite(service.location?.lat) && Number.isFinite(service.location?.lng);
  const googleMapsHref = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${service.location.lat},${service.location.lng}`
    : undefined;
  const directionsHref = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${service.location.lat},${service.location.lng}`
    : undefined;

  const navTabs: HotelNavTab[] = [
    { id: "overview", label: td("overview") },
    ...(service.services.length > 0 ? [{ id: "services", label: "Services" }] : []),
    ...(service.gallery.length > 0 ? [{ id: "gallery", label: t("gallery") }] : []),
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
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: service.rating,
      reviewCount: service.reviewCount,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <ViewTracker listingType="service" listingId={service.id} />

      <Breadcrumbs
        items={[
          { label: tNav("services"), href: `/${locale}/services` },
          { label: SERVICE_CATEGORY_LABELS[service.category], href: `/${locale}/services/${SERVICE_CATEGORY_SLUGS[service.category]}` },
          { label: service.name, href: `/${locale}${serviceHref(service.category, service.slug)}` },
        ]}
      />

      <HotelHeaderTop
        logo={service.logo}
        name={service.name}
        rating={service.rating}
        reviewCount={service.reviewCount}
        categoryLabel={SERVICE_CATEGORY_SINGULAR_LABELS[service.category]}
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

      <HotelGallerySlider cover={service.coverImage} images={service.gallery} alt={service.name} />

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

          {service.gallery.length > 0 && (
            <Reveal>
              <section id="gallery" aria-labelledby="photo-gallery-heading" className="scroll-mt-36">
                <h2 id="photo-gallery-heading" className="mb-5 font-display text-2xl font-semibold">
                  {th("photoGallery")}
                </h2>
                <BusinessPhotoGallery images={service.gallery} alt={service.name} categories={SERVICE_GALLERY_CATEGORIES} />
              </section>
            </Reveal>
          )}

          <Reveal>
            <section id="location" aria-labelledby="location-heading" className="scroll-mt-36">
              <h2 id="location-heading" className="mb-5 font-display text-2xl font-semibold">
                {td("location")}
              </h2>
              <div className="overflow-hidden rounded-xl3 border border-ink/8 dark:border-white/10">
                <SingleLocationMapLoader location={service.location} label={service.name} />
                <div className="flex flex-col gap-3 border-t border-ink/8 p-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
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
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-36">
              <h2 id="reviews-heading" className="mb-5 font-display text-2xl font-semibold">
                {t("reviews")}
              </h2>
              <ReviewsSection rating={service.rating} reviewCount={service.reviewCount} reviews={service.reviews} />
              <div className="mt-6">
                <ReviewForm
                  listingType="service"
                  listingId={service.id}
                  locale={locale}
                  pathToRevalidate={`/${locale}${serviceHref(service.category, service.slug)}`}
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
                      href={`/${locale}${serviceHref(s.category, s.slug)}`}
                      image={s.coverImage}
                      name={s.name}
                      address={s.address}
                      rating={s.rating}
                      reviewCount={s.reviewCount}
                      services={s.services}
                      phone={s.phone}
                      category={s.category}
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
