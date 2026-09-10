"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "framer-motion";
import { ProductDetailModal } from "@/components/shared/product-detail-modal";
import type { AddToCartBusiness } from "@/lib/cart/cart-context";
import { productLocalizedName, productLocalizedDescription } from "@/lib/utils/product-i18n";
import type { Product } from "@/types";

/**
 * Universal text-first menu — the reusable counterpart to ProductsSection's
 * image grid. Same editorial pattern proven on The Village Hargeisa's own
 * bespoke menu (components/the-village/village-menu.tsx, which stays as its
 * own hand-tuned component and is NOT refactored onto this): category
 * heading, a divider, then a `divide-y` list of name / optional localized
 * description / price(-cluster, incl. size options) / a "choice of X or Y"
 * line / add-ons, each row opening the shared ProductDetailModal as "View
 * Details" — no image dependency (ProductDetailModal falls back to
 * "compact" layout when a product has no image).
 *
 * Generic over any restaurant/cafe: `categoryOrder` lets a caller supply its
 * own printed-menu section order (falls back to first-appearance order in
 * the data when omitted), and all copy comes from the shared `products` i18n
 * namespace rather than a partner-specific one, so this component carries no
 * per-partner knowledge at all. This is the image-based ProductsSection's
 * sibling — a caller picks whichever presentation fits, and both can coexist
 * (ProductsSection/ProductCard's image grid stays the default everywhere it
 * already renders; nothing switches automatically).
 */
