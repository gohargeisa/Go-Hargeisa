"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Building2, Heart, Loader2, MapPin, Sparkles, Star } from "lucide-react";
import { toggleFavoriteAction } from "@/lib/actions/favorites";
import { amenityIcon } from "@/lib/utils/amenity-icon";
import { AnimatedCard } from "./animated-card";
import { FloatingBadge } from "./floating-badge";
import { PrimaryButton, SecondaryButton } from "./buttons";

const MAX_VISIBLE_AMENITIES = 4;

export function HotelCard({
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
  /** Real hotel website, if on file — used for the "Book Now" CTA. Falls back to the detail page. */
  website?: string;
}) {
  const t = useTranslations("listings");
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  function onToggleFavorite() {
    if (!hotelId) return;
    startTransition(async () => {
      const result = await toggleFavoriteAction("hotel", hotelId);
      if (!result.ok) {
        if (result.error === "sign-in-required" && locale) {
          router.push(`/${locale}/auth/login?next=${encodeURIComponent(href)}`);
        }
        return;
      }
      setFavorited(result.favorited ?? false);
    });
  }

  const visibleAmenities = amenities.slice(0, MAX_VISIBLE_AMENITIES);
  const extraAmenityCount = amenities.length - visibleAmenities.length;
  // coverImage is always a non-empty string (real photo or a generic brand
  // placeholder URL from lib/placeholder-image.ts) — treat the generic
  // placeholder the same as "no photo yet" and show an elegant in-card
  // fallback instead of the flat blue placehold.co image.
  const hasRealImage = Boolean(image) && !image.includes("placehold.co");

  return (
    <AnimatedCard className="group flex h-full w-full min-w-[280px] flex-col overflow-hidden rounded-xl3 border border-ink/8 bg-white shadow-soft transition-shadow duration-300 ease-premium hover:border-primary/25 hover:shadow-card dark:border-white/10 dark:bg-white/[0.04]">
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
                alt={`${name} — hotel exterior`}
                fill
                sizes="(max-width: 767px) 84vw, (max-width: 1024px) 45vw, 320px"
                onLoad={() => setLoaded(true)}
                className={`object-cover transition-all duration-500 ease-out group-hover:scale-105 ${
                  loaded ? "opacity-100" : "opacity-0"
                }`}
              />
            </Link>
            <div
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent"
              aria-hidden="true"
            />
          </>
        ) : (
          <Link
            href={href}
            aria-label={name}
            className="absolute inset-0 z-0 flex items-center justify-center bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/5 transition-transform duration-500 ease-out group-hover:scale-105 dark:from-primary/20 dark:via-secondary/20 dark:to-white/5"
          >
            <Building2 size={40} strokeWidth={1.5} className="text-primary/40" aria-hidden="true" />
          </Link>
        )}

        {featured && (
          <FloatingBadge icon={Sparkles}>{t("featuredBadge")}</FloatingBadge>
        )}

        {/* Rating badge — top-end, over the image */}
        <div className="absolute end-3.5 top-3.5 z-10 inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/20 px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
          <Star size={12} fill="currentColor" className="text-primary" aria-hidden="true" />
          {rating.toFixed(1)}
          {reviewCount > 0 && <span className="font-normal text-white/75">({reviewCount})</span>}
        </div>

        {hotelId && (
          <button
            type="button"
            onClick={onToggleFavorite}
            disabled={isPending}
            aria-label={favorited ? t("removeFromFavorites", { name }) : t("addToFavorites", { name })}
            className="absolute end-3.5 bottom-3.5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm transition-all duration-300 hover:scale-110 hover:shadow-[0_6px_16px_rgba(0,0,0,0.25)] active:scale-95 disabled:opacity-60 dark:bg-ink/90 dark:text-white"
          >
            {isPending ? (
              <Loader2 size={17} className="animate-spin" aria-hidden="true" />
            ) : (
              <Heart
                size={17}
                fill={favorited ? "#F4B400" : "none"}
                color={favorited ? "#F4B400" : "currentColor"}
                aria-hidden="true"
              />
            )}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
        <div>
          <Link href={href}>
            <h3 className="line-clamp-1 font-display text-xl font-bold text-ink transition-colors group-hover:text-primary dark:text-white sm:text-[1.375rem]">
              {name}
            </h3>
          </Link>
          <p className="mt-1.5 flex items-center gap-1.5 text-sm text-ink/60 dark:text-sand/60">
            <MapPin size={15} className="shrink-0 text-primary" aria-hidden="true" />
            <span className="line-clamp-1">{address}</span>
          </p>
        </div>

        {visibleAmenities.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label={t("amenitiesAriaLabel")}>
            {visibleAmenities.map((amenity) => {
              const Icon = amenityIcon(amenity);
              return (
                <li
                  key={amenity}
                  className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-medium text-ink/70 dark:bg-white/10 dark:text-sand/70"
                >
                  <Icon size={12} aria-hidden="true" />
                  {amenity}
                </li>
              );
            })}
            {extraAmenityCount > 0 && (
              <li className="inline-flex items-center rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-medium text-ink/50 dark:bg-white/10 dark:text-sand/50">
                +{extraAmenityCount}
              </li>
            )}
          </ul>
        )}

        <div className="mt-auto flex flex-col gap-4 border-t border-ink/8 pt-4 dark:border-white/10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">
              {t("startingFrom")}
            </p>
            {priceRange ? (
              <p className="font-display text-xl font-bold text-primary">
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
            <SecondaryButton href={href} compact>
              {t("viewDetails")}
            </SecondaryButton>

            {website ? (
              <PrimaryButton href={website} external compact>
                {t("bookNow")}
                <ArrowUpRight size={14} aria-hidden="true" />
                <span className="sr-only">{t("opensInNewTab")}</span>
              </PrimaryButton>
            ) : (
              <PrimaryButton href={href} compact>
                {t("bookNow")}
              </PrimaryButton>
            )}
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
}
