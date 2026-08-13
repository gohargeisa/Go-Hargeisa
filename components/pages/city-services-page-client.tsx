"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { SearchX, LayoutGrid } from "lucide-react";
import { CityServiceCard } from "@/components/shared/city-service-card";
import { CityServiceCategoryCard } from "@/components/shared/city-service-category-card";
import { EmptyState } from "@/components/shared/empty-state";
import { SearchWithin } from "@/components/shared/search-within";
import { Reveal } from "@/components/home/reveal";
import { DynamicIcon } from "@/lib/utils/dynamic-icon";
import { categoryDisplayName } from "@/lib/utils/category-href";
import { SERVICE_TAGS_BY_CATEGORY_SLUG, SERVICE_TAG_ICON, type ServiceTagCode } from "@/lib/config/service-tags";
import type { CityServiceCategoryGroup } from "@/lib/data/city-services";
import type { Locale } from "@/lib/i18n/config";

/** Neither "Education" nor "Perfumes & Cosmetics" is a `categories` row —
 * every member slug stays its own real category/business in the database
 * exactly as before. This purely groups members for display (one premium
 * card instead of several), matching the requested "no duplicate top-level
 * cards, no new category data" structure. Add another entry here if a
 * future grouping is needed — no other code needs to change. */
type MergedCategoryKey = "education" | "perfumes-cosmetics";

type MergedCategoryConfig = {
  key: MergedCategoryKey;
  memberSlugs: string[];
  icon: string;
  color: string;
  nameKey: "educationCategoryName" | "perfumesCosmeticsCategoryName";
};

const MERGED_CATEGORIES: MergedCategoryConfig[] = [
  {
    key: "education",
    memberSlugs: ["school", "university", "language-institute"],
    icon: "GraduationCap",
    color: "#16A34A",
    nameKey: "educationCategoryName",
  },
  {
    key: "perfumes-cosmetics",
    memberSlugs: ["perfume-shop", "cosmetics-beauty"],
    icon: "Sparkles",
    color: "#DB2777",
    nameKey: "perfumesCosmeticsCategoryName",
  },
];

const ALL_MERGED_MEMBER_SLUGS = MERGED_CATEGORIES.flatMap((m) => m.memberSlugs);

function mergedCategoryOf(key: string) {
  return MERGED_CATEGORIES.find((m) => m.key === key);
}

/** Cards appear in this order first (only when present — a slug with no
 * published listings is simply skipped, same as today); everything else
 * keeps its existing count-descending order after these. Purely a display
 * concern — doesn't touch `categories.sort_order` in the database. */
const CATEGORY_CARD_PRIORITY = ["hospital", "clinic", "pharmacy", "education", "perfumes-cosmetics", "kids-family"];

/** Bounded, literal Tailwind class strings (safe for the JIT scanner) so a
 * sparse section never reads as "one tiny card lost in a huge empty grid" —
 * column count matches the item count up to 4, and 1–3 item sections get a
 * bounded max-width instead of stretching across the full desktop row. */
function resultsGridClassName(count: number): string {
  if (count <= 1) return "grid max-w-sm gap-4";
  if (count === 2) return "grid max-w-2xl gap-4 sm:grid-cols-2";
  if (count === 3) return "grid max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3";
  return "grid gap-4 sm:grid-cols-2 lg:grid-cols-4";
}

