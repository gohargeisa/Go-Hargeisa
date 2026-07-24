import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getRestaurants } from "@/lib/data/restaurants";
import { PageHero } from "@/components/shared/page-hero";
import { RestaurantsPageClient } from "@/components/pages/restaurants-page-client";

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
  searchParams: { q?: string; minPrice?: string; maxPrice?: string; minRating?: string; sortBy?: string; cuisine?: string };
}) {
  const restaurants = await getRestaurants({ q: searchParams.q });

  return (
    <>
      <PageHero
  eyebrow="🍽 Restaurants"
  title="Discover Hargeisa's Best Restaurants"
  image="/images/restaurants/sultan/hero.png"
/>

      <RestaurantsPageClient locale={locale} initialRestaurants={restaurants} searchParams={searchParams} />
    </>
  );
}