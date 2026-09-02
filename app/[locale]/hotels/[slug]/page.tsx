import { safeJsonLd } from "@/lib/utils/json-ld";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FileText, UtensilsCrossed, Dumbbell, Presentation, Sparkles } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getHotelBySlug, getAllHotelSlugs, getNearbyAttractionsForHotel } from "@/lib/data/hotels";
import { getRelatedListings } from "@/lib/data/related-listings";
import { getPublicOffersForListing } from "@/lib/data/offers";
import { hotelCategoryLabel } from "@/lib/utils/hotel-category";
import { getSiteSettings } from "@/lib/actions/settings";
import { ListingOffersSection } from "@/components/shared/listing-offers-section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ViewTracker } from "@/components/shared/view-tracker";
import { HotelHeaderTop } from "@/components/shared/hotel-header-top";
import { HotelActionBar } from "@/components/shared/hotel-action-bar";
import { HotelQuickInfoCards } from "@/components/shared/hotel-quick-info-cards";
import { HotelGallerySlider } from "@/components/shared/hotel-gallery-slider";
import { HotelNavTabs, type HotelNavTab } from "@/components/shared/hotel-nav-tabs";
import { HotelOverview } from "@/components/shared/hotel-overview";
import { HotelRoomsSection } from "@/components/shared/hotel-rooms-section";
import { BusinessPhotoGallery } from "@/components/shared/business-photo-gallery";
import { HOTEL_GALLERY_CATEGORIES } from "@/lib/utils/gallery-categories";
import { HotelOnsiteRestaurantCard } from "@/components/shared/hotel-onsite-restaurant-card";
import { HotelOnsiteCafeCard } from "@/components/shared/hotel-onsite-cafe-card";
import { AmenitiesSection, hasAmenities } from "@/components/shared/amenities-section";
import { SocialLinks } from "@/components/shared/social-links";
import { VideoGallery } from "@/components/shared/video-gallery";
import { OpenStatusBadge } from "@/components/shared/open-status-badge";
import { formatDayRange, formatTime12h } from "@/lib/utils/opening-hours";
import { HotelBookingCard } from "@/components/shared/hotel-booking-card";
import { MobileBookingBar } from "@/components/shared/mobile-booking-bar";
import { HotelCard } from "@/components/shared/hotel-card";
import { ReviewsSection } from "@/components/shared/reviews-section";
import { ReviewForm } from "@/components/shared/review-form";
import { getMyReviewForListing } from "@/lib/data/reviews";
import { isListingFavorited } from "@/lib/data/favorites";
import { getNearbyListings, mergeCuratedNearby } from "@/lib/data/nearby";
import { NearbyListings } from "@/components/shared/nearby-listings";
import { Reveal } from "@/components/home/reveal";
import { getHotelBookingCta } from "@/lib/utils/booking-cta";
import { resolveMapsUrl } from "@/lib/utils/google-maps";
import { LocationMapSection } from "@/components/shared/location-map-section";
import {
  HOTELS_PRESENTATION_MODE,
  PRESENTATION_HOTEL_SLUG,
  RESTAURANTS_PUBLIC_ENABLED,
  CAFES_PUBLIC_ENABLED,
} from "@/lib/config/features";
import { getPartnerTheme } from "@/lib/config/partner-themes";
import { PartnerThemeScope } from "@/components/shared/partner/partner-theme-scope";
import { PartnerHeroBanner } from "@/components/shared/partner/partner-hero-banner";
import { PartnerStatusSection } from "@/components/shared/partner/partner-status-section";

// Public content changes infrequently; revalidate hourly instead of
// rendering on every request (this page no longer reads cookies, so
// it's eligible for static generation + ISR).
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllHotelSlugs();
  // Presentation mode: only pre-render the one hotel that's staying public
  // — see lib/config/features.ts. Every other hotel's page 404s below.
  const visibleSlugs = HOTELS_PRESENTATION_MODE ? slugs.filter((s) => s === PRESENTATION_HOTEL_SLUG) : slugs;
  return visibleSlugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}): Promise<Metadata> {
  const hotel = await getHotelBySlug(slug, locale);
  if (!hotel) return {};
  return {
    title: `${hotel.name} — Hotel in Hargeisa`,
    description: hotel.shortDescription,
    openGraph: { images: [hotel.coverImage] },
    alternates: localeAlternates(locale as Locale, `/hotels/${hotel.slug}`),
  };
}

