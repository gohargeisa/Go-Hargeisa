import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getDestinations } from "@/lib/data/destinations";
import { getHotels } from "@/lib/data/hotels";
import { getRestaurants } from "@/lib/data/restaurants";
import { getCafes } from "@/lib/data/cafes";
import { getAttractions } from "@/lib/data/attractions";
import { getEvents } from "@/lib/data/events";
import { getArticles } from "@/lib/data/articles";
import { getMapPoints } from "@/lib/data/map-points";
import { Hero } from "@/components/home/hero";
import { TrustBar } from "@/components/home/trust-bar";
import { DestinationsSection } from "@/components/home/destinations-section";
import { ListingRowSection } from "@/components/home/listing-row-section";
import { EventsSection } from "@/components/home/events-section";
import { ExperiencesSection } from "@/components/home/experiences-section";
import { FeaturedSection } from "@/components/home/featured-section";
import { ArticlesSection } from "@/components/home/articles-section";
import { MapSection } from "@/components/home/map-section";
import { NewsletterSection } from "@/components/home/newsletter-section";

// Public content changes infrequently; revalidate hourly instead of
// rendering on every request (this page no longer reads cookies, so
// it's eligible for static generation + ISR).
export const revalidate = 3600;

export default async function HomePage({ params: { locale } }: { params: { locale: Locale } }) {
  const t = await getTranslations("home");

  // Fetched in parallel — each function hits Supabase when configured and
  // transparently falls back to lib/mock-data.ts otherwise (see lib/data/*).
  const [destinations, hotels, restaurants, cafes, attractions, events, articles, mapPoints] = await Promise.all([
    getDestinations(),
    getHotels(),
    getRestaurants(),
    getCafes(),
    getAttractions(),
    getEvents(),
    getArticles(),
    getMapPoints(),
  ]);

  const featured = [
    ...hotels.filter((h) => h.featured).map((h) => ({ ...h, kind: "hotels" as const })),
    ...restaurants.filter((r) => r.featured).map((r) => ({ ...r, kind: "restaurants" as const })),
    ...cafes.filter((c) => c.featured).map((c) => ({ ...c, kind: "cafes" as const })),
    ...attractions.filter((a) => a.featured).map((a) => ({ ...a, kind: "attractions" as const })),
  ].map((item) => ({
    href: `/${locale}/${item.kind}/${item.slug}`,
    image: item.coverImage,
    name: item.name,
    category: item.shortDescription,
    rating: item.rating,
    reviewCount: item.reviewCount,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "TouristDestination",
            name: "Hargeisa",
            description:
              "Hargeisa, the capital of Somaliland — hotels, restaurants, attractions and travel guide.",
            url: `https://gohargeisa.com/${locale}`,
          }),
        }}
      />

      <Hero locale={locale} />
      <TrustBar />

      <DestinationsSection destinations={destinations} locale={locale} />

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

      <ListingRowSection
        eyebrow="See"
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
          tag: a.entryFee === "Free" ? "Free entry" : undefined,
        }))}
      />

      <EventsSection events={events} locale={locale} />
      <ExperiencesSection />
      <FeaturedSection items={featured} locale={locale} />
      <ArticlesSection articles={articles} locale={locale} />
      <MapSection points={mapPoints} />
      <NewsletterSection locale={locale} />
    </>
  );
}
