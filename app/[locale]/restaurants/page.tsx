import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getRestaurants } from "@/lib/data/restaurants";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { PageHero } from "@/components/shared/page-hero";
import { ComingSoonSection } from "@/components/shared/coming-soon-section";
import { RestaurantsEmptyState } from "@/components/shared/restaurants-empty-state";
import { RestaurantsPageClient } from "@/components/pages/restaurants-page-client";
import { RESTAURANTS_PUBLIC_ENABLED } from "@/lib/config/features";

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
    alternates: localeAlternates(locale as Locale, "/restaurants"),
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
  // so the page renders an empty state instead of sample content.
  const restaurants =
    RESTAURANTS_PUBLIC_ENABLED && isSupabaseConfigured() ? await getRestaurants({ q: searchParams.q }) : [];
  const th = await getTranslations({ locale, namespace: "home" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  // The feature-disabled "Coming Soon" placeholder only applies when the
  // whole category is switched off. Once enabled, zero restaurants means
  // there are genuinely no partners yet — every query against an empty
  // table also returns zero rows, so this correctly stays the "be our
  // first partner" invite (search box included) rather than exposing a
  // search UI with nothing to search.
  const isDisabled = !RESTAURANTS_PUBLIC_ENABLED;
  const isEmpty = RESTAURANTS_PUBLIC_ENABLED && restaurants.length === 0;

  return (
    <>
      <PageHero
  eyebrow={`🍽 ${tNav("restaurants")}`}
  title={th("restaurantsTitle")}
  image="/images/restaurants/sultan/hero.png"
/>

      {isDisabled ? (
        <ComingSoonSection locale={locale} />
      ) : isEmpty ? (
        <RestaurantsEmptyState locale={locale} />
      ) : (
        <RestaurantsPageClient locale={locale} initialRestaurants={restaurants} searchParams={searchParams} />
      )}
    </>
  );
}