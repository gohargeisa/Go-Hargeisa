"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { Search, ShoppingBag } from "lucide-react";
import { ProductCard } from "@/components/shared/product-card";
import { ProductDetailModal } from "@/components/shared/product-detail-modal";
import { useCart } from "@/lib/cart/cart-context";
import { productLocalizedName } from "@/lib/utils/product-i18n";
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
 */
export function ExcellenceCafeMenu({
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
  const tc = useTranslations("cart");
  const cart = useCart();

  const [categoryFilter, setCategoryFilter] = useState<ProductCategory | "all">("all");
  const [query, setQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<Product | null>(null);

  const visible = useMemo(() => products.filter((p) => !p.isHidden), [products]);

  const categoriesPresent = useMemo(() => {
    const seen: ProductCategory[] = [];
    for (const p of visible) if (p.category && !seen.includes(p.category)) seen.push(p.category);
    return seen;
  }, [visible]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return visible
      .filter((p) => categoryFilter === "all" || p.category === categoryFilter)
      .filter((p) => !needle || productLocalizedName(p, locale).toLowerCase().includes(needle))
      .sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder);
  }, [visible, categoryFilter, query, locale]);

  const paged = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > paged.length;

  function selectCategory(c: ProductCategory | "all") {
    setCategoryFilter(c);
    setVisibleCount(PAGE_SIZE);
  }

  if (visible.length === 0) return null;

  return (
    <div className="relative">
      <div className="mb-5 space-y-3">
        {categoriesPresent.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button type="button" onClick={() => selectCategory("all")} className={pillClass(categoryFilter === "all")}>
              {t("allCategories")}
            </button>
            {categoriesPresent.map((c) => (
              <button key={c} type="button" onClick={() => selectCategory(c)} className={pillClass(categoryFilter === c)}>
                {productCategoryLabel(c, locale)}
              </button>
            ))}
          </div>
        )}

        <div className="relative max-w-xs">
          <Search size={14} className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-ink/40" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setVisibleCount(PAGE_SIZE);
            }}
            placeholder={t("searchMenuPlaceholder")}
            className="w-full rounded-full border border-ink/12 bg-transparent py-2 ps-9 pe-4 text-sm outline-none focus:border-primary dark:border-white/15"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
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
                onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
                className="rounded-full border border-ink/15 px-6 py-2.5 text-sm font-semibold text-ink/75 transition-colors hover:border-primary hover:text-primary dark:border-white/15 dark:text-sand/75"
              >
                {t("loadMoreProducts")}
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
