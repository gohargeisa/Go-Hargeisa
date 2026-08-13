"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Star } from "lucide-react";
import { Lightbox, type LightboxSlide } from "./lightbox";
import type { RestaurantMenuItem } from "@/types";

function pillClass(active: boolean): string {
  return `rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
    active
      ? "bg-primary text-white"
      : "border border-ink/12 text-ink/60 hover:border-primary/40 hover:text-primary dark:border-white/15 dark:text-sand/60"
  }`;
}

/**
 * Renders a restaurant/cafe's `menu` jsonb column. Every existing listing's
 * menu data is a flat {name, price, description} list with no `category` —
 * for those, this renders exactly as the old inline block did (zero visual
 * change). The moment any item on a listing has a `category`, it switches to
 * grouped cards with tab/chip navigation, optional per-item photos (tap to
 * open the same Lightbox every other gallery on this site uses), and a
 * featured badge — all driven by data already in the jsonb column, no
 * schema change.
 */
export function RestaurantMenuSection({
  items,
  allCategoriesLabel,
  featuredLabel,
}: {
  items: RestaurantMenuItem[];
  allCategoriesLabel: string;
  featuredLabel: string;
}) {
  const hasCategories = items.some((item) => item.category);
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const categories = useMemo(() => {
    if (!hasCategories) return [];
    const seen = new Set<string>();
    const order: string[] = [];
    for (const item of items) {
      if (item.category && !seen.has(item.category)) {
        seen.add(item.category);
        order.push(item.category);
      }
    }
    return order;
  }, [items, hasCategories]);

  const visibleItems = activeCategory === "all" ? items : items.filter((item) => item.category === activeCategory);

  const photoSlides: LightboxSlide[] = useMemo(
    () => visibleItems.filter((item) => item.image).map((item) => ({ url: item.image!, alt: item.name })),
    [visibleItems]
  );

  if (!hasCategories) {
    return (
      <div className="divide-y divide-ink/8 overflow-hidden rounded-xl2 border border-ink/8 dark:divide-white/10 dark:border-white/10">
        {items.map((item) => (
          <div key={item.name} className="flex items-center justify-between gap-4 p-4 sm:p-5">
            <div className="min-w-0">
              <p className="text-sm font-semibold sm:text-base">{item.name}</p>
              {item.description && (
                <p className="mt-1 text-xs text-ink/55 dark:text-sand/55 sm:text-sm">{item.description}</p>
              )}
            </div>
            {item.price && (
              <span className="shrink-0 font-display text-sm font-bold text-primary sm:text-base">{item.price}</span>
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        <button type="button" onClick={() => setActiveCategory("all")} className={pillClass(activeCategory === "all")}>
          {allCategoriesLabel}
        </button>
        {categories.map((cat) => (
          <button key={cat} type="button" onClick={() => setActiveCategory(cat)} className={pillClass(activeCategory === cat)}>
            {cat}
          </button>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {visibleItems.map((item, i) => {
          const photoIndex = item.image ? photoSlides.findIndex((s) => s.url === item.image) : -1;
          return (
            <div
              key={`${item.name}-${i}`}
              className="flex gap-4 rounded-xl2 border border-ink/8 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]"
            >
              {item.image && (
                <button
                  type="button"
                  onClick={() => setLightboxIndex(photoIndex)}
                  aria-label={item.name}
                  className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-ink/5 dark:bg-white/10"
                >
                  <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                </button>
              )}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 text-sm font-semibold sm:text-base">{item.name}</p>
                  {item.featured && (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                      <Star size={10} className="fill-current" aria-hidden="true" />
                      {featuredLabel}
                    </span>
                  )}
                </div>
                {item.description && (
                  <p className="mt-1 text-xs text-ink/55 dark:text-sand/55 sm:text-sm">{item.description}</p>
                )}
                {item.price && (
                  <p className="mt-2 font-display text-sm font-bold text-primary sm:text-base">{item.price}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {lightboxIndex !== null && (
        <Lightbox slides={photoSlides} index={lightboxIndex} onClose={() => setLightboxIndex(null)} onIndexChange={setLightboxIndex} />
      )}
    </div>
  );
}
