"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronDown, X } from "lucide-react";

export interface FilterOptions {
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: "rating" | "price-low" | "price-high" | "newest";
  cuisine?: string[]; // For restaurants
}

export function ListingFilters({
  onFilterChange,
  maxPrice = 500,
  showCuisineFilter = false,
  cuisineOptions = [],
  locale,
}: {
  onFilterChange?: (filters: FilterOptions) => void;
  maxPrice?: number;
  showCuisineFilter?: boolean;
  cuisineOptions?: string[];
  locale: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Parse current filters from URL
  const currentMinPrice = parseInt(searchParams.get("minPrice") || "0");
  const currentMaxPrice = parseInt(searchParams.get("maxPrice") || maxPrice.toString());
  const currentMinRating = parseInt(searchParams.get("minRating") || "0");
  const currentSort = (searchParams.get("sortBy") || "rating") as FilterOptions["sortBy"];
  const currentCuisines = searchParams.get("cuisine")?.split(",") || [];

  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [maxPrice2, setMaxPrice2] = useState(currentMaxPrice);
  const [minRating, setMinRating] = useState(currentMinRating);
  const [sortBy, setSortBy] = useState(currentSort);
  const [selectedCuisines, setSelectedCuisines] = useState<Set<string>>(
    new Set(currentCuisines)
  );
  const [showCuisineDropdown, setShowCuisineDropdown] = useState(false);

  // Check if any filters are active
  const hasActiveFilters =
    minPrice > 0 ||
    maxPrice2 < maxPrice ||
    minRating > 0 ||
    sortBy !== "rating" ||
    selectedCuisines.size > 0;

  function applyFilters() {
    const params = new URLSearchParams();

    // Preserve search query
    const q = searchParams.get("q");
    if (q) params.set("q", q);

    // Add filter params
    if (minPrice > 0) params.set("minPrice", minPrice.toString());
    if (maxPrice2 < maxPrice) params.set("maxPrice", maxPrice2.toString());
    if (minRating > 0) params.set("minRating", minRating.toString());
    if (sortBy && sortBy !== "rating") {
  params.set("sortBy", sortBy);
}
    if (selectedCuisines.size > 0) {
      params.set("cuisine", Array.from(selectedCuisines).join(","));
    }

    const queryString = params.toString();
    const path = window.location.pathname;
    startTransition(() => {
      router.push(queryString ? `${path}?${queryString}` : path);
    });

    onFilterChange?.({
      minPrice: minPrice > 0 ? minPrice : undefined,
      maxPrice: maxPrice2 < maxPrice ? maxPrice2 : undefined,
      minRating: minRating > 0 ? minRating : undefined,
      sortBy: sortBy !== "rating" ? sortBy : undefined,
      cuisine: selectedCuisines.size > 0 ? Array.from(selectedCuisines) : undefined,
    });
  }

  function resetFilters() {
    setMinPrice(0);
    setMaxPrice2(maxPrice);
    setMinRating(0);
    setSortBy("rating");
    setSelectedCuisines(new Set());

    const params = new URLSearchParams();
    const q = searchParams.get("q");
    if (q) params.set("q", q);

    const queryString = params.toString();
    const path = window.location.pathname;
    startTransition(() => {
      router.push(queryString ? `${path}?${queryString}` : path);
    });
  }

  function toggleCuisine(cuisine: string) {
    const newCuisines = new Set(selectedCuisines);
    if (newCuisines.has(cuisine)) {
      newCuisines.delete(cuisine);
    } else {
      newCuisines.add(cuisine);
    }
    setSelectedCuisines(newCuisines);
  }

  return (
    <div className="rounded-2xl border border-ink/8 dark:border-white/10 bg-white dark:bg-white/[0.03] p-6">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Filters</h3>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            disabled={isPending}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-700 disabled:opacity-60"
          >
            <X size={14} />
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Sort By */}
        <div>
          <label className="text-sm font-semibold text-ink dark:text-white">Sort by</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as FilterOptions["sortBy"])}
            className="mt-2 w-full rounded-lg border border-ink/12 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
          >
            <option value="rating">Highest Rating</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="newest">Newest First</option>
          </select>
        </div>

        {/* Rating Filter */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-ink dark:text-white">
              Minimum Rating
            </label>
            <span className="text-xs text-ink/60 dark:text-white/60">
              {minRating > 0 ? `${minRating.toFixed(1)}+` : "All"}
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {[0, 3.5, 4.0, 4.5].map((rating) => (
              <label key={rating} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="rating"
                  value={rating}
                  checked={minRating === rating}
                  onChange={() => setMinRating(rating)}
                  className="h-4 w-4 cursor-pointer"
                />
                <span className="text-sm">
                  {rating === 0 ? "All Ratings" : `${rating.toFixed(1)} & up`}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range Filter */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-ink dark:text-white">
              Price Range
            </label>
            <span className="text-xs text-ink/60 dark:text-white/60">
              ${minPrice} - ${maxPrice2}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <label className="text-xs text-ink/60 dark:text-white/60">Min Price</label>
              <input
                type="range"
                min="0"
                max={maxPrice}
                value={minPrice}
                onChange={(e) => setMinPrice(parseInt(e.target.value))}
                className="mt-1 w-full"
              />
            </div>
            <div>
              <label className="text-xs text-ink/60 dark:text-white/60">Max Price</label>
              <input
                type="range"
                min="0"
                max={maxPrice}
                value={maxPrice2}
                onChange={(e) => setMaxPrice2(parseInt(e.target.value))}
                className="mt-1 w-full"
              />
            </div>
          </div>
        </div>

        {/* Cuisine Filter (Restaurants Only) */}
        {showCuisineFilter && cuisineOptions.length > 0 && (
          <div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowCuisineDropdown(!showCuisineDropdown)}
                className="w-full flex items-center justify-between rounded-lg border border-ink/12 dark:border-white/15 bg-white dark:bg-white/5 px-3 py-2 text-sm font-medium hover:border-primary/40 transition-colors"
              >
                <span>
                  {selectedCuisines.size > 0
                    ? `${selectedCuisines.size} selected`
                    : "All Cuisines"}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform ${showCuisineDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showCuisineDropdown && (
                <div className="absolute top-full left-0 right-0 mt-1 rounded-lg border border-ink/12 dark:border-white/15 bg-white dark:bg-ink shadow-lg z-10">
                  <div className="p-2 space-y-1 max-h-64 overflow-y-auto">
                    {cuisineOptions.map((cuisine) => (
                      <label
                        key={cuisine}
                        className="flex items-center gap-2 p-2 hover:bg-primary/5 dark:hover:bg-white/5 rounded cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCuisines.has(cuisine)}
                          onChange={() => toggleCuisine(cuisine)}
                          className="h-4 w-4 rounded cursor-pointer"
                        />
                        <span className="text-sm">{cuisine}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Apply Filters Button */}
        <button
          onClick={applyFilters}
          disabled={isPending}
          className="w-full rounded-lg bg-primary py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors disabled:opacity-60"
        >
          {isPending ? "Applying..." : "Apply Filters"}
        </button>
      </div>
    </div>
  );
}
