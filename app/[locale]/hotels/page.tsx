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

  // Sort: featured first, then by rating
  const sortedHotels = hotels.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return b.rating - a.rating;
  });

  return (
    <>
      <PageHero
        eyebrow="Stay"
        title={t("hotelsTitle")}
        subtitle={t("hotelsSubtitle")}
        image="/images/heroes/hotels-hero.png"
      />

      <section className="container-px mx-auto py-10 md:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">
              {hotels.length} Hotels
            </h2>
            <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
              {searchParams.q ? `Results for "${searchParams.q}"` : "Browse all hotels in Hargeisa"}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <SearchWithin
            basePath={`/${locale}/hotels`}
            placeholder="Search hotels by name or area…"
            defaultValue={searchParams.q}
          />
        </div>

        {hotels.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-ink/20 bg-ink/5 p-12 text-center dark:border-white/20 dark:bg-white/[0.02]">
            <h3 className="font-display text-lg font-semibold">No hotels found</h3>
            <p className="mt-2 text-sm text-ink/60 dark:text-sand/60">
              {searchParams.q ? "Try adjusting your search" : "Check back soon for more hotels"}
            </p>
          </div>
        ) : (
          <div className="mt-10">
            {/* Featured Hotels Section */}
            {sortedHotels.some((h) => h.featured) && (
              <div className="mb-12">
                <div className="mb-6">
                  <h3 className="font-display text-xl font-bold">⭐ Featured Hotels</h3>
                  <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">Our top-rated properties</p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {sortedHotels
                    .filter((h) => h.featured)
                    .map((h) => (
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
                        tag="Featured"
                      />
                    ))}
                </div>
              </div>
            )}

            {/* All Hotels Section */}
            {sortedHotels.some((h) => !h.featured) && (
              <div>
                <div className="mb-6">
                  <h3 className="font-display text-xl font-bold">All Hotels</h3>
                  <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
                    {sortedHotels.filter((h) => !h.featured).length} available properties
                  </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {sortedHotels
                    .filter((h) => !h.featured)
                    .map((h) => (
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
              </div>
            )}
          </div>
        )}
      </section>
    </>
  );
}