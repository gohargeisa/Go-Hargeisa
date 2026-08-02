"use client";

import Link from "next/link";
import Image from "next/image";
import { memo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { ArrowUpRight, Heart, Loader2, MapPin, Sparkles, Star, UtensilsCrossed } from "lucide-react";
import { toggleFavoriteAction } from "@/lib/actions/favorites";
import { AnimatedCard } from "@/components/shared/animated-card";
import { FloatingBadge } from "@/components/shared/floating-badge";
import { PrimaryButton, SecondaryButton } from "@/components/shared/buttons";

const MAX_VISIBLE_CUISINES = 4;

/**
 * Homepage-only restaurant card, matching the visual language of
 * components/home/premium-hotel-card.tsx exactly. Deliberately separate
 * from components/shared/listing-card.tsx (used by the restaurants
 * listing page, restaurant detail "You may also like", and dashboard
 * favorites) and from components/home/premium-card.tsx (still used
 * as-is for the Attractions row) so this redesign can't affect anything
 * outside the homepage Restaurants row.
 */
function PremiumRestaurantCardBase({
  href,
  image,
  name,
  address,
  rating,
  reviewCount,
  priceRange,
  cuisine = [],
  featured = false,
  reservable = false,
  restaurantId,
  locale,
  initiallyFavorited = false,
  website,
  phone,
}: {
  href: string;
  image: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  priceRange?: string;
  cuisine?: string[];
  featured?: boolean;
  reservable?: boolean;
  restaurantId?: string;
  locale?: string;
  initiallyFavorited?: boolean;
  website?: string;
  phone?: string;
}) {
  const t = useTranslations("listings");
  const tc = useTranslations("common");
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  function onToggleFavorite() {
    if (!restaurantId) return;
    startTransition(async () => {
      const result = await toggleFavoriteAction("restaurant", restaurantId);
      if (!result.ok) {
        if (result.error === "sign-in-required" && locale) {
          router.push(`/${locale}/auth/login?next=${encodeURIComponent(href)}`);
        }
        return;
      }
      setFavorited(result.favorited ?? false);
    });
  }

  const visibleCuisines = cuisine.slice(0, MAX_VISIBLE_CUISINES);
  const extraCuisineCount = cuisine.length - visibleCuisines.length;
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
                alt={`${name} — restaurant`}
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
            className="absolute inset-0 z-0 flex items-center justify-center bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/5 transition-transform duration-500 ease-premium group-hover:scale-105 dark:from-primary/20 dark:via-secondary/20 dark:to-white/5"
          >
            <UtensilsCrossed size={44} strokeWidth={1.5} className="text-primary/40" aria-hidden="true" />
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

        {restaurantId && (
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
                className="transition-transform duration-300"
                aria-hidden="true"
              />
            )}
          </button>
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

        {visibleCuisines.length > 0 && (
          <ul className="flex flex-wrap gap-2" aria-label={tc("cuisine")}>
            {visibleCuisines.map((c) => (
              <li
                key={c}
                className="inline-flex items-center gap-1.5 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-[11px] font-medium text-ink/70 dark:border-primary/20 dark:bg-primary/10 dark:text-sand/70"
              >
                <UtensilsCrossed size={12} className="text-primary" aria-hidden="true" />
                {c}
              </li>
            ))}
            {extraCuisineCount > 0 && (
              <li className="inline-flex items-center rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-[11px] font-semibold text-ink/50 dark:border-primary/20 dark:bg-primary/10 dark:text-sand/50">
                +{extraCuisineCount}
              </li>
            )}
          </ul>
        )}

        <div className="mt-auto flex flex-col gap-4 border-t border-ink/8 pt-5 dark:border-white/10">
          {priceRange && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">
                {tc("priceRange")}
              </p>
              <p className="font-display text-2xl font-bold text-primary">{priceRange}</p>
            </div>
          )}

          <div className={`grid gap-3 ${reservable ? "grid-cols-2" : "grid-cols-1"}`}>
            <SecondaryButton href={href} size="lg" compact>
              {t("viewDetails")}
            </SecondaryButton>

            {reservable &&
              (website ? (
                <PrimaryButton href={website} external size="lg" compact>
                  {tc("reserveTable")}
                  <ArrowUpRight size={14} aria-hidden="true" />
                  <span className="sr-only">{t("opensInNewTab")}</span>
                </PrimaryButton>
              ) : phone ? (
                <PrimaryButton href={`tel:${phone}`} size="lg" compact>
                  {tc("reserveTable")}
                </PrimaryButton>
              ) : (
                <PrimaryButton href={href} size="lg" compact>
                  {tc("reserveTable")}
                </PrimaryButton>
              ))}
          </div>
        </div>
      </div>
    </AnimatedCard>
  );
}

export const PremiumRestaurantCard = memo(PremiumRestaurantCardBase);
