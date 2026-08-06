import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Ticket, CalendarClock, MapPin, LightbulbIcon, Navigation, ExternalLink, Star, Tag, Phone as PhoneIcon, MessageCircle, Mail, Globe } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getAttractionBySlug, getAllAttractionSlugs, getNearbyForAttraction } from "@/lib/data/attractions";
import { getRelatedListings } from "@/lib/data/related-listings";
import { HotelHeaderTop } from "@/components/shared/hotel-header-top";
import { HotelGallerySlider } from "@/components/shared/hotel-gallery-slider";
import { HotelNavTabs, type HotelNavTab } from "@/components/shared/hotel-nav-tabs";
import { InfoCardsStrip, type InfoCard } from "@/components/shared/info-cards-strip";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ReviewsSection } from "@/components/shared/reviews-section";
import { ReviewForm } from "@/components/shared/review-form";
import { getMyReviewForListing } from "@/lib/data/reviews";
import { isListingFavorited } from "@/lib/data/favorites";
import { getNearbyListings, mergeCuratedNearby } from "@/lib/data/nearby";
import { NearbyListings } from "@/components/shared/nearby-listings";
import { AddToTripButton } from "@/components/shared/add-to-trip-button";
import { ShareButton } from "@/components/shared/share-button";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { ListingCard } from "@/components/shared/listing-card";
import { resolveMapsUrl, resolveDirectionsUrl } from "@/lib/utils/google-maps";
import { Reveal } from "@/components/home/reveal";
import { PrimaryButton, SecondaryButton } from "@/components/shared/buttons";
import { safeJsonLd } from "@/lib/utils/json-ld";
import { AmenitiesSection, hasAmenities } from "@/components/shared/amenities-section";
import { SocialLinks } from "@/components/shared/social-links";
import { VideoGallery } from "@/components/shared/video-gallery";
import { OpenStatusBadge } from "@/components/shared/open-status-badge";
import { formatDayRange, formatTime12h } from "@/lib/utils/opening-hours";
import { normalizeExternalUrl } from "@/lib/utils/normalize-url";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";

// Public content changes infrequently; revalidate hourly instead of
// rendering on every request (this page no longer reads cookies, so
// it's eligible for static generation + ISR).
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllAttractionSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const a = await getAttractionBySlug(slug);

  if (!a) {
    return {};
  }

  return {
    title: `${a.name} — Hargeisa Attraction`,
    description: a.shortDescription,
    openGraph: { images: [a.coverImage] },
    alternates: localeAlternates(locale as Locale, `/attractions/${a.slug}`),
  };
}

