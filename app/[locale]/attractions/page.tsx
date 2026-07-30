import type { Metadata } from "next";
import { SearchX } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getAttractions } from "@/lib/data/attractions";
import { ListingCard } from "@/components/shared/listing-card";
import { PageHero } from "@/components/shared/page-hero";
import { SearchWithin } from "@/components/shared/search-within";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/home/reveal";
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
    alternates: localeAlternates(locale as Locale, "/attractions"),
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
  const tl = await getTranslations("listings");
  const attractions = await getAttractions({ q: searchParams.q });

  return (
    <>
      <PageHero
        eyebrow={t("attractionsEyebrow")}
        title={t("attractionsTitle")}
        image={placeholderImage("Attractions in Hargeisa", {
          tone: "secondary",
        })}
      />

      <section className="container-px mx-auto py-10 md:py-14">
        <Reveal>
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold md:text-3xl">
                {tl("attractionsCount", { count: attractions.length })}
              </h2>
              <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
                {searchParams.q ? tl("resultsFor", { query: searchParams.q }) : tl("browseAllAttractions")}
              </p>
            </div>
          </div>

          <div className="mb-6">
            <SearchWithin
              basePath={`/${locale}/attractions`}
              placeholder={tl("searchAttractionsPlaceholder")}
              defaultValue={searchParams.q}
            />
          </div>
        </Reveal>

        {attractions.length === 0 ? (
          <EmptyState icon={SearchX} title={tl("noAttractionsMatch")} description={tl("adjustFilters")} className="mt-12" />
        ) : (
          <Reveal delay={0.08}>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
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
                      ? tl("freeEntry")
                      : a.entryFee ?? undefined
                  }
                />
              ))}
            </div>
          </Reveal>
        )}
      </section>
    </>
  );
}