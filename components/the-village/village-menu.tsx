"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { ProductDetailModal } from "@/components/shared/product-detail-modal";
import { Lightbox, type LightboxSlide } from "@/components/shared/lightbox";
import type { AddToCartBusiness } from "@/lib/cart/cart-context";
import { productLocalizedName, productLocalizedDescription } from "@/lib/utils/product-i18n";
import type { Product } from "@/types";

/**
 * The Village Hargeisa — editorial, text-first menu (Village-only; no other
 * restaurant renders this). Deliberately NOT an image grid: 46 of the 59
 * products carry stock/placeholder images that this project has no rights
 * to present as the restaurant's own, so the menu is typographic — the way
 * a printed restaurant menu reads — and real photography is shown only in
 * the separate "Signature Selection" strip (the ~13 dishes with genuine
 * Village-bucket uploads).
 *
 * Ordering, options (pizza size, pasta protein, ...) and per-dish add-ons
 * all run through the SAME shared `ProductDetailModal` + universal cart
 * every other partner uses — nothing new in the cart layer. Add-ons come
 * straight off each `product.addons` (already resolved per-product by
 * getProductsForListing, including the Village-scoped "Side Dishes" group),
 * so an add-on can only ever appear under the dish it's actually attached
 * to and never leaks in from another business.
 */

// The restaurant's own printed-menu section order (from the Desktop menu
// files), not alphabetical. Any category present in the data but missing
// here still renders, appended after these.
const CATEGORY_ORDER = [
  "Signature Pizza",
  "Saj-Shawarma & Sandwiches",
  "Burgers",
  "Grills (Mediterranean BBQ)",
  "The Village Specials",
  "Pastas",
  "Manakeesh",
  "All Day Breakfast",
];

const STICKY_SCROLL_OFFSET = 128; // header (~64) + sticky category nav (~56) + breathing room

function anchorId(category: string) {
  return "vmenu-" + category.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
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

export function VillageMenu({
  products,
  business,
  locale,
  storeName,
  originalMenuImages,
}: {
  products: Product[];
  business: AddToCartBusiness;
  locale: string;
  storeName: string;
  originalMenuImages: { src: string; page: number }[];
}) {
  const t = useTranslations("theVillage");
  const tp = useTranslations("products");
  const reduceMotion = useReducedMotion();

  const [selected, setSelected] = useState<Product | null>(null);
  const [originalMenuOpen, setOriginalMenuOpen] = useState(false);
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
    for (const cat of CATEGORY_ORDER) {
      if (map.has(cat)) {
        ordered.push({ category: cat, items: map.get(cat)! });
        map.delete(cat);
      }
    }
    for (const [category, items] of map) ordered.push({ category, items });
    return ordered;
  }, [products]);

  useEffect(() => {
    if (grouped.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveCategory((visible[0].target as HTMLElement).dataset.category ?? null);
      },
      { rootMargin: `-${STICKY_SCROLL_OFFSET}px 0px -55% 0px`, threshold: 0 }
    );
    for (const el of sectionRefs.current.values()) observer.observe(el);
    return () => observer.disconnect();
  }, [grouped]);

  function jumpTo(category: string) {
    const el = sectionRefs.current.get(category);
    if (el) el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
  }

  if (grouped.length === 0) {
    return <p className="text-sm text-ink/55 dark:text-sand/55">{t("menuEmpty")}</p>;
  }

  const menuSlides: LightboxSlide[] = originalMenuImages.map((img) => ({
    url: img.src,
    alt: t("originalMenuPageAlt", { n: img.page }),
  }));

  return (
    <div>
      {/* Sticky category navigation */}
      <nav
        aria-label={t("menuJumpTo")}
        className="sticky top-16 z-30 -mx-5 border-y border-ink/8 bg-sand/95 px-5 py-2.5 backdrop-blur dark:border-white/10 dark:bg-ink/95 sm:top-[4.25rem]"
      >
        <div className="flex gap-2 overflow-x-auto scrollbar-none">
          {grouped.map(({ category }) => {
            const active = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => jumpTo(category)}
                aria-current={active ? "true" : undefined}
                className={`shrink-0 whitespace-nowrap rounded-full px-3.5 py-1.5 text-[13px] font-semibold tracking-tight transition-colors ${
                  active
                    ? "bg-ink text-white dark:bg-white dark:text-ink"
                    : "text-ink/55 hover:text-ink dark:text-sand/55 dark:hover:text-sand"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      </nav>

      <div className="mt-12 space-y-16">
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
            style={{ scrollMarginTop: STICKY_SCROLL_OFFSET }}
          >
            <h3
              id={`${anchorId(category)}-h`}
              className="font-display text-[1.35rem] font-semibold tracking-tight sm:text-2xl"
            >
              {category}
            </h3>
            <div className="mt-1 h-px w-full bg-ink/10 dark:bg-white/10" />

            <ul className="mt-2 divide-y divide-ink/[0.07] dark:divide-white/[0.07]">
              {items.map((product) => {
                const name = productLocalizedName(product, locale);
                const description = productLocalizedDescription(product, locale);
                const sizeOpt = product.options?.find((o) => o.key === "size");
                const choiceOpt = product.options?.find((o) => o.key === "protein" || o.key === "preparation");
                const addons = product.addons ?? [];

                const sizeParts =
                  sizeOpt && product.price != null
                    ? sizeOpt.choices.map(
                        (c) => `${shortSize(c.label)} ${fmtPrice(product.price! + (c.priceDelta ?? 0))}`
                      )
                    : null;
                const priceCluster = sizeParts
                  ? sizeParts.join("  ·  ")
                  : product.price != null
                    ? fmtPrice(product.price)
                    : tp("priceOnRequest");

                return (
                  <li key={product.id} className="py-4">
                    <button
                      type="button"
                      onClick={() => setSelected(product)}
                      className="group flex w-full items-start justify-between gap-4 text-start"
                    >
                      <span className="min-w-0">
                        <span className="font-medium text-ink transition-colors group-hover:text-primary-700 dark:text-sand dark:group-hover:text-primary-300">
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
                      <span className="shrink-0 whitespace-nowrap pt-0.5 text-sm font-semibold tabular-nums text-ink/80 dark:text-sand/80">
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

      {/* Discreet secondary reference — the real printed menu */}
      {menuSlides.length > 0 && (
        <div className="mt-14 border-t border-ink/8 pt-6 text-center dark:border-white/10">
          <button
            type="button"
            onClick={() => setOriginalMenuOpen(true)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-ink/60 underline decoration-ink/20 underline-offset-4 transition-colors hover:text-ink hover:decoration-ink/50 dark:text-sand/60 dark:hover:text-sand"
          >
            <BookOpen size={15} aria-hidden="true" />
            {t("viewOriginalMenu")}
          </button>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-ink/40 dark:text-sand/40">
            {t("originalMenuNote")}
          </p>
        </div>
      )}

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

      {originalMenuOpen && (
        <Lightbox slides={menuSlides} index={0} onClose={() => setOriginalMenuOpen(false)} onIndexChange={() => {}} />
      )}
    </div>
  );
}
