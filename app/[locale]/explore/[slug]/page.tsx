import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getDestinationBySlug, getDestinations } from "@/lib/data/destinations";
import { getHotels } from "@/lib/data/hotels";
import { getRestaurants } from "@/lib/data/restaurants";
import { getAttractions } from "@/lib/data/attractions";
import { ListingCard } from "@/components/shared/listing-card";
import { HotelCard } from "@/components/shared/hotel-card";
import { PremiumPageHero } from "@/components/shared/premium-page-hero";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Reveal } from "@/components/home/reveal";
import { RESTAURANTS_PUBLIC_ENABLED, filterHotelsForPresentation } from "@/lib/config/features";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";

// Public content changes infrequently; revalidate hourly instead of
// rendering on every request (this page no longer reads cookies, so
// it's eligible for static generation + ISR).
export const revalidate = 3600;

export async function generateStaticParams() {
  const destinations = await getDestinations();
  return destinations.map((d) => ({ slug: d.slug }));
}

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}): Promise<Metadata> {
  const destination = await getDestinationBySlug(slug);

  if (!destination) return {};

  return {
    title: `${destination.name} — Explore Hargeisa`,
    description: destination.description,
    alternates: localeAlternates(locale as Locale, `/explore/${destination.slug}`),
  };
}

export default async function DestinationDetailPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  const destination = await getDestinationBySlug(slug);
  if (!destination) notFound();

  const tExplore = await getTranslations("explore");
  const tNav = await getTranslations("nav");

  const [hotelsRaw, restaurants, attractions] = await Promise.all([
    getHotels(),
    RESTAURANTS_PUBLIC_ENABLED ? getRestaurants() : Promise.resolve([]),
    getAttractions(),
  ]);
  const hotels = filterHotelsForPresentation(hotelsRaw);

  return (
    <>
      <Breadcrumbs
        items={[
          { label: tNav("explore"), href: `/${locale}/explore` },
          { label: destination.name, href: `/${locale}/explore/${destination.slug}` },
        ]}
      />

      <PremiumPageHero
        image={destination.image}
        imageAlt={destination.name}
        eyebrow={tExplore("eyebrow")}
        title={destination.name}
        subtitle={destination.description}
        scrollHint={tExplore("scrollHint")}
      />

      <section className="container-px mx-auto py-16 md:py-24 space-y-14">
        <Reveal>
          <div>
            <h2 className="mb-5 font-display text-2xl font-semibold">{tExplore("hotelsNearby")}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {hotels.slice(0, 3).map((h) => (
                <HotelCard
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
          </div>
        </Reveal>

        {restaurants.length > 0 && (
          <Reveal>
            <div>
              <h2 className="mb-5 font-display text-2xl font-semibold">{tExplore("placesToEat")}</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {restaurants.slice(0, 3).map((r) => (
                  <ListingCard key={r.id} href={`/${locale}/restaurants/${r.slug}`} image={r.coverImage} title={r.name} subtitle={r.cuisine.join(" · ")} rating={r.rating} reviewCount={r.reviewCount} priceRange={r.priceRange} />
                ))}
              </div>
            </div>
          </Reveal>
        )}

        <Reveal>
          <div>
            <h2 className="mb-5 font-display text-2xl font-semibold">{tExplore("thingsToSee")}</h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {attractions.slice(0, 3).map((a) => (
                <ListingCard key={a.id} href={`/${locale}/attractions/${a.slug}`} image={a.coverImage} title={a.name} subtitle={a.address} rating={a.rating} reviewCount={a.reviewCount} />
              ))}
            </div>
          </div>
        </Reveal>
      </section>
    </>
  );
}
