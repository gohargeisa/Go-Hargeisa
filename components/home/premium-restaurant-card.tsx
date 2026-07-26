"use client";

import Link from "next/link";
import Image from "next/image";
import { memo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowUpRight,
  Heart,
  Loader2,
  MapPin,
  Sparkles,
  Star,
  UtensilsCrossed,
} from "lucide-react";
import { toggleFavoriteAction } from "@/lib/actions/favorites";

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
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const reduceMotion = useReducedMotion();
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
    <motion.div
      whileHover={reduceMotion ? undefined : { y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group flex h-full w-full min-w-[288px] flex-col overflow-hidden rounded-[28px] border border-ink/8 bg-white shadow-[0_8px_24px_rgba(20,30,45,0.07)] transition-shadow duration-300 ease-out hover:border-primary/25 hover:shadow-[0_28px_60px_rgba(20,30,45,0.16)] dark:border-white/10 dark:bg-white/[0.04] dark:hover:shadow-[0_28px_60px_rgba(0,0,0,0.45)]"
    >
      {/* Image */}
      <div className="relative h-64 shrink-0 overflow-hidden rounded-t-[28px] sm:h-[17rem]">
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
                className={`object-cover transition-transform duration-700 ease-out group-hover:scale-110 ${
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
            className="absolute inset-0 z-0 flex items-center justify-center bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/5 transition-transform duration-700 ease-out group-hover:scale-110 dark:from-primary/20 dark:via-secondary/20 dark:to-white/5"
          >
            <UtensilsCrossed size={44} strokeWidth={1.5} className="text-primary/40" aria-hidden="true" />
          </Link>
        )}

        {featured && (
          <span className="absolute start-3.5 top-3.5 z-10 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-[0_4px_14px_rgba(245,158,11,0.45)] ring-1 ring-white/30 backdrop-blur-md">
            <Sparkles size={10} aria-hidden="true" />
            Featured
          </span>
        )}

        <div className="absolute end-3.5 top-3.5 z-10 inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/20 px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
          <Star size={12} fill="currentColor" className="text-primary" aria-hidden="true" />
          {rating.toFixed(1)}
          {reviewCount > 0 && <span className="font-normal text-white/75">({reviewCount})</span>}
        </div>

        {restaurantId && (
          <button
            type="button"
            onClick={onToggleFavorite}
            disabled={isPending}
            aria-label={favorited ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
            className="absolute end-3.5 bottom-3.5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm transition-all duration-300 hover:scale-110 hover:shadow-[0_6px_16px_rgba(0,0,0,0.25)] active:scale-95 disabled:opacity-60 dark:bg-ink/90 dark:text-white"
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
          <ul className="flex flex-wrap gap-2" aria-label="Cuisine">
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
                Price Range
              </p>
              <p className="font-display text-2xl font-bold text-primary">{priceRange}</p>
            </div>
          )}

          <div className={`grid gap-3 ${reservable ? "grid-cols-2" : "grid-cols-1"}`}>
            <Link
              href={href}
              className="inline-flex h-12 items-center justify-center rounded-full border border-ink/15 px-4 text-sm font-semibold text-ink transition-all duration-300 hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-white/20 dark:text-white dark:hover:border-primary dark:hover:bg-primary/10"
            >
              View Details
            </Link>

            {reservable &&
              (website ? (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 items-center justify-center gap-1 rounded-full bg-primary px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(245,158,11,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-[0_14px_30px_rgba(245,158,11,0.4)]"
                >
                  Reserve a Table
                  <ArrowUpRight size={14} aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              ) : phone ? (
                <a
                  href={`tel:${phone}`}
                  className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(245,158,11,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-[0_14px_30px_rgba(245,158,11,0.4)]"
                >
                  Reserve a Table
                </a>
              ) : (
                <Link
                  href={href}
                  className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(245,158,11,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-[0_14px_30px_rgba(245,158,11,0.4)]"
                >
                  Reserve a Table
                </Link>
              ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export const PremiumRestaurantCard = memo(PremiumRestaurantCardBase);
