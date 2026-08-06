import { safeJsonLd } from "@/lib/utils/json-ld";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ExternalLink, FileText, MapPin, Navigation } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getCafeBySlug, getAllCafeSlugs } from "@/lib/data/cafes";
import { getRelatedListings } from "@/lib/data/related-listings";
import { getPublicOffersForListing } from "@/lib/data/offers";
import { getSiteSettings } from "@/lib/actions/settings";
import { ListingOffersSection } from "@/components/shared/listing-offers-section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ViewTracker } from "@/components/shared/view-tracker";
import { HotelHeaderTop } from "@/components/shared/hotel-header-top";
import { HotelActionBar } from "@/components/shared/hotel-action-bar";
import { CafeQuickInfoCards } from "@/components/shared/cafe-quick-info-cards";
import { HotelGallerySlider } from "@/components/shared/hotel-gallery-slider";
import { HotelNavTabs, type HotelNavTab } from "@/components/shared/hotel-nav-tabs";
import { BusinessPhotoGallery } from "@/components/shared/business-photo-gallery";
import { CAFE_GALLERY_CATEGORIES } from "@/lib/utils/gallery-categories";
import { AmenitiesSection, hasAmenities } from "@/components/shared/amenities-section";
import { SocialLinks } from "@/components/shared/social-links";
import { VideoGallery } from "@/components/shared/video-gallery";
import { formatDayRange, formatTime12h } from "@/lib/utils/opening-hours";
import { OpenStatusBadge } from "@/components/shared/open-status-badge";
import { CafeActionCard } from "@/components/shared/cafe-action-card";
import { MobileBookingBar } from "@/components/shared/mobile-booking-bar";
import { ListingCard } from "@/components/shared/listing-card";
import { ReviewsSection } from "@/components/shared/reviews-section";
import { ReviewForm } from "@/components/shared/review-form";
import { getMyReviewForListing } from "@/lib/data/reviews";
import { isListingFavorited } from "@/lib/data/favorites";
import { getNearbyListings } from "@/lib/data/nearby";
import { NearbyListings } from "@/components/shared/nearby-listings";
import { resolveMapsUrl, resolveDirectionsUrl } from "@/lib/utils/google-maps";
import { Reveal } from "@/components/home/reveal";
import { PrimaryButton, SecondaryButton } from "@/components/shared/buttons";

// Public content changes infrequently; revalidate hourly instead of
// rendering on every request (this page no longer reads cookies, so
// it's eligible for static generation + ISR).
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllCafeSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const cafe = await getCafeBySlug(slug, locale);
  if (!cafe) return {};
  return {
    title: `${cafe.name} — Cafe in Hargeisa`,
    description: cafe.shortDescription,
    openGraph: { images: [cafe.coverImage] },
    alternates: localeAlternates(locale as Locale, `/cafes/${cafe.slug}`),
  };
}