export default async function AttractionDetailPage({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}) {
  const attraction = await getAttractionBySlug(slug);
  if (!attraction) notFound();
  const t = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const td = await getTranslations("detail");
  const th = await getTranslations("hotelDetail");
  const tw = await getTranslations("weekdays");
  const tl = await getTranslations("listings");
  const tn = await getTranslations("nearby");
  const [{ restaurants: nearbyRestaurants, hotels: nearbyHotels }, similarAttractions, myReview, isFavorited, nearbyPlaces] = await Promise.all([
    getNearbyForAttraction(attraction.id),
    getRelatedListings("attraction", attraction.id),
    getMyReviewForListing("attraction", attraction.id),
    isListingFavorited("attraction", attraction.id),
    getNearbyListings({ lat: attraction.location.lat, lng: attraction.location.lng, excludeType: "attraction", excludeId: attraction.id }),
  ]);
  const mergedNearby = mergeCuratedNearby(
    [
      ...nearbyRestaurants.map((r) => ({
        type: "restaurant" as const,
        id: r.id,
        slug: r.slug,
        name: r.name,
        image: r.coverImage,
        rating: r.rating,
        reviewCount: r.reviewCount,
        location: r.location,
      })),
      ...nearbyHotels.map((h) => ({
        type: "hotel" as const,
        id: h.id,
        slug: h.slug,
        name: h.name,
        image: h.coverImage,
        rating: h.rating,
        reviewCount: h.reviewCount,
        location: h.location,
      })),
    ],
    nearbyPlaces,
    attraction.location
  );
  const attractionWhatsappHref = attraction.whatsapp
    ? toWhatsAppHref(attraction.whatsapp, `Hi, I'd like to know more about ${attraction.name}.`)
    : undefined;
  const attractionWebsiteHref = attraction.website ? normalizeExternalUrl(attraction.website) : undefined;
  const hasStructuredHours = attraction.openingHoursStructured && attraction.openingHoursStructured.length > 0;
  const hasHoursInfo = hasStructuredHours || attraction.is24Hours || attraction.temporarilyClosed || attraction.permanentlyClosed;

  const navTabs: HotelNavTab[] = [
    { id: "overview", label: td("overview") },
    ...(attraction.visitorTips.length > 0 ? [{ id: "tips", label: t("visitorTips") }] : []),
    ...(attraction.videos && attraction.videos.length > 0 ? [{ id: "videos", label: td("videoGallery") }] : []),
    ...(hasHoursInfo ? [{ id: "hours", label: td("openingHoursByDay") }] : []),
    ...(hasAmenities(attraction.amenitiesV2) ? [{ id: "amenities", label: t("amenities") }] : []),
    { id: "location", label: td("location") },
    { id: "reviews", label: t("reviews") },
  ];

  const googleMapsHref = resolveMapsUrl(attraction.location, attraction.googleMapsUrl);
  const directionsHref = resolveDirectionsUrl(attraction.location);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristAttraction",
    name: attraction.name,
    description: attraction.description,
    image: attraction.coverImage,
    address: { "@type": "PostalAddress", streetAddress: attraction.address, addressLocality: "Hargeisa" },
    ...(attraction.reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: attraction.rating, reviewCount: attraction.reviewCount } }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <Breadcrumbs
        items={[
          { label: tNav("attractions"), href: `/${locale}/attractions` },
          { label: attraction.name, href: `/${locale}/attractions/${attraction.slug}` },
        ]}
      />

      <HotelHeaderTop
        name={attraction.name}
        rating={attraction.rating}
        reviewCount={attraction.reviewCount}
        categoryLabel={attraction.category}
      />

      {(attraction.phone || attractionWhatsappHref || attraction.email || attractionWebsiteHref) && (
        <Reveal delay={0.05}>
          <div className="container-px mx-auto mt-6 flex flex-wrap items-center justify-center gap-3">
            {attraction.phone && (
              <SecondaryButton href={`tel:${attraction.phone}`} size="sm">
                <PhoneIcon size={15} aria-hidden="true" />
                {th("call")}
              </SecondaryButton>
            )}
            {attractionWhatsappHref && (
              <SecondaryButton href={attractionWhatsappHref} external size="sm">
                <MessageCircle size={15} aria-hidden="true" />
                {th("whatsapp")}
              </SecondaryButton>
            )}
            {attractionWebsiteHref && (
              <SecondaryButton href={attractionWebsiteHref} external size="sm">
                <Globe size={15} aria-hidden="true" />
                {th("website")}
              </SecondaryButton>
            )}
            {attraction.email && (
              <SecondaryButton href={`mailto:${attraction.email}`} size="sm">
                <Mail size={15} aria-hidden="true" />
                {th("email")}
              </SecondaryButton>
            )}
          </div>
        </Reveal>
      )}

      <SocialLinks
        instagram={attraction.socialInstagram}
        facebook={attraction.socialFacebook}
        tiktok={attraction.socialTiktok}
        snapchat={attraction.socialSnapchat}
        x={attraction.socialX}
        youtube={attraction.socialYoutube}
        telegram={attraction.socialTelegram}
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

      <InfoCardsStrip
        cards={[
          ...(attraction.reviewCount > 0 ? [{ icon: Star, label: t("rating"), value: attraction.rating.toFixed(1) }] : []),
          { icon: Tag, label: th("category"), value: attraction.category },
          { icon: CalendarClock, label: t("bestTimeToVisit"), value: attraction.bestTimeToVisit },
          { icon: Ticket, label: t("entryFee"), value: attraction.entryFee ?? "—" },
        ]}
      />

      <HotelGallerySlider cover={attraction.coverImage} images={attraction.gallery} alt={attraction.name} />

      <div className="mt-8">
        <HotelNavTabs tabs={navTabs} />
      </div>

      <div className="container-px mx-auto grid gap-10 py-10 lg:grid-cols-3 lg:gap-12">
        <div className="lg:col-span-2 space-y-14">
          <Reveal>
            <section id="overview" aria-labelledby="overview-heading" className="scroll-mt-36">
              <h2 id="overview-heading" className="mb-5 font-display text-2xl font-semibold">
                {td("overview")}
              </h2>
              <p className="leading-relaxed text-ink/75 dark:text-sand/75">{attraction.description}</p>

              {attraction.history && (
                <div className="mt-8">
                  <h3 className="mb-3 font-display text-lg font-semibold">{t("history")}</h3>
                  <p className="leading-relaxed text-ink/75 dark:text-sand/75">{attraction.history}</p>
                </div>
              )}
            </section>
          </Reveal>

          {attraction.visitorTips.length > 0 && (
            <Reveal>
              <section id="tips" aria-labelledby="tips-heading" className="scroll-mt-36">
                <h2 id="tips-heading" className="mb-5 flex items-center gap-2 font-display text-2xl font-semibold">
                  <LightbulbIcon size={20} className="text-accent-700" aria-hidden="true" />
                  {t("visitorTips")}
                </h2>
                <ul className="space-y-2.5">
                  {attraction.visitorTips.map((tip) => (
                    <li
                      key={tip}
                      className="flex gap-2.5 rounded-xl2 border border-ink/8 bg-white px-4 py-3 text-sm text-ink/75 dark:border-white/10 dark:bg-white/[0.03] dark:text-sand/75"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </section>
            </Reveal>
          )}

          {attraction.videos && attraction.videos.length > 0 && (
            <Reveal>
              <section id="videos" aria-labelledby="video-gallery-heading" className="scroll-mt-36">
                <h2 id="video-gallery-heading" className="mb-5 font-display text-2xl font-semibold">
                  {td("videoGallery")}
                </h2>
                <VideoGallery videos={attraction.videos} watchOnLabel={(platform) => td("watchOn", { platform })} />
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
                    groups={attraction.openingHoursStructured ?? []}
                    is24Hours={attraction.is24Hours}
                    temporarilyClosed={attraction.temporarilyClosed}
                    permanentlyClosed={attraction.permanentlyClosed}
                  />
                </div>
                {hasStructuredHours && (
                  <div className="divide-y divide-ink/8 overflow-hidden rounded-xl2 border border-ink/8 dark:divide-white/10 dark:border-white/10">
                    {attraction.openingHoursStructured!.map((group, i) => (
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

          {hasAmenities(attraction.amenitiesV2) && (
            <Reveal>
              <section id="amenities" aria-labelledby="amenities-heading" className="scroll-mt-36">
                <h2 id="amenities-heading" className="mb-5 font-display text-2xl font-semibold">
                  {t("amenities")}
                </h2>
                <AmenitiesSection amenities={attraction.amenitiesV2} />
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
                  {attraction.address}
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
                rating={attraction.rating}
                reviewCount={attraction.reviewCount}
                reviews={attraction.reviews}
                locale={locale}
                pathToRevalidate={`/${locale}/attractions/${attraction.slug}`}
              />
              <div className="mt-6">
                <ReviewForm
                  key={myReview?.id ?? "new"}
                  listingType="attraction"
                  listingId={attraction.id}
                  locale={locale}
                  pathToRevalidate={`/${locale}/attractions/${attraction.slug}`}
                  allowPhotos
                  existingReview={myReview}
                />
              </div>
            </section>
          </Reveal>

        </div>

        <aside className="h-fit space-y-3 rounded-xl3 border border-ink/8 p-6 shadow-card dark:border-white/10 lg:sticky lg:top-24">
          <AddToTripButton locale={locale} listingType="attraction" listingId={attraction.id} />
          <ShareButton title={attraction.name} />
          <FavoriteButton
            listingType="attraction"
            listingId={attraction.id}
            locale={locale}
            initiallyFavorited={isFavorited}
            count={attraction.favoriteCount}
            showSpinner={false}
            size={15}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
            addLabel={tl("addToFavorites", { name: attraction.name })}
            removeLabel={tl("removeFromFavorites", { name: attraction.name })}
          />
          <h3 className="font-display text-lg font-semibold">{td("planYourVisit")}</h3>
          <p className="text-sm text-ink/70 dark:text-sand/70">
            <strong>{t("entryFee")}:</strong> {attraction.entryFee ?? "—"}
          </p>
          <p className="text-sm text-ink/70 dark:text-sand/70">
            <strong>{t("bestTimeToVisit")}:</strong> {attraction.bestTimeToVisit}
          </p>
        </aside>
      </div>

      {similarAttractions.length > 0 && (
        <section className="border-t border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-white/[0.03] sm:py-20">
          <div className="container-px mx-auto">
            <Reveal>
              <h2 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">{td("youMayAlsoLike")}</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
                {similarAttractions.map((a) => (
                  <div key={a.id} className="min-w-[272px] sm:min-w-0">
                    <ListingCard
                      href={`/${locale}/attractions/${a.slug}`}
                      image={a.coverImage}
                      title={a.name}
                      subtitle={a.address}
                      rating={a.rating}
                      reviewCount={a.reviewCount}
                      listingType="attraction"
                      listingId={a.id}
                      locale={locale}
                    />
                  </div>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {mergedNearby.length > 0 && (
        <section className="border-t border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-white/[0.03] sm:py-20">
          <div className="container-px mx-auto">
            <Reveal>
              <h2 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">{tn("nearbyPlaces")}</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <NearbyListings listings={mergedNearby} locale={locale} distanceLabel={(km) => tn("distanceAway", { km })} />
            </Reveal>
          </div>
        </section>
      )}
    </>
  );
}
