"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import { SearchX } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { HotelCard } from "@/components/shared/hotel-card";
import { SearchWithin } from "@/components/shared/search-within";
import { ListingFilters, type FilterOptions } from "@/components/shared/listing-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/home/reveal";
import { filterListings } from "@/lib/utils/filter-listings";

interface Hotel {
  id: string;
  slug: string;
  name: string;
  address: string;
  coverImage: string;
  rating: number;
  reviewCount: number;
  priceRange?: string;
  amenities?: string[];
  website?: string;
  featured?: boolean;
  createdAt?: string;
}

export function HotelsPageClient({
  locale,
  initialHotels,
  searchParams,
}: {
  locale: Locale;
  initialHotels: Hotel[];
  searchParams: Record<string, string | undefined>;
}) {
  const t = useTranslations("listings");
  // Parse filter params from URL
  const filters: FilterOptions = useMemo(
    () => ({
      minPrice: searchParams.minPrice ? parseInt(searchParams.minPrice) : undefined,
      maxPrice: searchParams.maxPrice ? parseInt(searchParams.maxPrice) : undefined,
      minRating: searchParams.minRating ? parseInt(searchParams.minRating) : undefined,
      sortBy: (searchParams.sortBy as any) || "rating",
    }),
    [searchParams.minPrice, searchParams.maxPrice, searchParams.minRating, searchParams.sortBy]
  );

  // Apply filters
  const filteredHotels = useMemo(() => {
    const filtered = filterListings(initialHotels, filters);

    // Separate featured and non-featured
    const featured = filtered.filter((h) => h.featured);
    const nonFeatured = filtered.filter((h) => !h.featured);

    return { featured, nonFeatured, total: filtered.length };
  }, [initialHotels, filters]);

  return (
    <section className="container-px mx-auto py-10 md:py-14">
      <Reveal>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">
              {t("hotelsCount", { count: filteredHotels.total })}
            </h2>
            <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
              {searchParams.q ? t("resultsFor", { query: searchParams.q }) : t("browseAllHotels")}
            </p>
          </div>
        </div>

        <div className="mb-6">
          <SearchWithin
            basePath={`/${locale}/hotels`}
            placeholder={t("searchHotelsPlaceholder")}
            defaultValue={searchParams.q}
          />
        </div>
      </Reveal>

      {filteredHotels.total === 0 ? (
        <EmptyState icon={SearchX} title={t("noHotelsMatch")} description={t("adjustFilters")} className="mt-12" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Filters Sidebar */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <ListingFilters locale={locale} maxPrice={500} />
          </div>

          {/* Listings Grid */}
          <div>
            {/* Featured Hotels Section */}
            {filteredHotels.featured.length > 0 && (
              <Reveal className="mb-12">
                <div className="mb-6">
                  <h3 className="font-display text-xl font-bold">{t("featuredHotels")}</h3>
                  <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("featuredHotelsSubtitle")}</p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {filteredHotels.featured.map((h) => (
                    <HotelCard
                      key={h.id}
                      href={`/${locale}/hotels/${h.slug}`}
                      image={h.coverImage}
                      name={h.name}
                      address={h.address}
                      rating={h.rating}
                      reviewCount={h.reviewCount}
                      priceRange={h.priceRange}
                      amenities={h.amenities}
                      featured
                      hotelId={h.id}
                      locale={locale}
                      website={h.website}
                    />
                  ))}
                </div>
              </Reveal>
            )}

            {/* All Hotels Section */}
            {filteredHotels.nonFeatured.length > 0 && (
              <Reveal delay={0.08}>
                <div className="mb-6">
                  <h3 className="font-display text-xl font-bold">{t("allHotels")}</h3>
                  <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
                    {t("availableProperties", { count: filteredHotels.nonFeatured.length })}
                  </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {filteredHotels.nonFeatured.map((h) => (
                    <HotelCard
                      key={h.id}
                      href={`/${locale}/hotels/${h.slug}`}
                      image={h.coverImage}
                      name={h.name}
                      address={h.address}
                      rating={h.rating}
                      reviewCount={h.reviewCount}
                      priceRange={h.priceRange}
                      amenities={h.amenities}
                      hotelId={h.id}
                      locale={locale}
                      website={h.website}
                    />
                  ))}
                </div>
              </Reveal>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
