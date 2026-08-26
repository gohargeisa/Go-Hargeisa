import { safeJsonLd } from "@/lib/utils/json-ld";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { FileText, Coffee, Wifi, Laptop, CalendarCheck } from "lucide-react";
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
import { RestaurantMenuSection } from "@/components/shared/restaurant-menu-section";
import { getProductsForListing } from "@/lib/data/products";
import { ProductsSection } from "@/components/shared/products-section";
import { GroupedProductsSection } from "@/components/shared/grouped-products-section";
import { LAVENDER_MENU_SECTIONS, LAVENDER_MENU_SORT_ORDER_BASE, groupProductsIntoSections } from "@/lib/config/lavender-menu-sections";
import { CAFE_GALLERY_CATEGORIES } from "@/lib/utils/gallery-categories";
import { AmenitiesSection, hasAmenities } from "@/components/shared/amenities-section";
import { SocialLinks } from "@/components/shared/social-links";
import { VideoGallery } from "@/components/shared/video-gallery";
import { formatDayRange, formatTime12h } from "@/lib/utils/opening-hours";
import { OpenStatusBadge } from "@/components/shared/open-status-badge";
import { CafeActionCard } from "@/components/shared/cafe-action-card";
import { TableReservationButton } from "@/components/shared/table-reservation-button";
import { MobileBookingBar } from "@/components/shared/mobile-booking-bar";
import { ListingCard } from "@/components/shared/listing-card";
import { ReviewsSection } from "@/components/shared/reviews-section";
import { ReviewForm } from "@/components/shared/review-form";
import { getMyReviewForListing } from "@/lib/data/reviews";
import { isListingFavorited } from "@/lib/data/favorites";
import { getNearbyListings } from "@/lib/data/nearby";
import { NearbyListings } from "@/components/shared/nearby-listings";
import { resolveMapsUrl } from "@/lib/utils/google-maps";
import { LocationMapSection } from "@/components/shared/location-map-section";
import { Reveal } from "@/components/home/reveal";
import { PrimaryButton, SecondaryButton } from "@/components/shared/buttons";
import { getPartnerTheme } from "@/lib/config/partner-themes";
import { PartnerThemeScope } from "@/components/shared/partner/partner-theme-scope";
import { PartnerHeroBanner } from "@/components/shared/partner/partner-hero-banner";
import { PartnerPartnershipFooter } from "@/components/shared/partner/partner-partnership-footer";
import { PremiumPartnerStory } from "@/components/shared/partner/premium-partner-story";
import { PremiumPartnerCTA } from "@/components/shared/partner/premium-partner-cta";
import { PartnerStatusSection } from "@/components/shared/partner/partner-status-section";

// Public content changes infrequently; revalidate hourly instead of
// rendering on every request (this page no longer reads cookies, so
// it's eligible for static generation + ISR).
export const revalidate = 3600;

/**
 * Lavender Café's real, verified display address — Alamada, not the generic
 * "Hargeisa, Somaliland" currently stored in `cafes.address` (or the wrong
 * neighborhood some other business might sit in). Supplied directly by the
 * project owner and used for DISPLAY only, same override-without-a-DB-write
 * pattern as FLOWERS_DISPLAY_NAME on the sibling Flowers page — no database
 * column is touched by this constant.
 *
 * The café's own `cafes.google_maps_url` / `lat`/`lng` are deliberately NOT
 * used for this listing: verified directly (the saved short link was
 * followed and resolved) to point at the *Lavender Flowers* Google Maps
 * Place — a real, pre-existing data bug where the café listing was set up
 * with the flower shop's saved map link instead of its own. Rather than
 * show a "Get Directions" button that sends a customer to a different
 * business, or invent a coordinate/link that was never verified, the café's
 * LocationMapSection call below passes no coords/mapsHref at all — it falls
 * back to its own supported address-only presentation. See this file's
 * LocationMapSection call and lib/utils/google-maps.ts for the shared
 * "prefer a saved link over built one" resolver this deliberately bypasses
 * for this one listing.
 */
