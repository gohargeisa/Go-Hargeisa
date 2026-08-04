"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { CityServiceCategory, CityServicePoint } from "@/types";
import { CATEGORY_ORDER } from "@/components/city-map/category-config";
import { CategoryFilters } from "@/components/city-map/category-filters";
import { CitySearchBar } from "@/components/city-map/city-search-bar";
import { PointInfoCard } from "@/components/city-map/point-info-card";
import { CityMapEmptyState } from "@/components/city-map/empty-state";
import { useVisitorLocation } from "@/lib/hooks/use-visitor-location";

function isCityServiceCategory(value: string | null): value is CityServiceCategory {
  return !!value && (CATEGORY_ORDER as string[]).includes(value);
}

/**
 * No embedded map — this is a searchable/filterable list of every city
 * service, each card linking straight out to Google Maps (View on Map/
 * Directions) rather than showing a pin on an in-page map. Same
 * search/category-filter UI as before; only the map-in-the-middle layout
 * was replaced with a card grid.
 */
export function CityMapExperience({ points, locale }: { points: CityServicePoint[]; locale: string }) {
  const searchParams = useSearchParams();
  // Lets homepage category cards (?category=hospital) land pre-filtered
  // instead of always showing every category.
  const [active, setActive] = useState<Set<CityServiceCategory>>(() => {
    const requested = searchParams.get("category");
    return isCityServiceCategory(requested) ? new Set([requested]) : new Set(CATEGORY_ORDER);
  });
  const [query, setQuery] = useState("");
  const visitorLocation = useVisitorLocation();

  const counts = useMemo(() => {
    const record = Object.fromEntries(CATEGORY_ORDER.map((c) => [c, 0])) as Record<CityServiceCategory, number>;
    for (const point of points) record[point.category] += 1;
    return record;
  }, [points]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return points.filter(
      (point) => active.has(point.category) && (!needle || point.name.toLowerCase().includes(needle))
    );
  }, [points, active, query]);

  function toggleCategory(category: CityServiceCategory) {
    setActive((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }

  const hasAnyData = points.length > 0;

  if (!hasAnyData) {
    return (
      <div className="flex min-h-[420px] items-center justify-center rounded-xl3 border border-dashed border-ink/15 bg-ink/[0.02] dark:border-white/15 dark:bg-white/[0.02]">
        <CityMapEmptyState
          title="No city services added yet"
          description="Check back soon — hospitals, mosques, pharmacies and more will appear here as they're added."
        />
      </div>
    );
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="w-full sm:max-w-md">
          <CitySearchBar value={query} onChange={setQuery} />
        </div>
        <CategoryFilters counts={counts} active={active} onToggle={toggleCategory} />
      </div>

      {visible.length === 0 ? (
        <div className="flex min-h-[300px] items-center justify-center rounded-xl3 border border-dashed border-ink/15 dark:border-white/15">
          <CityMapEmptyState />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((point) => (
            <div
              key={point.id}
              className="rounded-2xl border border-ink/8 bg-white p-5 shadow-soft transition-shadow duration-300 ease-premium hover:shadow-card dark:border-white/10 dark:bg-white/[0.03]"
            >
              <PointInfoCard point={point} locale={locale} visitorLocation={visitorLocation} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
