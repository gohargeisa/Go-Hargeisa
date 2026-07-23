import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getHotels } from "@/lib/data/hotels";
import { ListingCard } from "@/components/shared/listing-card";
import { PageHero } from "@/components/shared/page-hero";
import { SearchWithin } from "@/components/shared/search-within";
import { HotelsPageClient } from "@/components/pages/hotels-page-client";

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
  searchParams: { q?: string; minPrice?: string; maxPrice?: string; minRating?: string; sortBy?: string };
}) {
  const t = await getTranslations("home");
  const hotels = await getHotels({ q: searchParams.q });

  return (
    <>
      <PageHero
        eyebrow="Stay"
        title={t("hotelsTitle")}
        subtitle={t("hotelsSubtitle")}
        image="/images/heroes/hotels-hero.png"
      />

      <HotelsPageClient locale={locale} initialHotels={hotels} searchParams={searchParams} />
    </>
  );
}