"use client";

import { useMemo } from "react";
import type { Locale } from "@/lib/i18n/config";
import { ListingCard } from "@/components/shared/listing-card";
import { SearchWithin } from "@/components/shared/search-within";
import { ListingFilters, type FilterOptions } from "@/components/shared/listing-filters";
import { filterListings } from "@/lib/utils/filter-listings";

interface Cafe {
  id: string;
  slug: string;
  name: string;
  address: string;
  coverImage: string;
  rating: number;
  reviewCount: number;
  wifi?: boolean;
  priceRange?: string;
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
  // Parse filter params from URL
  const filters: FilterOptions = {
    minPrice: searchParams.minPrice ? parseInt(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? parseInt(searchParams.maxPrice) : undefined,
    minRating: searchParams.minRating ? parseInt(searchParams.minRating) : undefined,
    sortBy: (searchParams.sortBy as any) || "rating",
  };

  // Apply filters
  const filteredCafes = useMemo(() => {
    const filtered = filterListings(initialCafes, filters);
    
    // Separate featured and non-featured
    const featured = filtered.filter((c) => c.featured);
    const nonFeatured = filtered.filter((c) => !c.featured);
    
    return { featured, nonFeatured, total: filtered.length };
  }, [initialCafes, filters]);

  return (
    <section className="container-px mx-auto py-10 md:py-14">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold md:text-3xl">
            {filteredCafes.total} Cafes
          </h2>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
            {searchParams.q ? `Results for "${searchParams.q}"` : "Browse all cafes in Hargeisa"}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <SearchWithin
          basePath={`/${locale}/cafes`}
          placeholder="Search cafes…"
          defaultValue={searchParams.q}
        />
      </div>

      {filteredCafes.total === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-ink/20 bg-ink/5 p-12 text-center dark:border-white/20 dark:bg-white/[0.02]">
          <h3 className="font-display text-lg font-semibold">No cafes match your filters</h3>
          <p className="mt-2 text-sm text-ink/60 dark:text-sand/60">
            Try adjusting your search or filter criteria
          </p>
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Filters Sidebar */}
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <ListingFilters locale={locale} maxPrice={200} />
          </div>

          {/* Listings Grid */}
          <div>
            {/* Featured Cafes Section */}
            {filteredCafes.featured.length > 0 && (
              <div className="mb-12">
                <div className="mb-6">
                  <h3 className="font-display text-xl font-bold">⭐ Featured Cafes</h3>
                  <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">Our top-rated coffee spots</p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {filteredCafes.featured.map((c) => (
                    <ListingCard
                      key={c.id}
                      href={`/${locale}/cafes/${c.slug}`}
                      image={c.coverImage}
                      title={c.name}
                      subtitle={c.address}
                      rating={c.rating}
                      reviewCount={c.reviewCount}
                      listingType="cafe"
                      listingId={c.id}
                      locale={locale}
                      tag={c.wifi ? "Free WiFi" : "Featured"}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Cafes Section */}
            {filteredCafes.nonFeatured.length > 0 && (
              <div>
                <div className="mb-6">
                  <h3 className="font-display text-xl font-bold">All Cafes</h3>
                  <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
                    {filteredCafes.nonFeatured.length} available cafes
                  </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {filteredCafes.nonFeatured.map((c) => (
                    <ListingCard
                      key={c.id}
                      href={`/${locale}/cafes/${c.slug}`}
                      image={c.coverImage}
                      title={c.name}
                      subtitle={c.address}
                      rating={c.rating}
                      reviewCount={c.reviewCount}
                      listingType="cafe"
                      listingId={c.id}
                      locale={locale}
                      tag={c.wifi ? "Free WiFi" : undefined}
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
