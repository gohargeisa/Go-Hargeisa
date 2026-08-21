import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { CalendarDays, Ticket, MapPin, Phone as PhoneIcon, Mail, Globe } from "lucide-react";
import { WhatsAppIcon } from "@/components/shared/brand-icons";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getEventBySlug, getAllEventSlugs, getEvents } from "@/lib/data/events";
import { getMyReviewForListing } from "@/lib/data/reviews";
import { isListingFavorited } from "@/lib/data/favorites";
import { getNearbyListings } from "@/lib/data/nearby";
import { HotelHeaderTop } from "@/components/shared/hotel-header-top";
import { HotelGallerySlider } from "@/components/shared/hotel-gallery-slider";
import { HotelNavTabs, type HotelNavTab } from "@/components/shared/hotel-nav-tabs";
import { InfoCardsStrip, type InfoCard } from "@/components/shared/info-cards-strip";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { BusinessPhotoGallery } from "@/components/shared/business-photo-gallery";
import { EVENT_GALLERY_CATEGORIES } from "@/lib/utils/gallery-categories";
import { VideoGallery } from "@/components/shared/video-gallery";
import { AmenitiesSection, hasAmenities } from "@/components/shared/amenities-section";
import { SocialLinks } from "@/components/shared/social-links";
import { OpenStatusBadge } from "@/components/shared/open-status-badge";
import { formatDayRange, formatTime12h } from "@/lib/utils/opening-hours";
import { ReviewsSection } from "@/components/shared/reviews-section";
import { ReviewForm } from "@/components/shared/review-form";
import { ShareButton } from "@/components/shared/share-button";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { NearbyListings } from "@/components/shared/nearby-listings";
import { ListingCard } from "@/components/shared/listing-card";
import { SecondaryButton } from "@/components/shared/buttons";
import { resolveMapsUrl } from "@/lib/utils/google-maps";
import { LocationMapSection } from "@/components/shared/location-map-section";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import { normalizeExternalUrl } from "@/lib/utils/normalize-url";
import { Reveal } from "@/components/home/reveal";
import { safeJsonLd } from "@/lib/utils/json-ld";

export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllEventSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}): Promise<Metadata> {
  const event = await getEventBySlug(slug);
  if (!event) return {};
  return {
    title: `${event.title} — Hargeisa Event`,
    description: event.description,
    openGraph: { images: [event.coverImage] },
    alternates: localeAlternates(locale, `/events/${event.slug}`),
  };
}

