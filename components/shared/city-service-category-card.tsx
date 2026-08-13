"use client";

import Image from "next/image";
import { useState } from "react";
import { AnimatedCard } from "@/components/shared/animated-card";
import { DynamicIcon } from "@/lib/utils/dynamic-icon";
import { cityServiceCategoryImagePath } from "@/lib/config/city-service-category-images";
import type { Category } from "@/types";

/**
 * Premium image card for a City Services category — filters the page's
 * existing listing grid in place (calls back into CityServicesPageClient's
 * own selectCategory, the same state that already drives the URL deep-link
 * and search behavior) rather than navigating anywhere or duplicating
 * category data.
 *
 * Points at a prepared local file (public/images/city-services/<file>.jpg,
 * see lib/config/city-service-category-images.ts) — never an external or
 * fabricated URL. Falls back to the same warm on-brand gradient + centered
 * icon PremiumHotelCard/PremiumCategoryCard already use for "no photo yet",
 * checked at runtime via onError since there's no way to know in advance
 * which prepared files actually exist.
 *
 * `category` only needs slug/icon/color (not a full DB row) so this same
 * premium treatment also covers purely-presentational groupings like
 * "Education" (Schools + Universities combined for display — no new
 * `categories` row, no DB write) alongside real categories.
 */
export function CityServiceCategoryCard({
  category,
  name,
  description,
  count,
  placesLabel,
  active,
  onSelect,
}: {
  category: Pick<Category, "slug" | "icon" | "color">;
  name: string;
  description?: string;
  count: number;
  placesLabel: string;
  active: boolean;
  onSelect: () => void;
}) {
  const [imageMissing, setImageMissing] = useState(false);
  const imageSrc = cityServiceCategoryImagePath(category.slug);

  return (
    <AnimatedCard className="h-full">
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        className={`group flex h-full w-full flex-col overflow-hidden rounded-xl3 border bg-white text-start shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:bg-white/[0.04] dark:focus-visible:ring-offset-ink ${
          active ? "border-primary ring-2 ring-primary/40" : "border-ink/8 hover:border-primary/25 dark:border-white/10"
        }`}
      >
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden">
          {imageSrc && !imageMissing ? (
            <Image
              src={imageSrc}
              alt=""
              fill
              sizes="(max-width: 767px) 90vw, (max-width: 1024px) 45vw, 300px"
              onError={() => setImageMissing(true)}
              className="object-cover transition-transform duration-500 ease-premium group-hover:scale-105"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/5 transition-transform duration-500 ease-premium group-hover:scale-105 dark:from-primary/20 dark:via-secondary/20 dark:to-white/5">
              <DynamicIcon name={category.icon} size={40} strokeWidth={1.5} className="text-primary/40" aria-hidden="true" />
            </div>
          )}

          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent"
            aria-hidden="true"
          />

          <span
            className="absolute start-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full text-white shadow-[0_4px_14px_rgba(0,0,0,0.3)] ring-1 ring-white/30 backdrop-blur-md"
            style={{ backgroundColor: category.color || "var(--color-primary, #0B5ED7)" }}
            aria-hidden="true"
          >
            <DynamicIcon name={category.icon} size={17} />
          </span>

          <div className="absolute inset-x-0 bottom-0 z-10 p-3.5">
            <h3 className="line-clamp-1 font-display text-base font-bold text-white drop-shadow-sm">{name}</h3>
            <p className="text-xs font-medium text-white/80">{placesLabel}</p>
          </div>
        </div>

        {description && (
          <p className="line-clamp-2 flex-1 px-3.5 py-3 text-xs leading-relaxed text-ink/60 dark:text-sand/60">
            {description}
          </p>
        )}
      </button>
    </AnimatedCard>
  );
}
