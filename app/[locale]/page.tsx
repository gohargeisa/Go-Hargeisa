import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";

import { getHotels } from "@/lib/data/hotels";
import { getRestaurants } from "@/lib/data/restaurants";
import { getAttractions } from "@/lib/data/attractions";

import { Hero } from "@/components/home/hero";
import { TrustBar } from "@/components/home/trust-bar";
import { ListingRowSection } from "@/components/home/listing-row-section";
import { CafesComingSoonSection } from "@/components/home/cafes-coming-soon-section";
import { NewsletterSection } from "@/components/home/newsletter-section";
import { Reveal } from "@/components/home/reveal";

export const revalidate = 3600;

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const t = await getTranslations("home");

  const [hotels, restaurants, attractions] = await Promise.all([
    getHotels(),
    getRestaurants(),
    getAttractions(),
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

      <ListingRowSection
        eyebrow="Stay"
        title={t("hotelsTitle")}
        subtitle={t("hotelsSubtitle")}
        viewAllHref={`/${locale}/hotels`}
        viewAllLabel={t("viewAll")}
        tone="white"
        items={hotels.map((h) => ({
          href: `/${locale}/hotels/${h.slug}`,
          image: h.coverImage,
          title: h.name,
          subtitle: h.address,
          rating: h.rating,
          reviewCount: h.reviewCount,
          priceRange: h.priceRange,
        }))}
      />

      <ListingRowSection
        eyebrow="Eat"
        title={t("restaurantsTitle")}
        viewAllHref={`/${locale}/restaurants`}
        viewAllLabel={t("viewAll")}
        items={restaurants.map((r) => ({
          href: `/${locale}/restaurants/${r.slug}`,
          image: r.coverImage,
          title: r.name,
          subtitle: r.cuisine.join(" · "),
          rating: r.rating,
          reviewCount: r.reviewCount,
          priceRange: r.priceRange,
        }))}
      />

      <CafesComingSoonSection locale={locale} />

      <ListingRowSection
        eyebrow="Discover"
        title={t("attractionsTitle")}
        viewAllHref={`/${locale}/attractions`}
        viewAllLabel={t("viewAll")}
        items={attractions.map((a) => ({
          href: `/${locale}/attractions/${a.slug}`,
          image: a.coverImage,
          title: a.name,
          subtitle: a.address,
          rating: a.rating,
          reviewCount: a.reviewCount,
        }))}
      />

      <NewsletterSection locale={locale} />
    </>
  );
}