"use client";

import { useMemo, useState } from "react";
import { MapPin } from "lucide-react";
import type { CityServiceCategory, CityServicePoint } from "@/types";
import { CATEGORY_ORDER } from "@/components/city-map/category-config";
import { CategoryFilters } from "@/components/city-map/category-filters";
import { CitySearchBar } from "@/components/city-map/city-search-bar";
import { PointInfoCard } from "@/components/city-map/point-info-card";
import { CityMapEmptyState } from "@/components/city-map/empty-state";
import { CityMapLoader } from "@/components/map/city-map-loader";
import { BottomSheet } from "@/components/shared/bottom-sheet";

export function CityMapExperience({ points }: { points: CityServicePoint[] }) {
  const [active, setActive] = useState<Set<CityServiceCategory>>(new Set(CATEGORY_ORDER));
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<CityServicePoint | null>(null);

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

  return (
    <div className="flex h-[75vh] min-h-[560px] w-full overflow-hidden">
      <div className="relative flex-1">
        {hasAnyData ? (
          <CityMapLoader points={visible} onSelectPoint={setSelected} />
        ) : (
          <div className="flex h-full items-center justify-center bg-ink/5 dark:bg-white/5">
            <CityMapEmptyState
              title="No city services added yet"
              description="Check back soon — hospitals, mosques, pharmacies and more will appear here as they're added."
            />
          </div>
        )}

        {hasAnyData && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[15] flex flex-col gap-3 p-4">
            <div className="pointer-events-auto mx-auto w-full max-w-md">
              <CitySearchBar value={query} onChange={setQuery} />
            </div>
            <div className="pointer-events-auto">
              <CategoryFilters counts={counts} active={active} onToggle={toggleCategory} />
            </div>
          </div>
        )}

        {hasAnyData && visible.length === 0 && (
          <div className="pointer-events-none absolute inset-0 z-[12] flex items-center justify-center">
            <div className="pointer-events-auto rounded-2xl bg-white/95 shadow-lg backdrop-blur-sm dark:bg-ink/90">
              <CityMapEmptyState />
            </div>
          </div>
        )}
      </div>

      {/* Desktop side panel */}
      <aside className="hidden w-80 shrink-0 overflow-y-auto border-s border-ink/10 bg-white/95 p-5 dark:border-white/10 dark:bg-ink/95 lg:block">
        {selected ? (
          <PointInfoCard point={selected} />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 py-6 text-center">
            <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
              <MapPin size={20} aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-ink dark:text-white">Tap a marker</p>
            <p className="max-w-[200px] text-xs text-ink/50 dark:text-sand/50">
              Select any pin on the map to see its details here.
            </p>
          </div>
        )}
      </aside>

      <BottomSheet open={selected !== null} onClose={() => setSelected(null)} title={selected?.name}>
        {selected && <PointInfoCard point={selected} />}
      </BottomSheet>
    </div>
  );
}
