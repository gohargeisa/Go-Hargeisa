"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { ProductDetailModal } from "@/components/shared/product-detail-modal";
import { ProductCard } from "@/components/shared/product-card";
import { PRODUCT_GENDER_ORDER, PRODUCT_GENDER_LABELS, productCategoryLabel } from "@/lib/config/product-categories";
import type { AddToCartBusiness } from "@/lib/cart/cart-context";
import type { Product, ProductCategory, ProductGender } from "@/types";

function pillClass(active: boolean) {
  return `shrink-0 snap-start whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
    active
      ? "bg-primary text-white"
      : "border border-ink/12 text-ink/70 hover:border-primary hover:text-primary dark:border-white/15 dark:text-sand/70"
  }`;
}

/**
 * Universal products grid + filters — Restaurant menus, Café menus, Flower
 * Shop bouquets, Perfume Shop bottles, any future vertical, only rendered
 * when the listing is orderable. Client-side filtering (category/gender/
 * brand) is plenty for the product volume a single business carries; no new
 * search infra needed. Detail view is a modal (ProductDetailModal), not a
 * new route. `business` carries the shared add-on vocabulary and cart
 * identity every ProductCard/ProductDetailModal's Add to Cart button needs.
 */
export function ProductsSection({
  products,
  storeName,
  business,
  locale,
}: {
  products: Product[];
  storeName: string;
  business: AddToCartBusiness;
  locale: string;
}) {
  const t = useTranslations("products");
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "all">("all");
  const [genderFilter, setGenderFilter] = useState<ProductGender | "all">("all");
  const [brandQuery, setBrandQuery] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);

  const visible = useMemo(() => products.filter((p) => !p.isHidden), [products]);

  // Category vocabulary is free text (any business can use its own) — the
  // filter pills are whatever categories this product list actually has,
  // in first-appearance order, not a fixed enum.
  const categoriesPresent = useMemo(() => {
    const seen: ProductCategory[] = [];
    for (const p of visible) {
      if (p.category && !seen.includes(p.category)) seen.push(p.category);
    }
    return seen;
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
          <div className="flex snap-x snap-proximity gap-2 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap sm:overflow-visible sm:pb-0">
            <button type="button" onClick={() => setCategoryFilter("all")} className={pillClass(categoryFilter === "all")}>
              {t("allCategories")}
            </button>
            {categoriesPresent.map((c) => (
              <button key={c} type="button" onClick={() => setCategoryFilter(c)} className={pillClass(categoryFilter === c)}>
                {productCategoryLabel(c, locale)}
              </button>
            ))}
          </div>
        )}

        {(gendersPresent.length > 1 || brandsPresent.length > 0) && (
          <div className="flex flex-wrap items-center gap-3">
            {gendersPresent.length > 1 && (
              <div className="flex snap-x snap-proximity gap-2 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap sm:overflow-visible sm:pb-0">
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
          {filtered.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              business={business}
              locale={locale}
              onOpenDetails={() => setSelected(product)}
              variant="compact"
            />
          ))}
        </div>
      )}

      {selected && (
        <ProductDetailModal product={selected} storeName={storeName} business={business} locale={locale} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
