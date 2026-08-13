"use client";

import Link from "next/link";
import Image from "next/image";
import { memo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { useImageLoaded } from "@/lib/hooks/use-image-loaded";
import { AnimatedCard } from "@/components/shared/animated-card";
import { DynamicIcon } from "@/lib/utils/dynamic-icon";
import { SecondaryButton } from "@/components/shared/buttons";
import { categoryDisplayName, categoryHref } from "@/lib/utils/category-href";
import type { Category } from "@/types";
import type { Locale } from "@/lib/i18n/config";

/** Local, same-origin asset per category — no external host, no CSP change
 * needed. Drop a real photo at this exact path (by category slug) and it
 * renders automatically; nothing else to wire up. See the "still needed"
 * list in the implementation report for which files are missing today. */
export function categoryImagePath(category: Category): string {
  return `/images/categories/${category.slug}.jpg`;
}

/**
 * Homepage-only category card (Hospitals, Pharmacies, Real Estate, ...) —
 * same visual weight/proportions as PremiumHotelCard/PremiumRestaurantCard/
 * PremiumCafeCard so the City Services section reads as premium as the rest
 * of the homepage, not a downgraded tile grid.
 *
 * Real per-category photography doesn't exist in the project yet, so this
 * never fabricates an external image URL (no stock-photo host, no
 * placehold.co) — it points at a local file by category slug
 * (public/images/categories/<slug>.jpg) and only falls back if that file is
 * genuinely missing (checked at runtime via the real <img>'s onError, since
 * there's no way to know in advance which of the 22 files exist). The
 * fallback is the exact same warm brand-gradient + centered icon treatment
 * PremiumHotelCard already uses for a hotel with no photo — never a flat
 * gray/color swatch.
 */
function PremiumCategoryCardBase({ category, locale }: { category: Category; locale: Locale }) {
  const t = useTranslations("home");
  const { loaded, imgRef, onLoad } = useImageLoaded();
  const [imageMissing, setImageMissing] = useState(false);
  const href = categoryHref(locale, category);
  const name = categoryDisplayName(category, locale);
  const imageSrc = categoryImagePath(category);

  return (
    <AnimatedCard className="group flex h-full flex-col overflow-hidden rounded-xl3 border border-ink/8 bg-white shadow-soft transition-shadow duration-300 ease-premium hover:border-primary/25 hover:shadow-card dark:border-white/10 dark:bg-white/[0.04]">
      <div className="relative h-64 shrink-0 overflow-hidden rounded-t-xl3 sm:h-[17rem]">
        {imageMissing ? (
          <Link
            href={href}
            aria-label={name}
            className="absolute inset-0 z-0 flex items-center justify-center bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/5 transition-transform duration-500 ease-premium group-hover:scale-105 dark:from-primary/20 dark:via-secondary/20 dark:to-white/5"
          >
            <DynamicIcon name={category.icon} size={44} strokeWidth={1.5} className="text-primary/40" aria-hidden="true" />
          </Link>
        ) : (
          <>
            {!loaded && <div className="skeleton absolute inset-0" aria-hidden="true" />}
            <Link href={href} className="absolute inset-0 z-0" aria-label={name}>
              <Image
                ref={imgRef}
                src={imageSrc}
                alt=""
                fill
                sizes="(max-width: 767px) 88vw, (max-width: 1024px) 45vw, 340px"
                onLoad={onLoad}
                onError={() => setImageMissing(true)}
                className={`object-cover transition-transform duration-500 ease-premium group-hover:scale-105 ${
                  loaded ? "opacity-100" : "opacity-0"
                }`}
              />
            </Link>

            {/* Same top-sheen / bottom-scrim treatment PremiumHotelCard uses
                over real photos — legible contrast for the corner badge. */}
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/20 via-transparent to-transparent"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"
              aria-hidden="true"
            />

            {/* Icon — explicitly secondary once a real photo is present: a
                small corner badge, not the card's main content. */}
            <span
              className="absolute start-3.5 bottom-3.5 z-10 flex h-11 w-11 items-center justify-center rounded-full text-white shadow-[0_4px_14px_rgba(0,0,0,0.3)] ring-1 ring-white/30 backdrop-blur-md"
              style={{ backgroundColor: category.color || "var(--color-primary, #0B5ED7)" }}
              aria-hidden="true"
            >
              <DynamicIcon name={category.icon} size={19} />
            </span>
          </>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-6 sm:p-7">
        <Link href={href}>
          <h3 className="line-clamp-1 font-display text-2xl font-extrabold tracking-tight text-ink transition-colors group-hover:text-primary dark:text-white">
            {name}
          </h3>
        </Link>
        <p className="flex-1 text-sm text-ink/60 dark:text-sand/60">
          {t("placesCount", { count: category.businessCount ?? 0 })}
        </p>

        <div className="mt-1 border-t border-ink/8 pt-5 dark:border-white/10">
          <SecondaryButton href={href} size="lg" fullWidth>
            {t("exploreCta")}
            <ArrowRight
              size={14}
              className="transition-transform duration-300 ease-premium group-hover:translate-x-1"
              aria-hidden="true"
            />
          </SecondaryButton>
        </div>
      </div>
    </AnimatedCard>
  );
}

export const PremiumCategoryCard = memo(PremiumCategoryCardBase);
