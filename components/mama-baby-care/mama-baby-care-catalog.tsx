"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Reveal } from "@/components/home/reveal";
import { MamaBabyCareProductGrid } from "@/components/mama-baby-care/mama-baby-care-product-grid";
import type { PartnerTheme } from "@/lib/config/partner-themes";
import type { Product, ProductCategory } from "@/types";

function SectionHeading({ eyebrow, title, theme }: { eyebrow: string; title: string; theme: PartnerTheme }) {
  return (
    <div className="mb-8">
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em]"
        style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.08)`, color: theme.primaryStrong }}
      >
        {eyebrow}
      </span>
      <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-[1.75rem]">{title}</h2>
    </div>
  );
}

type CategoryCard = { category: ProductCategory; label: string; count: number; image?: string };

/**
 * Wraps "Featured Categories" + "Shop All Products" in one client component
 * so clicking a category card actually filters the Shop All grid (not just
 * scrolls to it, which is all the two independent server-rendered sections
 * did before). Visual output is unchanged from the original two sections —
 * same markup/classes — the only addition is the shared `activeCategory`
 * state passed to MamaBabyCareProductGrid via `key` (remounts the grid with
 * that category pre-selected; the grid's own pill row still lets the
 * shopper switch categories afterwards).
 */
export function MamaBabyCareCatalog({
  categoryCards,
  products,
  whatsappNumber,
  storeName,
  locale,
  theme,
  featuredSection,
}: {
  categoryCards: CategoryCard[];
  products: Product[];
  whatsappNumber?: string;
  storeName: string;
  locale: string;
  theme: PartnerTheme;
  /** The "Featured Products" section, rendered server-side by the caller and
   * passed through as-is — keeps it between Categories and Shop All (the
   * approved section order) without duplicating that markup here. */
  featuredSection?: ReactNode;
}) {
  const t = useTranslations("mamaBabyCareStorefront");
  const [activeCategory, setActiveCategory] = useState<ProductCategory | "all">("all");

  return (
    <>
      {/* ── FEATURED CATEGORIES ──────────────────────────────────── */}
      {categoryCards.length > 0 && (
        <section id="categories" className="scroll-mt-36 border-b border-ink/8 bg-white dark:border-white/10 dark:bg-white/[0.02]">
          <div className="container-px mx-auto max-w-6xl py-14 sm:py-16">
            <Reveal>
              <SectionHeading eyebrow={t("categoriesEyebrow")} title={t("categoriesTitle")} theme={theme} />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {categoryCards.map(({ category, label, count, image }) => (
                  <a
                    key={category}
                    href="#shop-all"
                    onClick={() => setActiveCategory(category)}
                    aria-current={activeCategory === category ? "true" : undefined}
                    className="group flex flex-col overflow-hidden rounded-xl2 border border-ink/8 bg-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-card dark:border-white/10 dark:bg-white/[0.03]"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-[#FBF7F4] dark:bg-white/[0.04]">
                      {image && (
                        <Image src={image} alt="" fill sizes="(max-width: 640px) 33vw, 160px" className="object-contain p-3 transition-transform duration-500 group-hover:scale-105" />
                      )}
                    </div>
                    <div className="p-2.5 text-center">
                      <p className="truncate text-xs font-semibold sm:text-sm">{label}</p>
                      <p className="text-[11px] text-ink/45 dark:text-sand/45">{t("categoryItemCount", { count })}</p>
                    </div>
                  </a>
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {featuredSection}

      {/* ── SHOP ALL PRODUCTS ────────────────────────────────────── */}
      <section id="shop-all" className="scroll-mt-36 bg-white dark:bg-white/[0.02]">
        <div className="container-px mx-auto max-w-6xl py-14 sm:py-16">
          <Reveal>
            <SectionHeading eyebrow={t("shopAllEyebrow")} title={t("shopAllTitle")} theme={theme} />
            <MamaBabyCareProductGrid
              key={activeCategory}
              products={products}
              whatsappNumber={whatsappNumber}
              storeName={storeName}
              locale={locale}
              accentColor={theme.accentStrong}
              primaryColor={theme.primaryStrong}
              initialCategory={activeCategory}
            />
          </Reveal>
        </div>
      </section>
    </>
  );
}
