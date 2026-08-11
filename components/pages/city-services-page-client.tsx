"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { SearchX, LayoutGrid } from "lucide-react";
import { CityServiceCard } from "@/components/shared/city-service-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchWithin } from "@/components/shared/search-within";
import { Reveal } from "@/components/home/reveal";
import { DynamicIcon } from "@/lib/utils/dynamic-icon";
import { categoryDisplayName } from "@/lib/utils/category-href";
import { SERVICE_TAGS_BY_CATEGORY_SLUG, SERVICE_TAG_ICON, type ServiceTagCode } from "@/lib/config/service-tags";
import type { CityServiceCategoryGroup } from "@/lib/data/city-services";
import type { Locale } from "@/lib/i18n/config";

export function CityServicesPageClient({
  groups,
  locale,
  initialQuery,
  basePath,
}: {
  /** Already filtered to non-empty, active categories, sorted by listing
   * count descending — see getCityServicesGroupedByCategory. This component
   * never hardcodes which categories exist; it only ever renders what's
   * passed in. */
  groups: CityServiceCategoryGroup[];
  locale: string;
  initialQuery?: string;
  /** Where the search box submits `?q=`. Defaults to /city-services (this
   * component's original, only caller) — /services reuses this same
   * component against the same city_services data and passes its own path
   * here so search stays on the page the visitor is actually on. */
  basePath?: string;
}) {
  const t = useTranslations("cityServices");
  const tt = useTranslations("serviceTags");
  const [activeCategoryId, setActiveCategoryId] = useState<string | "all">("all");
  const [tagFilter, setTagFilter] = useState<ServiceTagCode | "all">("all");

  function selectCategory(id: string | "all") {
    setActiveCategoryId(id);
    setTagFilter("all");
  }

  const needle = (initialQuery ?? "").trim().toLowerCase();

  // Category + text-search filtering only (no tag filter yet) — this is
  // what tag-pill availability is computed from, same as ProductsSection
  // computing categoriesPresent from its unfiltered `visible` list rather
  // than its already-filtered `filtered` list, so picking a tag narrows the
  // grid without also making the other pills disappear.
  const textFilteredSections = useMemo(() => {
    return groups
      .filter((g) => activeCategoryId === "all" || activeCategoryId === g.category?.id)
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (s) => !needle || s.name.toLowerCase().includes(needle) || (s.description ?? "").toLowerCase().includes(needle)
        ),
      }));
  }, [groups, activeCategoryId, needle]);

  // Only meaningful when exactly one category is active — the "all
  // categories" view never shows tag pills, same as ProductsSection only
  // showing category pills once you're looking at one store's catalog.
  const activeCategorySlug = activeCategoryId === "all" ? undefined : groups.find((g) => g.category?.id === activeCategoryId)?.category?.slug;
  const tagsPresent = useMemo(() => {
    const availableTags = activeCategorySlug ? SERVICE_TAGS_BY_CATEGORY_SLUG[activeCategorySlug] ?? [] : [];
    if (availableTags.length === 0) return [];
    const present = new Set(textFilteredSections.flatMap((g) => g.items).flatMap((s) => s.serviceTags ?? []));
    return availableTags.filter((code) => present.has(code));
  }, [activeCategorySlug, textFilteredSections]);

  const sections = useMemo(() => {
    return textFilteredSections
      .map((g) => ({
        ...g,
        items: g.items.filter((s) => tagFilter === "all" || (s.serviceTags ?? []).includes(tagFilter)),
      }))
      .filter((g) => g.items.length > 0);
  }, [textFilteredSections, tagFilter]);

  const totalMatches = sections.reduce((sum, s) => sum + s.items.length, 0);

  return (
    <div>
      <div className="mb-8 flex flex-col gap-4">
        <SearchWithin basePath={basePath ?? `/${locale}/city-services`} placeholder={t("searchPlaceholder")} defaultValue={initialQuery} />

        {groups.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => selectCategory("all")}
              className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                activeCategoryId === "all"
                  ? "border-primary bg-primary/10 text-primary-800"
                  : "border-ink/12 text-ink/60 hover:border-primary/40 dark:border-white/15 dark:text-sand/60"
              }`}
            >
              <LayoutGrid size={14} aria-hidden="true" />
              {t("allCategoriesLabel")}
            </button>
            {groups.map((g) => (
              <button
                key={g.category.id}
                type="button"
                onClick={() => selectCategory(g.category.id)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  activeCategoryId === g.category.id
                    ? "border-primary bg-primary/10 text-primary-800"
                    : "border-ink/12 text-ink/60 hover:border-primary/40 dark:border-white/15 dark:text-sand/60"
                }`}
              >
                <DynamicIcon name={g.category.icon} size={14} aria-hidden="true" />
                {categoryDisplayName(g.category, locale as Locale)}
              </button>
            ))}
          </div>
        )}

        {tagsPresent.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setTagFilter("all")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                tagFilter === "all"
                  ? "bg-primary text-white"
                  : "border border-ink/12 text-ink/60 hover:border-primary/40 hover:text-primary dark:border-white/15 dark:text-sand/60"
              }`}
            >
              {t("allServiceTagsLabel")}
            </button>
            {tagsPresent.map((code) => {
              const Icon = SERVICE_TAG_ICON[code];
              return (
                <button
                  key={code}
                  type="button"
                  onClick={() => setTagFilter(code)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                    tagFilter === code
                      ? "bg-primary text-white"
                      : "border border-ink/12 text-ink/60 hover:border-primary/40 hover:text-primary dark:border-white/15 dark:text-sand/60"
                  }`}
                >
                  <Icon size={12} aria-hidden="true" />
                  {tt(code)}
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
            <Reveal key={s.category.id} delay={Math.min(i * 0.08, 0.24)}>
              <div>
                <div className="mb-5 flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <DynamicIcon name={s.category.icon} size={19} aria-hidden="true" />
                  </div>
                  <h2 className="font-display text-2xl font-bold text-ink dark:text-white">{categoryDisplayName(s.category, locale as Locale)}</h2>
                  <span className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-bold text-ink/40 dark:bg-white/10 dark:text-sand/40">
                    {s.items.length}
                  </span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {s.items.map((service) => (
                    <CityServiceCard key={service.id} service={service} category={s.category} locale={locale} />
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