export default async function HotelDetailPage({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}) {
  const hotel = await getHotelBySlug(slug, locale);
  if (!hotel) notFound();
  if (HOTELS_PRESENTATION_MODE && slug !== PRESENTATION_HOTEL_SLUG) notFound();

  const t = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const td = await getTranslations("detail");
  const th = await getTranslations("hotelDetail");
  const tw = await getTranslations("weekdays");
  const tn = await getTranslations("nearby");
  const [nearby, similarHotels, siteSettings, offers, myReview, isFavorited, nearbyPlaces] = await Promise.all([
    getNearbyAttractionsForHotel(hotel.id),
    getRelatedListings("hotel", hotel.id),
    getSiteSettings(),
    getPublicOffersForListing("hotel", hotel.id),
    getMyReviewForListing("hotel", hotel.id),
    isListingFavorited("hotel", hotel.id),
    getNearbyListings({ lat: hotel.location.lat, lng: hotel.location.lng, excludeType: "hotel", excludeId: hotel.id }),
  ]);
  const mergedNearby = mergeCuratedNearby(
    nearby.map((a) => ({
      type: "attraction" as const,
      id: a.id,
      slug: a.slug,
      name: a.name,
      image: a.coverImage,
      rating: a.rating,
      reviewCount: a.reviewCount,
      location: a.location,
    })),
    nearbyPlaces,
    hotel.location
  );
  const whatsappFallback = (siteSettings as { whatsapp_number?: string } | null)?.whatsapp_number ?? undefined;

  const bookingCta = getHotelBookingCta(hotel, {
    bookNow: t("bookNow"),
    bookOnWebsite: t("bookOnWebsite"),
    bookViaWhatsApp: t("bookViaWhatsApp"),
    bookOnBookingCom: t("bookOnBookingCom"),
  });

  const hasStructuredHours = hotel.openingHoursStructured && hotel.openingHoursStructured.length > 0;
  const hasHoursInfo = hasStructuredHours || hotel.is24Hours || hotel.temporarilyClosed || hotel.permanentlyClosed;

  const navTabs: HotelNavTab[] = [
    { id: "overview", label: td("overview") },
    ...(offers.length > 0 ? [{ id: "offers", label: td("offersTabLabel") }] : []),
    ...(hotel.rooms.length > 0 ? [{ id: "rooms", label: th("rooms") }] : []),
    ...(hotel.gallery.length > 0 ? [{ id: "gallery", label: t("gallery") }] : []),
    ...(hotel.videos && hotel.videos.length > 0 ? [{ id: "videos", label: td("videoGallery") }] : []),
    ...(hasHoursInfo ? [{ id: "hours", label: td("openingHoursByDay") }] : []),
    ...(hasAmenities(hotel.amenitiesV2) ? [{ id: "amenities", label: t("amenities") }] : []),
    { id: "reviews", label: t("reviews") },
    { id: "location", label: td("location") },
  ];

  const googleMapsHref = resolveMapsUrl(hotel.location, hotel.googleMapsUrl);
  // Everything partner-specific (colors, hero photo) lives in
  // lib/config/partner-themes.ts — this page stays generic for every other
  // hotel (getPartnerTheme returns null when none is configured).
  const partnerTheme = getPartnerTheme("hotel", hotel.slug);

  // Real amenity tags this hotel already has on file (amenitiesV2) — used
  // only to decide whether to show that facility's highlight card below;
  // no capacity/hours/menu specifics are ever added since none are verified.
  const hasRestaurant = hotel.amenitiesV2?.includes("restaurant");
  const hasGym = hotel.amenitiesV2?.includes("gym");
  const hasMeetingRooms = hotel.amenitiesV2?.includes("meeting_rooms");
  const showSignatureFacilities = Boolean(hasRestaurant || hasGym || hasMeetingRooms);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: hotel.name,
    description: hotel.shortDescription,
    image: hotel.coverImage,
    logo: hotel.logo,
    address: { "@type": "PostalAddress", streetAddress: hotel.address, addressLocality: "Hargeisa" },
    telephone: hotel.phone,
    ...(hotel.reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: hotel.rating, reviewCount: hotel.reviewCount } }
      : {}),
    priceRange: hotel.priceRange,
  };

  return (
    <PartnerThemeScope theme={partnerTheme}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <ViewTracker listingType="hotel" listingId={hotel.id} />

      <Breadcrumbs
        items={[
          { label: tNav("hotels"), href: `/${locale}/hotels` },
          { label: hotel.name, href: `/${locale}/hotels/${hotel.slug}` },
        ]}
      />

      {partnerTheme?.heroImage && <PartnerHeroBanner theme={partnerTheme} alt={hotel.name} locale={locale} />}

      <HotelHeaderTop
        logo={hotel.logo}
        name={hotel.name}
        rating={hotel.rating}
        reviewCount={hotel.reviewCount}
        categoryLabel={hotelCategoryLabel(hotel.priceRange)}
        locale={locale}
        isPartner={hotel.isPartner}
      />

      {/* Official full brand name, exactly as it appears on the hotel's own
          logo (verified independently against its Facebook page and
          Tripadvisor listing title) — display-only, the underlying
          `hotel.name` used for booking/breadcrumbs/search stays unchanged. */}
      {partnerTheme?.partnerName && partnerTheme.partnerName !== hotel.name && (
        <p className="container-px mx-auto mt-1.5 text-center text-sm font-medium italic text-ink/50 dark:text-sand/50">
          {partnerTheme.partnerName}
        </p>
      )}

      <HotelActionBar
        locale={locale}
        listingType="hotel"
        listingId={hotel.id}
        hotelSlug={hotel.slug}
        name={hotel.name}
        rating={hotel.rating}
        phone={hotel.phone}
        website={hotel.website}
        email={hotel.email}
        whatsappFallback={whatsappFallback}
        bookingCta={bookingCta}
        rooms={hotel.rooms}
      />

      {hotel.documentUrl && (
        <div className="container-px mx-auto mt-3 flex flex-wrap items-center justify-center gap-3">
          <a
            href={hotel.documentUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-full border border-ink/15 px-4 text-sm font-semibold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:text-primary hover:shadow-soft active:scale-95 dark:border-white/20 dark:text-white"
          >
            <FileText size={15} aria-hidden="true" />
            {t("document_hotel_info")}
          </a>
        </div>
      )}

      <SocialLinks
        instagram={hotel.socialInstagram}
        facebook={hotel.socialFacebook}
        tiktok={hotel.socialTiktok}
        snapchat={hotel.socialSnapchat}
        x={hotel.socialX}
        youtube={hotel.socialYoutube}
        telegram={hotel.socialTelegram}
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

      <HotelQuickInfoCards
        rating={hotel.rating}
        reviewCount={hotel.reviewCount}
        priceRange={hotel.priceRange}
        checkInTime={hotel.checkInTime}
        checkOutTime={hotel.checkOutTime}
        languages={hotel.languages}
        amenities={hotel.amenities}
      />

      {/* Real amenity tags this hotel already has on file get elevated,
          premium presentation here — no facility is shown unless its exact
          amenitiesV2 code is present, and no capacity/hours/menu specifics
          are invented (see hasRestaurant/hasGym/hasMeetingRooms above). */}
      {showSignatureFacilities && (
        <Reveal delay={0.08}>
          <div className="container-px mx-auto mt-6">
            <h2 className="mb-4 flex items-center justify-center gap-2 text-center font-display text-lg font-bold">
              <Sparkles size={16} className="text-primary" aria-hidden="true" />
              {th("signatureFacilities")}
            </h2>
            <div className="mx-auto grid max-w-3xl gap-3 sm:grid-cols-3">
              {hasRestaurant && (
                <div className="flex items-center gap-3 rounded-xl2 border border-ink/8 bg-white px-4 py-3.5 dark:border-white/10 dark:bg-white/[0.03]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <UtensilsCrossed size={18} className="text-primary" aria-hidden="true" />
                  </span>
                  <p className="text-xs leading-snug text-ink/60 dark:text-sand/60">{th("restaurantHighlight")}</p>
                </div>
              )}
              {hasGym && (
                <div className="flex items-center gap-3 rounded-xl2 border border-ink/8 bg-white px-4 py-3.5 dark:border-white/10 dark:bg-white/[0.03]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Dumbbell size={18} className="text-primary" aria-hidden="true" />
                  </span>
                  <p className="text-xs leading-snug text-ink/60 dark:text-sand/60">{th("gymHighlight")}</p>
                </div>
              )}
              {hasMeetingRooms && (
                <div className="flex items-center gap-3 rounded-xl2 border border-ink/8 bg-white px-4 py-3.5 dark:border-white/10 dark:bg-white/[0.03]">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Presentation size={18} className="text-primary" aria-hidden="true" />
                  </span>
                  <p className="text-xs leading-snug text-ink/60 dark:text-sand/60">{th("meetingsHighlight")}</p>
                </div>
              )}
            </div>
          </div>
        </Reveal>
      )}

      {/* ROOMS & SUITES — the main offering, promoted above the generic
          gallery so it's the first real content a visitor scrolls into
          (per the Premium Partner Showcase direction: the actual product —
          here, real rooms with real prices — must be the star, not buried
          below photos/tabs). Full-width, not confined to the 2/3 column
          the old in-grid section lived in. Uses the exact same real data
          (hotel.rooms) and booking flow as before — nothing invented,
          nothing duplicated below. */}
      {hotel.rooms.length > 0 && (
        <Reveal>
          <section id="rooms" aria-labelledby="rooms-heading" className="scroll-mt-36 border-t border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-white/[0.03] sm:py-20">
            <div className="container-px mx-auto">
              <div className="mx-auto mb-8 max-w-2xl text-center">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  {th("roomsEyebrow")}
                </span>
                <h2 id="rooms-heading" className="font-display text-2xl font-semibold sm:text-3xl">
                  {th("roomsAndSuites")}
                </h2>
                <p className="mt-3 text-sm text-ink/60 dark:text-sand/60 sm:text-base">{th("roomsSubtitle")}</p>
              </div>
              <HotelRoomsSection
                rooms={hotel.rooms}
                locale={locale}
                hotelId={hotel.id}
                hotelName={hotel.name}
                hotelRating={hotel.rating}
                bookingCta={bookingCta}
                size="large"
              />
            </div>
          </section>
        </Reveal>
      )}

      <HotelGallerySlider cover={hotel.coverImage} images={hotel.gallery} alt={hotel.name} />

      <div className="mt-8">
        <HotelNavTabs tabs={navTabs} />
      </div>

      <div className="container-px mx-auto grid gap-10 pb-28 pt-10 lg:grid-cols-3 lg:gap-12 lg:pb-10">
        {/* min-w-0: on mobile this grid has no column template (only
            `lg:grid-cols-3`), so its single implicit column is `auto`-sized
            and a grid item defaults to `min-width: auto` — any wide
            descendant (map iframe, a long review word, a gallery) would then
            stretch this column past the viewport and horizontally overflow
            the whole page in the Android WebView. Matches restaurants/cafes/
            city-services, which already carry this. */}
        <div className="min-w-0 space-y-14 lg:col-span-2">
          <Reveal>
            <section id="overview" aria-labelledby="overview-heading" className="scroll-mt-36">
              <h2 id="overview-heading" className="mb-5 font-display text-2xl font-semibold">
                {td("overview")}
              </h2>
              <HotelOverview
                description={hotel.description}
                checkInTime={hotel.checkInTime}
                checkOutTime={hotel.checkOutTime}
                languages={hotel.languages}
                amenities={hotel.amenities}
              />
            </section>
          </Reveal>

          {offers.length > 0 && (
            <Reveal>
              <ListingOffersSection
                offers={offers}
                title={td("offersTabLabel")}
                couponLabel={td("offerCouponCodeLabel")}
                validUntilLabel={(date) => td("offerValidUntil", { date })}
                saveLabel={(amount) => td("offerSave", { amount })}
                percentOffLabel={(pct) => td("offerPercentOff", { pct })}
              />
            </Reveal>
          )}

          {hotel.gallery.length > 0 && (
            <Reveal>
              <section id="gallery" aria-labelledby="photo-gallery-heading" className="scroll-mt-36">
                <h2 id="photo-gallery-heading" className="mb-5 font-display text-2xl font-semibold">
                  {th("photoGallery")}
                </h2>
                <BusinessPhotoGallery images={hotel.gallery} alt={hotel.name} categories={HOTEL_GALLERY_CATEGORIES} />
              </section>
            </Reveal>
          )}

          {hotel.videos && hotel.videos.length > 0 && (
            <Reveal>
              <section id="videos" aria-labelledby="video-gallery-heading" className="scroll-mt-36">
                <h2 id="video-gallery-heading" className="mb-5 font-display text-2xl font-semibold">
                  {td("videoGallery")}
                </h2>
                <VideoGallery videos={hotel.videos} />
              </section>
            </Reveal>
          )}

          {RESTAURANTS_PUBLIC_ENABLED && hotel.restaurant && (
            <Reveal>
              <section aria-labelledby="restaurant-heading">
                <h2 id="restaurant-heading" className="mb-5 font-display text-2xl font-semibold">
                  {th("onsiteRestaurant")}
                </h2>
                <HotelOnsiteRestaurantCard restaurant={hotel.restaurant} locale={locale} viewLabel={th("viewRestaurant")} />
              </section>
            </Reveal>
          )}

          {CAFES_PUBLIC_ENABLED && hotel.cafe && (
            <Reveal>
              <section aria-labelledby="cafe-heading">
                <h2 id="cafe-heading" className="mb-5 font-display text-2xl font-semibold">
                  {th("onsiteCafe")}
                </h2>
                <HotelOnsiteCafeCard cafe={hotel.cafe} locale={locale} viewLabel={th("viewCafe")} />
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
                    groups={hotel.openingHoursStructured ?? []}
                    is24Hours={hotel.is24Hours}
                    temporarilyClosed={hotel.temporarilyClosed}
                    permanentlyClosed={hotel.permanentlyClosed}
                  />
                </div>
                {hasStructuredHours && (
                  <div className="divide-y divide-ink/8 overflow-hidden rounded-xl2 border border-ink/8 dark:divide-white/10 dark:border-white/10">
                    {hotel.openingHoursStructured!.map((group, i) => (
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

          {hasAmenities(hotel.amenitiesV2) && (
            <Reveal>
              <section id="amenities" aria-labelledby="amenities-heading" className="scroll-mt-36">
                <h2 id="amenities-heading" className="mb-5 font-display text-2xl font-semibold">
                  {t("amenities")}
                </h2>
                <AmenitiesSection amenities={hotel.amenitiesV2} />
              </section>
            </Reveal>
          )}

          <LocationMapSection locale={locale} address={hotel.address} coords={hotel.location} mapsHref={googleMapsHref} name={hotel.name} />

          <Reveal>
            <section aria-labelledby="policies-heading">
              <h2 id="policies-heading" className="mb-4 font-display text-2xl font-semibold">
                {td("policies")}
              </h2>
              <div className="rounded-xl2 border border-ink/8 bg-ink/[0.02] p-5 text-sm leading-relaxed text-ink/70 dark:border-white/10 dark:bg-white/[0.02] dark:text-sand/70">
                {td("policiesText", { name: hotel.name })}
              </div>
            </section>
          </Reveal>

          <Reveal>
            <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-36">
              <h2 id="reviews-heading" className="mb-5 font-display text-2xl font-semibold">
                {t("reviews")}
              </h2>
              <ReviewsSection
                rating={hotel.rating}
                reviewCount={hotel.reviewCount}
                reviews={hotel.reviews}
                locale={locale}
                pathToRevalidate={`/${locale}/hotels/${hotel.slug}`}
              />
              <div className="mt-6">
                <ReviewForm
                  key={myReview?.id ?? "new"}
                  listingType="hotel"
                  listingId={hotel.id}
                  locale={locale}
                  pathToRevalidate={`/${locale}/hotels/${hotel.slug}`}
                  allowPhotos
                  existingReview={myReview}
                />
              </div>
            </section>
          </Reveal>

        </div>

        <aside className="hidden h-fit rounded-xl3 border border-ink/8 p-6 shadow-premium dark:border-white/10 lg:sticky lg:top-24 lg:block">
          <HotelBookingCard
            hotelId={hotel.id}
            hotelSlug={hotel.slug}
            name={hotel.name}
            rating={hotel.rating}
            priceRange={hotel.priceRange}
            phone={hotel.phone}
            website={hotel.website}
            locale={locale}
            bookingCta={bookingCta}
            rooms={hotel.rooms}
            initiallyFavorited={isFavorited}
            favoriteCount={hotel.favoriteCount}
          />
        </aside>
      </div>

      {similarHotels.length > 0 && (
        <section className="border-t border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-white/[0.03] sm:py-20">
          <div className="container-px mx-auto">
            <Reveal>
              <h2 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">{td("youMayAlsoLike")}</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
                {similarHotels.map((h) => (
                  <div key={h.id} className="min-w-[280px] sm:min-w-0">
                    <HotelCard
                      href={`/${locale}/hotels/${h.slug}`}
                      image={h.coverImage}
                      name={h.name}
                      address={h.address}
                      rating={h.rating}
                      reviewCount={h.reviewCount}
                      priceRange={h.priceRange}
                      amenities={h.amenities}
                      featured={h.featured}
                      hotelId={h.id}
                      locale={locale}
                      website={h.website}
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

      <PartnerStatusSection
        isPartner={hotel.isPartner}
        partnerStatus={hotel.partnerStatus}
        logoUrl={hotel.logo}
        businessName={hotel.name}
        locale={locale}
      />

      <MobileBookingBar
        listingType="hotel"
        listingId={hotel.id}
        name={hotel.name}
        phone={hotel.phone}
        whatsappFallback={whatsappFallback}
        locale={locale}
      />
    </PartnerThemeScope>
  );
}
