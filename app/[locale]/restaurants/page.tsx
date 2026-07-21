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

  return (
    <>
      <PageHero
        eyebrow="🍽 Restaurants"
        title="Discover Hargeisa's Best Restaurants"
        image="/images/restaurants/sultan/hero.jpeg"
      />

      <section className="container-px mx-auto py-14">
        <SearchWithin
          basePath={`/${locale}/restaurants`}
          placeholder="Search restaurants or cuisine..."
          defaultValue={searchParams.q}
        />

        {restaurants.length > 0 && (
          <div className="mt-12 mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Featured Restaurants
              </h2>

              <p className="mt-2 max-w-2xl text-muted-foreground">
                Explore authentic Somali cuisine, grilled specialties,
                international flavors and the highest-rated restaurants in
                Hargeisa.
              </p>
            </div>

            <div className="rounded-full bg-emerald-100 px-4 py-2 text-sm font-semibold text-emerald-700">
              {restaurants.length} Restaurant
              {restaurants.length > 1 ? "s" : ""}
            </div>
          </div>
        )}

        {restaurants.length === 0 ? (
          <p className="mt-10 text-center text-ink/50 dark:text-sand/50">
            {common("noResults")}
          </p>
        ) : (
          <div className="mt-8 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {restaurants.map((r) => (
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
        )}
      </section>
    </>
  );
}