const LAVENDER_CAFE_ADDRESS: Record<Locale, string> = {
  en: "Alamada, Hargeisa, Somaliland — near Scandinavian Hotel",
  ar: "علامادا، هرجيسا، صوماليلاند — بالقرب من فندق سكاندنافيا",
  so: "Alamada, Hargeisa, Somaliland — u dhow Scandinavian Hotel",
};

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
  // Falls back to the older sellsFlowers flag until
  // 20260823000002_universal_cart_orders.sql (adds cafes.ordering_enabled,
  // backfilled from sellsFlowers) is reviewed and applied — keeps Lavender's
  // already-shipped, already-verified product ordering working in the
  // meantime instead of silently disappearing because the new column isn't
  // live yet. Safe no-op once the migration lands and ordering_enabled is
  // populated (true/false, never undefined).
  const cafeOrderingEnabled = cafe.orderingEnabled ?? cafe.sellsFlowers;
  const t = await getTranslations("common");
  const tNav = await getTranslations("nav");
  const td = await getTranslations("detail");
  const th = await getTranslations("hotelDetail");
  const tw = await getTranslations("weekdays");
  const tl = await getTranslations("listings");
  const tn = await getTranslations("nearby");
  const [similarCafes, siteSettings, offers, myReview, isFavorited, nearbyPlaces, cafeProducts] = await Promise.all([
    getRelatedListings("cafe", cafe.id),
    getSiteSettings(),
    getPublicOffersForListing("cafe", cafe.id),
    getMyReviewForListing("cafe", cafe.id),
    isListingFavorited("cafe", cafe.id),
    getNearbyListings({ lat: cafe.location.lat, lng: cafe.location.lng, excludeType: "cafe", excludeId: cafe.id }),
    cafeOrderingEnabled ? getProductsForListing(cafe.id, "cafe") : Promise.resolve([]),
  ]);
  // Lavender-only, temporary: most of its 106 café-menu products don't have
  // a genuine individual photo yet (only a positional/generic menu-page
  // scan would be available, which the product-image cleanup task
  // explicitly ruled out using) — showing those as bare gray placeholder
  // cards next to the ones that do have real photos reads as broken/
  // unprofessional. Hides them from this customer-facing page only; the
  // underlying rows are untouched (still is_available/is_hidden=false in
  // the DB) and reappear automatically the moment a real image is attached
  // to products.image. Every other cafe/listing type is unaffected — this
  // never runs for them, since `cafe.slug === "lavender"` guards it.
  const visibleCafeProducts =
    cafe.slug === "lavender" ? cafeProducts.filter((p) => typeof p.image === "string" && p.image.trim().length > 0) : cafeProducts;
  // One shared catalog — menu items and flowers alike — through the
  // universal cart. ProductsSection's own category filter (derived from
  // whatever categories are present) is what lets a shopper narrow down to
  // "Flowers & Bouquets" specifically; no separate flowers-only section.
  const showProducts = Boolean(cafeOrderingEnabled) && visibleCafeProducts.length > 0;
  // Lavender-only: its 106 café-menu products carry no real category (the
  // live products.category CHECK constraint doesn't allow café vocabulary —
  // see lib/config/lavender-menu-sections.ts), so they're grouped into
  // labeled sections positionally instead of via ProductsSection's normal
  // category-pill filtering. Every other cafe keeps the generic flat view.
  // Flower products no longer live on this listing at all (moved to the
  // separate Lavender Flowers listing — see /flowers/[slug]) — the "start
  // of café sections" cutoff (LAVENDER_MENU_SORT_ORDER_BASE) is kept only
  // because it's still what separates one café section from the next.
  const lavenderMenuGroups =
    cafe.slug === "lavender" ? groupProductsIntoSections(visibleCafeProducts, LAVENDER_MENU_SORT_ORDER_BASE, LAVENDER_MENU_SECTIONS) : null;
  const whatsappFallback = (siteSettings as { whatsapp_number?: string } | null)?.whatsapp_number ?? undefined;
  // Everything partner-specific (hero image, fit mode, brand colors) lives
  // in lib/config/partner-themes.ts — this page stays generic for any
  // current or future themed partner, and renders exactly as before for any
  // listing with no theme configured (getPartnerTheme returns null).
  const partnerTheme = getPartnerTheme("cafe", cafe.slug);

  const googleMapsHref = resolveMapsUrl(cafe.location, cafe.googleMapsUrl);
  const showAmenities = hasAmenities(cafe.amenitiesV2);

  const hasStructuredHours = cafe.openingHoursStructured && cafe.openingHoursStructured.length > 0;
  const hasHoursInfo = hasStructuredHours || cafe.is24Hours || cafe.temporarilyClosed || cafe.permanentlyClosed;

  const navTabs: HotelNavTab[] = [
    { id: "overview", label: td("overview") },
    ...(offers.length > 0 ? [{ id: "offers", label: td("offersTabLabel") }] : []),
    ...(hasHoursInfo ? [{ id: "hours", label: td("openingHoursByDay") }] : []),
    ...(cafe.specialDrinks.length > 0 ? [{ id: "specialties", label: td("coffeeSpecialties") }] : []),
    ...(cafe.menuHighlights.length > 0 || cafe.menuPdfUrl ? [{ id: "menu", label: td("menuHighlights") }] : []),
    ...(showProducts ? [{ id: "shop", label: td("orderOnline") }] : []),
    ...(cafe.reservable ? [{ id: "reservation", label: t("reserveTable") }] : []),
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
    <PartnerThemeScope theme={partnerTheme}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <ViewTracker listingType="cafe" listingId={cafe.id} />

      <Breadcrumbs
        items={[
          { label: tNav("cafes"), href: `/${locale}/cafes` },
          { label: cafe.name, href: `/${locale}/cafes/${cafe.slug}` },
        ]}
      />

      {partnerTheme && <PartnerHeroBanner theme={partnerTheme} alt={cafe.name} locale={locale} />}

      <HotelHeaderTop
        logo={cafe.logo}
        name={cafe.name}
        rating={cafe.rating}
        reviewCount={cafe.reviewCount}
        categoryLabel="Cafe"
        locale={locale}
        isPartner={cafe.isPartner}
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
        showPrimary={cafe.reservable}
        primaryLabel={t("reserveTable")}
        reservable={cafe.reservable}
      />

      {cafe.slug === "lavender" && (
        <div className="container-px mx-auto mt-3 flex justify-center">
          <SecondaryButton href={`/${locale}/flowers/lavender`} size="sm">
            {td("visitLavenderFlowers")}
          </SecondaryButton>
        </div>
      )}

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

      {/* MENU — the main offering, promoted above the generic gallery/tabs
          (the real, orderable, 100+ item catalog — same GroupedProductsSection
          / ProductsSection this section always rendered, just moved so it's
          the star instead of something a visitor has to scroll past
          Overview/Hours/Specialties to reach). */}
      {showProducts && (
        <Reveal>
          <section
            id="shop"
            aria-labelledby="shop-heading"
            className="scroll-mt-36 border-t border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-white/[0.03] sm:py-20"
          >
            <div className="container-px mx-auto">
              <div className="mx-auto mb-8 max-w-2xl text-center">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-primary">{td("menuEyebrow")}</span>
                <h2 id="shop-heading" className="font-display text-2xl font-semibold sm:text-3xl">
                  {td("orderOnline")}
                </h2>
              </div>
              {lavenderMenuGroups ? (
                <GroupedProductsSection
                  groups={lavenderMenuGroups}
                  storeName={cafe.name}
                  business={{
                    listingType: "cafe",
                    listingId: cafe.id,
                    businessName: cafe.name,
                    deliveryEnabled: Boolean(cafe.productsDeliveryEnabled),
                    addons: cafe.flowerAddons ?? [],
                  }}
                  locale={locale}
                />
              ) : (
                <ProductsSection
                  products={visibleCafeProducts}
                  storeName={cafe.name}
                  business={{
                    listingType: "cafe",
                    listingId: cafe.id,
                    businessName: cafe.name,
                    deliveryEnabled: Boolean(cafe.productsDeliveryEnabled),
                    addons: cafe.flowerAddons ?? [],
                  }}
                  locale={locale}
                />
              )}
            </div>
          </section>
        </Reveal>
      )}

      <HotelGallerySlider cover={cafe.coverImage} images={cafe.gallery} alt={cafe.name} />

      <div className="mt-8">
        <HotelNavTabs tabs={navTabs} />
      </div>

      <div className="container-px mx-auto grid gap-10 pb-28 pt-10 lg:grid-cols-3 lg:gap-12 lg:pb-10">
        <div className="min-w-0 space-y-14 lg:col-span-2">
          <Reveal>
            {partnerTheme ? (
              <PremiumPartnerStory
                eyebrow={td("eyebrowAbout")}
                title={td("overview")}
                description={cafe.description}
                highlightsLabel={td("whatWeOfferTitle")}
                highlights={[
                  ...(cafe.specialDrinks.length > 0 ? [{ icon: Coffee, label: td("coffeeSpecialties") }] : []),
                  ...(cafe.wifi ? [{ icon: Wifi, label: td("freeWifi") }] : []),
                  ...(cafe.workingSpace ? [{ icon: Laptop, label: td("workingSpace") }] : []),
                  ...(cafe.reservable ? [{ icon: CalendarCheck, label: t("reserveTable") }] : []),
                ]}
              />
            ) : (
              <section id="overview" aria-labelledby="overview-heading" className="scroll-mt-36">
                <h2 id="overview-heading" className="mb-5 font-display text-2xl font-semibold">
                  {td("overview")}
                </h2>
                <p className="leading-relaxed text-ink/75 dark:text-sand/75">{cafe.description}</p>
              </section>
            )}
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
                  <RestaurantMenuSection
                    items={cafe.menuHighlights}
                    allCategoriesLabel={td("menuAllCategoriesLabel")}
                    featuredLabel={td("menuFeaturedLabel")}
                  />
                )}
              </section>
            </Reveal>
          )}

          {cafe.reservable && (
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
                    listingType="cafe"
                    listingId={cafe.id}
                    businessName={cafe.name}
                    locale={locale}
                    label={t("reserveTable")}
                    className="group inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary-700 px-8 text-[15px] font-semibold text-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-card active:scale-95"
                  />
                </div>
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
                <VideoGallery videos={cafe.videos} />
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

          <LocationMapSection
            locale={locale}
            address={cafe.slug === "lavender" ? LAVENDER_CAFE_ADDRESS[locale] : cafe.address}
            coords={cafe.slug === "lavender" ? undefined : cafe.location}
            mapsHref={cafe.slug === "lavender" ? undefined : googleMapsHref}
            name={cafe.name}
          />

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
            reservable={cafe.reservable}
            reserveLabel={t("reserveTable")}
            initiallyFavorited={isFavorited}
            favoriteCount={cafe.favoriteCount}
            addFavoriteLabel={tl("addToFavorites", { name: cafe.name })}
            removeFavoriteLabel={tl("removeFromFavorites", { name: cafe.name })}
          />
        </aside>
      </div>

      {cafe.slug === "lavender" && (
        <Reveal>
          <div className="container-px mx-auto pb-4">
            <div className="flex flex-col items-center justify-between gap-4 rounded-xl3 border border-ink/8 bg-white p-6 text-center dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:text-start sm:p-8">
              <div>
                <h3 className="font-display text-lg font-semibold">{td("lookingForLavenderFlowersTitle")}</h3>
                <p className="mt-1 text-sm text-ink/65 dark:text-sand/65">{td("lookingForLavenderFlowersBody")}</p>
              </div>
              <PrimaryButton href={`/${locale}/flowers/lavender`} size="sm" className="shrink-0">
                {td("visitLavenderFlowers")}
              </PrimaryButton>
            </div>
          </div>
        </Reveal>
      )}

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

      {showProducts && partnerTheme && (
        <PremiumPartnerCTA
          theme={partnerTheme}
          icon={Coffee}
          badgeLabel={cafe.name}
          title={td("exploreCafeCtaTitle")}
          subtitle={td("exploreCafeCtaSubtitle")}
          primaryHref="#shop"
          primaryLabel={td("exploreCafeButton")}
          secondaryHref={cafe.reservable ? "#reservation" : undefined}
          secondaryLabel={cafe.reservable ? t("reserveTable") : undefined}
          secondaryIcon={CalendarCheck}
        />
      )}

      {partnerTheme ? (
        <PartnerPartnershipFooter theme={partnerTheme} locale={locale} />
      ) : (
        <PartnerStatusSection
          isPartner={cafe.isPartner}
          partnerStatus={cafe.partnerStatus}
          logoUrl={cafe.logo}
          businessName={cafe.name}
          locale={locale}
        />
      )}

      <MobileBookingBar
        listingType="cafe"
        listingId={cafe.id}
        name={cafe.name}
        phone={cafe.phone}
        whatsappFallback={whatsappFallback}
        locale={locale}
      />
    </PartnerThemeScope>
  );
}
