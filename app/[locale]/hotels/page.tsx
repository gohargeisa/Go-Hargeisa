import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getHotels } from "@/lib/data/hotels";
import { ListingCard } from "@/components/shared/listing-card";
import { PageHero } from "@/components/shared/page-hero";
import { SearchWithin } from "@/components/shared/search-within";

// Public content changes infrequently; revalidate hourly instead of
// rendering on every request (this page no longer reads cookies, so
// it's eligible for static generation + ISR).
export const revalidate = 3600;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  return {
    title: "Hotels in Hargeisa — Where to Stay",
    description:
      "Browse the best hotels in Hargeisa, Somaliland, from business-friendly 4-star hotels to boutique stays. Prices, amenities, maps and reviews.",
    alternates: { canonical: `/${locale}/hotels` },
  };
}

export default async function HotelsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { q?: string };
}) {
  const t = await getTranslations("home");
  const common = await getTranslations("common");
  const hotels = await getHotels({ q: searchParams.q });

  return (
    <>
      <PageHero
        eyebrow="Stay"
        title={t("hotelsTitle")}
        subtitle={t("hotelsSubtitle")}
        image="/images/heroes/hotels-hero.png"
      />

      <section className="container-px mx-auto py-14">
        <SearchWithin
          basePath={`/${locale}/hotels`}
          placeholder="Search hotels by name or area…"
          defaultValue={searchParams.q}
        />

        {hotels.length === 0 ? (
          <p className="mt-10 text-center text-ink/50 dark:text-sand/50">
            {common("noResults")}
          </p>
        ) : (
          <>
            {/* Featured Header */}
            <div className="mt-12 mb-10 text-center">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-4 py-2 text-sm font-semibold text-primary">
                ⭐ Featured Hotel
              </span>

              <h2 className="mt-4 font-display text-4xl font-bold text-ink dark:text-sand">
                Our Verified Hotel Partner
              </h2>

              <p className="mt-3 text-lg text-ink/60 dark:text-sand/60">
                Carefully selected accommodation for visitors to Hargeisa.
              </p>
            </div>

            {/* Hotel Card */}
            <div className="flex justify-center">
              {hotels.map((h) => (
                <ListingCard
                  key={h.id}
                  href={`/${locale}/hotels/${h.slug}`}
                  image={h.coverImage}
                  title={h.name}
                  subtitle={h.address}
                  rating={h.rating}
                  reviewCount={h.reviewCount}
                  listingType="hotel"
                  listingId={h.id}
                  locale={locale}
                  priceRange={h.priceRange}
                />
              ))}
            </div>
          </>
        )}
      </section>
    </>
  );
}