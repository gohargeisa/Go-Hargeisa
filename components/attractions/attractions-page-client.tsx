"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { SearchX } from "lucide-react";
import type { Attraction } from "@/types";
import type { Locale } from "@/lib/i18n/config";
import { EmptyState } from "@/components/shared/empty-state";
import { Reveal } from "@/components/home/reveal";
import { regionFromAddress, ATTRACTION_CATEGORIES } from "@/lib/config/attraction-categories";
import { AttractionsToolbar } from "./attractions-toolbar";
import { AttractionsStats } from "./attractions-stats";
import { AttractionsEmptyState } from "./attractions-empty-state";
import { AttractionCard } from "./attraction-card";
import { AttractionCategories } from "./attraction-categories";
import { AttractionsMapLoader } from "./attractions-map-loader";

export type AttractionSortOption = "recommended" | "rating" | "reviews" | "name";

export function AttractionsPageClient({ locale, attractions }: { locale: Locale; attractions: Attraction[] }) {
  const t = useTranslations("listings");
  const tp = useTranslations("attractionsPage");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState<AttractionSortOption>("recommended");
  const [minRating, setMinRating] = useState(0);
  const [region, setRegion] = useState("");

  const categoryOptions = useMemo(() => {
    const present = new Set(attractions.map((a) => a.category));
    return ATTRACTION_CATEGORIES.filter((c) => present.has(c.value)).map((c) => ({
      value: c.value,
      label: tp(c.labelKey),
    }));
  }, [attractions, tp]);

  const regionOptions = useMemo(
    () => Array.from(new Set(attractions.map((a) => regionFromAddress(a.address)))).sort(),
    [attractions]
  );

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const a of attractions) counts[a.category] = (counts[a.category] ?? 0) + 1;
    return counts;
  }, [attractions]);

  const filtered = useMemo(() => {
    let results = [...attractions];

    if (search) {
      const needle = search.toLowerCase();
      results = results.filter(
        (a) => a.name.toLowerCase().includes(needle) || a.shortDescription.toLowerCase().includes(needle)
      );
    }
    if (category) results = results.filter((a) => a.category === category);
    if (minRating > 0) results = results.filter((a) => a.rating >= minRating);
    if (region) results = results.filter((a) => regionFromAddress(a.address) === region);

    switch (sort) {
      case "rating":
        results.sort((a, b) => b.rating - a.rating);
        break;
      case "reviews":
        results.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case "name":
        results.sort((a, b) => a.name.localeCompare(b.name));
        break;
      default:
        results.sort((a, b) => Number(b.featured ?? false) - Number(a.featured ?? false) || b.rating - a.rating);
    }

    return results;
  }, [attractions, search, category, sort, minRating, region]);

  const hasActiveFilters = Boolean(search || category || minRating > 0 || region);

  function clearAll() {
    setSearch("");
    setCategory("");
    setSort("recommended");
    setMinRating(0);
    setRegion("");
  }

  const stats = useMemo(
    () => ({
      total: attractions.length,
      categoryCount: new Set(attractions.map((a) => a.category)).size,
      topRatedCount: attractions.filter((a) => a.rating >= 4.5).length,
      reviewCount: attractions.reduce((sum, a) => sum + a.reviewCount, 0),
    }),
    [attractions]
  );

  const featured = useMemo(() => attractions.filter((a) => a.featured), [attractions]);

  const mapPoints = useMemo(
    () =>
      filtered.map((a) => ({
        id: a.id,
        href: `/${locale}/attractions/${a.slug}`,
        name: a.name,
        image: a.coverImage,
        rating: a.rating,
        location: a.location,
      })),
    [filtered, locale]
  );

  if (attractions.length === 0) {
    return (
      <section className="container-px mx-auto py-10 md:py-14">
        <AttractionsEmptyState locale={locale} />
      </section>
    );
  }

  return (
    <>
      <section id="attractions-grid" className="container-px mx-auto scroll-mt-24 py-10 md:py-14">
        <Reveal className="mb-8">
          <AttractionsToolbar
            search={search}
            onSearchChange={setSearch}
            category={category}
            onCategoryChange={setCategory}
            categoryOptions={categoryOptions}
            sort={sort}
            onSortChange={setSort}
            minRating={minRating}
            onMinRatingChange={setMinRating}
            region={region}
            onRegionChange={setRegion}
            regionOptions={regionOptions}
            hasActiveFilters={hasActiveFilters}
            onClearAll={clearAll}
          />
        </Reveal>

        <div className="mb-10">
          <AttractionsStats
            total={stats.total}
            categoryCount={stats.categoryCount}
            topRatedCount={stats.topRatedCount}
            reviewCount={stats.reviewCount}
          />
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={SearchX} title={t("noAttractionsMatch")} description={t("adjustFilters")} className="mt-4" />
        ) : (
          <Reveal delay={0.08}>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((a) => (
                <AttractionCard
                  key={a.id}
                  href={`/${locale}/attractions/${a.slug}`}
                  image={a.coverImage}
                  name={a.name}
                  address={a.address}
                  rating={a.rating}
                  reviewCount={a.reviewCount}
                  category={a.category}
                  shortDescription={a.shortDescription}
                  openingHours={a.openingHours}
                  visitDuration={a.visitDuration}
                  entryTag={a.entryFee === "Free" ? t("freeEntry") : a.entryFee ?? undefined}
                  featured={a.featured}
                  attractionId={a.id}
                  locale={locale}
                  location={a.location}
                />
              ))}
            </div>
          </Reveal>
        )}
      </section>

      <section className="container-px mx-auto py-6 md:py-10">
        <Reveal>
          <div className="mx-auto mb-10 max-w-2xl text-center md:mb-12">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {tp("categoriesEyebrow")}
            </span>
            <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              {tp("categoriesTitle")}
            </h2>
            <p className="mt-2 text-ink/60 dark:text-sand/60">{tp("categoriesSubtitle")}</p>
          </div>
        </Reveal>
        <AttractionCategories counts={categoryCounts} activeCategory={category} onSelectCategory={setCategory} />
      </section>

      {featured.length > 0 && (
        <section className="bg-white py-16 dark:bg-white/[0.03] md:py-24">
          <div className="container-px mx-auto">
            <Reveal>
              <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
                <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                  {tp("featuredEyebrow")}
                </span>
                <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
                  {tp("featuredTitle")}
                </h2>
                <p className="mt-2 text-ink/60 dark:text-sand/60">{tp("featuredSubtitle")}</p>
              </div>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((a) => (
                  <AttractionCard
                    key={a.id}
                    href={`/${locale}/attractions/${a.slug}`}
                    image={a.coverImage}
                    name={a.name}
                    address={a.address}
                    rating={a.rating}
                    reviewCount={a.reviewCount}
                    category={a.category}
                    shortDescription={a.shortDescription}
                    openingHours={a.openingHours}
                    visitDuration={a.visitDuration}
                    entryTag={a.entryFee === "Free" ? t("freeEntry") : a.entryFee ?? undefined}
                    featured
                    size="lg"
                    attractionId={a.id}
                    locale={locale}
                    location={a.location}
                  />
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <section id="attractions-map" className="container-px mx-auto scroll-mt-24 py-16 md:py-24">
        <Reveal>
          <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {tp("mapEyebrow")}
            </span>
            <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              {tp("mapTitle")}
            </h2>
            <p className="mt-2 text-ink/60 dark:text-sand/60">{tp("mapSubtitle")}</p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <div className="h-[28rem] w-full overflow-hidden rounded-xl3 border border-ink/8 shadow-soft dark:border-white/10 md:h-[32rem]">
            <AttractionsMapLoader points={mapPoints} openDetailsLabel={tp("mapOpenDetails")} />
          </div>
        </Reveal>
      </section>
    </>
  );
}
