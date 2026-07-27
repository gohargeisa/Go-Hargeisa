import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getRestaurants } from "@/lib/data/restaurants";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { PageHero } from "@/components/shared/page-hero";
import { ComingSoonSection } from "@/components/shared/coming-soon-section";
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
  // Never show mock/seed restaurants to visitors — only real, published
  // partner listings. When Supabase isn't connected there is no real data,
  // so the page renders the "Coming Soon" state instead of sample content.
  const restaurants = isSupabaseConfigured() ? await getRestaurants({ q: searchParams.q }) : [];
  const t = await getTranslations({ locale, namespace: "comingSoon" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  // "Coming soon" only applies when there are truly no listings yet — a
  // search that legitimately matches nothing should show a normal
  // no-results state (handled inside RestaurantsPageClient), not tell the
  // searching user the whole category doesn't exist.
  const showComingSoon = restaurants.length === 0 && !searchParams.q;

  return (
    <>
      <PageHero
  eyebrow={`🍽 ${tNav("restaurants")}`}
  title={t("restaurantsTitle")}
  image="/images/restaurants/sultan/hero.png"
/>

      {showComingSoon ? (
        <ComingSoonSection type="restaurant" locale={locale} />
      ) : (
        <RestaurantsPageClient locale={locale} initialRestaurants={restaurants} searchParams={searchParams} />
      )}
    </>
  );
}