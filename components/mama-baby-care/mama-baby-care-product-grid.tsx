"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { productCategoryLabel } from "@/lib/config/product-categories";
import { MamaBabyCareProductCard } from "@/components/mama-baby-care/mama-baby-care-product-card";
import type { Product, ProductCategory } from "@/types";

function pillClass(active: boolean, accentColor: string) {
  return `shrink-0 snap-start whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
    active ? "text-white" : "border border-ink/12 text-ink/70 hover:border-current dark:border-white/15 dark:text-sand/70"
  }`;
}

/**
 * "Shop All Products" grid with category filter pills — only categories that
 * actually have products render a pill (never an empty category), per this
 * brief's explicit rule. No search/gender/brand filters (unlike the
 * universal ProductsSection) — this catalog is small enough that category
 * alone is plenty, and brand isn't a customer-facing concept the owner
 * wants foregrounded here.
 */
export function MamaBabyCareProductGrid({
  products,
  whatsappNumber,
  storeName,
  locale,
  accentColor,
  primaryColor,
  initialCategory = "all",
}: {
  products: Product[];
  whatsappNumber?: string;
  storeName: string;
  locale: string;
  accentColor: string;
  primaryColor: string;
  initialCategory?: ProductCategory | "all";
}) {
  const t = useTranslations("mamaBabyCareStorefront");
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "all">(initialCategory);

  const categoriesPresent = useMemo(() => {
    const seen: ProductCategory[] = [];
    for (const p of products) {
      if (p.category && !seen.includes(p.category)) seen.push(p.category);
    }
    return seen;
  }, [products]);

  const filtered = useMemo(() => {
    return products
      .filter((p) => categoryFilter === "all" || p.category === categoryFilter)
      .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder);
  }, [products, categoryFilter]);

  if (products.length === 0) return null;

  return (
    <div>
      {categoriesPresent.length > 1 && (
        <div className="mb-6 flex snap-x snap-proximity gap-2 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap sm:overflow-visible sm:pb-0">
          <button
            type="button"
            onClick={() => setCategoryFilter("all")}
            className={pillClass(categoryFilter === "all", primaryColor)}
            style={categoryFilter === "all" ? { backgroundColor: primaryColor } : undefined}
          >
            {t("allCategories")}
          </button>
          {categoriesPresent.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoryFilter(c)}
              className={pillClass(categoryFilter === c, primaryColor)}
              style={categoryFilter === c ? { backgroundColor: primaryColor } : undefined}
            >
              {productCategoryLabel(c, locale)}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {filtered.map((product) => (
          <MamaBabyCareProductCard
            key={product.id}
            product={product}
            whatsappNumber={whatsappNumber}
            storeName={storeName}
            locale={locale}
            accentColor={accentColor}
          />
        ))}
      </div>
    </div>
  );
}