export default async function EventDetailPage({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}) {
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const t = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const td = await getTranslations("detail");
  const th = await getTranslations("hotelDetail");
  const tw = await getTranslations("weekdays");
  const tl = await getTranslations("listings");
  const tn = await getTranslations("nearby");
  const te = await getTranslations("eventDetail");

  const [myReview, isFavorited, nearbyPlaces, allEvents] = await Promise.all([
    getMyReviewForListing("event", event.id),
    isListingFavorited("event", event.id),
    getNearbyListings({ lat: event.coords.lat, lng: event.coords.lng, excludeType: "event", excludeId: event.id }),
    getEvents(),
  ]);
  const moreEvents = allEvents.filter((e) => e.id !== event.id).slice(0, 4);

  const hasStructuredHours = event.openingHoursStructured && event.openingHoursStructured.length > 0;
  const hasHoursInfo = hasStructuredHours || event.is24Hours || event.temporarilyClosed || event.permanentlyClosed;
  const eventWhatsappHref = event.whatsapp ? toWhatsAppHref(event.whatsapp, `Hi, I'd like to know more about ${event.title}.`) : undefined;
  const eventWebsiteHref = event.website ? normalizeExternalUrl(event.website) : undefined;

  const categoryLabelKey = `category${event.category.charAt(0).toUpperCase()}${event.category.slice(1)}` as
    | "categoryCultural"
    | "categoryNational"
    | "categoryBusiness"
    | "categorySports"
    | "categoryConcert";

  const navTabs: HotelNavTab[] = [
    { id: "overview", label: td("overview") },
    ...(event.gallery.length > 0 ? [{ id: "gallery", label: t("gallery") }] : []),
    ...(event.videos && event.videos.length > 0 ? [{ id: "videos", label: td("videoGallery") }] : []),
    ...(hasHoursInfo ? [{ id: "hours", label: td("openingHoursByDay") }] : []),
    ...(hasAmenities(event.amenitiesV2) ? [{ id: "amenities", label: t("amenities") }] : []),
    { id: "location", label: td("location") },
    { id: "reviews", label: t("reviews") },
  ];

  const googleMapsHref = resolveMapsUrl(event.coords, event.googleMapsUrl);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    image: event.coverImage,
    startDate: event.startDate,
    endDate: event.endDate ?? undefined,
    location: { "@type": "Place", name: event.location },
    ...(event.reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: event.rating, reviewCount: event.reviewCount } }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <Breadcrumbs
        items={[
          { label: tNav("events"), href: `/${locale}/events` },
          { label: event.title, href: `/${locale}/events/${event.slug}` },
        ]}
      />

      <HotelHeaderTop
        name={event.title}
        rating={event.rating}
        reviewCount={event.reviewCount}
        categoryLabel={te(categoryLabelKey)}
      />

      {(event.phone || eventWhatsappHref || event.email || eventWebsiteHref) && (
        <Reveal delay={0.05}>
          <div className="container-px mx-auto mt-6 flex flex-wrap items-center justify-center gap-3">
            {event.phone && (
              <SecondaryButton href={`tel:${event.phone}`} size="sm">
                <PhoneIcon size={15} aria-hidden="true" />
                {th("call")}
              </SecondaryButton>
            )}
            {eventWhatsappHref && (
              <SecondaryButton href={eventWhatsappHref} external size="sm">
                <WhatsAppIcon size={15} aria-hidden="true" />
                {th("whatsapp")}
              </SecondaryButton>
            )}
            {eventWebsiteHref && (
              <SecondaryButton href={eventWebsiteHref} external size="sm">
                <Globe size={15} aria-hidden="true" />
                {th("website")}
              </SecondaryButton>
            )}
            {event.email && (
              <SecondaryButton href={`mailto:${event.email}`} size="sm">
                <Mail size={15} aria-hidden="true" />
                {th("email")}
              </SecondaryButton>
            )}
          </div>
        </Reveal>
      )}

      <SocialLinks
        instagram={event.socialInstagram}
        facebook={event.socialFacebook}
        tiktok={event.socialTiktok}
        snapchat={event.socialSnapchat}
        x={event.socialX}
        youtube={event.socialYoutube}
        telegram={event.socialTelegram}
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
        cards={
          [
            { icon: CalendarDays, label: te("startsOn"), value: new Date(event.startDate).toLocaleDateString(locale) },
            ...(event.endDate ? [{ icon: CalendarDays, label: te("endsOn"), value: new Date(event.endDate).toLocaleDateString(locale) }] : []),
            { icon: MapPin, label: td("location"), value: event.location },
            ...(event.ticketInfo ? [{ icon: Ticket, label: te("ticketInfo"), value: event.ticketInfo }] : []),
          ] as InfoCard[]
        }
      />

      <HotelGallerySlider cover={event.coverImage} images={event.gallery} alt={event.title} />

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
              <p className="leading-relaxed text-ink/75 dark:text-sand/75">{event.description}</p>
            </section>
          </Reveal>

          {event.gallery.length > 0 && (
            <Reveal>
              <section id="gallery" aria-labelledby="photo-gallery-heading" className="scroll-mt-36">
                <h2 id="photo-gallery-heading" className="mb-5 font-display text-2xl font-semibold">
                  {th("photoGallery")}
                </h2>
                <BusinessPhotoGallery images={event.gallery} alt={event.title} categories={EVENT_GALLERY_CATEGORIES} />
              </section>
            </Reveal>
          )}

          {event.videos && event.videos.length > 0 && (
            <Reveal>
              <section id="videos" aria-labelledby="video-gallery-heading" className="scroll-mt-36">
                <h2 id="video-gallery-heading" className="mb-5 font-display text-2xl font-semibold">
                  {td("videoGallery")}
                </h2>
                <VideoGallery videos={event.videos} />
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
                    groups={event.openingHoursStructured ?? []}
                    is24Hours={event.is24Hours}
                    temporarilyClosed={event.temporarilyClosed}
                    permanentlyClosed={event.permanentlyClosed}
                  />
                </div>
                {hasStructuredHours && (
                  <div className="divide-y divide-ink/8 overflow-hidden rounded-xl2 border border-ink/8 dark:divide-white/10 dark:border-white/10">
                    {event.openingHoursStructured!.map((group, i) => (
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

          {hasAmenities(event.amenitiesV2) && (
            <Reveal>
              <section id="amenities" aria-labelledby="amenities-heading" className="scroll-mt-36">
                <h2 id="amenities-heading" className="mb-5 font-display text-2xl font-semibold">
                  {t("amenities")}
                </h2>
                <AmenitiesSection amenities={event.amenitiesV2} />
              </section>
            </Reveal>
          )}

          <LocationMapSection locale={locale} address={event.location} coords={event.coords} mapsHref={googleMapsHref} name={event.title} />

          <Reveal>
            <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-36">
              <h2 id="reviews-heading" className="mb-5 font-display text-2xl font-semibold">
                {t("reviews")}
              </h2>
              <ReviewsSection
                rating={event.rating}
                reviewCount={event.reviewCount}
                reviews={event.reviews}
                locale={locale}
                pathToRevalidate={`/${locale}/events/${event.slug}`}
              />
              <div className="mt-6">
                <ReviewForm
                  key={myReview?.id ?? "new"}
                  listingType="event"
                  listingId={event.id}
                  locale={locale}
                  pathToRevalidate={`/${locale}/events/${event.slug}`}
                  allowPhotos
                  existingReview={myReview}
                />
              </div>
            </section>
          </Reveal>
        </div>

        <aside className="h-fit space-y-3 rounded-xl3 border border-ink/8 p-6 shadow-card dark:border-white/10 lg:sticky lg:top-24">
          <ShareButton title={event.title} />
          <FavoriteButton
            listingType="event"
            listingId={event.id}
            locale={locale}
            initiallyFavorited={isFavorited}
            count={event.favoriteCount}
            showSpinner={false}
            size={15}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
            addLabel={tl("addToFavorites", { name: event.title })}
            removeLabel={tl("removeFromFavorites", { name: event.title })}
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

      {moreEvents.length > 0 && (
        <section className="border-t border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-white/[0.03] sm:py-20">
          <div className="container-px mx-auto">
            <Reveal>
              <h2 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">{te("moreEvents")}</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
                {moreEvents.map((e) => (
                  <div key={e.id} className="min-w-[272px] sm:min-w-0">
                    <ListingCard
                      href={`/${locale}/events/${e.slug}`}
                      image={e.coverImage}
                      title={e.title}
                      subtitle={e.location}
                      rating={e.rating}
                      reviewCount={e.reviewCount}
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
