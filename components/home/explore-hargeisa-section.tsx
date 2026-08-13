import { getTranslations } from "next-intl/server";
import { Sparkles } from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { ViewAllButton } from "@/components/home/view-all-button";
import { EmptyState } from "@/components/shared/empty-state";
import { PremiumCategoryCard } from "@/components/home/premium-category-card";
import type { Locale } from "@/lib/i18n/config";
import type { Category } from "@/types";

/**
 * Every non-hotel/restaurant/cafe category (Hospitals, Pharmacies, Schools,
 * Real Estate, Electronics, ...) gets its own premium card here, each
 * linking straight to its own listing page via categoryHref() — replacing
 * the old design where every City Services category was a small icon tile
 * that all pointed at the same flat /city-services URL. `categories` is
 * fully dynamic (already-counted, already filtered to >0 by the caller);
 * nothing here is a fixed list.
 */
export async function ExploreHargeisaSection({
  locale,
  categories,
}: {
  locale: Locale;
  categories: Category[];
}) {
  const t = await getTranslations("home");

  return (
    <section className="py-16 md:py-24">
      <div className="container-px mx-auto">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary-800">
              {t("exploreHargeisaEyebrow")}
            </span>
            <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              {t("exploreHargeisaTitle")}
            </h2>
            <p className="mt-3 text-ink/60 dark:text-sand/60">{t("exploreHargeisaSubtitle")}</p>
          </div>
        </Reveal>

        {categories.length === 0 ? (
          <div className="mt-10 md:mt-14">
            <EmptyState
              icon={Sparkles}
              title={t("exploreHargeisaEmptyTitle")}
              description={t("exploreHargeisaEmptyDescription")}
            />
          </div>
        ) : (
          <>
            <Reveal delay={0.1}>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 md:mt-14 lg:grid-cols-3">
                {categories.map((category) => (
                  <PremiumCategoryCard key={category.id} category={category} locale={locale} />
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <ViewAllButton href={`/${locale}/city-services`} label={t("viewAllServicesButton")} />
            </Reveal>
          </>
        )}
      </div>
    </section>
  );
}
