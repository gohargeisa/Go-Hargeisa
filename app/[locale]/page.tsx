import { safeJsonLd } from "@/lib/utils/json-ld";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";

import { getHotels } from "@/lib/data/hotels";
import { getRestaurants } from "@/lib/data/restaurants";
import { getCafes } from "@/lib/data/cafes";
import { RESTAURANTS_PUBLIC_ENABLED, CAFES_PUBLIC_ENABLED, filterHotelsForPresentation } from "@/lib/config/features";

import { getLatestAnnouncement } from "@/lib/data/announcements";
import { getFeaturedOffersForHomepage } from "@/lib/data/offers";
import { getFeaturedPartnerShowcase } from "@/lib/data/featured-partner-showcase";
import { getCityServiceCategoryCounts } from "@/lib/data/city-services";
import { getVisibleCategoriesWithCounts } from "@/lib/data/categories";
import { Hero } from "@/components/home/hero";
import { SplashScreenOverlay } from "@/components/shared/splash-overlay";
import { OfferCard } from "@/components/home/offer-card";
import { AnnouncementBanner } from "@/components/home/announcement-banner";
import { FeaturedPartnersShowcase } from "@/components/home/featured-partners-showcase";
import { FlormarComingSoonBanner } from "@/components/home/flormar-coming-soon-banner";
import { AppPromotionSection } from "@/components/home/app-promotion-section";
import { ExploreHargeisaSection } from "@/components/home/explore-hargeisa-section";
import { NewsletterSection } from "@/components/home/newsletter-section";
import { Reveal } from "@/components/home/reveal";
import { ScrollRow } from "@/components/shared/scroll-row";
import { PremiumHotelCard } from "@/components/home/premium-hotel-card";
import { PremiumRestaurantCard } from "@/components/home/premium-restaurant-card";
import { PremiumCafeCard } from "@/components/home/premium-cafe-card";
import { ViewAllButton } from "@/components/home/view-all-button";

export const revalidate = 3600;