export function CityServicesPageClient({
  groups,
  locale,
  initialQuery,
  initialCategorySlug,
  basePath,
}: {
  /** Already filtered to non-empty, active categories, sorted by listing
   * count descending — see getCityServicesGroupedByCategory. This component
   * never hardcodes which categories exist; it only ever renders what's
   * passed in. */
  groups: CityServiceCategoryGroup[];
  locale: string;
  initialQuery?: string;
  /** Deep-links straight to one category's tab on first render — e.g. a
   * homepage "Hospitals" card links to /city-services?category=hospital.
   * Purely an initial-state seed: once loaded, the existing tab buttons work
   * exactly as before (this is not synced back to the URL on change). */
  initialCategorySlug?: string;
  /** Where the search box submits `?q=`. Defaults to /city-services (this
   * component's original, only caller) — /services reuses this same
   * component against the same city_services data and passes its own path
   * here so search stays on the page the visitor is actually on. */
  basePath?: string;
}) {
  const t = useTranslations("cityServices");
  const tt = useTranslations("serviceTags");
  const [activeCategoryId, setActiveCategoryId] = useState<string | "all" | MergedCategoryKey>(() => {
    if (initialCategorySlug && mergedCategoryOf(initialCategorySlug)) return initialCategorySlug as MergedCategoryKey;
    return groups.find((g) => g.category?.slug === initialCategorySlug)?.category?.id ?? "all";
  });
  const [tagFilter, setTagFilter] = useState<ServiceTagCode | "all">("all");
  const [mergedSubFilter, setMergedSubFilter] = useState<string | "all">("all");

  function selectCategory(id: string | "all" | MergedCategoryKey) {
    setActiveCategoryId(id);
    setTagFilter("all");
    setMergedSubFilter("all");
  }

  const needle = (initialQuery ?? "").trim().toLowerCase();

  const activeMerged = mergedCategoryOf(activeCategoryId);

  // Category + text-search filtering only (no tag filter yet) — this is
  // what tag-pill availability is computed from, same as ProductsSection
  // computing categoriesPresent from its unfiltered `visible` list rather
  // than its already-filtered `filtered` list, so picking a tag narrows the
  // grid without also making the other pills disappear. A merged category
  // (Education, Perfumes & Cosmetics) filters to its member groups (all of
  // them, or just the one picked via mergedSubFilter) rather than one
  // specific category id.
  const textFilteredSections = useMemo(() => {
    return groups
      .filter((g) => {
        if (activeCategoryId === "all") return true;
        if (activeMerged) {
          if (!activeMerged.memberSlugs.includes(g.category?.slug ?? "")) return false;
          return mergedSubFilter === "all" || mergedSubFilter === g.category?.id;
        }
        return activeCategoryId === g.category?.id;
      })
      .map((g) => ({
        ...g,
        items: g.items.filter(
          (s) => !needle || s.name.toLowerCase().includes(needle) || (s.description ?? "").toLowerCase().includes(needle)
        ),
      }));
  }, [groups, activeCategoryId, activeMerged, mergedSubFilter, needle]);

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

  const activeMergedMemberGroups = useMemo(
    () => (activeMerged ? groups.filter((g) => activeMerged.memberSlugs.includes(g.category?.slug ?? "")) : []),
    [groups, activeMerged]
  );

  // Real category cards + one synthetic card per merged grouping (Education,
  // Perfumes & Cosmetics), each replacing the individual cards it groups (no
  // duplicate top-level cards) — reordered to the requested Hospitals/
  // Clinics/Pharmacies/Education/Perfumes & Cosmetics/Kids & Family
  // priority, everything else keeping its existing (count-descending) order
  // after that. Purely a display computation — `groups` itself, and every
  // count/id/slug within it, is untouched.
  const displayCards = useMemo(() => {
    type DisplayCard = {
      key: string;
      slug: string;
      icon: string;
      color?: string;
      name: string;
      count: number;
      active: boolean;
      onSelect: () => void;
    };

    const cards: DisplayCard[] = groups
      .filter((g) => !ALL_MERGED_MEMBER_SLUGS.includes(g.category?.slug ?? ""))
      .map((g) => ({
        key: g.category.id,
        slug: g.category.slug,
        icon: g.category.icon,
        color: g.category.color,
        name: categoryDisplayName(g.category, locale as Locale),
        count: g.items.length,
        active: activeCategoryId === g.category.id,
        onSelect: () => selectCategory(activeCategoryId === g.category.id ? "all" : g.category.id),
      }));

    for (const merged of MERGED_CATEGORIES) {
      const memberGroups = groups.filter((g) => merged.memberSlugs.includes(g.category?.slug ?? ""));
      if (memberGroups.length === 0) continue;
      cards.push({
        key: merged.key,
        slug: merged.key,
        icon: merged.icon,
        color: merged.color,
        name: t(merged.nameKey),
        count: memberGroups.reduce((sum, g) => sum + g.items.length, 0),
        active: activeCategoryId === merged.key,
        onSelect: () => selectCategory(activeCategoryId === merged.key ? "all" : merged.key),
      });
    }

    return cards.sort((a, b) => {
      const ai = CATEGORY_CARD_PRIORITY.indexOf(a.slug);
      const bi = CATEGORY_CARD_PRIORITY.indexOf(b.slug);
      if (ai === -1 && bi === -1) return 0;
      if (ai === -1) return 1;
      if (bi === -1) return -1;
      return ai - bi;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groups, activeCategoryId, locale, t]);

  return (
    <div>
      {displayCards.length > 1 && (
        <div className="mb-10 md:mb-14">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:gap-5 lg:grid-cols-4">
            {displayCards.map((card) => (
              <CityServiceCategoryCard
                key={card.key}
                category={{ slug: card.slug, icon: card.icon, color: card.color }}
                name={card.name}
                description={t(`categoryCardDescription_${card.slug}` as "categoryCardDescription_hospital")}
                count={card.count}
                placesLabel={t("placesCountLabel", { count: card.count })}
                active={card.active}
                onSelect={card.onSelect}
              />
            ))}
          </div>
        </div>
      )}

      <div className="mb-8 flex flex-col gap-4 rounded-xl2 border border-ink/8 bg-white/70 p-4 shadow-soft backdrop-blur-sm dark:border-white/10 dark:bg-white/[0.03] md:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="flex-1">
            <SearchWithin basePath={basePath ?? `/${locale}/city-services`} placeholder={t("searchPlaceholder")} defaultValue={initialQuery} />
          </div>
          {activeCategoryId !== "all" && (
            <button
              type="button"
              onClick={() => selectCategory("all")}
              className="inline-flex shrink-0 items-center gap-1.5 self-start rounded-full border border-primary bg-primary/10 px-4 py-2 text-sm font-semibold text-primary-800 transition-colors hover:bg-primary/15 sm:self-auto"
            >
              <LayoutGrid size={14} aria-hidden="true" />
              {t("allCategoriesLabel")}
            </button>
          )}
        </div>

        {/* A merged category groups two or more real categories (e.g. Schools
            + Universities, Perfumes + Cosmetics) — once selected, let
            visitors narrow to just one member using the same pill pattern as
            the service-tag filters below, reusing each category's own real
            translated name (no new strings). */}
        {activeMerged && activeMergedMemberGroups.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setMergedSubFilter("all")}
              className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                mergedSubFilter === "all"
                  ? "bg-primary text-white"
                  : "border border-ink/12 text-ink/60 hover:border-primary/40 hover:text-primary dark:border-white/15 dark:text-sand/60"
              }`}
            >
              {t("allCategoriesLabel")}
            </button>
            {activeMergedMemberGroups.map((g) => (
              <button
                key={g.category.id}
                type="button"
                onClick={() => setMergedSubFilter(g.category.id)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  mergedSubFilter === g.category.id
                    ? "bg-primary text-white"
                    : "border border-ink/12 text-ink/60 hover:border-primary/40 hover:text-primary dark:border-white/15 dark:text-sand/60"
                }`}
              >
                <DynamicIcon name={g.category.icon} size={12} aria-hidden="true" />
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
                <div className={resultsGridClassName(s.items.length)}>
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
