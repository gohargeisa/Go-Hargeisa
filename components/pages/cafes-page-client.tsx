"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { SearchX } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { ListingCard } from "@/components/shared/listing-card";
import { SearchWithin } from "@/components/shared/search-within";
import { ListingFilters, type FilterOptions } from "@/components/shared/listing-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { filterListings } from "@/lib/utils/filter-listings";

interface Cafe {
  id: string;
  slug: string;
  name: string;
  specialDrinks: string[];
  coverImage: string;
  rating: number;
  reviewCount: number;
  featured?: boolean;
  createdAt?: string;
}

export function CafesPageClient({
  locale,
  initialCafes,
  searchParams,
}: {
  locale: Locale;
  initialCafes: Cafe[];
  searchParams: Record<string, string | undefined>;
}) {
  const t = useTranslations("listings");

  const filters: FilterOptions = useMemo(
    () => ({
      minRating: searchParams.minRating ? parseInt(searchParams.minRating) : undefined,
      sortBy: (searchParams.sortBy as any) || "rating",
    }),
    [searchParams.minRating, searchParams.sortBy]
  );

  const filteredCafes = useMemo(() => {
    const filtered = filterListings(initialCafes, filters);
    const featured = filtered.filter((c) => c.featured);
    const nonFeatured = filtered.filter((c) => !c.featured);
    return { featured, nonFeatured, total: filtered.length };
  }, [initialCafes, filters]);

  return (
    <section className="container-px mx-auto py-10 md:py-14">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold md:text-3xl">{t("cafesCount", { count: filteredCafes.total })}</h2>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
            {searchParams.q ? t("resultsFor", { query: searchParams.q }) : t("browseAllCafes")}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <SearchWithin basePath={`/${locale}/cafes`} placeholder={t("searchCafesPlaceholder")} defaultValue={searchParams.q} />
      </div>

      {filteredCafes.total === 0 ? (
        <EmptyState icon={SearchX} title={t("noCafesMatch")} description={t("adjustFilters")} className="mt-12" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <ListingFilters locale={locale} maxPrice={500} />
          </div>

          <div>
            {filteredCafes.featured.length > 0 && (
              <div className="mb-12">
                <div className="mb-6">
                  <h3 className="font-display text-xl font-bold">{t("featuredCafes")}</h3>
                  <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("featuredCafesSubtitle")}</p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {filteredCafes.featured.map((c) => (
                    <ListingCard
                      key={c.id}
                      href={`/${locale}/cafes/${c.slug}`}
                      image={c.coverImage}
                      title={c.name}
                      subtitle={c.specialDrinks.join(" • ") || t("cafeSubtitleFallback")}
                      rating={c.rating}
                      reviewCount={c.reviewCount}
                      listingType="cafe"
                      listingId={c.id}
                      locale={locale}
                      tag={t("featuredTag")}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredCafes.nonFeatured.length > 0 && (
              <div>
                <div className="mb-6">
                  <h3 className="font-display text-xl font-bold">{t("allCafes")}</h3>
                  <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
                    {t("availableCafes", { count: filteredCafes.nonFeatured.length })}
                  </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {filteredCafes.nonFeatured.map((c) => (
                    <ListingCard
                      key={c.id}
                      href={`/${locale}/cafes/${c.slug}`}
                      image={c.coverImage}
                      title={c.name}
                      subtitle={c.specialDrinks.join(" • ") || t("cafeSubtitleFallback")}
                      rating={c.rating}
                      reviewCount={c.reviewCount}
                      listingType="cafe"
                      listingId={c.id}
                      locale={locale}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