// Homepage preview sections show a fixed handful of cards each — the full
// database is untouched, only fetched at this cap (rather than fetching
// everything and slicing) so the homepage doesn't pull the entire table
// just to show 3 rows. The real listing pages (/hotels, /restaurants,
// /cafes) call the same functions with no limit and show everything.
const HOMEPAGE_PREVIEW_COUNT = 3;

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const t = await getTranslations("home");

  const [hotelsRaw, restaurants, cafes, announcement, featuredOffers, featuredPartners, cityServiceCategoryCounts, categories] =
    await Promise.all([
      getHotels({ limit: HOMEPAGE_PREVIEW_COUNT }),
      RESTAURANTS_PUBLIC_ENABLED ? getRestaurants({ limit: HOMEPAGE_PREVIEW_COUNT }) : Promise.resolve([]),
      CAFES_PUBLIC_ENABLED ? getCafes({ limit: HOMEPAGE_PREVIEW_COUNT, locale }) : Promise.resolve([]),
      getLatestAnnouncement(),
      getFeaturedOffersForHomepage(),
      getFeaturedPartnerShowcase(locale),
      getCityServiceCategoryCounts(),
      getVisibleCategoriesWithCounts(),
    ]);
  const hotels = filterHotelsForPresentation(hotelsRaw);

  // The homepage's "City Services" section shows every non-hotel/restaurant/
  // cafe category as its own premium card — both the literal city_services
  // sub-categories (Hospitals, Pharmacies, ...) and the separate
  // services-vertical categories (Real Estate, Apartments, ...). Both lists
  // are already fetched above with counts populated — no new query needed.
  const serviceVerticalCategories = categories.filter((c) => c.targetTable === "services");
  const cityServicesShowcaseCategories = [
    ...serviceVerticalCategories,
    ...cityServiceCategoryCounts.map(({ category, count }) => ({ ...category, businessCount: count })),
  ].sort((a, b) => a.sortOrder - b.sortOrder);

  return (
    <>
      <SplashScreenOverlay />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: safeJsonLd({
            "@context": "https://schema.org",
            "@type": "TouristDestination",
            name: "Go Hargeisa",
            description:
              "Go Hargeisa is a travel and city guide platform for Hargeisa, Somaliland. Discover hotels, restaurants, cafés, tourist attractions, shopping, local experiences and travel information. Users can securely sign in with Google to save favourites, write reviews and manage their travel profile.",
            url: `https://gohargeisa.com/${locale}`,
          }),
        }}
      />

      {announcement && <AnnouncementBanner announcement={announcement} />}

      <Hero locale={locale} />

      <FlormarComingSoonBanner locale={locale} />

      <FeaturedPartnersShowcase partners={featuredPartners} locale={locale} />

      <AppPromotionSection locale={locale} previewHotel={hotels[0]} />

      {featuredOffers.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container-px mx-auto">
            <Reveal>
              <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary-800">
                  {t("offersEyebrow")}
                </span>
                <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
                  {t("offersTitle")}
                </h2>
                <p className="mt-2 text-ink/60 dark:text-sand/60">{t("offersSubtitleHome")}</p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <ScrollRow>
                {featuredOffers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} locale={locale} />
                ))}
              </ScrollRow>
            </Reveal>
          </div>
        </section>
      )}

      {hotels.length > 0 && (
        <section className="bg-white py-16 dark:bg-white/[0.03] md:py-24">
          <div className="container-px mx-auto">
            <Reveal>
              <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary-800">
                  {t("hotelsEyebrow")}
                </span>
                <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
                  {t("hotelsTitle")}
                </h2>
                <p className="mt-2 text-ink/60 dark:text-sand/60">{t("hotelsSubtitle")}</p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {hotels.map((h) => (
                  <PremiumHotelCard
                    key={h.id}
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
                ))}
              </div>
            </Reveal>
            <ViewAllButton href={`/${locale}/hotels`} label={t("viewAllHotelsButton")} />
          </div>
        </section>
      )}

      {restaurants.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container-px mx-auto">
            <Reveal>
              <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary-800">
                  {t("restaurantsEyebrow")}
                </span>
                <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
                  {t("restaurantsTitle")}
                </h2>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {restaurants.map((r) => (
                  <PremiumRestaurantCard
                    key={r.id}
                    href={`/${locale}/restaurants/${r.slug}`}
                    image={r.coverImage}
                    name={r.name}
                    address={r.address}
                    rating={r.rating}
                    reviewCount={r.reviewCount}
                    priceRange={r.priceRange}
                    cuisine={r.cuisine}
                    featured={r.featured}
                    reservable={r.reservable}
                    restaurantId={r.id}
                    locale={locale}
                    website={r.website}
                    phone={r.phone}
                  />
                ))}
              </div>
            </Reveal>
            <ViewAllButton href={`/${locale}/restaurants`} label={t("viewAllRestaurantsButton")} />
          </div>
        </section>
      )}

      {cafes.length > 0 && (
        <section className="bg-white py-16 dark:bg-white/[0.03] md:py-24">
          <div className="container-px mx-auto">
            <Reveal>
              <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary-800">
                  {t("cafesEyebrow")}
                </span>
                <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
                  {t("cafesTitle")}
                </h2>
                <p className="mt-2 text-ink/60 dark:text-sand/60">{t("cafesSubtitle")}</p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {cafes.map((c) => (
                  <PremiumCafeCard
                    key={c.id}
                    href={`/${locale}/cafes/${c.slug}`}
                    image={c.coverImage}
                    name={c.name}
                    address={c.address}
                    rating={c.rating}
                    reviewCount={c.reviewCount}
                    specialDrinks={c.specialDrinks}
                    wifi={c.wifi}
                    workingSpace={c.workingSpace}
                    featured={c.featured}
                    cafeId={c.id}
                    locale={locale}
                    phone={c.phone}
                  />
                ))}
              </div>
            </Reveal>
            <ViewAllButton href={`/${locale}/cafes`} label={t("viewAllCafesButton")} />
          </div>
        </section>
      )}

      <ExploreHargeisaSection locale={locale} categories={cityServicesShowcaseCategories} />

      <NewsletterSection locale={locale} />
    </>
  );
}
