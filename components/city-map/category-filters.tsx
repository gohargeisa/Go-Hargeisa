"use client";

import { CATEGORY_CONFIG, CATEGORY_ORDER } from "@/components/city-map/category-config";
import type { CityServiceCategory } from "@/types";

export function CategoryFilters({
  counts,
  active,
  onToggle,
}: {
  counts: Record<CityServiceCategory, number>;
  active: Set<CityServiceCategory>;
  onToggle: (category: CityServiceCategory) => void;
}) {
  return (
    <div
      className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none sm:flex-wrap sm:overflow-visible sm:px-0"
      role="group"
      aria-label="Filter by category"
    >
      {CATEGORY_ORDER.map((category) => {
        const meta = CATEGORY_CONFIG[category];
        const Icon = meta.icon;
        const isActive = active.has(category);
        const count = counts[category] ?? 0;

        return (
          <button
            key={category}
            type="button"
            onClick={() => onToggle(category)}
            aria-pressed={isActive}
            disabled={count === 0}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold shadow-sm backdrop-blur-xl transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-40 ${
              isActive
                ? "border-transparent text-white"
                : "border-ink/10 bg-white/90 text-ink/70 hover:-translate-y-0.5 hover:border-ink/20 dark:border-white/15 dark:bg-ink/80 dark:text-sand/70"
            }`}
            style={isActive ? { backgroundColor: meta.color } : undefined}
          >
            <Icon size={14} aria-hidden="true" />
            {meta.label}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                isActive ? "bg-white/25" : "bg-ink/8 dark:bg-white/15"
              }`}
            >
              {count}
            </span>
          </button>
        );
      })}
    </div>
  );
}
