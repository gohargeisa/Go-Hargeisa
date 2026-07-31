"use client";

import { useTranslations } from "next-intl";
import { Reveal } from "@/components/home/reveal";
import { ATTRACTION_CATEGORIES } from "@/lib/config/attraction-categories";

export function AttractionCategories({
  counts,
  activeCategory,
  onSelectCategory,
}: {
  counts: Record<string, number>;
  activeCategory: string;
  onSelectCategory: (category: string) => void;
}) {
  const tp = useTranslations("attractionsPage");
  const categories = ATTRACTION_CATEGORIES.filter((c) => (counts[c.value] ?? 0) > 0);
  if (categories.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
      {categories.map(({ value, labelKey, icon: Icon }, i) => {
        const active = activeCategory === value;
        return (
          <Reveal key={value} delay={i * 0.06}>
            <button
              type="button"
              onClick={() => onSelectCategory(active ? "" : value)}
              aria-pressed={active}
              className={`group relative flex h-full w-full flex-col items-center gap-3 overflow-hidden rounded-xl3 border p-6 text-center transition-all duration-300 ease-premium hover:-translate-y-1.5 ${
                active
                  ? "border-primary bg-primary/10 shadow-card"
                  : "border-ink/8 bg-white shadow-soft hover:border-primary/30 hover:shadow-card dark:border-white/10 dark:bg-white/[0.03]"
              }`}
            >
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${
                  active ? "bg-primary text-white" : "bg-primary/10 text-primary"
                }`}
              >
                <Icon size={24} aria-hidden="true" />
              </span>
              <span className="font-display text-base font-semibold text-ink dark:text-white">
                {tp(labelKey)}
              </span>
              <span className="text-xs font-medium text-ink/50 dark:text-sand/50">
                {tp("categoryCount", { count: counts[value] ?? 0 })}
              </span>
            </button>
          </Reveal>
        );
      })}
    </div>
  );
}
