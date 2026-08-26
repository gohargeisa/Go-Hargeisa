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

// Each product photo is a real, full-resolution download (this project's
// next.config.mjs runs images.unoptimized: true, so there is no server-side
// resizing to shrink an off-screen image's bytes) — a smaller initial page
// means fewer full-size photos fetched before any interaction, without
// changing what "Load More" reveals or how many products exist.
const PAGE_SIZE = 6;

function pillClass(active: boolean) {
  return `shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
    active
      ? "bg-primary text-white"
      : "border border-ink/12 text-ink/70 hover:border-primary hover:text-primary dark:border-white/15 dark:text-sand/70"
  }`;
}

/**
 * The Village Hargeisa's single "Menu & Order Online" experience — one
 * browse-and-buy grid instead of the two separate sections (a display-only
 * "Menu Highlights" reading `restaurants.menu`'s legacy JSON, and a second
 * "Order Online" grid reading the real `products` table) the generic
 * restaurant page still renders for every OTHER restaurant. Verified
 * directly against the live DB before this was built: both were the exact
 * same 60 dishes (same names/images/prices/categories) — literal
 * duplicates, one a stale copy that predates the real orderable catalog.
 * This component reads only the real `products` table (the richer,
 * cart-integrated, already-authoritative source) — nothing is deleted or
 * changed, `restaurants.menu`'s own column is untouched, just no longer
 * rendered a second time for this one restaurant.
 *
 * Deliberately NOT a change to the shared `ProductsSection` component
 * every other partner (Flormar, Pinnacle, Lavender, future Waafi Market)
 * already uses — that component's brand-only search and unpaginated grid
 * are fine for their catalog sizes/shapes, and changing it would change
 * their pages too. This is a parallel, Village-scoped component built from
 * the same lower-level primitives (`ProductCard`, `ProductDetailModal`,
 * the shared cart context) instead, so every other partner's page is
 * provably untouched.
 *
 * Performance: only `PAGE_SIZE` cards render initially — a "Load More"
 * button (not a second network request; the full list is already in
 * memory, this is just how many `<ProductCard>`s/images mount at once) —
 * category tabs and name search both narrow `filtered` before paging,
 * exactly what "don't render the whole menu at once" asks for. Images
 * inherit ProductCard's existing next/image `sizes` + built-in lazy
 * loading (no `priority`) — nothing new needed there.
 */
export function VillageMenuOrderSection({
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

      {/* Lightweight sticky cart indicator — mobile only (desktop already has
          the always-visible header cart icon + item badge); positioned to
          clear MobileBookingBar's own fixed bottom bar rather than overlap
          it. Reuses the existing global cart state (useCart) — no new cart
          logic, just a small always-in-view summary while browsing.
          Portaled to document.body: this section renders inside a <Reveal>
          (framer-motion) wrapper, and framer-motion leaves a `transform` on
          its element even at rest — a `transform` on any ancestor makes a
          `position: fixed` descendant fix itself to THAT ancestor's box
          instead of the viewport (CSS spec behavior, not a framer-motion
          bug). Without the portal this indicator was pinned to a spot
          partway down the document instead of the screen, landing on top of
          whichever product cards happened to scroll to that position. */}
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
