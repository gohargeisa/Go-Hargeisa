"use client";

import Link from "next/link";
import Image from "next/image";
import { memo } from "react";
import { useTranslations } from "next-intl";
import { Coffee, MapPin, Phone, Sparkles, Star, Wifi } from "lucide-react";
import { useImageLoaded } from "@/lib/hooks/use-image-loaded";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { AnimatedCard } from "@/components/shared/animated-card";
import { FloatingBadge } from "@/components/shared/floating-badge";
import { PrimaryButton, SecondaryButton } from "@/components/shared/buttons";

const MAX_VISIBLE_DRINKS = 4;

/**
 * Homepage-only cafe card, matching the visual language of
 * components/home/premium-hotel-card.tsx and premium-restaurant-card.tsx
 * exactly. Deliberately separate from components/shared/listing-card.tsx
 * (used by the cafes listing page and cafe detail "You may also like")
 * so this redesign can't affect anything outside the homepage Cafes row.
 */
function PremiumCafeCardBase({
  href,
  image,
  name,
  address,
  rating,
  reviewCount,
  specialDrinks = [],
  wifi = false,
  workingSpace = false,
  featured = false,
  cafeId,
  locale,
  initiallyFavorited = false,
  phone,
}: {
  href: string;
  image: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  specialDrinks?: string[];
  wifi?: boolean;
  workingSpace?: boolean;
  featured?: boolean;
  cafeId?: string;
  locale?: string;
  initiallyFavorited?: boolean;
  phone?: string;
}) {
  const t = useTranslations("listings");
  const { loaded, imgRef, onLoad } = useImageLoaded();

  const visibleDrinks = specialDrinks.slice(0, MAX_VISIBLE_DRINKS);
  const extraDrinkCount = specialDrinks.length - visibleDrinks.length;
  const hasRealImage = Boolean(image) && !image.includes("placehold.co");

  return (
    <AnimatedCard className="group flex h-full w-full min-w-[288px] flex-col overflow-hidden rounded-xl3 border border-ink/8 bg-white shadow-soft transition-shadow duration-300 ease-premium hover:border-primary/25 hover:shadow-card dark:border-white/10 dark:bg-white/[0.04]">
      {/* Image */}
      <div className="relative h-64 shrink-0 overflow-hidden rounded-t-xl3 sm:h-[17rem]">
        {hasRealImage ? (
          <>
            {!loaded && (
              <div className="skeleton absolute inset-0" aria-hidden="true" />
            )}
            <Link href={href} className="absolute inset-0 z-0" aria-label={name}>
              <Image
                ref={imgRef}
                src={image}
                alt={`${name} — cafe`}
                fill
                sizes="(max-width: 767px) 88vw, (max-width: 1024px) 45vw, 340px"
                onLoad={onLoad}
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
            className="absolute inset-0 z-0 flex items-center justify-center bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/5 transition-transform duration-500 ease-premium group-hover:scale-105 dark:from-primary/20 dark:via-secondary/20 dark:to-white/5"
          >
            <Coffee size={44} strokeWidth={1.5} className="text-primary/40" aria-hidden="true" />
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

        {cafeId && (
          <FavoriteButton
            listingType="cafe"
            listingId={cafeId}
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

        {(visibleDrinks.length > 0 || wifi || workingSpace) && (
          <ul className="flex flex-wrap gap-2" aria-label={t("amenitiesAriaLabel")}>
            {wifi && (
              <li className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-[11px] font-medium text-ink/70 dark:border-primary/20 dark:bg-primary/10 dark:text-sand/70">
                <Wifi size={12} className="text-primary" aria-hidden="true" />
                WiFi
              </li>
            )}
            {workingSpace && (
              <li className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-[11px] font-medium text-ink/70 dark:border-primary/20 dark:bg-primary/10 dark:text-sand/70">
                <Coffee size={12} className="text-primary" aria-hidden="true" />
                Workspace
              </li>
            )}
            {visibleDrinks.map((drink) => (
              <li
                key={drink}
                className="inline-flex items-center gap-1.5 rounded-full border border-ink/8 bg-ink/[0.03] px-3 py-1.5 text-[11px] font-medium text-ink/70 dark:border-white/10 dark:bg-white/[0.06] dark:text-sand/70"
              >
                {drink}
              </li>
            ))}
            {extraDrinkCount > 0 && (
              <li className="inline-flex items-center rounded-full border border-ink/8 bg-ink/[0.03] px-3 py-1.5 text-[11px] font-semibold text-ink/50 dark:border-white/10 dark:bg-white/[0.06] dark:text-sand/50">
                +{extraDrinkCount}
              </li>
            )}
          </ul>
        )}

        <div className="mt-auto flex flex-col gap-4 border-t border-ink/8 pt-5 dark:border-white/10">
          <div className={`grid gap-3 ${phone ? "grid-cols-2" : "grid-cols-1"}`}>
            <SecondaryButton href={href} size="lg" compact>
              {t("viewDetails")}
            </SecondaryButton>

            {phone && (
              <PrimaryButton href={`tel:${phone}`} size="lg" compact>
                <Phone size={14} aria-hidden="true" />
                {t("call")}
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
}

export const PremiumCafeCard = memo(PremiumCafeCardBase);
