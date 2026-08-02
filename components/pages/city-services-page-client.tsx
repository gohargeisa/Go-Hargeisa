"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { SearchX, LayoutGrid } from "lucide-react";
import { CityServiceCard } from "@/components/shared/city-service-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchWithin } from "@/components/shared/search-within";
import { Reveal } from "@/components/home/reveal";
import { CITY_SERVICE_CATEGORIES } from "@/lib/config/city-service-categories";
import type { CityService, EssentialServiceCategory } from "@/types";

export function CityServicesPageClient({
  servicesByCategory,
  locale,
  initialQuery,
}: {
  servicesByCategory: Record<EssentialServiceCategory, CityService[]>;
  locale: string;
  initialQuery?: string;
}) {
  const t = useTranslations("cityServices");
  const [activeCategory, setActiveCategory] = useState<EssentialServiceCategory | "all">("all");

  const availableCategories = useMemo(
    () => CITY_SERVICE_CATEGORIES.filter((c) => servicesByCategory[c.key].length > 0),
    [servicesByCategory]
  );

  const needle = (initialQuery ?? "").trim().toLowerCase();

  const sections = useMemo(() => {
    return availableCategories
      .filter((c) => activeCategory === "all" || activeCategory === c.key)
      .map((c) => {
        const items = servicesByCategory[c.key].filter(
          (s) => !needle || s.name.toLowerCase().includes(needle) || (s.description ?? "").toLowerCase().includes(needle)
        );
        return { ...c, items };
      })
      .filter((c) => c.items.length > 0);
  }, [availableCategories, activeCategory, servicesByCategory, needle]);

  const totalMatches = sections.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4">
        <SearchWithin basePath={`/${locale}/city-services`} placeholder={t("searchPlaceholder")} defaultValue={initialQuery} />

        {availableCategories.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setActiveCategory("all")}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                activeCategory === "all"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-ink/12 text-ink/60 hover:border-primary/40 dark:border-white/15 dark:text-sand/60"
              }`}
            >
              <LayoutGrid size={14} aria-hidden="true" />
              {t("allCategoriesLabel")}
            </button>
            {availableCategories.map((c) => (
              <button
                key={c.key}
                type="button"
                onClick={() => setActiveCategory(c.key)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  activeCategory === c.key
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-ink/12 text-ink/60 hover:border-primary/40 dark:border-white/15 dark:text-sand/60"
                }`}
              >
                <c.icon size={14} aria-hidden="true" />
                {t(c.titleKey)}
              </button>
            ))}
          </div>
        )}
      </div>

      {totalMatches === 0 ? (
        <EmptyState icon={SearchX} title={t("noMatchTitle")} description={t("noMatchDescription")} className="mt-4" />
      ) : (
        <div className="flex flex-col gap-14">
          {sections.map((s, i) => (
            <Reveal key={s.key} delay={Math.min(i * 0.08, 0.24)}>
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
                    <CityServiceCard key={service.id} service={service} />
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
