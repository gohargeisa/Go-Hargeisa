import { safeJsonLd } from "@/lib/utils/json-ld";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ExternalLink, MapPin, Navigation } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getHotelBySlug, getAllHotelSlugs, getNearbyAttractionsForHotel, getHotels } from "@/lib/data/hotels";
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
import { HotelAmenities } from "@/components/shared/hotel-amenities";
import { HotelBookingCard } from "@/components/shared/hotel-booking-card";
import { MobileBookingBar } from "@/components/shared/mobile-booking-bar";
import { HotelCard } from "@/components/shared/hotel-card";
import { ReviewsSection } from "@/components/shared/reviews-section";
import { ReviewForm } from "@/components/shared/review-form";
import { SingleLocationMapLoader } from "@/components/map/single-location-map-loader";
import { Reveal } from "@/components/home/reveal";
import { PrimaryButton, SecondaryButton } from "@/components/shared/buttons";
import { getHotelBookingCta } from "@/lib/utils/booking-cta";
import {
  HOTELS_PRESENTATION_MODE,
  PRESENTATION_HOTEL_SLUG,
  RESTAURANTS_PUBLIC_ENABLED,
  CAFES_PUBLIC_ENABLED,
  filterHotelsForPresentation,
} from "@/lib/config/features";

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
  const hotel = await getHotelBySlug(slug);
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
  const hotel = await getHotelBySlug(slug);
  if (!hotel) notFound();
  if (HOTELS_PRESENTATION_MODE && slug !== PRESENTATION_HOTEL_SLUG) notFound();

  const t = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const td = await getTranslations("detail");
  const th = await getTranslations("hotelDetail");
  const [nearby, allHotels, siteSettings, offers] = await Promise.all([
    getNearbyAttractionsForHotel(hotel.id),
    getHotels(),
    getSiteSettings(),
    getPublicOffersForListing("hotel", hotel.id),
  ]);
  const similarHotels = filterHotelsForPresentation(allHotels)
    .filter((h) => h.id !== hotel.id)
    .slice(0, 4);
  const whatsappFallback = (siteSettings as { whatsapp_number?: string } | null)?.whatsapp_number ?? undefined;

  const bookingCta = getHotelBookingCta(hotel, {
    bookNow: t("bookNow"),
    bookOnWebsite: t("bookOnWebsite"),
    bookViaWhatsApp: t("bookViaWhatsApp"),
    bookOnBookingCom: t("bookOnBookingCom"),
  });

  const navTabs: HotelNavTab[] = [
    { id: "overview", label: td("overview") },
    ...(offers.length > 0 ? [{ id: "offers", label: td("offersTabLabel") }] : []),
    ...(hotel.rooms.length > 0 ? [{ id: "rooms", label: th("rooms") }] : []),
    ...(hotel.gallery.length > 0 ? [{ id: "gallery", label: t("gallery") }] : []),
    { id: "amenities", label: t("amenities") },
    { id: "reviews", label: t("reviews") },
    { id: "location", label: td("location") },
  ];

  const hasCoordinates = Number.isFinite(hotel.location?.lat) && Number.isFinite(hotel.location?.lng);
  const googleMapsHref = hasCoordinates
    ? `https://www.google.com/maps/search/?api=1&query=${hotel.location.lat},${hotel.location.lng}`
    : undefined;
  const directionsHref = hasCoordinates
    ? `https://www.google.com/maps/dir/?api=1&destination=${hotel.location.lat},${hotel.location.lng}`
    : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Hotel",
    name: hotel.name,
    description: hotel.shortDescription,
    image: hotel.coverImage,
    logo: hotel.logo,
    address: { "@type": "PostalAddress", streetAddress: hotel.address, addressLocality: "Hargeisa" },
    telephone: hotel.phone,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: hotel.rating,
      reviewCount: hotel.reviewCount,
    },
    priceRange: hotel.priceRange,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <ViewTracker listingType="hotel" listingId={hotel.id} />

      <Breadcrumbs
        items={[
          { label: tNav("hotels"), href: `/${locale}/hotels` },
          { label: hotel.name, href: `/${locale}/hotels/${hotel.slug}` },
        ]}
      />

      <HotelHeaderTop
        logo={hotel.logo}
        name={hotel.name}
        rating={hotel.rating}
        reviewCount={hotel.reviewCount}
        categoryLabel={hotelCategoryLabel(hotel.priceRange)}
      />

      <HotelActionBar
        locale={locale}
        listingType="hotel"
        listingId={hotel.id}
        name={hotel.name}
        rating={hotel.rating}
        phone={hotel.phone}
        website={hotel.website}
        whatsappFallback={whatsappFallback}
        bookingCta={bookingCta}
        rooms={hotel.rooms}
      />

      <HotelQuickInfoCards
        rating={hotel.rating}
        priceRange={hotel.priceRange}
        checkInTime={hotel.checkInTime}
        checkOutTime={hotel.checkOutTime}
        languages={hotel.languages}
        amenities={hotel.amenities}
      />

      <HotelGallerySlider cover={hotel.coverImage} images={hotel.gallery} alt={hotel.name} />

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
              />
            </Reveal>
          )}

          {hotel.rooms.length > 0 && (
            <Reveal>
              <section id="rooms" aria-labelledby="rooms-heading" className="scroll-mt-36">
                <h2 id="rooms-heading" className="mb-5 font-display text-2xl font-semibold">
                  {th("rooms")}
                </h2>
                <HotelRoomsSection
                  rooms={hotel.rooms}
                  locale={locale}
                  hotelId={hotel.id}
                  hotelName={hotel.name}
                  hotelRating={hotel.rating}
                  bookingCta={bookingCta}
                />
              </section>
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

          <Reveal>
            <section id="amenities" aria-labelledby="amenities-heading" className="scroll-mt-36">
              <h2 id="amenities-heading" className="mb-5 font-display text-2xl font-semibold">
                {t("amenities")}
              </h2>
              <HotelAmenities amenities={hotel.amenities} />
            </section>
          </Reveal>

          <Reveal>
            <section id="location" aria-labelledby="location-heading" className="scroll-mt-36">
              <h2 id="location-heading" className="mb-5 font-display text-2xl font-semibold">
                {td("location")}
              </h2>
              <div className="overflow-hidden rounded-xl3 border border-ink/8 dark:border-white/10">
                <SingleLocationMapLoader location={hotel.location} label={hotel.name} />
                <div className="flex flex-col gap-3 border-t border-ink/8 p-5 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between">
                  <p className="flex items-center gap-2 text-sm text-ink/70 dark:text-sand/70">
                    <MapPin size={16} className="shrink-0 text-primary" aria-hidden="true" />
                    {hotel.address}
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
              </div>
            </section>
          </Reveal>

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
              <ReviewsSection rating={hotel.rating} reviewCount={hotel.reviewCount} reviews={hotel.reviews} />
              <div className="mt-6">
                <ReviewForm
                  listingType="hotel"
                  listingId={hotel.id}
                  locale={locale}
                  pathToRevalidate={`/${locale}/hotels/${hotel.slug}`}
                  allowPhotos
                />
              </div>
            </section>
          </Reveal>

          {nearby.length > 0 && (
            <Reveal>
              <section aria-labelledby="nearby-heading">
                <h2 id="nearby-heading" className="mb-5 font-display text-2xl font-semibold">
                  {t("nearbyAttractions")}
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                  {nearby.map((a) => (
                    <Link
                      key={a.id}
                      href={`/${locale}/attractions/${a.slug}`}
                      className="flex gap-3 rounded-xl2 border border-ink/8 p-3 transition-colors hover:border-primary/40 dark:border-white/10"
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                        <Image src={a.coverImage} alt={a.name} fill sizes="64px" className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{a.name}</p>
                        <p className="line-clamp-2 text-xs text-ink/55 dark:text-sand/55">{a.shortDescription}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            </Reveal>
          )}
        </div>

        <aside className="hidden h-fit rounded-xl3 border border-ink/8 p-6 shadow-premium dark:border-white/10 lg:sticky lg:top-24 lg:block">
          <HotelBookingCard
            hotelId={hotel.id}
            name={hotel.name}
            rating={hotel.rating}
            priceRange={hotel.priceRange}
            phone={hotel.phone}
            website={hotel.website}
            locale={locale}
            bookingCta={bookingCta}
            rooms={hotel.rooms}
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

      <MobileBookingBar
        listingType="hotel"
        listingId={hotel.id}
        name={hotel.name}
        phone={hotel.phone}
        website={hotel.website}
        whatsappFallback={whatsappFallback}
        locale={locale}
        bookingCta={bookingCta}
        rooms={hotel.rooms}
      />
    </>
  );
}
