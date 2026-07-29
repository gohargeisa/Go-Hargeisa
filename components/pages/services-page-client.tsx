"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { SearchX } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { ServiceCategory } from "@/types";
import { ServiceCard } from "@/components/shared/service-card";
import { SearchWithin } from "@/components/shared/search-within";
import { ListingFilters, type FilterOptions } from "@/components/shared/listing-filters";
import { EmptyState } from "@/components/shared/empty-state";
import { CATEGORY_CONFIG } from "@/components/city-map/category-config";
import { SERVICE_CATEGORY_ORDER, SERVICE_CATEGORY_LABELS, SERVICE_CATEGORY_SLUGS } from "@/lib/utils/service-categories";
import { filterListings } from "@/lib/utils/filter-listings";

interface ServiceListItem {
  id: string;
  slug: string;
  name: string;
  address: string;
  coverImage: string;
  rating: number;
  reviewCount: number;
  services?: string[];
  phone?: string;
  category: ServiceCategory;
  featured?: boolean;
  createdAt?: string;
}

export function ServicesPageClient({
  locale,
  initialServices,
  searchParams,
  /** Fixed category — set on /services/[category] sub-pages. When unset
   * (the /services hub), a category tab bar lets visitors switch between
   * all 8 categories client-side without a full page navigation. */
  category,
}: {
  locale: Locale;
  initialServices: ServiceListItem[];
  searchParams: Record<string, string | undefined>;
  category?: ServiceCategory;
}) {
  const t = useTranslations("listings");
  const [activeCategory, setActiveCategory] = useState<ServiceCategory | "all">(category ?? "all");

  const filters: FilterOptions = useMemo(
    () => ({
      minRating: searchParams.minRating ? parseInt(searchParams.minRating) : undefined,
      sortBy: (searchParams.sortBy as any) || "rating",
    }),
    [searchParams.minRating, searchParams.sortBy]
  );

  const byCategory = useMemo(() => {
    if (category || activeCategory === "all") return initialServices;
    return initialServices.filter((s) => s.category === activeCategory);
  }, [initialServices, activeCategory, category]);

  const filteredServices = useMemo(() => {
    const filtered = filterListings(byCategory, filters);
    const featured = filtered.filter((s) => s.featured);
    const nonFeatured = filtered.filter((s) => !s.featured);
    return { featured, nonFeatured, total: filtered.length };
  }, [byCategory, filters]);

  const basePath = category ? `/${locale}/services/${SERVICE_CATEGORY_SLUGS[category]}` : `/${locale}/services`;

  return (
    <section className="container-px mx-auto py-10 md:py-14">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold md:text-3xl">
            {category ? SERVICE_CATEGORY_LABELS[category] : t("servicesCount", { count: filteredServices.total })}
          </h2>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
            {searchParams.q ? t("resultsFor", { query: searchParams.q }) : t("browseAllServices")}
          </p>
        </div>
      </div>

      {!category && (
        <div className="mb-6 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            aria-pressed={activeCategory === "all"}
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold shadow-sm transition-all duration-300 ${
              activeCategory === "all"
                ? "border-transparent bg-primary text-white"
                : "border-ink/10 bg-white text-ink/70 hover:-translate-y-0.5 hover:border-ink/20 dark:border-white/15 dark:bg-ink/80 dark:text-sand/70"
            }`}
          >
            {t("allServices")}
          </button>
          {SERVICE_CATEGORY_ORDER.map((c) => {
            const meta = CATEGORY_CONFIG[c];
            const Icon = meta.icon;
            const isActive = activeCategory === c;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setActiveCategory(c)}
                aria-pressed={isActive}
                className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-2 text-xs font-semibold shadow-sm transition-all duration-300 ${
                  isActive ? "border-transparent text-white" : "border-ink/10 bg-white text-ink/70 hover:-translate-y-0.5 hover:border-ink/20 dark:border-white/15 dark:bg-ink/80 dark:text-sand/70"
                }`}
                style={isActive ? { backgroundColor: meta.color } : undefined}
              >
                <Icon size={13} aria-hidden="true" />
                {meta.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="mb-6">
        <SearchWithin basePath={basePath} placeholder={t("searchServicesPlaceholder")} defaultValue={searchParams.q} />
      </div>

      {filteredServices.total === 0 ? (
        <EmptyState icon={SearchX} title={t("noServicesMatch")} description={t("adjustFilters")} className="mt-12" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <div className="lg:sticky lg:top-24 lg:h-fit">
            <ListingFilters locale={locale} maxPrice={500} />
          </div>

          <div>
            {filteredServices.featured.length > 0 && (
              <div className="mb-12">
                <div className="mb-6">
                  <h3 className="font-display text-xl font-bold">{t("featuredServices")}</h3>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {filteredServices.featured.map((s) => (
                    <ServiceCard
                      key={s.id}
                      href={`/${locale}/services/${SERVICE_CATEGORY_SLUGS[s.category]}/${s.slug}`}
                      image={s.coverImage}
                      name={s.name}
                      address={s.address}
                      rating={s.rating}
                      reviewCount={s.reviewCount}
                      services={s.services}
                      phone={s.phone}
                      category={s.category}
                      featured
                      serviceId={s.id}
                      locale={locale}
                    />
                  ))}
                </div>
              </div>
            )}

            {filteredServices.nonFeatured.length > 0 && (
              <div>
                <div className="mb-6">
                  <h3 className="font-display text-xl font-bold">{t("allServices")}</h3>
                  <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
                    {t("availableServices", { count: filteredServices.nonFeatured.length })}
                  </p>
                </div>
                <div className="grid gap-6 sm:grid-cols-2">
                  {filteredServices.nonFeatured.map((s) => (
                    <ServiceCard
                      key={s.id}
                      href={`/${locale}/services/${SERVICE_CATEGORY_SLUGS[s.category]}/${s.slug}`}
                      image={s.coverImage}
                      name={s.name}
                      address={s.address}
                      rating={s.rating}
                      reviewCount={s.reviewCount}
                      services={s.services}
                      phone={s.phone}
                      category={s.category}
                      serviceId={s.id}
                      locale={locale}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
