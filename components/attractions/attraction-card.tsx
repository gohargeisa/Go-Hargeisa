"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Clock, Landmark, MapPin, Sparkles, Star, Timer } from "lucide-react";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { AnimatedCard } from "@/components/shared/animated-card";
import { FloatingBadge } from "@/components/shared/floating-badge";
import { PrimaryButton, SecondaryButton } from "@/components/shared/buttons";
import { getCategoryMeta } from "@/lib/config/attraction-categories";
import { resolveMapsUrl } from "@/lib/utils/google-maps";
import { useImageLoaded } from "@/lib/hooks/use-image-loaded";
import type { Coordinates } from "@/types";

export function AttractionCard({
  href,
  image,
  name,
  address,
  rating,
  reviewCount,
  category,
  shortDescription,
  openingHours,
  visitDuration,
  entryTag,
  featured = false,
  size = "md",
  attractionId,
  locale,
  location,
}: {
  href: string;
  image: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  category: string;
  shortDescription?: string;
  openingHours?: string;
  visitDuration?: string;
  entryTag?: string;
  featured?: boolean;
  size?: "md" | "lg";
  attractionId?: string;
  locale: string;
  location: Coordinates;
}) {
  const t = useTranslations("listings");
  const tp = useTranslations("attractionsPage");
  const { loaded, imgRef, onLoad } = useImageLoaded();
  const categoryMeta = getCategoryMeta(category);
  const CategoryIcon = categoryMeta.icon;
  const categoryLabel = tp(categoryMeta.labelKey);

  const googleMapsHref = resolveMapsUrl(location);

  const hasRealImage = Boolean(image) && !image.includes("placehold.co");
  const imageHeight = size === "lg" ? "h-72 sm:h-80" : "h-56 sm:h-60";

  return (
    <AnimatedCard className="group flex h-full w-full flex-col overflow-hidden rounded-xl3 border border-ink/8 bg-white shadow-soft transition-shadow duration-300 ease-premium hover:border-primary/25 hover:shadow-card dark:border-white/10 dark:bg-white/[0.04]">
      <div className={`relative shrink-0 overflow-hidden ${imageHeight}`}>
        {hasRealImage ? (
          <>
            {!loaded && <div className="skeleton absolute inset-0" aria-hidden="true" />}
            <Link href={href} className="absolute inset-0 z-0" aria-label={name}>
              <Image
                ref={imgRef}
                src={image}
                alt={name}
                fill
                sizes="(max-width: 767px) 92vw, (max-width: 1024px) 45vw, 380px"
                onLoad={onLoad}
                className={`object-cover transition-transform duration-500 ease-premium group-hover:scale-105 ${
                  loaded ? "opacity-100" : "opacity-0"
                }`}
              />
            </Link>
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />
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

        <span className="absolute start-3.5 top-3.5 z-10 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-ink shadow-sm backdrop-blur dark:bg-ink/85 dark:text-white">
          <CategoryIcon size={12} className="text-primary" aria-hidden="true" />
          {categoryLabel}
        </span>

        {featured && <FloatingBadge icon={Sparkles} position="top-end">{t("featuredBadge")}</FloatingBadge>}

        {attractionId && (
          <FavoriteButton
            listingType="attraction"
            listingId={attractionId}
            initiallyFavorited={false}
            locale={locale}
            redirectPath={href}
            size={16}
            className={`absolute end-3.5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm transition-all duration-300 hover:scale-110 active:scale-95 disabled:opacity-60 dark:bg-ink/90 dark:text-white ${
              featured ? "top-14" : "top-3.5"
            }`}
            addLabel={t("addToFavorites", { name })}
            removeLabel={t("removeFromFavorites", { name })}
          />
        )}

        {reviewCount > 0 && (
          <div className="absolute bottom-3.5 start-3.5 z-10 inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/20 px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
            <Star size={12} fill="currentColor" className="text-primary" aria-hidden="true" />
            {rating.toFixed(1)}
            <span className="font-normal text-white/75">({reviewCount})</span>
          </div>
        )}

        {entryTag && (
          <div className="absolute bottom-3.5 end-3.5 z-10 rounded-full bg-accent/90 px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            {entryTag}
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div>
          <Link href={href}>
            <h3 className="line-clamp-1 font-display text-xl font-bold text-ink transition-colors group-hover:text-primary dark:text-white">
              {name}
            </h3>
          </Link>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink/60 dark:text-sand/60">
            <MapPin size={14} className="shrink-0 text-primary" aria-hidden="true" />
            <span className="line-clamp-1">{address}</span>
          </p>
        </div>

        {shortDescription && (
          <p className="line-clamp-2 text-sm leading-relaxed text-ink/60 dark:text-sand/60">{shortDescription}</p>
        )}

        {(openingHours || visitDuration) && (
          <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-ink/8 pt-4 text-xs text-ink/55 dark:border-white/10 dark:text-sand/55">
            {openingHours && (
              <span className="inline-flex items-center gap-1.5" title={t("openingHoursLabel")}>
                <Clock size={13} className="shrink-0 text-primary/70" aria-hidden="true" />
                {openingHours}
              </span>
            )}
            {visitDuration && (
              <span className="inline-flex items-center gap-1.5" title={t("visitDurationLabel")}>
                <Timer size={13} className="shrink-0 text-primary/70" aria-hidden="true" />
                {visitDuration}
              </span>
            )}
          </div>
        )}

        <div className="mt-auto flex gap-2.5 pt-1">
          <PrimaryButton href={href} size="sm" compact fullWidth>
            {t("viewDetails")}
          </PrimaryButton>
          {googleMapsHref && (
            <SecondaryButton href={googleMapsHref} external size="sm" compact fullWidth aria-label={t("viewOnMap")}>
              <MapPin size={14} aria-hidden="true" />
              {t("viewOnMap")}
            </SecondaryButton>
          )}
        </div>
      </div>
    </AnimatedCard>
  );
}
