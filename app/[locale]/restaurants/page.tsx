import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getRestaurants } from "@/lib/data/restaurants";
import { ListingCard } from "@/components/shared/listing-card";
import { PageHero } from "@/components/shared/page-hero";
import { SearchWithin } from "@/components/shared/search-within";
import { placeholderImage } from "@/lib/placeholder-image";

// Public content changes infrequently; revalidate hourly instead of
// rendering on every request (this page no longer reads cookies, so
// it's eligible for static generation + ISR).
export const revalidate = 3600;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Restaurants in Hargeisa — Where to Eat",
  description: "Discover the best restaurants in Hargeisa: Somali grill houses, cafes and international dining.",
    alternates: { canonical: `/${locale}/restaurants` },
  };
}

export default async function RestaurantsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { q?: string };
}) {
  const t = await getTranslations("home");
  const common = await getTranslations("common");
  const restaurants = await getRestaurants({ q: searchParams.q });

  return (
    <>
      <PageHero
        eyebrow="Eat"
        title={t("restaurantsTitle")}
        image={placeholderImage("Restaurants in Hargeisa", { tone: "secondary" })}
      />
      <section className="container-px mx-auto py-14">
        <SearchWithin basePath={`/${locale}/restaurants`} placeholder="Search restaurants or cuisine…" defaultValue={searchParams.q} />

        {restaurants.length === 0 ? (
          <p className="mt-10 text-center text-ink/50 dark:text-sand/50">{common("noResults")}</p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((r) => (
              <ListingCard
                key={r.id}
                href={`/${locale}/restaurants/${r.slug}`}
                image={r.coverImage}
                title={r.name}
                subtitle={r.cuisine.join(" · ")}
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
