"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ArrowRight, MapPin, Star } from "lucide-react";
import { useImageLoaded } from "@/lib/hooks/use-image-loaded";
import { RatingBadge } from "./rating-badge";
import { FavoriteButton } from "./favorite-button";
import { AnimatedCard } from "./animated-card";
import { FloatingBadge } from "./floating-badge";
import type { PolymorphicListingType } from "@/types";

type ListingType = PolymorphicListingType;

export function ListingCard({
  href, image, title, subtitle, rating, reviewCount, tag, priceRange,
  listingType, listingId, initiallyFavorited = false, locale,
}: {
  href: string; image: string; title: string; subtitle: string; rating: number;
  reviewCount: number; tag?: string; priceRange?: string; listingType?: ListingType;
  listingId?: string; initiallyFavorited?: boolean; locale?: string;
}) {
  const t = useTranslations("listings");
  const { loaded, imgRef, onLoad } = useImageLoaded();

  return (
    <AnimatedCard lift={6} className="group h-full w-full min-w-[272px]">
      <Link
        href={href}
        className="flex h-full flex-col overflow-hidden rounded-xl3 border border-ink/8 bg-white shadow-soft transition-shadow duration-300 ease-premium hover:border-primary/25 hover:shadow-card dark:border-white/10 dark:bg-white/[0.04]"
      >
        <div className="relative h-52 overflow-hidden sm:h-56">
          {!loaded && <div className="skeleton absolute inset-0" aria-hidden="true" />}
          <Image
            ref={imgRef}
            src={image}
            alt={title}
            fill
            sizes="(max-width: 767px) 78vw, (max-width: 1024px) 33vw, 25vw"
            onLoad={onLoad}
            className={`object-cover transition-all duration-500 ease-premium group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          {reviewCount > 0 && (
            <div className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1.5 text-xs font-bold text-ink shadow-sm backdrop-blur">
              <Star size={13} fill="currentColor" className="text-primary" /> {rating.toFixed(1)}
            </div>
          )}
          {listingType && listingId && (
            <FavoriteButton
              listingType={listingType}
              listingId={listingId}
              initiallyFavorited={initiallyFavorited}
              locale={locale}
              redirectPath={href}
              stopPropagation
              size={18}
              className="absolute end-3 top-3 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm transition-all duration-300 hover:scale-110 hover:shadow-[0_6px_16px_rgba(0,0,0,0.25)] active:scale-95 disabled:opacity-60"
              addLabel={t("addToFavorites", { name: title })}
              removeLabel={t("removeFromFavorites", { name: title })}
            />
          )}
          {tag && <FloatingBadge position="bottom-start">{tag}</FloatingBadge>}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate font-display text-xl font-bold text-ink transition-colors group-hover:text-primary dark:text-white">{title}</h3>
              <p className="mt-2 flex items-center gap-1.5 text-sm text-ink/55 dark:text-sand/60">
                <MapPin size={15} className="shrink-0 text-primary" />
                <span className="line-clamp-1">{subtitle}</span>
              </p>
            </div>
            {priceRange && <span className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-sm font-bold text-primary-800">{priceRange}</span>}
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-ink/8 pt-4 dark:border-white/10">
            <RatingBadge rating={rating} reviewCount={reviewCount} />
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-all group-hover:gap-2">
              {t("explore")} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1 rtl:rotate-180" />
            </span>
          </div>
        </div>
      </Link>
    </AnimatedCard>
  );
}
