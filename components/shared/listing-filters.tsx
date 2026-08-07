"use client";

import { useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { ChevronDown, X } from "lucide-react";
import { PrimaryButton } from "./buttons";

export interface FilterOptions {
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  sortBy?: "rating" | "price-low" | "price-high" | "newest";
  cuisine?: string[]; // For restaurants
  amenities?: string[]; // For hotels
}

export function ListingFilters({
  onFilterChange,
  maxPrice = 500,
  showCuisineFilter = false,
  cuisineOptions = [],
  showAmenitiesFilter = false,
  amenitiesOptions = [],
  locale,
}: {
  onFilterChange?: (filters: FilterOptions) => void;
  maxPrice?: number;
  showCuisineFilter?: boolean;
  cuisineOptions?: string[];
  showAmenitiesFilter?: boolean;
  amenitiesOptions?: string[];
  locale: string;
}) {
  const t = useTranslations("listings");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  // Parse current filters from URL
  const currentMinPrice = parseInt(searchParams.get("minPrice") || "0");
  const currentMaxPrice = parseInt(searchParams.get("maxPrice") || maxPrice.toString());
  const currentMinRating = parseInt(searchParams.get("minRating") || "0");
  const currentSort = (searchParams.get("sortBy") || "rating") as FilterOptions["sortBy"];
  const currentCuisines = searchParams.get("cuisine")?.split(",") || [];
  const currentAmenities = searchParams.get("amenities")?.split(",") || [];

  const [minPrice, setMinPrice] = useState(currentMinPrice);
  const [maxPrice2, setMaxPrice2] = useState(currentMaxPrice);
  const [minRating, setMinRating] = useState(currentMinRating);
  const [sortBy, setSortBy] = useState(currentSort);
  const [selectedCuisines, setSelectedCuisines] = useState<Set<string>>(
    new Set(currentCuisines)
  );
  const [showCuisineDropdown, setShowCuisineDropdown] = useState(false);
  const [selectedAmenities, setSelectedAmenities] = useState<Set<string>>(
    new Set(currentAmenities)
  );
  const [showAmenitiesDropdown, setShowAmenitiesDropdown] = useState(false);

  // Check if any filters are active
  const hasActiveFilters =
    minPrice > 0 ||
    maxPrice2 < maxPrice ||
    minRating > 0 ||
    sortBy !== "rating" ||
    selectedCuisines.size > 0 ||
    selectedAmenities.size > 0;

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
    if (selectedAmenities.size > 0) {
      params.set("amenities", Array.from(selectedAmenities).join(","));
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
      amenities: selectedAmenities.size > 0 ? Array.from(selectedAmenities) : undefined,
    });
  }

  function resetFilters() {
    setMinPrice(0);
    setMaxPrice2(maxPrice);
    setMinRating(0);
    setSortBy("rating");
    setSelectedCuisines(new Set());
    setSelectedAmenities(new Set());

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

  function toggleAmenity(amenity: string) {
    const next = new Set(selectedAmenities);
    if (next.has(amenity)) next.delete(amenity);
    else next.add(amenity);
    setSelectedAmenities(next);
  }

  return (
    <div className="rounded-xl2 border border-ink/8 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">{t("filtersTitle")}</h3>
        {hasActiveFilters && (
          <button
            onClick={resetFilters}
            disabled={isPending}
            className="flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary-700 disabled:opacity-60"
          >
            <X size={14} />
            {t("clearAll")}
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* Sort By */}
        <div>
          <label htmlFor="listing-filters-sort" className="text-sm font-semibold text-ink dark:text-white">{t("sortByLabel")}</label>
          <select
            id="listing-filters-sort"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as FilterOptions["sortBy"])}
            className="mt-2 w-full rounded-xl border border-ink/12 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-primary dark:border-white/15 dark:bg-white/5"
          >
            <option value="rating">{t("sortRating")}</option>
            <option value="price-low">{t("sortPriceLow")}</option>
            <option value="price-high">{t("sortPriceHigh")}</option>
            <option value="newest">{t("sortNewest")}</option>
          </select>
        </div>

        {/* Rating Filter */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-ink dark:text-white">
              {t("minRatingLabel")}
            </label>
            <span className="text-xs text-ink/60 dark:text-white/60">
              {minRating > 0 ? `${minRating.toFixed(1)}+` : t("allRatingsShort")}
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
                  {rating === 0 ? t("allRatingsOption") : t("ratingAndUp", { rating: rating.toFixed(1) })}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Price Range Filter */}
        <div>
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-ink dark:text-white">
              {t("priceRangeLabel")}
            </label>
            <span className="text-xs text-ink/60 dark:text-white/60">
              ${minPrice} - ${maxPrice2}
            </span>
          </div>
          <div className="mt-4 space-y-3">
            <div>
              <label htmlFor="listing-filters-min-price" className="text-xs text-ink/60 dark:text-white/60">{t("minPriceLabel")}</label>
              <input
                id="listing-filters-min-price"
                type="range"
                min="0"
                max={maxPrice}
                value={minPrice}
                onChange={(e) => setMinPrice(parseInt(e.target.value))}
                className="mt-1 w-full"
              />
            </div>
            <div>
              <label htmlFor="listing-filters-max-price" className="text-xs text-ink/60 dark:text-white/60">{t("maxPriceLabel")}</label>
              <input
                id="listing-filters-max-price"
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
                className="flex w-full items-center justify-between rounded-xl border border-ink/12 bg-white px-3 py-2.5 text-sm font-medium transition-colors hover:border-primary/40 dark:border-white/15 dark:bg-white/5"
              >
                <span>
                  {selectedCuisines.size > 0
                    ? t("cuisineSelected", { count: selectedCuisines.size })
                    : t("allCuisines")}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ease-premium ${showCuisineDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showCuisineDropdown && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1.5 rounded-xl2 border border-ink/12 bg-white shadow-card dark:border-white/15 dark:bg-ink">
                  <div className="max-h-64 space-y-1 overflow-y-auto p-2">
                    {cuisineOptions.map((cuisine) => (
                      <label
                        key={cuisine}
                        className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-primary/5 dark:hover:bg-white/5"
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

        {/* Amenities Filter (Hotels Only) */}
        {showAmenitiesFilter && amenitiesOptions.length > 0 && (
          <div>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowAmenitiesDropdown(!showAmenitiesDropdown)}
                className="flex w-full items-center justify-between rounded-xl border border-ink/12 bg-white px-3 py-2.5 text-sm font-medium transition-colors hover:border-primary/40 dark:border-white/15 dark:bg-white/5"
              >
                <span>
                  {selectedAmenities.size > 0
                    ? t("amenitiesSelected", { count: selectedAmenities.size })
                    : t("allAmenities")}
                </span>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ease-premium ${showAmenitiesDropdown ? "rotate-180" : ""}`}
                />
              </button>

              {showAmenitiesDropdown && (
                <div className="absolute left-0 right-0 top-full z-10 mt-1.5 rounded-xl2 border border-ink/12 bg-white shadow-card dark:border-white/15 dark:bg-ink">
                  <div className="max-h-64 space-y-1 overflow-y-auto p-2">
                    {amenitiesOptions.map((amenity) => (
                      <label
                        key={amenity}
                        className="flex cursor-pointer items-center gap-2 rounded-lg p-2 hover:bg-primary/5 dark:hover:bg-white/5"
                      >
                        <input
                          type="checkbox"
                          checked={selectedAmenities.has(amenity)}
                          onChange={() => toggleAmenity(amenity)}
                          className="h-4 w-4 rounded cursor-pointer"
                        />
                        <span className="text-sm">{amenity}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Apply Filters Button */}
        <PrimaryButton onClick={applyFilters} disabled={isPending} fullWidth>
          {isPending ? t("applying") : t("applyFilters")}
        </PrimaryButton>
      </div>
    </div>
  );
}
