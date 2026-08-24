import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Flower2, Gift, Package, Truck, ShieldCheck } from "lucide-react";
import { WhatsAppIcon } from "@/components/shared/brand-icons";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getCityServiceBySlug } from "@/lib/data/city-services";
import { getCafeBySlug } from "@/lib/data/cafes";
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
import { resolveMapsUrl } from "@/lib/utils/google-maps";
import { LocationMapSection } from "@/components/shared/location-map-section";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import { Reveal } from "@/components/home/reveal";
import { safeJsonLd } from "@/lib/utils/json-ld";
import { MobileBookingBar } from "@/components/shared/mobile-booking-bar";
import { AmenitiesSection, hasAmenities } from "@/components/shared/amenities-section";
import { getPartnerTheme } from "@/lib/config/partner-themes";
import { PartnerThemeScope } from "@/components/shared/partner/partner-theme-scope";
import { PartnerHeroBanner } from "@/components/shared/partner/partner-hero-banner";
import { PartnerPartnershipFooter } from "@/components/shared/partner/partner-partnership-footer";
import { PremiumPartnerStory } from "@/components/shared/partner/premium-partner-story";
import { PremiumPartnerCTA } from "@/components/shared/partner/premium-partner-cta";
import { PartnerAcquisitionCta } from "@/components/shared/partner-acquisition-cta";

// Same reasoning as every other public listing page in this codebase:
// content changes infrequently, so ISR beats rendering on every request.
export const revalidate = 3600;

/**
 * The page's own identity — deliberately NOT `service.name`. The underlying
 * city_services row was created with name="Lavender Flowers" (the split
 * migration) but has since been edited back to "Lavender Flowers & Cakes"
 * through the live admin dashboard, outside of anything this codebase
 * controls. This page's whole reason to exist is presenting the flower side
 * of the business on its own terms — "Lavender Flowers", never "& Cakes" —
 * so it uses this constant everywhere the business's display name appears
 * (title, breadcrumb, header, JSON-LD, contact message templates), rather
 * than trusting whatever the raw listing row currently says. No database
 * write happens anywhere in this file — the row itself is untouched.
 */
const FLOWERS_DISPLAY_NAME = "Lavender Flowers";

/**
 * Lavender Flowers' real, verified display address — Jigjiga Yar /
 * Degelsame iyo Indhobirta, cross-verified two independent ways: (1) this
 * listing's own saved `city_services.maps_url` short link resolves to a
 * real Google Maps Place literally titled "Lavender Flowers, Degelsame iyo
 * Indhobirta ..., Jigjigayar ..., Hargeisa"; (2) the business's own public
 * Instagram bio (@lavenderflowers_sl) separately states "Wadaad-diid Mall",
 * matching the "Wadaad Diid" landmark named in that same resolved Maps
 * listing. This listing has no generic `address` text column at all (see
 * `city_services` schema — location here is coords/maps_url only), so the
 * page previously fell back to showing the category label
 * ("Flowers & Bouquets") as a fake "address" — replaced here with the real
 * verified place name. `service.coords`/`googleMapsHref` below are already
 * correct for this listing (confirmed by the same Maps resolution) and are
 * left untouched.
 */
