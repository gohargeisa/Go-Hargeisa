"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { SearchX, LayoutGrid } from "lucide-react";
import { CityServiceCard } from "@/components/shared/city-service-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchWithin } from "@/components/shared/search-within";
import { Reveal } from "@/components/home/reveal";
import { cityServiceCategoryMeta } from "@/lib/config/city-service-categories";
import type { CityServiceCategoryGroup } from "@/lib/data/city-services";
import type { EssentialServiceCategory } from "@/types";

export function CityServicesPageClient({
  groups,
  locale,
  initialQuery,
}: {
  /** Already filtered to non-empty categories, sorted by listing count
   * descending — see getCityServicesGroupedByCategory. This component never
   * hardcodes which categories exist; it only ever renders what's passed in. */
  groups: CityServiceCategoryGroup[];
  locale: string;
  initialQuery?: string;
}) {
  const t = useTranslations("cityServices");
  const [activeCategory, setActiveCategory] = useState<EssentialServiceCategory | "all">("all");

  const needle = (initialQuery ?? "").trim().toLowerCase();

  const sections = useMemo(() => {
    return groups
      .filter((g) => activeCategory === "all" || activeCategory === g.category)
      .map((g) => {
        const items = g.items.filter(
          (s) => !needle || s.name.toLowerCase().includes(needle) || (s.description ?? "").toLowerCase().includes(needle)
        );
        return { ...g, ...cityServiceCategoryMeta(g.category), items };
      })
      .filter((g) => g.items.length > 0);
  }, [groups, activeCategory, needle]);

  const totalMatches = sections.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4">
        <SearchWithin basePath={`/${locale}/city-services`} placeholder={t("searchPlaceholder")} defaultValue={initialQuery} />

        {groups.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                activeCategory === "all"
                  ? "border-primary bg-primary/10 text-primary-800"
                  : "border-ink/12 text-ink/60 hover:border-primary/40 dark:border-white/15 dark:text-sand/60"
              }`}
            >
              <LayoutGrid size={14} aria-hidden="true" />
              {t("allCategoriesLabel")}
            </button>
            {groups.map((g) => {
              const meta = cityServiceCategoryMeta(g.category);
              return (
                <button
                  key={g.category}
                  type="button"
                  onClick={() => setActiveCategory(g.category)}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                    activeCategory === g.category
                      ? "border-primary bg-primary/10 text-primary-800"
                      : "border-ink/12 text-ink/60 hover:border-primary/40 dark:border-white/15 dark:text-sand/60"
                  }`}
                >
                  <meta.icon size={14} aria-hidden="true" />
                  {t(meta.titleKey)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {totalMatches === 0 ? (
        <EmptyState icon={SearchX} title={t("noMatchTitle")} description={t("noMatchDescription")} className="mt-4" />
      ) : (
        <div className="flex flex-col gap-14">
          {sections.map((s, i) => (
            <Reveal key={s.category} delay={Math.min(i * 0.08, 0.24)}>
              <div>
                <div className="mb-5 flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <s.icon size={19} aria-hidden="true" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-ink dark:text-white">{t(s.titleKey)}</h2>
                  <span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-bold text-ink/40 dark:bg-white/10 dark:text-sand/40">
                    {s.items.length}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {s.items.map((service) => (
                    <CityServiceCard key={service.id} service={service} locale={locale} />
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