export function TextFirstMenuSection({
  products,
  business,
  locale,
  storeName,
  categoryOrder,
  stickyTopPx,
}: {
  products: Product[];
  business: AddToCartBusiness;
  locale: string;
  storeName: string;
  categoryOrder?: string[];
  /** Pixel offset for the sticky category nav's `top`. Omit (the default)
   * to keep the header-relative `top-[calc(5rem+env(safe-area-inset-top))]`
   * every existing caller uses. A page that stacks its own sticky section
   * nav above this menu (Excellence Café) passes the combined height so the
   * category rail tucks directly under it instead of colliding. */
  stickyTopPx?: number;
}) {
  const t = useTranslations("products");
  const reduceMotion = useReducedMotion();
  const scrollOffset = stickyTopPx == null ? STICKY_SCROLL_OFFSET : stickyTopPx + 52;

  const [selected, setSelected] = useState<Product | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const sectionRefs = useRef<Map<string, HTMLElement>>(new Map());

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of products) {
      if (p.isHidden) continue;
      const cat = p.category ?? "Menu";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(p);
    }
    for (const list of map.values()) list.sort((a, b) => a.sortOrder - b.sortOrder);
    const ordered: { category: string; items: Product[] }[] = [];
    for (const cat of categoryOrder ?? []) {
      if (map.has(cat)) {
        ordered.push({ category: cat, items: map.get(cat)! });
        map.delete(cat);
      }
    }
    for (const [category, items] of map) ordered.push({ category, items });
    return ordered;
  }, [products, categoryOrder]);

  useEffect(() => {
    if (grouped.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveCategory((visible[0].target as HTMLElement).dataset.category ?? null);
      },
      { rootMargin: `-${scrollOffset}px 0px -55% 0px`, threshold: 0 }
    );
    for (const el of sectionRefs.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, [grouped, scrollOffset]);

  function jumpTo(category: string) {
    const el = sectionRefs.current.get(category);
    if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  if (grouped.length === 0) {
    return <p className="text-sm text-ink/55 dark:text-sand/55">{t("menuEmpty")}</p>;
  }

  return (
    <div>
      {/* Sticky category navigation */}
      <nav
        aria-label={t("menuJumpTo")}
        /* Sticks directly below the global fixed site header (h-20 = 5rem, plus
           env(safe-area-inset-top) on notched devices) — same offset as
           VillageMenu's identical nav. A caller with its own sticky section
           nav above the menu passes `stickyTopPx` to stack below it. */
        className={`sticky z-30 -mx-5 border-y border-ink/8 bg-sand/95 px-5 py-2.5 backdrop-blur dark:border-white/10 dark:bg-ink/95 ${
          stickyTopPx == null ? "top-[calc(5rem+env(safe-area-inset-top))]" : ""
        }`}
        style={stickyTopPx == null ? undefined : { top: stickyTopPx }}
      >
        <div className="flex gap-1.5 overflow-x-auto scrollbar-none">
          {grouped.map(({ category }) => {
            const active = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => jumpTo(category)}
                aria-current={active ? "true" : undefined}
                className={`shrink-0 whitespace-nowrap rounded-full px-4 py-1.5 text-[13px] font-semibold tracking-tight transition-colors ${
                  active
                    ? "bg-primary text-white shadow-sm"
                    : "text-ink/50 hover:bg-ink/[0.05] hover:text-ink dark:text-sand/50 dark:hover:bg-white/[0.06] dark:hover:text-sand"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="mt-9 space-y-12">
        {grouped.map(({ category, items }) => (
          <section
            key={category}
            id={anchorId(category)}
            data-category={category}
            ref={(el) => {
              if (el) sectionRefs.current.set(category, el);
              else sectionRefs.current.delete(category);
            }}
            aria-labelledby={`${anchorId(category)}-h`}
            style={{ scrollMarginTop: scrollOffset }}
          >
            <div className="flex items-baseline gap-4">
              <h3
                id={`${anchorId(category)}-h`}
                className="shrink-0 font-display text-xl font-semibold tracking-tight sm:text-[1.4rem]"
              >
                {category}
              </h3>
              <span className="h-px flex-1 translate-y-[-0.15em] bg-ink/12 dark:bg-white/12" aria-hidden="true" />
            </div>

            <ul className="mt-3 divide-y divide-ink/[0.08] dark:divide-white/[0.08]">
              {items.map((product) => {
                const name = productLocalizedName(product, locale);
                const description = productLocalizedDescription(product, locale);
                const sizeOpt = product.options?.find((o) => o.key === "size");
                const choiceOpt = product.options?.find(
                  (o) => o.key === "flavor" || o.key === "protein" || o.key === "preparation"
                );
                const addons = product.addons ?? [];

                const sizeParts =
                  sizeOpt && product.price != null
                    ? sizeOpt.choices.map((c) => `${shortSize(c.label)} ${fmtPrice(product.price! + (c.priceDelta ?? 0))}`)
                    : null;
                const priceCluster = sizeParts
                  ? sizeParts.join("  ·  ")
                  : product.price != null
                    ? fmtPrice(product.price)
                    : t("priceOnRequest");

                return (
                  <li key={product.id} className="-mx-3 rounded-xl px-3 py-3.5 transition-colors hover:bg-ink/[0.03] dark:hover:bg-white/[0.035]">
                    <button
                      type="button"
                      onClick={() => setSelected(product)}
                      className="group flex w-full items-baseline justify-between gap-4 text-start"
                    >
                      <span className="min-w-0">
                        <span className="text-[15px] font-semibold text-ink transition-colors group-hover:text-primary-700 dark:text-sand dark:group-hover:text-primary-300">
                          {name}
                        </span>
                        {description && (
                          <span dir="auto" className="mt-1 block text-[13px] leading-relaxed text-ink/55 dark:text-sand/55">
                            {description}
                          </span>
                        )}
                        {choiceOpt && (
                          <span dir="auto" className="mt-1 block text-xs italic text-ink/45 dark:text-sand/45">
                            {t("menuChoiceOf", {
                              choices: formatChoiceList(
                                choiceOpt.choices.map((c) => c.label.toLowerCase()),
                                t("menuOr")
                              ),
                            })}
                          </span>
                        )}
                      </span>
                      <span className="shrink-0 whitespace-nowrap text-[15px] font-semibold tabular-nums text-ink dark:text-white">
                        {priceCluster}
                      </span>
                    </button>

                    {addons.length > 0 && (
                      <p dir="auto" className="mt-2 ps-0 text-xs leading-relaxed text-ink/45 dark:text-sand/45">
                        <span className="font-semibold uppercase tracking-wide text-ink/40 dark:text-sand/40">
                          {t("menuAddonsLabel")}:{" "}
                        </span>
                        {addons.map((a, i) => (
                          <span key={a.id}>
                            {i > 0 && "  ·  "}
                            {a.name} — {fmtPrice(a.price)}
                          </span>
                        ))}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      {selected && (
        <ProductDetailModal
          product={selected}
          storeName={storeName}
          business={business}
          locale={locale}
          layout={selected.image ? "spacious" : "compact"}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}

const STICKY_SCROLL_OFFSET = 128; // header (~64) + sticky category nav (~56) + breathing room

function anchorId(category: string) {
  return "tfmenu-" + category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

function fmtPrice(n: number) {
  return Number.isInteger(n) ? `$${n}` : `$${n.toFixed(2)}`;
}

function formatChoiceList(items: string[], orWord: string) {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${orWord} ${items[items.length - 1]}`;
}

function shortSize(label: string) {
  const l = label.toLowerCase();
  if (l.startsWith("small")) return "S";
  if (l.startsWith("medium")) return "M";
  if (l.startsWith("large")) return "L";
  return label;
}
