import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getAttractions } from "@/lib/data/attractions";
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
    title: "Tourist Attractions in Hargeisa",
    description:
      "Landmarks, museums, markets and nature spots to visit in Hargeisa, Somaliland.",
    alternates: { canonical: `/${locale}/attractions` },
  };
}

export default async function AttractionsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { q?: string };
}) {
  const t = await getTranslations("home");
  const common = await getTranslations("common");
  const attractions = await getAttractions({ q: searchParams.q });

  return (
    <>
      <PageHero
        eyebrow="See"
        title={t("attractionsTitle")}
        image={placeholderImage("Attractions in Hargeisa", {
          tone: "secondary",
        })}
      />

      <section className="container-px mx-auto py-14">
        <SearchWithin
          basePath={`/${locale}/attractions`}
          placeholder="Search attractions…"
          defaultValue={searchParams.q}
        />

        {attractions.length === 0 ? (
          <p className="mt-10 text-center text-ink/50 dark:text-sand/50">
            {common("noResults")}
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {attractions.map((a) => (
              <ListingCard
                key={a.id}
                href={`/${locale}/attractions/${a.slug}`}
                image={a.coverImage}
                title={a.name}
                subtitle={a.address}
                rating={a.rating}
                reviewCount={a.reviewCount}
                listingType="attraction"
                listingId={a.id}
                locale={locale}
                tag={
                  a.entryFee === "Free"
                    ? "Free entry"
                    : a.entryFee ?? undefined
                }
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}