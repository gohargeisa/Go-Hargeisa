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
// Public content changes infrequently; revalidate hourly instead of
// rendering on every request (this page no longer reads cookies, so
// it's eligible for static generation + ISR).
export const revalidate = 3600;

export default async function HomePage({ params: { locale } }: { params: { locale: Locale } }) {
  const t = await getTranslations("home");

  // Fetched in parallel — each function hits Supabase when configured and
  // transparently falls back to lib/mock-data.ts otherwise (see lib/data/*).
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
            name: "Hargeisa",
            description:
              "Hargeisa, the capital of Somaliland — hotels, restaurants, attractions and travel guide.",
            url: `https://gohargeisa.com/${locale}`,
          }),
        }}
      />

      <Hero locale={locale} />
      <TrustBar />

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

      

      <EventsSection events={events} locale={locale} />
      
      
      
      
      <NewsletterSection locale={locale} />
    </>
  );
}
