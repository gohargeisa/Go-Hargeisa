"use client";

import { useId } from "react";
import { useTranslations } from "next-intl";
import { Search, X } from "lucide-react";
import type { AttractionSortOption } from "./attractions-page-client";

export interface AttractionsToolbarProps {
  search: string;
  onSearchChange: (value: string) => void;

  category: string;
  onCategoryChange: (value: string) => void;
  categoryOptions: { value: string; label: string }[];

  sort: AttractionSortOption;
  onSortChange: (value: AttractionSortOption) => void;

  minRating: number;
  onMinRatingChange: (value: number) => void;

  region: string;
  onRegionChange: (value: string) => void;
  regionOptions: string[];

  hasActiveFilters: boolean;
  onClearAll: () => void;
}

const SELECT_CLASS =
  "w-full rounded-xl border border-ink/12 bg-white px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-primary dark:border-white/15 dark:bg-white/5 dark:text-white";

export function AttractionsToolbar({
  search,
  onSearchChange,
  category,
  onCategoryChange,
  categoryOptions,
  sort,
  onSortChange,
  minRating,
  onMinRatingChange,
  region,
  onRegionChange,
  regionOptions,
  hasActiveFilters,
  onClearAll,
}: AttractionsToolbarProps) {
  const t = useTranslations("listings");
  const searchInputId = useId();
  const sortOptions: { value: AttractionSortOption; label: string }[] = [
    { value: "recommended", label: t("sortRecommended") },
    { value: "rating", label: t("sortRating") },
    { value: "reviews", label: t("sortMostReviewed") },
    { value: "name", label: t("sortNameAZ") },
  ];

  return (
    <div className="sticky top-[calc(5rem+env(safe-area-inset-top))] z-20 rounded-xl3 border border-ink/8 bg-white/95 p-4 shadow-card backdrop-blur-md dark:border-white/10 dark:bg-ink/90 sm:p-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="flex flex-1 items-center gap-2.5 rounded-full border border-ink/12 bg-sand/60 px-4 py-3 dark:border-white/15 dark:bg-white/5">
          <Search size={17} className="shrink-0 text-ink/40 dark:text-sand/40" aria-hidden="true" />
          <label htmlFor={searchInputId} className="sr-only">
            {t("searchAttractionsPlaceholder")}
          </label>
          <input
            id={searchInputId}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t("searchAttractionsPlaceholder")}
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink/40 dark:text-white dark:placeholder:text-sand/40"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange("")}
              aria-label={t("clearSearchAriaLabel")}
              className="shrink-0 text-ink/40 hover:text-ink dark:text-sand/40 dark:hover:text-white"
            >
              <X size={15} />
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:flex lg:shrink-0 lg:gap-2.5">
          <select
            aria-label={t("categoryLabel")}
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className={`${SELECT_CLASS} lg:w-40`}
          >
            <option value="">{t("allCategoriesOption")}</option>
            {categoryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            aria-label={t("sortByLabel")}
            value={sort}
            onChange={(e) => onSortChange(e.target.value as AttractionSortOption)}
            className={`${SELECT_CLASS} lg:w-40`}
          >
            {sortOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>

          <select
            aria-label={t("minRatingLabel")}
            value={minRating}
            onChange={(e) => onMinRatingChange(Number(e.target.value))}
            className={`${SELECT_CLASS} lg:w-36`}
          >
            <option value={0}>{t("allRatingsOption")}</option>
            {[3.5, 4, 4.5].map((r) => (
              <option key={r} value={r}>
                {t("ratingAndUp", { rating: r.toFixed(1) })}
              </option>
            ))}
          </select>

          <select
            aria-label={t("regionLabel")}
            value={region}
            onChange={(e) => onRegionChange(e.target.value)}
            className={`${SELECT_CLASS} lg:w-36`}
          >
            <option value="">{t("allRegionsOption")}</option>
            {regionOptions.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={onClearAll}
            className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full border border-ink/12 px-4 py-2.5 text-xs font-semibold text-ink/70 transition-colors hover:border-primary hover:text-primary dark:border-white/15 dark:text-sand/70"
          >
            <X size={13} aria-hidden="true" />
            {t("clearAll")}
          </button>
        )}
      </div>
    </div>
  );
}
