"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Search } from "lucide-react";
import { ProductDetailModal } from "@/components/shared/product-detail-modal";
import { ProductCard } from "@/components/shared/product-card";
import { SecondaryButton } from "@/components/shared/buttons";
import { usePaginatedProducts } from "@/lib/hooks/use-paginated-products";
import { PRODUCT_GENDER_ORDER, PRODUCT_GENDER_LABELS, productCategoryLabel } from "@/lib/config/product-categories";
import type { AddToCartBusiness } from "@/lib/cart/cart-context";
import type { Product, ProductCategory, ProductGender } from "@/types";

const PAGE_SIZE = 48;

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
 * when the listing is orderable. Detail view is a modal
 * (ProductDetailModal), not a new route.
 *
 * `initialProducts`/`initialTotal` are the FIRST page only (see
 * getProductsPageForListing) — a listing whose catalog outgrew "a single
 * business's product volume" (Excellence Café's menu, at ~780KB of shipped
 * HTML, was a measured real example) no longer ships its whole catalog on
 * every page load. Category/gender/brand-search changes and "Load More"
 * re-query the server for exactly the rows needed (usePaginatedProducts →
 * /api/products) instead of re-filtering an in-memory copy of everything.
 * `facets` (the full set of category/gender/brand values across the WHOLE
 * catalog) comes from a separate, much lighter query so the filter pills
 * still reflect items that haven't loaded yet.
 */
export function ProductsSection({
  initialProducts,
  initialTotal,
  facets,
  storeName,
  business,
  locale,
}: {
  initialProducts: Product[];
  initialTotal: number;
  facets: { categories: ProductCategory[]; genders: ProductGender[]; brands: string[] };
  storeName: string;
  business: AddToCartBusiness;
  locale: string;
}) {
  const t = useTranslations("products");
  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "all">("all");
  const [genderFilter, setGenderFilter] = useState<ProductGender | "all">("all");
  const [brandInput, setBrandInput] = useState("");
  const [brandQuery, setBrandQuery] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);

  // Debounced brand search — a fetch on every keystroke would be a real
  // "repeated Supabase requests" problem; 350ms after the visitor stops
  // typing is enough to feel instant without querying per character.
  useEffect(() => {
    const id = setTimeout(() => setBrandQuery(brandInput.trim()), 350);
    return () => clearTimeout(id);
  }, [brandInput]);

  const { items, loading, hasMore, loadMore } = usePaginatedProducts({
    listingId: business.listingId,
    listingType: business.listingType,
    initialItems: initialProducts,
    initialTotal,
    pageSize: PAGE_SIZE,
    filters: {
      category: categoryFilter === "all" ? undefined : categoryFilter,
      gender: genderFilter,
      brandQuery,
    },
  });

  const gendersPresent = useMemo(() => PRODUCT_GENDER_ORDER.filter((g) => facets.genders.includes(g)), [facets.genders]);

  if (initialTotal === 0) return null;

  return (
    <div>
      <div className="mb-5 space-y-3">
        {facets.categories.length > 1 && (
          <div className="flex snap-x snap-proximity gap-2 overflow-x-auto pb-1 scrollbar-none sm:flex-wrap sm:overflow-visible sm:pb-0">
            <button type="button" onClick={() => setCategoryFilter("all")} className={pillClass(categoryFilter === "all")}>
              {t("allCategories")}
            </button>
            {facets.categories.map((c) => (
              <button key={c} type="button" onClick={() => setCategoryFilter(c)} className={pillClass(categoryFilter === c)}>
                {productCategoryLabel(c, locale)}
              </button>
            ))}
          </div>
        )}

        {(gendersPresent.length > 1 || facets.brands.length > 0) && (
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
            {facets.brands.length > 0 && (
              <div className="relative">
                <Search size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink/40" aria-hidden="true" />
                <input
                  value={brandInput}
                  onChange={(e) => setBrandInput(e.target.value)}
                  placeholder={t("searchBrandPlaceholder")}
                  className="rounded-full border border-ink/12 bg-transparent py-2 ps-9 pe-4 text-sm outline-none focus:border-primary dark:border-white/15"
                />
              </div>
            )}
          </div>
        )}
      </div>

      {items.length === 0 && !loading ? (
        <p className="text-sm text-ink/50 dark:text-sand/50">{t("noProductsMatchFilters")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((product) => (
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

      {hasMore && (
        <div className="mt-6 flex justify-center">
          <SecondaryButton onClick={loadMore} disabled={loading}>
            {loading ? t("loadingMore") : t("loadMore")}
          </SecondaryButton>
        </div>
      )}

      {selected && (
        <ProductDetailModal product={selected} storeName={storeName} business={business} locale={locale} onClose={() => setSelected(null)} />
      )}
    </div>
  );
}