const LAVENDER_FLOWERS_ADDRESS: Record<Locale, string> = {
  en: "Jigjiga Yar, Hargeisa, Somaliland — Degelsame iyo Indhobirta, near Wadaad-diid Mall",
  ar: "جيجيغا يار، هرجيسا، صوماليلاند — ديغلسامي إيو إندوبيرتا، بالقرب من مول وداد ديد",
  so: "Jigjiga Yar, Hargeisa, Somaliland — Degelsame iyo Indhobirta, u dhow Wadaad-diid Mall",
};

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}): Promise<Metadata> {
  const service = await getCityServiceBySlug(slug, locale);
  if (!service) return {};
  return {
    title: `${FLOWERS_DISPLAY_NAME} — Premium Flower Shop in Hargeisa`,
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
  const td = await getTranslations("detail");
  const th = await getTranslations("hotelDetail");
  const tw = await getTranslations("weekdays");
  const tl = await getTranslations("listings");
  const tn = await getTranslations("nearby");
  const tp = await getTranslations("products");
  const tpa = await getTranslations("partnerAcquisition");

  const [myReview, isFavorited, nearbyPlaces, products, sisterCafe] = await Promise.all([
    getMyReviewForListing("city_service", service.id),
    isListingFavorited("city_service", service.id),
    getNearbyListings({ lat: service.coords.lat, lng: service.coords.lng, excludeType: "city_service", excludeId: service.id }),
    getProductsForListing(service.id),
    // Lavender Flowers and Lavender Café are the same real brand, split
    // into two listings — this listing's own logo/social columns are empty
    // (never duplicated at split time, on purpose: one edit to the café's
    // real profile shouldn't need a second edit here to stay in sync), so
    // read-only fall back to the café's already-verified real values below.
    // No database write happens anywhere in this file.
    getCafeBySlug("lavender", locale),
  ]);

  const showProducts = products.length > 0;
  const hasStructuredHours = !!service.openingHoursStructured && service.openingHoursStructured.length > 0;
  const hasHoursInfo = hasStructuredHours || service.is24Hours || service.temporarilyClosed || service.permanentlyClosed;
  // Real, already-verified amenity tags on this listing (wifi, parking,
  // prayer room, restrooms, CCTV, security, cash accepted) that were never
  // actually surfaced on this page before — same shared AmenitiesSection
  // every other listing type already uses, not a new feature.
  const showAmenities = hasAmenities(service.amenitiesV2);
  const servicePhone = service.phone ?? sisterCafe?.phone;
  const serviceWhatsapp = service.whatsapp ?? sisterCafe?.whatsapp;
  const serviceWhatsappHref = serviceWhatsapp
    ? toWhatsAppHref(serviceWhatsapp, `Hi, I'd like to know more about ${FLOWERS_DISPLAY_NAME}.`)
    : undefined;
  const serviceLogo = service.logoUrl ?? sisterCafe?.logo;
  // Real product photography for the gallery/hero — every one of the 12
  // verified flower products already has a real image (see the split's data
  // verification), so this is a genuine multi-photo florist showcase, not
  // one image stretched into an empty slider. service.image/service.gallery
  // (both still empty on this listing) stay the first choice if either is
  // ever populated for real; the product photos are the fallback, not a
  // replacement.
  const productImages = products.map((p) => p.image).filter((img): img is string => !!img);
  const coverImage = service.image ?? productImages[0] ?? undefined;
  const galleryImages = service.gallery.length > 0 ? service.gallery : productImages.slice(1).map((url) => ({ url }));
  const partnerTheme = getPartnerTheme("city_service", "lavender");

  const navTabs: HotelNavTab[] = [
    { id: "overview", label: td("overview") },
    ...(showProducts ? [{ id: "shop", label: td("orderOnline") }] : []),
    ...(hasHoursInfo ? [{ id: "hours", label: td("openingHoursByDay") }] : []),
    ...(galleryImages.length > 0 ? [{ id: "gallery", label: t("gallery") }] : []),
    ...(showAmenities ? [{ id: "amenities", label: t("amenities") }] : []),
    { id: "location", label: td("location") },
    { id: "reviews", label: t("reviews") },
  ];

  const googleMapsHref = resolveMapsUrl(service.coords, service.mapsUrl);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FlowerShop",
    name: FLOWERS_DISPLAY_NAME,
    description: service.description ?? undefined,
    image: coverImage,
    telephone: service.phone ?? undefined,
    ...(service.reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: service.rating, reviewCount: service.reviewCount } }
      : {}),
  };

  return (
    <PartnerThemeScope theme={partnerTheme}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      {/* Single crumb, not "Flowers > {name}" — there's no /flowers index
         page (out of scope; this listing links to Lavender Café directly
         instead, see the cross-link button below), so a leading "Flowers"
         entry would just be a second dead link to the same broken route.
         Breadcrumbs already renders a lone/last item as plain, non-clickable
         text — exactly the "current page" treatment wanted here. */}
      <Breadcrumbs items={[{ label: FLOWERS_DISPLAY_NAME, href: `/${locale}/flowers/${service.slug}` }]} />

      {partnerTheme && <PartnerHeroBanner theme={partnerTheme} alt={FLOWERS_DISPLAY_NAME} locale={locale} />}

      <HotelHeaderTop
        logo={serviceLogo}
        name={FLOWERS_DISPLAY_NAME}
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
        {servicePhone && (
          <SecondaryButton href={`tel:${servicePhone}`} size="sm">
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
        instagram={service.socialInstagram ?? sisterCafe?.socialInstagram}
        facebook={service.socialFacebook ?? sisterCafe?.socialFacebook}
        tiktok={service.socialTiktok ?? sisterCafe?.socialTiktok}
        snapchat={service.socialSnapchat ?? sisterCafe?.socialSnapchat}
        x={service.socialX ?? sisterCafe?.socialX}
        youtube={service.socialYoutube ?? sisterCafe?.socialYoutube}
        telegram={service.socialTelegram ?? sisterCafe?.socialTelegram}
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

      {/* Trust strip — small, factual credibility signals, each gated on a
         real condition already computed above (isPartner, WhatsApp
         availability). Nothing here is invented; delivery is the same real
         claim already carried by ProductsSection's deliveryEnabled + the
         existing "offerDelivery" copy used in the offer grid below. */}
      <div className="container-px mx-auto mt-5 flex flex-wrap items-center justify-center gap-2.5">
        {service.isPartner && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/[0.06] px-3.5 py-1.5 text-xs font-semibold text-primary-800 dark:border-primary/30 dark:bg-primary/15 dark:text-primary-300">
            <ShieldCheck size={13} className="shrink-0" aria-hidden="true" />
            {tpa("badgeLabel")}
          </span>
        )}
        {serviceWhatsappHref && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3.5 py-1.5 text-xs font-semibold text-ink/75 dark:border-white/10 dark:bg-white/[0.04] dark:text-sand/75">
            <WhatsAppIcon size={13} className="shrink-0 text-primary" aria-hidden="true" />
            {td("trustDirectWhatsapp")}
          </span>
        )}
        <span className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 bg-white px-3.5 py-1.5 text-xs font-semibold text-ink/75 dark:border-white/10 dark:bg-white/[0.04] dark:text-sand/75">
          <Truck size={13} className="shrink-0 text-primary" aria-hidden="true" />
          {td("offerDelivery")}
        </span>
      </div>

      {/* FLOWERS / BOUQUETS / GIFTS — the main offering, promoted above the
          generic gallery (same real 12-item rose/bouquet catalog + real
          verified add-ons, just moved so it's the star instead of
          something below Overview/a photo slider). */}
      {showProducts && (
        <Reveal>
          <section
            id="shop"
            aria-labelledby="shop-heading"
            className="scroll-mt-36 border-t border-ink/8 bg-gradient-to-b from-primary/[0.04] to-transparent py-14 dark:border-white/10 sm:py-20"
          >
            <div className="container-px mx-auto">
              <div className="mx-auto mb-8 max-w-2xl text-center">
                <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-primary">
                  {td("eyebrowCollection")}
                </span>
                <h2 id="shop-heading" className="font-display text-2xl font-semibold sm:text-3xl">
                  {td("flowersAndBouquets")}
                </h2>
                <p className="mt-3 text-sm text-ink/60 dark:text-sand/60 sm:text-base">{td("roseCollectionSubtitle")}</p>
              </div>
              <ProductsSection
                products={products}
                storeName={FLOWERS_DISPLAY_NAME}
                business={{
                  listingType: "city_service",
                  listingId: service.id,
                  businessName: FLOWERS_DISPLAY_NAME,
                  deliveryEnabled: true,
                  addons: sisterCafe?.flowerAddons ?? [],
                  whatsapp: serviceWhatsapp,
                }}
                locale={locale}
              />
            </div>
          </section>
        </Reveal>
      )}

      {coverImage && (
        <HotelGallerySlider cover={coverImage} images={galleryImages} alt={FLOWERS_DISPLAY_NAME} productOriented />
      )}

      <div className="mt-8">
        <HotelNavTabs tabs={navTabs} />
      </div>

      <div className="container-px mx-auto grid gap-10 py-10 lg:grid-cols-3 lg:gap-12">
        <div className="space-y-14 lg:col-span-2">
          {service.description && (
            <Reveal>
              <PremiumPartnerStory
                eyebrow={td("eyebrowAbout")}
                title={td("overview")}
                description={service.description}
                highlightsLabel={td("whatWeOfferTitle")}
                highlights={[
                  { icon: Flower2, label: td("offerFreshBouquets") },
                  { icon: Gift, label: td("offerGiftFlowers") },
                  { icon: Package, label: td("offerBoxedArrangements") },
                  { icon: Truck, label: td("offerDelivery") },
                ]}
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

          {showAmenities && (
            <Reveal>
              <section id="amenities" aria-labelledby="amenities-heading" className="scroll-mt-36">
                <h2 id="amenities-heading" className="mb-5 font-display text-2xl font-semibold">
                  {t("amenities")}
                </h2>
                <AmenitiesSection amenities={service.amenitiesV2} />
              </section>
            </Reveal>
          )}

          <LocationMapSection locale={locale} address={LAVENDER_FLOWERS_ADDRESS[locale]} coords={service.coords} mapsHref={googleMapsHref} name={service.name} />

          <Reveal>
            <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-36">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-primary">
                {td("eyebrowReviews")}
              </span>
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
            addLabel={tl("addToFavorites", { name: FLOWERS_DISPLAY_NAME })}
            removeLabel={tl("removeFromFavorites", { name: FLOWERS_DISPLAY_NAME })}
          />
          <SecondaryButton href={`/${locale}/cafes/lavender`} className="w-full justify-center">
            {td("visitLavenderCafe")}
          </SecondaryButton>
        </aside>
      </div>

      {showProducts && partnerTheme && (
        <PremiumPartnerCTA
          theme={partnerTheme}
          icon={Flower2}
          badgeLabel={FLOWERS_DISPLAY_NAME}
          title={td("exploreFlowersCtaTitle")}
          subtitle={td("exploreFlowersCtaSubtitle")}
          primaryHref="#shop"
          primaryLabel={td("exploreFlowersButton")}
          secondaryHref={serviceWhatsappHref}
          secondaryLabel={serviceWhatsappHref ? th("whatsapp") : undefined}
          secondaryIcon={WhatsAppIcon}
          secondaryExternal
        />
      )}

      {/* Polished sister-listing cross-link — the two businesses share one
         physical shop but are now fully separate listings/ordering
         contexts; this is the "content" version of the quick action-row
         button above, matching the reciprocal card on the café page. */}
      <Reveal>
        <div className="container-px mx-auto pb-4">
          <div className="flex flex-col items-center justify-between gap-4 rounded-xl3 border border-ink/8 bg-white p-6 text-center shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-card dark:border-white/10 dark:bg-white/[0.03] sm:flex-row sm:text-start sm:p-8">
            <div>
              <h3 className="font-display text-lg font-semibold">{td("lookingForLavenderCafeTitle")}</h3>
              <p className="mt-1 text-sm text-ink/65 dark:text-sand/65">{td("lookingForLavenderCafeBody")}</p>
            </div>
            <PrimaryButton href={`/${locale}/cafes/lavender`} size="sm" className="shrink-0">
              {td("visitLavenderCafe")}
            </PrimaryButton>
          </div>
        </div>
      </Reveal>

      {nearbyPlaces.length > 0 && (
        <section className="border-t border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-white/[0.03] sm:py-20">
          <div className="container-px mx-auto">
            <Reveal>
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-primary">
                {td("eyebrowNearby")}
              </span>
              <h2 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">{tn("nearbyPlaces")}</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <NearbyListings listings={nearbyPlaces} locale={locale} distanceLabel={(km) => tn("distanceAway", { km })} />
            </Reveal>
          </div>
        </section>
      )}

      {/* Site-wide "become a partner" CTA — generic Go Hargeisa content, not
          specific to this partner — deliberately placed BEFORE the
          Partnership Footer so the branded "Go Hargeisa × Lavender Flowers"
          section stays the true final, page-specific section before the
          site footer (see partner-partnership-footer.tsx). */}
      <PartnerAcquisitionCta locale={locale} />

      {partnerTheme && <PartnerPartnershipFooter theme={partnerTheme} locale={locale} />}

      <MobileBookingBar
        listingType="city_service"
        listingId={service.id}
        name={FLOWERS_DISPLAY_NAME}
        phone={servicePhone}
        whatsappFallback={serviceWhatsapp}
        locale={locale}
      />
    </PartnerThemeScope>
  );
}
