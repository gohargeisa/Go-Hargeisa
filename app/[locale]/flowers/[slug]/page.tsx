import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { MapPin, Navigation, ExternalLink } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getCityServiceBySlug } from "@/lib/data/city-services";
import { getProductsForListing } from "@/lib/data/products";
import { ProductsSection } from "@/components/shared/products-section";
import { getMyReviewForListing } from "@/lib/data/reviews";
import { isListingFavorited } from "@/lib/data/favorites";
import { getNearbyListings } from "@/lib/data/nearby";
import { HotelHeaderTop } from "@/components/shared/hotel-header-top";
import { HotelGallerySlider } from "@/components/shared/hotel-gallery-slider";
import { HotelNavTabs, type HotelNavTab } from "@/components/shared/hotel-nav-tabs";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { SocialLinks } from "@/components/shared/social-links";
import { OpenStatusBadge } from "@/components/shared/open-status-badge";
import { formatDayRange, formatTime12h } from "@/lib/utils/opening-hours";
import { ReviewsSection } from "@/components/shared/reviews-section";
import { ReviewForm } from "@/components/shared/review-form";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { NearbyListings } from "@/components/shared/nearby-listings";
import { SecondaryButton, PrimaryButton } from "@/components/shared/buttons";
import { resolveMapsUrl, resolveDirectionsUrl } from "@/lib/utils/google-maps";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import { Reveal } from "@/components/home/reveal";
import { safeJsonLd } from "@/lib/utils/json-ld";

// Same reasoning as every other public listing page in this codebase:
// content changes infrequently, so ISR beats rendering on every request.
export const revalidate = 3600;

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}): Promise<Metadata> {
  const service = await getCityServiceBySlug(slug, locale);
  if (!service) return {};
  return {
    title: `${service.name} — Flower Shop in Hargeisa`,
    description: service.description ?? undefined,
    openGraph: service.image ? { images: [service.image] } : undefined,
    alternates: localeAlternates(locale, `/flowers/${service.slug}`),
  };
}

/**
 * Lavender Flowers' own page — a `city_services` listing (category
 * 'flower-shops', already supports_products=true), deliberately a separate,
 * smaller page rather than a route on top of the generic
 * /city-services/[slug] page: this page only needs Overview/Shop/Gallery/
 * Hours/Location/Reviews, none of the doctors/typed-details/appointments
 * machinery the generic page carries for other verticals. The underlying
 * data functions (getCityServiceBySlug, getProductsForListing) and shared
 * components are the exact same ones /city-services/[slug] already uses —
 * nothing new was added to the data layer for this page.
 */
export default async function FlowersDetailPage({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}) {
  const service = await getCityServiceBySlug(slug, locale);
  if (!service) notFound();

  const t = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const td = await getTranslations("detail");
  const th = await getTranslations("hotelDetail");
  const tw = await getTranslations("weekdays");
  const tl = await getTranslations("listings");
  const tn = await getTranslations("nearby");
  const tp = await getTranslations("products");

  const [myReview, isFavorited, nearbyPlaces, products] = await Promise.all([
    getMyReviewForListing("city_service", service.id),
    isListingFavorited("city_service", service.id),
    getNearbyListings({ lat: service.coords.lat, lng: service.coords.lng, excludeType: "city_service", excludeId: service.id }),
    getProductsForListing(service.id),
  ]);

  const showProducts = products.length > 0;
  const hasStructuredHours = !!service.openingHoursStructured && service.openingHoursStructured.length > 0;
  const hasHoursInfo = hasStructuredHours || service.is24Hours || service.temporarilyClosed || service.permanentlyClosed;
  const serviceWhatsappHref = service.whatsapp
    ? toWhatsAppHref(service.whatsapp, `Hi, I'd like to know more about ${service.name}.`)
    : undefined;

  const navTabs: HotelNavTab[] = [
    { id: "overview", label: td("overview") },
    ...(showProducts ? [{ id: "shop", label: td("orderOnline") }] : []),
    ...(hasHoursInfo ? [{ id: "hours", label: td("openingHoursByDay") }] : []),
    ...(service.gallery.length > 0 ? [{ id: "gallery", label: t("gallery") }] : []),
    { id: "location", label: td("location") },
    { id: "reviews", label: t("reviews") },
  ];

  const googleMapsHref = resolveMapsUrl(service.coords, service.mapsUrl);
  const directionsHref = resolveDirectionsUrl(service.coords);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FlowerShop",
    name: service.name,
    description: service.description ?? undefined,
    image: service.image ?? undefined,
    telephone: service.phone ?? undefined,
    ...(service.reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: service.rating, reviewCount: service.reviewCount } }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <Breadcrumbs
        items={[
          { label: tNav("flowers"), href: `/${locale}/flowers` },
          { label: service.name, href: `/${locale}/flowers/${service.slug}` },
        ]}
      />

      <HotelHeaderTop
        logo={service.logoUrl}
        name={service.name}
        rating={service.rating}
        reviewCount={service.reviewCount}
        categoryLabel={td("flowersAndBouquets")}
        locale={locale}
        isPartner={service.isPartner}
      />

      <div className="container-px mx-auto mt-6 flex flex-wrap items-center justify-center gap-3">
        {showProducts && (
          <PrimaryButton href="#shop" size="sm">
            {td("orderOnline")}
          </PrimaryButton>
        )}
        {service.phone && (
          <SecondaryButton href={`tel:${service.phone}`} size="sm">
            {th("call")}
          </SecondaryButton>
        )}
        {serviceWhatsappHref && (
          <SecondaryButton href={serviceWhatsappHref} external size="sm">
            {th("whatsapp")}
          </SecondaryButton>
        )}
        {/* Clear, explicit link to the sibling listing — the two businesses
           share one physical shop but are now fully separate listings. */}
        <SecondaryButton href={`/${locale}/cafes/lavender`} size="sm">
          {td("visitLavenderCafe")}
        </SecondaryButton>
      </div>

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

      {service.image && (
        <HotelGallerySlider cover={service.image} images={service.gallery} alt={service.name} productOriented />
      )}

      <div className="mt-8">
        <HotelNavTabs tabs={navTabs} />
      </div>

      <div className="container-px mx-auto grid gap-10 py-10 lg:grid-cols-3 lg:gap-12">
        <div className="space-y-14 lg:col-span-2">
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

          {showProducts && (
            <Reveal>
              <section id="shop" aria-labelledby="shop-heading" className="scroll-mt-36">
                <h2 id="shop-heading" className="mb-5 font-display text-2xl font-semibold">
                  {td("orderOnline")}
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
                {hasStructuredHours && (
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
                )}
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
                  {td("flowersAndBouquets")}
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
                pathToRevalidate={`/${locale}/flowers/${service.slug}`}
              />
              <div className="mt-6">
                <ReviewForm
                  key={myReview?.id ?? "new"}
                  listingType="city_service"
                  listingId={service.id}
                  locale={locale}
                  pathToRevalidate={`/${locale}/flowers/${service.slug}`}
                  allowPhotos
                  existingReview={myReview}
                />
              </div>
            </section>
          </Reveal>
        </div>

        <aside className="hidden h-fit space-y-3 rounded-xl3 border border-ink/8 p-6 shadow-card dark:border-white/10 lg:sticky lg:top-24 lg:block">
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
          <SecondaryButton href={`/${locale}/cafes/lavender`} className="w-full justify-center">
            {td("visitLavenderCafe")}
          </SecondaryButton>
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
    </>
  );
}
