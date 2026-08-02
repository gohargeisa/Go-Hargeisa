import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { searchAllListings, type SearchResultItem } from "@/lib/data/global-search";
import { ListingCard } from "@/components/shared/listing-card";
import { SearchWithin } from "@/components/shared/search-within";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/home/reveal";
import { SearchX } from "lucide-react";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { q?: string };
}): Promise<Metadata> {
  return { title: searchParams.q ? `"${searchParams.q}" — Search — Go Hargeisa` : "Search — Go Hargeisa" };
}

export default async function SearchPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { q?: string };
}) {
  const t = await getTranslations("search");
  const q = searchParams.q?.trim() ?? "";
  const results = q ? await searchAllListings(q, locale, 24) : null;

  const groups = (
    results
      ? ([
          { key: "hotel", label: t("groupHotels"), items: results.hotels },
          { key: "restaurant", label: t("groupRestaurants"), items: results.restaurants },
          { key: "cafe", label: t("groupCafes"), items: results.cafes },
          { key: "attraction", label: t("groupAttractions"), items: results.attractions },
        ] satisfies { key: SearchResultItem["type"]; label: string; items: SearchResultItem[] }[])
      : []
  ).filter((g) => g.items.length > 0);

  return (
    <section className="container-px mx-auto py-10 md:py-14">
      <Reveal>
        <div className="mb-6">
          <h1 className="font-display text-2xl font-bold md:text-3xl">
            {q ? t("resultsTitle", { count: results?.total ?? 0 }) : t("searchPageTitle")}
          </h1>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
            {q ? t("resultsSubtitle", { query: q }) : t("searchPageSubtitle")}
          </p>
        </div>

        <div className="mb-10">
          <SearchWithin basePath={`/${locale}/search`} placeholder={t("placeholder")} defaultValue={q} />
        </div>
      </Reveal>

      {!q ? null : !results || results.total === 0 ? (
        <EmptyState icon={SearchX} title={t("noResultsTitle")} description={t("noResults", { query: q })} className="mt-4" />
      ) : (
        <div className="space-y-12">
          {groups.map((group) => (
            <Reveal key={group.key}>
              <h2 className="mb-5 font-display text-xl font-bold">{group.label}</h2>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <ListingCard
                    key={`${item.type}-${item.id}`}
                    href={`/${locale}${item.href}`}
                    image={item.image}
                    title={item.name}
                    subtitle={item.subtitle}
                    rating={item.rating}
                    reviewCount={item.reviewCount}
                    listingType={item.type}
                    listingId={item.id}
                    locale={locale}
                  />
                ))}
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </section>
  );
}
