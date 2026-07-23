"use client";

import { useMemo } from "react";
import type { Locale } from "@/lib/i18n/config";
import { ListingCard } from "@/components/shared/listing-card";
import { SearchWithin } from "@/components/shared/search-within";
import { ListingFilters, type FilterOptions } from "@/components/shared/listing-filters";
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
  // Parse filter params from URL
  const filters: FilterOptions = {
    minPrice: searchParams.minPrice ? parseInt(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? parseInt(searchParams.maxPrice) : undefined,
    minRating: searchParams.minRating ? parseInt(searchParams.minRating) : undefined,
    sortBy: (searchParams.sortBy as any) || "rating",
  };

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl font-bold md:text-3xl">
            {filteredHotels.total} Hotels
          </h2>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
            {searchParams.q ? `Results for "${searchParams.q}"` : "Browse all hotels in Hargeisa"}
          </p>
        </div>
      </div>

      <div className="mb-6">
        <SearchWithin
          basePath={`/${locale}/hotels`}
          placeholder="Search hotels by name or area…"
          defaultValue={searchParams.q}
        />
      </div>

      {filteredHotels.total === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-ink/20 bg-ink/5 p-12 text-center dark:border-white/20 dark:bg-white/[0.02]">
          <h3 className="font-display text-lg font-semibold">No hotels match your filters</h3>
          <p className="mt-2 text-sm text-ink/60 dark:text-sand/60">
            Try adjusting your search or filter criteria
          </p>
        </div>
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
              <div className="mb-12">
                <div className="mb-6">
                  <h3 className="font-display text-xl font-bold">⭐ Featured Hotels</h3>
                  <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">Our top-rated properties</p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {filteredHotels.featured.map((h) => (
                    <ListingCard
                      key={h.id}
                      href={`/${locale}/hotels/${h.slug}`}
                      image={h.coverImage}
                      title={h.name}
                      subtitle={h.address}
                      rating={h.rating}
                      reviewCount={h.reviewCount}
                      listingType="hotel"
                      listingId={h.id}
                      locale={locale}
                      priceRange={h.priceRange}
                      tag="Featured"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* All Hotels Section */}
            {filteredHotels.nonFeatured.length > 0 && (
              <div>
                <div className="mb-6">
                  <h3 className="font-display text-xl font-bold">All Hotels</h3>
                  <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
                    {filteredHotels.nonFeatured.length} available properties
                  </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {filteredHotels.nonFeatured.map((h) => (
                    <ListingCard
                      key={h.id}
                      href={`/${locale}/hotels/${h.slug}`}
                      image={h.coverImage}
                      title={h.name}
                      subtitle={h.address}
                      rating={h.rating}
                      reviewCount={h.reviewCount}
                      listingType="hotel"
                      listingId={h.id}
                      locale={locale}
                      priceRange={h.priceRange}
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
