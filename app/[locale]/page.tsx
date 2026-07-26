import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";

import { getHotels } from "@/lib/data/hotels";
import { getRestaurants } from "@/lib/data/restaurants";
import { getAttractions } from "@/lib/data/attractions";
import { getCityServicePoints } from "@/lib/data/map-points";

import { Hero } from "@/components/home/hero";
import { TrustBar } from "@/components/home/trust-bar";
import { CafesComingSoonSection } from "@/components/home/cafes-coming-soon-section";
import { ExploreHargeisaSection } from "@/components/home/explore-hargeisa-section";
import { NewsletterSection } from "@/components/home/newsletter-section";
import { Reveal } from "@/components/home/reveal";
import { ScrollRow } from "@/components/shared/scroll-row";
import { PremiumHotelCard } from "@/components/home/premium-hotel-card";
import { PremiumRestaurantCard } from "@/components/home/premium-restaurant-card";
import { PremiumAttractionCard } from "@/components/home/premium-attraction-card";

export const revalidate = 3600;

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const t = await getTranslations("home");

  const [hotels, restaurants, attractions, cityServicePoints] = await Promise.all([
    getHotels(),
    getRestaurants(),
    getAttractions(),
    getCityServicePoints(),
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TouristDestination",
            name: "Go Hargeisa",
            description:
              "Go Hargeisa is a travel and city guide platform for Hargeisa, Somaliland. Discover hotels, restaurants, cafés, tourist attractions, shopping, local experiences and travel information. Users can securely sign in with Google to save favourites, write reviews and manage their travel profile.",
            url: `https://gohargeisa.com/${locale}`,
          }),
        }}
      />

      <Hero locale={locale} />
      <TrustBar />

      {/* About Go Hargeisa */}
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8 md:py-28 lg:px-12">
        <Reveal>
          <div className="mx-auto max-w-5xl rounded-[32px] border border-primary/20 bg-gradient-to-br from-primary via-primary-700 to-secondary-800 p-8 shadow-2xl sm:p-12 md:p-16">
            <div className="text-center">
              <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                {t("aboutBadge")}
              </span>

              <h2 className="mt-6 text-balance font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-5xl">
                {t("aboutTitle")}
              </h2>

              <p className="mx-auto mt-6 max-w-3xl text-balance text-base leading-8 text-white/90 md:mt-8 md:text-lg md:leading-9">
                {t("aboutDescription1")}
              </p>
            </div>

            <div className="mt-12 grid gap-5 sm:grid-cols-3 md:mt-14 md:gap-6">
              {[
                { emoji: "🏨", titleKey: "exploreTitle", descKey: "exploreDescription", bg: "bg-amber-100 dark:bg-amber-400/15" },
                { emoji: "❤️", titleKey: "saveTitle", descKey: "saveDescription", bg: "bg-red-100 dark:bg-red-400/15" },
                { emoji: "⭐", titleKey: "shareTitle", descKey: "shareDescription", bg: "bg-yellow-100 dark:bg-yellow-400/15" },
              ].map(({ emoji, titleKey, descKey, bg }) => (
                <div
                  key={titleKey}
                  className="rounded-3xl bg-white p-6 shadow-lg transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl dark:bg-ink/90 dark:shadow-none sm:p-8"
                >
                  <div
                    className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl text-3xl ${bg}`}
                    aria-hidden="true"
                  >
                    {emoji}
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    {t(titleKey)}
                  </h3>

                  <p className="mt-4 leading-7 text-slate-600 dark:text-sand/70">
                    {t(descKey)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </section>

      {hotels.length > 0 && (
        <section className="bg-white py-16 dark:bg-white/[0.03] md:py-24">
          <div className="container-px mx-auto">
            <Reveal>
              <div className="mb-10 flex flex-col gap-5 md:mb-14 md:flex-row md:items-end md:justify-between">
                <div>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                    Stay
                  </span>
                  <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
                    {t("hotelsTitle")}
                  </h2>
                  <p className="mt-2 max-w-xl text-ink/60 dark:text-sand/60">{t("hotelsSubtitle")}</p>
                </div>
                <Link
                  href={`/${locale}/hotels`}
                  className="inline-flex items-center gap-2 self-start rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-white/20 dark:hover:border-primary dark:hover:bg-primary/10 md:self-auto"
                >
                  {t("viewAll")}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <ScrollRow>
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
              </ScrollRow>
            </Reveal>
          </div>
        </section>
      )}

      {restaurants.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container-px mx-auto">
            <Reveal>
              <div className="mb-10 flex flex-col gap-5 md:mb-14 md:flex-row md:items-end md:justify-between">
                <div>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                    Eat
                  </span>
                  <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
                    {t("restaurantsTitle")}
                  </h2>
                </div>
                <Link
                  href={`/${locale}/restaurants`}
                  className="inline-flex items-center gap-2 self-start rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-white/20 dark:hover:border-primary dark:hover:bg-primary/10 md:self-auto"
                >
                  {t("viewAll")}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <ScrollRow>
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
              </ScrollRow>
            </Reveal>
          </div>
        </section>
      )}

      <CafesComingSoonSection locale={locale} />

      {attractions.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container-px mx-auto">
            <Reveal>
              <div className="mb-10 flex flex-col gap-5 md:mb-14 md:flex-row md:items-end md:justify-between">
                <div>
                  <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                    Discover
                  </span>
                  <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
                    {t("attractionsTitle")}
                  </h2>
                </div>
                <Link
                  href={`/${locale}/attractions`}
                  className="inline-flex items-center gap-2 self-start rounded-full border border-ink/15 px-5 py-2.5 text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-white/20 dark:hover:border-primary dark:hover:bg-primary/10 md:self-auto"
                >
                  {t("viewAll")}
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <ScrollRow>
                {attractions.map((a) => (
                  <PremiumAttractionCard
                    key={a.id}
                    href={`/${locale}/attractions/${a.slug}`}
                    image={a.coverImage}
                    name={a.name}
                    address={a.address}
                    rating={a.rating}
                    reviewCount={a.reviewCount}
                    category={a.category}
                    shortDescription={a.shortDescription}
                    featured={a.featured}
                    attractionId={a.id}
                    locale={locale}
                  />
                ))}
              </ScrollRow>
            </Reveal>
          </div>
        </section>
      )}

      <ExploreHargeisaSection locale={locale} points={cityServicePoints} />

      <NewsletterSection locale={locale} />
    </>
  );
}