export default async function CafeDetailPage({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}) {
  const cafe = await getCafeBySlug(slug, locale);
  if (!cafe) notFound();
  const t = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const td = await getTranslations("detail");
  const th = await getTranslations("hotelDetail");
  const tw = await getTranslations("weekdays");
  const tl = await getTranslations("listings");
  const tn = await getTranslations("nearby");
  const [similarCafes, siteSettings, offers, myReview, isFavorited, nearbyPlaces] = await Promise.all([
    getRelatedListings("cafe", cafe.id),
    getSiteSettings(),
    getPublicOffersForListing("cafe", cafe.id),
    getMyReviewForListing("cafe", cafe.id),
    isListingFavorited("cafe", cafe.id),
    getNearbyListings({ lat: cafe.location.lat, lng: cafe.location.lng, excludeType: "cafe", excludeId: cafe.id }),
  ]);
  const whatsappFallback = (siteSettings as { whatsapp_number?: string } | null)?.whatsapp_number ?? undefined;

  const googleMapsHref = resolveMapsUrl(cafe.location, cafe.googleMapsUrl);
  const directionsHref = resolveDirectionsUrl(cafe.location);
  const showAmenities = hasAmenities(cafe.amenitiesV2);

  const hasStructuredHours = cafe.openingHoursStructured && cafe.openingHoursStructured.length > 0;
  const hasHoursInfo = hasStructuredHours || cafe.is24Hours || cafe.temporarilyClosed || cafe.permanentlyClosed;

  const navTabs: HotelNavTab[] = [
    { id: "overview", label: td("overview") },
    ...(offers.length > 0 ? [{ id: "offers", label: td("offersTabLabel") }] : []),
    ...(hasHoursInfo ? [{ id: "hours", label: td("openingHoursByDay") }] : []),
    ...(cafe.specialDrinks.length > 0 ? [{ id: "specialties", label: td("coffeeSpecialties") }] : []),
    ...(cafe.menuHighlights.length > 0 || cafe.menuPdfUrl ? [{ id: "menu", label: td("menuHighlights") }] : []),
    ...(cafe.gallery.length > 0 ? [{ id: "gallery", label: t("gallery") }] : []),
    ...(cafe.videos && cafe.videos.length > 0 ? [{ id: "videos", label: td("videoGallery") }] : []),
    ...(showAmenities ? [{ id: "amenities", label: t("amenities") }] : []),
    { id: "reviews", label: t("reviews") },
    { id: "location", label: td("location") },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CafeOrCoffeeShop",
    name: cafe.name,
    description: cafe.shortDescription,
    image: cafe.coverImage,
    logo: cafe.logo,
    address: { "@type": "PostalAddress", streetAddress: cafe.address, addressLocality: "Hargeisa" },
    telephone: cafe.phone,
    priceRange: cafe.priceRange,
    sameAs: [cafe.socialInstagram, cafe.socialFacebook].filter((url): url is string => Boolean(url)),
    openingHoursSpecification: (cafe.openingHoursStructured ?? []).map((group) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: group.days.map((d) => d.charAt(0).toUpperCase() + d.slice(1)),
      opens: group.open,
      closes: group.close,
    })),
    ...(cafe.reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: cafe.rating, reviewCount: cafe.reviewCount } }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <ViewTracker listingType="cafe" listingId={cafe.id} />

      <Breadcrumbs
        items={[
          { label: tNav("cafes"), href: `/${locale}/cafes` },
          { label: cafe.name, href: `/${locale}/cafes/${cafe.slug}` },
        ]}
      />

      <HotelHeaderTop
        logo={cafe.logo}
        name={cafe.name}
        rating={cafe.rating}
        reviewCount={cafe.reviewCount}
        categoryLabel="Cafe"
      />

      <HotelActionBar
        locale={locale}
        listingType="cafe"
        listingId={cafe.id}
        name={cafe.name}
        phone={cafe.phone}
        website={cafe.website}
        email={cafe.email}
        whatsappFallback={whatsappFallback}
        showPrimary={false}
      />

      <SocialLinks
        instagram={cafe.socialInstagram}
        facebook={cafe.socialFacebook}
        tiktok={cafe.socialTiktok}
        snapchat={cafe.socialSnapchat}
        x={cafe.socialX}
        youtube={cafe.socialYoutube}
        telegram={cafe.socialTelegram}
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

      <CafeQuickInfoCards
        rating={cafe.rating}
        reviewCount={cafe.reviewCount}
        wifi={cafe.wifi}
        workingSpace={cafe.workingSpace}
        priceRange={cafe.priceRange}
      />

      <HotelGallerySlider cover={cafe.coverImage} images={cafe.gallery} alt={cafe.name} />

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
              <p className="leading-relaxed text-ink/75 dark:text-sand/75">{cafe.description}</p>
            </section>
          </Reveal>

          {offers.length > 0 && (
            <Reveal>
              <ListingOffersSection
                offers={offers}
                title={td("offersTabLabel")}
                couponLabel={td("offerCouponCodeLabel")}
                validUntilLabel={(date) => td("offerValidUntil", { date })}
              />
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
                    groups={cafe.openingHoursStructured ?? []}
                    is24Hours={cafe.is24Hours}
                    temporarilyClosed={cafe.temporarilyClosed}
                    permanentlyClosed={cafe.permanentlyClosed}
                  />
                </div>
                {hasStructuredHours && (
                  <div className="divide-y divide-ink/8 overflow-hidden rounded-xl2 border border-ink/8 dark:divide-white/10 dark:border-white/10">
                    {cafe.openingHoursStructured!.map((group, i) => (
                      <div
                        key={i}
                        className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5"
                      >
                        <span className="min-w-0 break-words text-sm font-semibold">
                          {formatDayRange(group.days, tw)}
                        </span>
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

          {cafe.specialDrinks.length > 0 && (
            <Reveal>
              <section id="specialties" aria-labelledby="specialties-heading" className="scroll-mt-36">
                <h2 id="specialties-heading" className="mb-5 font-display text-2xl font-semibold">
                  {td("coffeeSpecialties")}
                </h2>
                <ul className="flex flex-wrap gap-2.5">
                  {cafe.specialDrinks.map((drink) => (
                    <li
                      key={drink}
                      className="inline-flex items-center gap-2 rounded-xl2 border border-ink/8 bg-white px-4 py-2.5 text-sm font-medium text-ink transition-colors hover:border-primary/30 dark:border-white/10 dark:bg-white/[0.03] dark:text-sand"
                    >
                      {drink}
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          )}

          {(cafe.menuHighlights.length > 0 || cafe.menuPdfUrl) && (
            <Reveal>
              <section id="menu" aria-labelledby="menu-heading" className="scroll-mt-36">
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <h2 id="menu-heading" className="font-display text-2xl font-semibold">
                    {td("menuHighlights")}
                  </h2>
                  {cafe.menuPdfUrl && (
                    <SecondaryButton href={cafe.menuPdfUrl} external size="sm">
                      <FileText size={14} aria-hidden="true" />
                      {td("downloadMenuPdf")}
                    </SecondaryButton>
                  )}
                </div>
                {cafe.menuHighlights.length > 0 && (
                  <div className="divide-y divide-ink/8 overflow-hidden rounded-xl2 border border-ink/8 dark:divide-white/10 dark:border-white/10">
                    {cafe.menuHighlights.map((item) => (
                      <div key={item.name} className="flex items-center justify-between gap-4 p-4 sm:p-5">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold sm:text-base">{item.name}</p>
                          {item.description && (
                            <p className="mt-1 text-xs text-ink/55 dark:text-sand/55 sm:text-sm">
                              {item.description}
                            </p>
                          )}
                        </div>
                        <span className="shrink-0 font-display text-sm font-bold text-primary sm:text-base">
                          {item.price}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </Reveal>
          )}

          {cafe.gallery.length > 0 && (
            <Reveal>
              <section id="gallery" aria-labelledby="photo-gallery-heading" className="scroll-mt-36">
                <h2 id="photo-gallery-heading" className="mb-5 font-display text-2xl font-semibold">
                  {th("photoGallery")}
                </h2>
                <BusinessPhotoGallery images={cafe.gallery} alt={cafe.name} categories={CAFE_GALLERY_CATEGORIES} />
              </section>
            </Reveal>
          )}

          {cafe.videos && cafe.videos.length > 0 && (
            <Reveal>
              <section id="videos" aria-labelledby="video-gallery-heading" className="scroll-mt-36">
                <h2 id="video-gallery-heading" className="mb-5 font-display text-2xl font-semibold">
                  {td("videoGallery")}
                </h2>
                <VideoGallery videos={cafe.videos} watchOnLabel={(platform) => td("watchOn", { platform })} />
              </section>
            </Reveal>
          )}

          {showAmenities && (
            <Reveal>
              <section id="amenities" aria-labelledby="amenities-heading" className="scroll-mt-36">
                <h2 id="amenities-heading" className="mb-5 font-display text-2xl font-semibold">
                  {t("amenities")}
                </h2>
                <AmenitiesSection amenities={cafe.amenitiesV2} />
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
                  {cafe.address}
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
                rating={cafe.rating}
                reviewCount={cafe.reviewCount}
                reviews={cafe.reviews}
                locale={locale}
                pathToRevalidate={`/${locale}/cafes/${cafe.slug}`}
              />
              <div className="mt-6">
                <ReviewForm
                  key={myReview?.id ?? "new"}
                  listingType="cafe"
                  listingId={cafe.id}
                  locale={locale}
                  pathToRevalidate={`/${locale}/cafes/${cafe.slug}`}
                  allowPhotos
                  existingReview={myReview}
                />
              </div>
            </section>
          </Reveal>
        </div>

        <aside className="hidden h-fit rounded-xl3 border border-ink/8 p-6 shadow-card dark:border-white/10 lg:sticky lg:top-24 lg:block">
          <CafeActionCard
            cafeId={cafe.id}
            name={cafe.name}
            openingHoursStructured={cafe.openingHoursStructured}
            is24Hours={cafe.is24Hours}
            temporarilyClosed={cafe.temporarilyClosed}
            permanentlyClosed={cafe.permanentlyClosed}
            hoursLabel={t("openingHours")}
            viewHoursLabel={td("viewHours")}
            phone={cafe.phone}
            locale={locale}
            callLabel={th("call")}
            initiallyFavorited={isFavorited}
            favoriteCount={cafe.favoriteCount}
            addFavoriteLabel={tl("addToFavorites", { name: cafe.name })}
            removeFavoriteLabel={tl("removeFromFavorites", { name: cafe.name })}
          />
        </aside>
      </div>

      {similarCafes.length > 0 && (
        <section className="border-t border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-white/[0.03] sm:py-20">
          <div className="container-px mx-auto">
            <Reveal>
              <h2 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">{td("youMayAlsoLike")}</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
                {similarCafes.map((c) => (
                  <div key={c.id} className="min-w-[272px] sm:min-w-0">
                    <ListingCard
                      href={`/${locale}/cafes/${c.slug}`}
                      image={c.coverImage}
                      title={c.name}
                      subtitle={c.address}
                      rating={c.rating}
                      reviewCount={c.reviewCount}
                      listingType="cafe"
                      listingId={c.id}
                      locale={locale}
                      tag={c.wifi ? td("freeWifi") : undefined}
                    />
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

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

      <MobileBookingBar
        listingType="cafe"
        listingId={cafe.id}
        name={cafe.name}
        phone={cafe.phone}
        whatsappFallback={whatsappFallback}
        directionsHref={directionsHref}
        locale={locale}
        showPrimary={false}
      />
    </>
  );
}
