"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Star, Search } from "lucide-react";
import { ProductDetailModal } from "@/components/shared/product-detail-modal";
import { PRODUCT_CATEGORY_ORDER, PRODUCT_CATEGORY_LABELS, PRODUCT_GENDER_ORDER, PRODUCT_GENDER_LABELS, productCategoryLabel } from "@/lib/config/product-categories";
import { productLocalizedName } from "@/lib/utils/product-i18n";
import type { Product, ProductCategory, ProductGender } from "@/types";

function pillClass(active: boolean) {
  return `rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
    active
      ? "bg-primary text-white"
      : "border border-ink/12 text-ink/70 hover:border-primary hover:text-primary dark:border-white/15 dark:text-sand/70"
  }`;
}

/**
 * Products grid + filters for a Perfume & Cosmetics shop's city-services
 * detail page — only rendered when categories.supports_products is true.
 * Client-side filtering (category/gender/brand) is plenty for the product
 * volume a single shop carries; no new search infra needed. Detail view is
 * a modal (ProductDetailModal), not a new route.
 */
export function ProductsSection({ products, storeName, locale }: { products: Product[]; storeName: string; locale: string }) {
  const t = useTranslations("products");
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "all">("all");
  const [genderFilter, setGenderFilter] = useState<ProductGender | "all">("all");
  const [brandQuery, setBrandQuery] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);

  const visible = useMemo(() => products.filter((p) => !p.isHidden), [products]);

  const categoriesPresent = useMemo(() => {
    const present = new Set(visible.map((p) => p.category).filter((c): c is ProductCategory => !!c));
    return PRODUCT_CATEGORY_ORDER.filter((c) => present.has(c));
  }, [visible]);

  const gendersPresent = useMemo(() => {
    const present = new Set(visible.map((p) => p.gender).filter((g): g is ProductGender => !!g));
    return PRODUCT_GENDER_ORDER.filter((g) => present.has(g));
  }, [visible]);

  const brandsPresent = useMemo(() => {
    const present = new Set(visible.map((p) => p.brand).filter((b): b is string => !!b));
    return Array.from(present).sort();
  }, [visible]);

  const filtered = useMemo(() => {
    const needle = brandQuery.trim().toLowerCase();
    return visible
      .filter((p) => categoryFilter === "all" || p.category === categoryFilter)
      .filter((p) => genderFilter === "all" || p.gender === genderFilter)
      .filter((p) => !needle || (p.brand ?? "").toLowerCase().includes(needle))
      .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder);
  }, [visible, categoryFilter, genderFilter, brandQuery]);

  if (visible.length === 0) return null;

  return (
    <div>
      <div className="mb-5 space-y-3">
        {categoriesPresent.length > 1 && (
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setCategoryFilter("all")} className={pillClass(categoryFilter === "all")}>
              {t("allCategories")}
            </button>
            {categoriesPresent.map((c) => (
              <button key={c} type="button" onClick={() => setCategoryFilter(c)} className={pillClass(categoryFilter === c)}>
                {PRODUCT_CATEGORY_LABELS[c][locale as "en" | "ar" | "so"] ?? PRODUCT_CATEGORY_LABELS[c].en}
              </button>
            ))}
          </div>
        )}

        {(gendersPresent.length > 1 || brandsPresent.length > 0) && (
          <div className="flex flex-wrap items-center gap-3">
            {gendersPresent.length > 1 && (
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={() => setGenderFilter("all")} className={pillClass(genderFilter === "all")}>
                  {t("allGenders")}
                </button>
                {gendersPresent.map((g) => (
                  <button key={g} type="button" onClick={() => setGenderFilter(g)} className={pillClass(genderFilter === g)}>
                    {PRODUCT_GENDER_LABELS[g][locale as "en" | "ar" | "so"] ?? PRODUCT_GENDER_LABELS[g].en}
                  </button>
                ))}
              </div>
            )}
            {brandsPresent.length > 0 && (
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink/40" aria-hidden="true" />
                <input
                  value={brandQuery}
                  onChange={(e) => setBrandQuery(e.target.value)}
                  placeholder={t("searchBrandPlaceholder")}
                  className="rounded-full border border-ink/12 bg-transparent py-2 ps-9 pe-4 text-sm outline-none focus:border-primary dark:border-white/15"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-ink/50 dark:text-sand/50">{t("noProductsMatchFilters")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((product) => {
            const name = productLocalizedName(product, locale);
            return (
              <button
                key={product.id}
                type="button"
                onClick={() => setSelected(product)}
                className="group text-start focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
              >
                <div className="relative aspect-square overflow-hidden rounded-xl2 bg-ink/5 dark:bg-white/5">
                  {product.image && (
                    <Image
                      src={product.image}
                      alt={name}
                      fill
                      sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                  {product.isFeatured && (
                    <span className="absolute start-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-amber-500 text-white">
                      <Star size={13} aria-hidden="true" fill="currentColor" />
                    </span>
                  )}
                  {!product.isAvailable && (
                    <span className="absolute inset-x-0 bottom-0 bg-black/60 py-1 text-center text-xs font-bold text-white">
                      {t("unavailable")}
                    </span>
                  )}
                </div>
                <p className="mt-2 truncate text-sm font-semibold">{name}</p>
                <p className="text-xs text-ink/50 dark:text-sand/50">
                  {product.category ? productCategoryLabel(product.category, locale) : ""}
                  {product.price != null ? ` • ${product.price} ${product.currency}` : ` • ${t("priceOnRequest")}`}
                </p>
              </button>
            );
          })}
        </div>
      )}

      {selected && (
        <ProductDetailModal product={selected} storeName={storeName} locale={locale} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
