import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, Sparkles } from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { EmptyState } from "@/components/shared/empty-state";
import { cityServiceCategoryMeta } from "@/lib/config/city-service-categories";
import type { EssentialServiceCategory } from "@/types";

/**
 * Fully dynamic — `categoryCounts` is already computed from real published
 * listings (getCityServiceCategoryCounts) and only ever contains categories
 * with at least one, sorted by count descending. No category is ever
 * hardcoded here; a brand-new category appears automatically the moment its
 * first listing is published, and disappears the moment its last one isn't.
 */
export async function ExploreHargeisaSection({
  locale,
  categoryCounts,
}: {
  locale: string;
  categoryCounts: { category: EssentialServiceCategory; count: number }[];
}) {
  const t = await getTranslations("home");
  const tCityServices = await getTranslations("cityServices");

  return (
    <section className="py-16 md:py-24">
      <div className="container-px mx-auto">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {t("exploreHargeisaEyebrow")}
            </span>
            <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              {t("exploreHargeisaTitle")}
            </h2>
            <p className="mt-3 text-ink/60 dark:text-sand/60">{t("exploreHargeisaSubtitle")}</p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          {categoryCounts.length === 0 ? (
            <div className="mt-10 md:mt-14">
              <EmptyState
                icon={Sparkles}
                title={t("exploreHargeisaEmptyTitle")}
                description={t("exploreHargeisaEmptyDescription")}
              />
            </div>
          ) : (
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 md:mt-14 lg:grid-cols-3">
              {categoryCounts.map(({ category, count }) => {
                const meta = cityServiceCategoryMeta(category);
                return (
                  <Link
                    key={category}
                    href={`/${locale}/city-services`}
                    className="group flex h-full flex-col rounded-2xl border border-ink/8 bg-white p-6 shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-card dark:border-white/10 dark:bg-white/[0.03] sm:p-7"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 ease-premium group-hover:scale-105">
                      <meta.icon size={26} aria-hidden="true" />
                    </span>
                    <h3 className="mt-5 font-display text-lg font-bold text-ink dark:text-white">{tCityServices(meta.titleKey)}</h3>
                    <p className="mt-1.5 flex-1 text-sm leading-relaxed text-ink/60 dark:text-sand/60">
                      {t("placesCount", { count })}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                      {t("exploreCta")}
                      <ArrowRight size={14} className="transition-transform duration-300 ease-premium group-hover:translate-x-1" aria-hidden="true" />
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
