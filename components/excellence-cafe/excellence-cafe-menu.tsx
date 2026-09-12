"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Search, ShoppingBag } from "lucide-react";
import { ProductCard } from "@/components/shared/product-card";
import { ProductDetailModal } from "@/components/shared/product-detail-modal";
import { useCart } from "@/lib/cart/cart-context";
import { usePaginatedProducts } from "@/lib/hooks/use-paginated-products";
import { productCategoryLabel } from "@/lib/config/product-categories";
import type { AddToCartBusiness } from "@/lib/cart/cart-context";
import type { Product, ProductCategory } from "@/types";

// Same "don't mount the whole catalog at once" budget as
// components/restaurants/village-menu-order-section.tsx.
const PAGE_SIZE = 6;

function pillClass(active: boolean) {
  return `shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
    active
      ? "bg-primary text-white"
      : "border border-ink/12 text-ink/70 hover:border-primary hover:text-primary dark:border-white/15 dark:text-sand/70"
  }`;
}

/**
 * Excellence Café's "Menu & Order Online" grid — category pills + live
 * search + "Load More" paging over the real `products` table (~190 items
 * across 14 categories). Deliberately its own component, not a shared one
 * with The Village's VillageMenuOrderSection: same UI pattern (search+pills+
 * pagination is the right shape for a menu this size), but kept as a
 * parallel, partner-scoped component from the same lower-level primitives
 * (ProductCard, ProductDetailModal, the shared cart context) rather than a
 * cross-partner import, so touching one restaurant's menu UI can never
 * affect the other's.
 *
 * `initialProducts`/`initialTotal` are page 1 only (see
 * getProductsPageForListing) — this menu's ~190 rows previously shipped in
 * full on every page load (measured live: ~780KB of HTML for this one
 * page) even though only 6 cards ever showed before "Load More". Category/
 * search changes and "Load More" now re-query /api/products for exactly
 * the rows needed. `facets.categories` (the full category list across the
 * whole menu) comes from a separate, much lighter query so the category
 * pills still include categories that haven't loaded yet.
 */
export function ExcellenceCafeMenu({
  initialProducts,
  initialTotal,
  facets,
  storeName,
  business,
  locale,
}: {
  initialProducts: Product[];
  initialTotal: number;
  facets: { categories: ProductCategory[] };
  storeName: string;
  business: AddToCartBusiness;
  locale: string;
}) {
  const t = useTranslations("products");
  const tc = useTranslations("cart");
  const cart = useCart();

  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "all">("all");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);

  // Debounced — a fetch on every keystroke would be a real "repeated
  // Supabase requests" problem; 350ms after the visitor stops typing is
  // enough to feel instant without querying per character.
  useEffect(() => {
    const id = setTimeout(() => setQuery(queryInput.trim()), 350);
    return () => clearTimeout(id);
  }, [queryInput]);

  const { items: paged, loading, hasMore, loadMore } = usePaginatedProducts({
    listingId: business.listingId,
    listingType: business.listingType,
    initialItems: initialProducts,
    initialTotal,
    pageSize: PAGE_SIZE,
    filters: { category: categoryFilter === "all" ? undefined : categoryFilter, nameQuery: query },
  });

  function selectCategory(c: ProductCategory | "all") {
    setCategoryFilter(c);
  }

  if (initialTotal === 0) return null;

  return (
    <div className="relative">
      <div className="mb-5 space-y-3">
        {facets.categories.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button type="button" onClick={() => selectCategory("all")} className={pillClass(categoryFilter === "all")}>
              {t("allCategories")}
            </button>
            {facets.categories.map((c) => (
              <button key={c} type="button" onClick={() => selectCategory(c)} className={pillClass(categoryFilter === c)}>
                {productCategoryLabel(c, locale)}
              </button>
            ))}
          </div>
        )}

        <div className="relative max-w-xs">
          <Search size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink/40" aria-hidden="true" />
          <input
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder={t("searchMenuPlaceholder")}
            className="w-full rounded-full border border-ink/12 bg-transparent py-2 ps-9 pe-4 text-sm outline-none focus:border-primary dark:border-white/15"
          />
        </div>
      </div>

      {paged.length === 0 && !loading ? (
        <p className="text-sm text-ink/50 dark:text-sand/50">{t("noProductsMatchFilters")}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {paged.map((product) => (
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

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loading}
                className="rounded-full border border-ink/15 px-6 py-2.5 text-sm font-semibold text-ink/75 transition-colors hover:border-primary hover:text-primary disabled:opacity-60 dark:border-white/15 dark:text-sand/75"
              >
                {loading ? t("loadingMore") : t("loadMoreProducts")}
              </button>
            </div>
          )}
        </>
      )}

      {selected && (
        <ProductDetailModal product={selected} storeName={storeName} business={business} locale={locale} onClose={() => setSelected(null)} />
      )}

      {/* Mobile sticky cart summary — same portal-to-body reasoning as
          VillageMenuOrderSection's own (a `transform` from the <Reveal>
          ancestor would otherwise pin this to that ancestor's box instead
          of the viewport). */}
      {cart.itemCount > 0 &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-x-4 z-chrome lg:hidden"
            style={{ bottom: "calc(4.75rem + 1.1rem + max(0.75rem, env(safe-area-inset-bottom)))" }}
          >
            <button
              type="button"
              onClick={cart.openCart}
              className="mx-auto flex w-full max-w-sm items-center justify-center gap-2 rounded-full bg-ink px-5 py-3 text-sm font-bold text-white shadow-premium-lg transition-transform active:scale-[0.98] dark:bg-primary-700"
            >
              <ShoppingBag size={16} aria-hidden="true" />
              <span>
                {tc("viewCart")} • {tc("itemsCount", { count: cart.itemCount })} • {cart.subtotal.toFixed(2)} USD
              </span>
            </button>
          </div>,
          document.body
        )}
    </div>
  );
}
