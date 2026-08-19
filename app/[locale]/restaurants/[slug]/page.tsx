import { safeJsonLd } from "@/lib/utils/json-ld";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ExternalLink, FileText, MapPin, Navigation, UtensilsCrossed } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getRestaurantBySlug, getAllRestaurantSlugs } from "@/lib/data/restaurants";
import { getRelatedListings } from "@/lib/data/related-listings";
import { getPublicOffersForListing } from "@/lib/data/offers";
import { getSiteSettings } from "@/lib/actions/settings";
import { ListingOffersSection } from "@/components/shared/listing-offers-section";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ViewTracker } from "@/components/shared/view-tracker";
import { HotelHeaderTop } from "@/components/shared/hotel-header-top";
import { HotelActionBar } from "@/components/shared/hotel-action-bar";
import { RestaurantQuickInfoCards } from "@/components/shared/restaurant-quick-info-cards";
import { HotelGallerySlider } from "@/components/shared/hotel-gallery-slider";
import { HotelNavTabs, type HotelNavTab } from "@/components/shared/hotel-nav-tabs";
import { BusinessPhotoGallery } from "@/components/shared/business-photo-gallery";
import { RestaurantMenuSection } from "@/components/shared/restaurant-menu-section";
import { getProductsForListing } from "@/lib/data/products";
import { ProductsSection } from "@/components/shared/products-section";
import { RESTAURANT_GALLERY_CATEGORIES } from "@/lib/utils/gallery-categories";
import { RestaurantBookingCard } from "@/components/shared/restaurant-booking-card";
import { TableReservationButton } from "@/components/shared/table-reservation-button";
import { EmptyState } from "@/components/shared/empty-state";
import { MobileBookingBar } from "@/components/shared/mobile-booking-bar";
import { ListingCard } from "@/components/shared/listing-card";
import { ReviewsSection } from "@/components/shared/reviews-section";
import { ReviewForm } from "@/components/shared/review-form";
import { getMyReviewForListing } from "@/lib/data/reviews";
import { isListingFavorited } from "@/lib/data/favorites";
import { getNearbyListings } from "@/lib/data/nearby";
import { NearbyListings } from "@/components/shared/nearby-listings";
import { resolveMapsUrl, resolveDirectionsUrl } from "@/lib/utils/google-maps";
import { getRestaurantOrderCta } from "@/lib/utils/restaurant-cta";
import { Reveal } from "@/components/home/reveal";
import { PrimaryButton, SecondaryButton } from "@/components/shared/buttons";
import { listingCategoryLabel } from "@/lib/utils/hotel-category";
import { AmenitiesSection, hasAmenities } from "@/components/shared/amenities-section";
import { SocialLinks } from "@/components/shared/social-links";
import { VideoGallery } from "@/components/shared/video-gallery";
import { OpenStatusBadge } from "@/components/shared/open-status-badge";
import { PartnerAcquisitionCta } from "@/components/shared/partner-acquisition-cta";
import { formatDayRange, formatTime12h } from "@/lib/utils/opening-hours";

// Public content changes infrequently; revalidate hourly instead of
// rendering on every request (this page no longer reads cookies, so
// it's eligible for static generation + ISR).
export const revalidate = 3600;

export async function generateStaticParams() {
  const slugs = await getAllRestaurantSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}): Promise<Metadata> {
  const r = await getRestaurantBySlug(slug);
  if (!r) return {};
  return {
    title: `${r.name} — Restaurant in Hargeisa`,
    description: r.shortDescription,
    openGraph: { images: [r.coverImage] },
    alternates: localeAlternates(locale as Locale, `/restaurants/${r.slug}`),
  };
}

