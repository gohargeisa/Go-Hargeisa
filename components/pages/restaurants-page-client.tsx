"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/lib/i18n/config";
import { ListingCard } from "@/components/shared/listing-card";
import { SearchWithin } from "@/components/shared/search-within";
import { ListingFilters, type FilterOptions } from "@/components/shared/listing-filters";
import { filterListings, getUniqueCuisines } from "@/lib/utils/filter-listings";

interface Restaurant {
  id: string;
  slug: string;
  name: string;
  cuisine: string[];
  coverImage: string;
  rating: number;
  reviewCount: number;
  priceRange?: string;
  featured?: boolean;
  createdAt?: string;
}

export function RestaurantsPageClient({
  locale,
  initialRestaurants,
  searchParams,
}: {
  locale: Locale;
  initialRestaurants: Restaurant[];
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
      cuisine: searchParams.cuisine ? searchParams.cuisine.split(",") : undefined,
    }),
    [
      searchParams.minPrice,
      searchParams.maxPrice,
      searchParams.minRating,
      searchParams.sortBy,
      searchParams.cuisine,
    ]
  );

  // Get unique cuisines for filter options
  const cuisineOptions = useMemo(
    () => getUniqueCuisines(initialRestaurants),
    [initialRestaurants]
  );

  // Apply filters
  const filteredRestaurants = useMemo(() => {
    const filtered = filterListings(initialRestaurants, filters);
    
    // Separate featured and non-featured
    const featured = filtered.filter((r) => r.featured);
    const nonFeatured = filtered.filter((r) => !r.featured);
    
    return { featured, nonFeatured, total: filtered.length };
  }, [initialRestaurants, filters]);

  return (
    <section className="container-px mx-auto py-10 md:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold md:text-3xl">
            {t("restaurantsCount", { count: filteredRestaurants.total })}
          </h2>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
            {searchParams.q ? t("resultsFor", { query: searchParams.q }) : t("browseAllRestaurants")}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <SearchWithin
          basePath={`/${locale}/restaurants`}
          placeholder={t("searchRestaurantsPlaceholder")}
          defaultValue={searchParams.q}
        />
      </div>

      {filteredRestaurants.total === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-ink/20 bg-ink/5 p-12 text-center dark:border-white/20 dark:bg-white/[0.02]">
          <h3 className="font-display text-lg font-semibold">{t("noRestaurantsMatch")}</h3>
          <p className="mt-2 text-sm text-ink/60 dark:text-sand/60">
            {t("adjustFilters")}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Filters Sidebar */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <ListingFilters
              locale={locale}
              maxPrice={500}
              showCuisineFilter
              cuisineOptions={cuisineOptions}
            />
          </div>

          {/* Listings Grid */}
          <div>
            {/* Featured Restaurants Section */}
            {filteredRestaurants.featured.length > 0 && (
              <div className="mb-12">
                <div className="mb-6">
                  <h3 className="font-display text-xl font-bold">{t("featuredRestaurants")}</h3>
                  <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("featuredRestaurantsSubtitle")}</p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {filteredRestaurants.featured.map((r) => (
                    <ListingCard
                      key={r.id}
                      href={`/${locale}/restaurants/${r.slug}`}
                      image={r.coverImage}
                      title={r.name}
                      subtitle={r.cuisine.join(" • ")}
                      rating={r.rating}
                      reviewCount={r.reviewCount}
                      listingType="restaurant"
                      listingId={r.id}
                      locale={locale}
                      priceRange={r.priceRange}
                      tag={t("featuredTag")}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Restaurants Section */}
            {filteredRestaurants.nonFeatured.length > 0 && (
              <div>
                <div className="mb-6">
                  <h3 className="font-display text-xl font-bold">{t("allRestaurants")}</h3>
                  <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
                    {t("availableRestaurants", { count: filteredRestaurants.nonFeatured.length })}
                  </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {filteredRestaurants.nonFeatured.map((r) => (
                    <ListingCard
                      key={r.id}
                      href={`/${locale}/restaurants/${r.slug}`}
                      image={r.coverImage}
                      title={r.name}
                      subtitle={r.cuisine.join(" • ")}
                      rating={r.rating}
                      reviewCount={r.reviewCount}
                      listingType="restaurant"
                      listingId={r.id}
                      locale={locale}
                      priceRange={r.priceRange}
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
