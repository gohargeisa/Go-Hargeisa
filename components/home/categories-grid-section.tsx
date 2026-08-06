import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { DynamicIcon } from "@/lib/utils/dynamic-icon";
import { categoryHref, categoryDisplayName } from "@/lib/utils/category-href";
import type { Locale } from "@/lib/i18n/config";
import type { Category } from "@/types";

/**
 * Fully database-driven "browse by category" grid — every active,
 * feature-flag-visible category (lib/data/categories.ts
 * getVisibleCategoriesWithCounts) gets a card automatically; nothing here
 * is a fixed list. A brand-new admin-created category appears the moment
 * it's activated, no code change required.
 */
export async function CategoriesGridSection({ locale, categories }: { locale: Locale; categories: Category[] }) {
  if (categories.length === 0) return null;

  const t = await getTranslations("home");

  return (
    <section className="py-16 md:py-24">
      <div className="container-px mx-auto">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary">
              {t("browseCategoriesEyebrow")}
            </span>
            <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              {t("browseCategoriesTitle")}
            </h2>
            <p className="mt-3 text-ink/60 dark:text-sand/60">{t("browseCategoriesSubtitle")}</p>
          </div>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 md:mt-14 md:gap-5 lg:grid-cols-4 xl:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={categoryHref(locale, category)}
                className="group flex h-full flex-col rounded-2xl border border-ink/8 bg-white p-5 shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-card dark:border-white/10 dark:bg-white/[0.03]"
              >
                <span
                  className="flex h-12 w-12 items-center justify-center rounded-2xl text-white transition-transform duration-300 ease-premium group-hover:scale-105"
                  style={{ backgroundColor: category.color || "var(--color-primary, #0B5ED7)" }}
                  aria-hidden="true"
                >
                  <DynamicIcon name={category.icon} size={22} />
                </span>
                <h3 className="mt-4 line-clamp-1 font-display text-base font-bold text-ink dark:text-white">
                  {categoryDisplayName(category, locale)}
                </h3>
                <p className="mt-1 flex-1 text-sm text-ink/55 dark:text-sand/55">
                  {t("placesCount", { count: category.businessCount ?? 0 })}
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  {t("exploreCta")}
                  <ArrowRight size={13} className="transition-transform duration-300 ease-premium group-hover:translate-x-1" aria-hidden="true" />
                </span>
              </Link>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-8 text-center">
            <Link
              href={`/${locale}/services`}
              className="inline-flex items-center gap-2 rounded-full border border-ink/12 px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/15 dark:text-white"
            >
              <LayoutGrid size={15} aria-hidden="true" />
              {t("browseAllCategoriesCta")}
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
