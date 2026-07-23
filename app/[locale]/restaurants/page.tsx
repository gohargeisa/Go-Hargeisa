import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getRestaurants } from "@/lib/data/restaurants";
import { ListingCard } from "@/components/shared/listing-card";
import { PageHero } from "@/components/shared/page-hero";
import { SearchWithin } from "@/components/shared/search-within";

export const revalidate = 3600;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Restaurants in Hargeisa — Where to Eat",
    description:
      "Discover the best restaurants in Hargeisa: Somali cuisine, Arabic food and international dining.",
    alternates: {
      canonical: `/${locale}/restaurants`,
    },
  };
}

export default async function RestaurantsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { q?: string };
}) {
  const common = await getTranslations("common");
  const restaurants = await getRestaurants({ q: searchParams.q });

  // Sort: featured first, then by rating
  const sortedRestaurants = restaurants.sort((a, b) => {
    if (a.featured && !b.featured) return -1;
    if (!a.featured && b.featured) return 1;
    return b.rating - a.rating;
  });

  return (
    <>
      <PageHero
        eyebrow="🍽 Restaurants"
        title="Discover Hargeisa's Best Restaurants"
        image="/images/restaurants/sultan/hero.jpeg"
      />

      <section className="container-px mx-auto py-10 md:py-14">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">
              {restaurants.length} Restaurants
            </h2>
            <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
              {searchParams.q ? `Results for "${searchParams.q}"` : "Browse all restaurants in Hargeisa"}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <SearchWithin
            basePath={`/${locale}/restaurants`}
            placeholder="Search restaurants or cuisine..."
            defaultValue={searchParams.q}
          />
        </div>

        {restaurants.length === 0 ? (
          <div className="mt-12 rounded-2xl border border-dashed border-ink/20 bg-ink/5 p-12 text-center dark:border-white/20 dark:bg-white/[0.02]">
            <h3 className="font-display text-lg font-semibold">No restaurants found</h3>
            <p className="mt-2 text-sm text-ink/60 dark:text-sand/60">
              {searchParams.q ? "Try adjusting your search" : "Check back soon for more restaurants"}
            </p>
          </div>
        ) : (
          <div className="mt-10">
            {/* Featured Restaurants Section */}
            {sortedRestaurants.some((r) => r.featured) && (
              <div className="mb-12">
                <div className="mb-6">
                  <h3 className="font-display text-xl font-bold">⭐ Featured Restaurants</h3>
                  <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">Our top-rated dining experiences</p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {sortedRestaurants
                    .filter((r) => r.featured)
                    .map((r) => (
                      <ListingCard
                        key={r.id}
                        href={`/${locale}/restaurants/${r.slug}`}
                        image={r.coverImage}
                        title={r.name}
                        subtitle={r.cuisine.join(" • ")}
                        rating={r.rating}
                        reviewCount={r.reviewCount}
                        listingType="restaurant"
                        listingId={r.id}
                        locale={locale}
                        priceRange={r.priceRange}
                        tag="Featured"
                      />
                    ))}
                </div>
              </div>
            )}

            {/* All Restaurants Section */}
            {sortedRestaurants.some((r) => !r.featured) && (
              <div>
                <div className="mb-6">
                  <h3 className="font-display text-xl font-bold">All Restaurants</h3>
                  <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
                    {sortedRestaurants.filter((r) => !r.featured).length} available restaurants
                  </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {sortedRestaurants
                    .filter((r) => !r.featured)
                    .map((r) => (
                      <ListingCard
                        key={r.id}
                        href={`/${locale}/restaurants/${r.slug}`}
                        image={r.coverImage}
                        title={r.name}
                        subtitle={r.cuisine.join(" • ")}
                        rating={r.rating}
                        reviewCount={r.reviewCount}
                        listingType="restaurant"
                        listingId={r.id}
                        locale={locale}
                        priceRange={r.priceRange}
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