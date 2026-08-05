"use client";

import Link from "next/link";
import Image from "next/image";
import { memo, useState } from "react";
import { useTranslations } from "next-intl";
import { Landmark, MapPin, Sparkles, Star } from "lucide-react";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { AnimatedCard } from "@/components/shared/animated-card";
import { FloatingBadge } from "@/components/shared/floating-badge";
import { PrimaryButton } from "@/components/shared/buttons";

/**
 * Homepage-only attraction card, matching the visual language of
 * premium-hotel-card.tsx / premium-restaurant-card.tsx exactly.
 * Deliberately separate from components/shared/listing-card.tsx (used
 * by the attractions listing page, attraction detail "nearby" links,
 * explore pages, and dashboard favorites), so this redesign can't affect
 * anything outside the homepage Attractions row.
 */
function PremiumAttractionCardBase({
  href,
  image,
  name,
  address,
  rating,
  reviewCount,
  category,
  shortDescription,
  featured = false,
  attractionId,
  locale,
  initiallyFavorited = false,
}: {
  href: string;
  image: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  category?: string;
  shortDescription?: string;
  featured?: boolean;
  attractionId?: string;
  locale?: string;
  initiallyFavorited?: boolean;
}) {
  const t = useTranslations("listings");
  const [loaded, setLoaded] = useState(false);

  const hasRealImage = Boolean(image) && !image.includes("placehold.co");

  return (
    <AnimatedCard className="group flex h-full w-full min-w-[288px] flex-col overflow-hidden rounded-xl3 border border-ink/8 bg-white shadow-soft transition-shadow duration-300 ease-premium hover:border-primary/25 hover:shadow-card dark:border-white/10 dark:bg-white/[0.04]">
      {/* Image */}
      <div className="relative h-64 shrink-0 overflow-hidden rounded-t-xl3 sm:h-[17rem]">
        {hasRealImage ? (
          <>
            {!loaded && (
              <div className="absolute inset-0 animate-pulse bg-ink/10 dark:bg-white/10" aria-hidden="true" />
            )}
            <Link href={href} className="absolute inset-0 z-0" aria-label={name}>
              <Image
                src={image}
                alt={`${name} — attraction`}
                fill
                sizes="(max-width: 767px) 88vw, (max-width: 1024px) 45vw, 340px"
                onLoad={() => setLoaded(true)}
                className={`object-cover transition-transform duration-500 ease-premium group-hover:scale-105 ${
                  loaded ? "opacity-100" : "opacity-0"
                }`}
              />
            </Link>
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/15 via-transparent to-transparent"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent"
              aria-hidden="true"
            />
          </>
        ) : (
          <Link
            href={href}
            aria-label={name}
            className="absolute inset-0 z-0 flex items-center justify-center bg-gradient-to-br from-secondary/15 via-primary/10 to-secondary/5 transition-transform duration-500 ease-premium group-hover:scale-105 dark:from-secondary/25 dark:via-primary/15 dark:to-white/5"
          >
            <Landmark size={44} strokeWidth={1.5} className="text-secondary-700/50 dark:text-white/30" aria-hidden="true" />
          </Link>
        )}

        {featured && <FloatingBadge icon={Sparkles}>{t("featuredBadge")}</FloatingBadge>}

        {reviewCount > 0 && (
          <div className="absolute end-3.5 top-3.5 z-10 inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/20 px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
            <Star size={12} fill="currentColor" className="text-primary" aria-hidden="true" />
            {rating.toFixed(1)}
            <span className="font-normal text-white/75">({reviewCount})</span>
          </div>
        )}

        {attractionId && (
          <FavoriteButton
            listingType="attraction"
            listingId={attractionId}
            initiallyFavorited={initiallyFavorited}
            locale={locale}
            redirectPath={href}
            addLabel={t("addToFavorites", { name })}
            removeLabel={t("removeFromFavorites", { name })}
          />
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-5 p-6 sm:p-7">
        <div>
          <Link href={href}>
            <h3 className="line-clamp-1 font-display text-2xl font-extrabold tracking-tight text-ink transition-colors group-hover:text-primary dark:text-white">
              {name}
            </h3>
          </Link>
          <p className="mt-2 flex items-center gap-1.5 text-sm text-ink/60 dark:text-sand/60">
            <MapPin size={15} className="shrink-0 text-primary" aria-hidden="true" />
            <span className="line-clamp-1 leading-none">{address}</span>
          </p>
        </div>

        {category && (
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-secondary/20 bg-secondary/5 px-3 py-1.5 text-[11px] font-medium text-secondary-700 dark:border-secondary-300/25 dark:bg-secondary-300/10 dark:text-secondary-300">
            <Landmark size={12} aria-hidden="true" />
            {category}
          </span>
        )}

        {shortDescription && (
          <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-ink/60 dark:text-sand/60">
            {shortDescription}
          </p>
        )}

        <div className="mt-auto border-t border-ink/8 pt-5 dark:border-white/10">
          <PrimaryButton href={href} size="lg" fullWidth>
            {t("viewDetails")}
          </PrimaryButton>
        </div>
      </div>
    </AnimatedCard>
  );
}

export const PremiumAttractionCard = memo(PremiumAttractionCardBase);