export default async function RestaurantDetailPage({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}) {
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) notFound();
  const t = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const td = await getTranslations("detail");
  const th = await getTranslations("hotelDetail");
  const tw = await getTranslations("weekdays");
  const tl = await getTranslations("listings");
  const tn = await getTranslations("nearby");
  const [similarRestaurants, siteSettings, offers, myReview, isFavorited, nearbyPlaces, restaurantProducts] = await Promise.all([
    getRelatedListings("restaurant", restaurant.id),
    getSiteSettings(),
    getPublicOffersForListing("restaurant", restaurant.id),
    getMyReviewForListing("restaurant", restaurant.id),
    isListingFavorited("restaurant", restaurant.id),
    getNearbyListings({ lat: restaurant.location.lat, lng: restaurant.location.lng, excludeType: "restaurant", excludeId: restaurant.id }),
    restaurant.catalogOrderingEnabled ? getProductsForListing(restaurant.id, "restaurant") : Promise.resolve([]),
  ]);
  const showProducts = Boolean(restaurant.catalogOrderingEnabled) && restaurantProducts.length > 0;
  const whatsappFallback = (siteSettings as { whatsapp_number?: string } | null)?.whatsapp_number ?? undefined;
  const hasStructuredHours = restaurant.openingHoursStructured && restaurant.openingHoursStructured.length > 0;
  const hasHoursInfo = hasStructuredHours || restaurant.is24Hours || restaurant.temporarilyClosed || restaurant.permanentlyClosed;

  const navTabs: HotelNavTab[] = [
    { id: "overview", label: td("overview") },
    ...(offers.length > 0 ? [{ id: "offers", label: td("offersTabLabel") }] : []),
    ...(hasHoursInfo ? [{ id: "hours", label: td("openingHoursByDay") }] : []),
    ...(restaurant.menuHighlights.length > 0 || restaurant.menuPdfUrl ? [{ id: "menu", label: td("menuHighlights") }] : []),
    ...(showProducts ? [{ id: "shop", label: td("orderOnline") }] : []),
    ...(restaurant.reservable ? [{ id: "reservation", label: t("reserveTable") }] : []),
    ...(restaurant.gallery.length > 0 ? [{ id: "gallery", label: t("gallery") }] : []),
    ...(restaurant.videos && restaurant.videos.length > 0 ? [{ id: "videos", label: td("videoGallery") }] : []),
    ...(hasAmenities(restaurant.amenitiesV2) ? [{ id: "amenities", label: t("amenities") }] : []),
    { id: "reviews", label: t("reviews") },
    { id: "location", label: td("location") },
  ];

  const googleMapsHref = resolveMapsUrl(restaurant.location, restaurant.googleMapsUrl);
  const directionsHref = resolveDirectionsUrl(restaurant.location);
  const orderCta = getRestaurantOrderCta({
    onlineOrderingEnabled: restaurant.onlineOrderingEnabled,
    onlineOrderUrl: restaurant.onlineOrderUrl,
    phoneOrderingEnabled: restaurant.phoneOrderingEnabled,
    phone: restaurant.phone,
  });

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    description: restaurant.shortDescription,
    image: restaurant.coverImage,
    logo: restaurant.logo,
    address: { "@type": "PostalAddress", streetAddress: restaurant.address, addressLocality: "Hargeisa" },
    telephone: restaurant.phone,
    servesCuisine: restaurant.cuisine,
    ...(restaurant.reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: restaurant.rating, reviewCount: restaurant.reviewCount } }
      : {}),
    priceRange: restaurant.priceRange,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <ViewTracker listingType="restaurant" listingId={restaurant.id} />

      <Breadcrumbs
        items={[
          { label: tNav("restaurants"), href: `/${locale}/restaurants` },
          { label: restaurant.name, href: `/${locale}/restaurants/${restaurant.slug}` },
        ]}
      />

      <HotelHeaderTop
        logo={restaurant.logo}
        name={restaurant.name}
        rating={restaurant.rating}
        reviewCount={restaurant.reviewCount}
        categoryLabel={
          restaurant.cuisine.length > 0
            ? `${listingCategoryLabel(restaurant.priceRange, "Restaurant")} · ${restaurant.cuisine.join(", ")}`
            : listingCategoryLabel(restaurant.priceRange, "Restaurant")
        }
        locale={locale}
        isPartner={restaurant.isPartner}
      />

      <HotelActionBar
        locale={locale}
        listingType="restaurant"
        listingId={restaurant.id}
        name={restaurant.name}
        phone={restaurant.phone}
        website={restaurant.website}
        email={restaurant.email}
        whatsappFallback={whatsappFallback}
        showPrimary={restaurant.reservable || Boolean(orderCta)}
        reserveLabel={t("reserveTable")}
        reservable={restaurant.reservable}
        orderCta={orderCta}
      />

      <SocialLinks
        instagram={restaurant.socialInstagram}
        facebook={restaurant.socialFacebook}
        tiktok={restaurant.socialTiktok}
        snapchat={restaurant.socialSnapchat}
        x={restaurant.socialX}
        youtube={restaurant.socialYoutube}
        telegram={restaurant.socialTelegram}
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

      <RestaurantQuickInfoCards
        rating={restaurant.rating}
        reviewCount={restaurant.reviewCount}
        priceRange={restaurant.priceRange}
        cuisine={restaurant.cuisine}
        openingHours={restaurant.openingHours}
        reservable={restaurant.reservable}
      />

      <HotelGallerySlider cover={restaurant.coverImage} images={restaurant.gallery} alt={restaurant.name} />

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
              <p className="leading-relaxed text-ink/75 dark:text-sand/75">{restaurant.description}</p>
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
                    groups={restaurant.openingHoursStructured ?? []}
                    is24Hours={restaurant.is24Hours}
                    temporarilyClosed={restaurant.temporarilyClosed}
                    permanentlyClosed={restaurant.permanentlyClosed}
                  />
                </div>
                {hasStructuredHours && (
                  <div className="divide-y divide-ink/8 overflow-hidden rounded-xl2 border border-ink/8 dark:divide-white/10 dark:border-white/10">
                    {restaurant.openingHoursStructured!.map((group, i) => (
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

          <Reveal>
            <section id="menu" aria-labelledby="menu-heading" className="scroll-mt-36">
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <h2 id="menu-heading" className="font-display text-2xl font-semibold">
                  {td("menuHighlights")}
                </h2>
                {restaurant.menuPdfUrl && (
                  <SecondaryButton href={restaurant.menuPdfUrl} external size="sm">
                    <FileText size={14} aria-hidden="true" />
                    {td("downloadMenuPdf")}
                  </SecondaryButton>
                )}
              </div>
              {restaurant.menuHighlights.length > 0 ? (
                <RestaurantMenuSection
                  items={restaurant.menuHighlights}
                  allCategoriesLabel={td("menuAllCategoriesLabel")}
                  featuredLabel={td("menuFeaturedLabel")}
                />
              ) : !restaurant.menuPdfUrl ? (
                <EmptyState icon={UtensilsCrossed} title={td("menuComingSoonTitle")} description={td("menuComingSoonBody")} />
              ) : null}
            </section>
          </Reveal>

          {showProducts && (
            <Reveal>
              <section id="shop" aria-labelledby="shop-heading" className="scroll-mt-36">
                <h2 id="shop-heading" className="mb-5 font-display text-2xl font-semibold">
                  {td("orderOnline")}
                </h2>
                <ProductsSection
                  products={restaurantProducts}
                  storeName={restaurant.name}
                  business={{
                    listingType: "restaurant",
                    listingId: restaurant.id,
                    businessName: restaurant.name,
                    deliveryEnabled: Boolean(restaurant.productsDeliveryEnabled),
                    addons: [],
                  }}
                  locale={locale}
                />
              </section>
            </Reveal>
          )}

          {restaurant.reservable && (
            <Reveal>
              <section id="reservation" aria-labelledby="reservation-heading" className="scroll-mt-36">
                <h2 id="reservation-heading" className="mb-5 font-display text-2xl font-semibold">
                  {t("reserveTable")}
                </h2>
                <div className="rounded-xl3 border border-ink/8 bg-white p-6 dark:border-white/10 dark:bg-white/[0.03] sm:p-8">
                  <p className="mb-5 max-w-lg text-sm leading-relaxed text-ink/65 dark:text-sand/65">
                    {td("reservationSectionBody")}
                  </p>
                  <TableReservationButton
                    listingType="restaurant"
                    listingId={restaurant.id}
                    businessName={restaurant.name}
                    locale={locale}
                    label={t("reserveTable")}
                    className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary-700 px-8 text-[15px] font-semibold text-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-card active:scale-95"
                  />
                </div>
              </section>
            </Reveal>
          )}

          {restaurant.gallery.length > 0 && (
            <Reveal>
              <section id="gallery" aria-labelledby="photo-gallery-heading" className="scroll-mt-36">
                <h2 id="photo-gallery-heading" className="mb-5 font-display text-2xl font-semibold">
                  {th("photoGallery")}
                </h2>
                <BusinessPhotoGallery
                  images={restaurant.gallery}
                  alt={restaurant.name}
                  categories={RESTAURANT_GALLERY_CATEGORIES}
                />
              </section>
            </Reveal>
          )}

          {restaurant.videos && restaurant.videos.length > 0 && (
            <Reveal>
              <section id="videos" aria-labelledby="video-gallery-heading" className="scroll-mt-36">
                <h2 id="video-gallery-heading" className="mb-5 font-display text-2xl font-semibold">
                  {td("videoGallery")}
                </h2>
                <VideoGallery videos={restaurant.videos} />
              </section>
            </Reveal>
          )}

          {hasAmenities(restaurant.amenitiesV2) && (
            <Reveal>
              <section id="amenities" aria-labelledby="amenities-heading" className="scroll-mt-36">
                <h2 id="amenities-heading" className="mb-5 font-display text-2xl font-semibold">
                  {t("amenities")}
                </h2>
                <AmenitiesSection amenities={restaurant.amenitiesV2} />
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
                  {restaurant.address}
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
                rating={restaurant.rating}
                reviewCount={restaurant.reviewCount}
                reviews={restaurant.reviews}
                locale={locale}
                pathToRevalidate={`/${locale}/restaurants/${restaurant.slug}`}
              />
              <div className="mt-6">
                <ReviewForm
                  key={myReview?.id ?? "new"}
                  listingType="restaurant"
                  listingId={restaurant.id}
                  locale={locale}
                  pathToRevalidate={`/${locale}/restaurants/${restaurant.slug}`}
                  allowPhotos
                  existingReview={myReview}
                />
              </div>
            </section>
          </Reveal>
        </div>

        <aside className="hidden h-fit rounded-xl3 border border-ink/8 p-6 shadow-card dark:border-white/10 lg:sticky lg:top-24 lg:block">
          <RestaurantBookingCard
            restaurantId={restaurant.id}
            name={restaurant.name}
            priceRange={restaurant.priceRange}
            priceLabel={t("priceRange")}
            openingHours={restaurant.openingHours}
            hoursLabel={t("openingHours")}
            reservable={restaurant.reservable}
            reserveLabel={t("reserveTable")}
            orderCta={orderCta}
            orderLabel={t("orderNow")}
            phone={restaurant.phone}
            website={restaurant.website}
            locale={locale}
            contactLabel={tNav("contact")}
            visitWebsiteLabel={th("website")}
            initiallyFavorited={isFavorited}
            favoriteCount={restaurant.favoriteCount}
            addFavoriteLabel={tl("addToFavorites", { name: restaurant.name })}
            removeFavoriteLabel={tl("removeFromFavorites", { name: restaurant.name })}
          />
        </aside>
      </div>

      {similarRestaurants.length > 0 && (
        <section className="border-t border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-white/[0.03] sm:py-20">
          <div className="container-px mx-auto">
            <Reveal>
              <h2 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">{td("youMayAlsoLike")}</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="flex gap-5 overflow-x-auto pb-2 scrollbar-none sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
                {similarRestaurants.map((r) => (
                  <div key={r.id} className="min-w-[272px] sm:min-w-0">
                    <ListingCard
                      href={`/${locale}/restaurants/${r.slug}`}
                      image={r.coverImage}
                      title={r.name}
                      subtitle={r.cuisine.join(" · ")}
                      rating={r.rating}
                      reviewCount={r.reviewCount}
                      priceRange={r.priceRange}
                      listingType="restaurant"
                      listingId={r.id}
                      locale={locale}
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

      <PartnerAcquisitionCta locale={locale} />

      <MobileBookingBar
        listingType="restaurant"
        listingId={restaurant.id}
        name={restaurant.name}
        phone={restaurant.phone}
        whatsappFallback={whatsappFallback}
        locale={locale}
      />
    </>
  );
}
