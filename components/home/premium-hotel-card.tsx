"use client";

import Link from "next/link";
import Image from "next/image";
import { memo, useState } from "react";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Building2, MapPin, Sparkles, Star } from "lucide-react";
import { amenityIcon } from "@/lib/utils/amenity-icon";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { AnimatedCard } from "@/components/shared/animated-card";
import { FloatingBadge } from "@/components/shared/floating-badge";
import { PrimaryButton, SecondaryButton } from "@/components/shared/buttons";

const MAX_VISIBLE_AMENITIES = 4;

/**
 * Homepage-only hotel card. Deliberately separate from
 * components/shared/hotel-card.tsx (used by the hotels listing page,
 * hotel detail page, and dashboard favorites) so this redesign can't
 * change anything outside the homepage.
 */
function PremiumHotelCardBase({
  href,
  image,
  name,
  address,
  rating,
  reviewCount,
  priceRange,
  amenities = [],
  featured = false,
  hotelId,
  locale,
  initiallyFavorited = false,
  website,
}: {
  href: string;
  image: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  priceRange?: string;
  amenities?: string[];
  featured?: boolean;
  hotelId?: string;
  locale?: string;
  initiallyFavorited?: boolean;
  website?: string;
}) {
  const t = useTranslations("listings");
  const [loaded, setLoaded] = useState(false);

  const visibleAmenities = amenities.slice(0, MAX_VISIBLE_AMENITIES);
  const extraAmenityCount = amenities.length - visibleAmenities.length;
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
                src={image}
                alt={`${name} — hotel exterior`}
                fill
                sizes="(max-width: 767px) 88vw, (max-width: 1024px) 45vw, 340px"
                onLoad={() => setLoaded(true)}
                className={`object-cover transition-transform duration-500 ease-premium group-hover:scale-105 ${
                  loaded ? "opacity-100" : "opacity-0"
                }`}
              />
            </Link>
            {/* subtle glass sheen up top, dark scrim down low for badge legibility */}
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
            <Building2 size={44} strokeWidth={1.5} className="text-primary/40" aria-hidden="true" />
          </Link>
        )}

        {featured && <FloatingBadge icon={Sparkles}>{t("featuredBadge")}</FloatingBadge>}

        {/* Rating badge — glass, top-end */}
        {reviewCount > 0 && (
          <div className="absolute end-3.5 top-3.5 z-10 inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/20 px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
            <Star size={12} fill="currentColor" className="text-primary" aria-hidden="true" />
            {rating.toFixed(1)}
            <span className="font-normal text-white/75">({reviewCount})</span>
          </div>
        )}

        {hotelId && (
          <FavoriteButton
            listingType="hotel"
            listingId={hotelId}
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

        {visibleAmenities.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label={t("amenitiesAriaLabel")}>
            {visibleAmenities.map((amenity) => {
              const Icon = amenityIcon(amenity);
              return (
                <li
                  key={amenity}
                  className="inline-flex items-center gap-1.5 rounded-full border border-ink/8 bg-ink/[0.03] px-3 py-1.5 text-[11px] font-medium text-ink/70 dark:border-white/10 dark:bg-white/[0.06] dark:text-sand/70"
                >
                  <Icon size={12} className="text-primary" aria-hidden="true" />
                  {amenity}
                </li>
              );
            })}
            {extraAmenityCount > 0 && (
              <li className="inline-flex items-center rounded-full border border-ink/8 bg-ink/[0.03] px-3 py-1.5 text-[11px] font-semibold text-ink/50 dark:border-white/10 dark:bg-white/[0.06] dark:text-sand/50">
                +{extraAmenityCount}
              </li>
            )}
          </ul>
        )}

        <div className="mt-auto flex flex-col gap-4 border-t border-ink/8 pt-5 dark:border-white/10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">
              {t("startingFrom")}
            </p>
            {priceRange ? (
              <p className="font-display text-2xl font-bold text-primary">
                {priceRange}
                <span className="ms-1 text-sm font-medium text-ink/50 dark:text-sand/50">{t("perNight")}</span>
              </p>
            ) : (
              <p className="font-display text-base font-semibold text-ink/35 dark:text-sand/40">
                {t("priceOnRequest")}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SecondaryButton href={href} size="lg" compact>
              {t("viewDetails")}
            </SecondaryButton>

            {website ? (
              <PrimaryButton href={website} external size="lg" compact>
                {t("bookNow")}
                <ArrowUpRight size={14} aria-hidden="true" />
                <span className="sr-only">{t("opensInNewTab")}</span>
              </PrimaryButton>
            ) : (
              <PrimaryButton href={href} size="lg" compact>
                {t("bookNow")}
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
}

export const PremiumHotelCard = memo(PremiumHotelCardBase);
