import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";

import { getHotels } from "@/lib/data/hotels";
import { getRestaurants } from "@/lib/data/restaurants";
import { getCafes } from "@/lib/data/cafes";
import { getEvents } from "@/lib/data/events";

import { Hero } from "@/components/home/hero";
import { TrustBar } from "@/components/home/trust-bar";
import { ListingRowSection } from "@/components/home/listing-row-section";
import { EventsSection } from "@/components/home/events-section";
import { NewsletterSection } from "@/components/home/newsletter-section";

export const revalidate = 3600;

export default async function HomePage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const t = await getTranslations("home");
  
  const [hotels, restaurants, cafes, events] = await Promise.all([
    getHotels(),
    getRestaurants(),
    getCafes(),
    getEvents(),
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
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <span className="inline-flex rounded-full bg-emerald-100 px-4 py-1 text-sm font-semibold text-emerald-700">
            {t("aboutBadge")}
          </span>

          <h2 className="mt-6 text-4xl font-bold tracking-tight text-slate-900 md:text-5xl">
            {t("aboutTitle")}
          </h2>

          <p className="mt-8 text-lg leading-8 text-slate-600">
            {t("aboutDescription1")}
          </p>

          <p className="mt-6 text-lg leading-8 text-slate-600">
            {t("aboutDescription2")}
          </p>
        </div>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-lg">
            <div className="mb-4 text-4xl">🏨</div>

            <h3 className="text-xl font-semibold">
              {t("exploreTitle")}
            </h3>

            <p className="mt-4 leading-7 text-slate-600">
              {t("exploreDescription")}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-lg">
            <div className="mb-4 text-4xl">❤️</div>

            <h3 className="text-xl font-semibold">
              {t("saveTitle")}
            </h3>

            <p className="mt-4 leading-7 text-slate-600">
              {t("saveDescription")}
            </p>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-lg">
            <div className="mb-4 text-4xl">⭐</div>

            <h3 className="text-xl font-semibold">
              {t("shareTitle")}
            </h3>

            <p className="mt-4 leading-7 text-slate-600">
              {t("shareDescription")}
            </p>
          </div>
        </div>

        
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

      <ListingRowSection
        eyebrow="Sip"
        title={t("cafesTitle")}
        tone="white"
        viewAllHref={`/${locale}/cafes`}
        viewAllLabel={t("viewAll")}
        items={cafes.map((c) => ({
          href: `/${locale}/cafes/${c.slug}`,
          image: c.coverImage,
          title: c.name,
          subtitle: c.address,
          rating: c.rating,
          reviewCount: c.reviewCount,
          tag: c.wifi ? "Free WiFi" : undefined,
        }))}
      />

      <EventsSection
        events={events}
        locale={locale}
      />

      <NewsletterSection locale={locale} />
    </>
  );
}