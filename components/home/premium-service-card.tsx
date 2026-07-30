"use client";

import Link from "next/link";
import Image from "next/image";
import { memo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { m, useReducedMotion } from "framer-motion";
import { Heart, Loader2, MapPin, Phone, Sparkles, Star } from "lucide-react";
import { toggleFavoriteAction } from "@/lib/actions/favorites";
import { CATEGORY_CONFIG } from "@/components/city-map/category-config";
import type { ServiceCategory } from "@/types";

/**
 * Homepage-only service card, matching the visual language of
 * components/home/premium-hotel-card.tsx / premium-cafe-card.tsx exactly.
 * Separate from components/shared/service-card.tsx (used by the /services
 * listing pages) so this redesign can't affect anything outside the
 * homepage Essential Services row.
 */
function PremiumServiceCardBase({
  href,
  image,
  name,
  address,
  rating,
  reviewCount,
  category,
  phone,
  featured = false,
  serviceId,
  locale,
  initiallyFavorited = false,
}: {
  href: string;
  image: string;
  name: string;
  address: string;
  rating: number;
  reviewCount: number;
  category: ServiceCategory;
  phone?: string;
  featured?: boolean;
  serviceId?: string;
  locale?: string;
  initiallyFavorited?: boolean;
}) {
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const reduceMotion = useReducedMotion();
  const router = useRouter();

  function onToggleFavorite() {
    if (!serviceId) return;
    startTransition(async () => {
      const result = await toggleFavoriteAction("service", serviceId);
      if (!result.ok) {
        if (result.error === "sign-in-required" && locale) {
          router.push(`/${locale}/auth/login?next=${encodeURIComponent(href)}`);
        }
        return;
      }
      setFavorited(result.favorited ?? false);
    });
  }

  const meta = CATEGORY_CONFIG[category];
  const CategoryIcon = meta.icon;
  const hasRealImage = Boolean(image) && !image.includes("placehold.co");

  return (
    <m.div
      whileHover={reduceMotion ? undefined : { y: -8 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group flex h-full w-full min-w-[288px] flex-col overflow-hidden rounded-[28px] border border-ink/8 bg-white shadow-[0_8px_24px_rgba(20,30,45,0.07)] transition-shadow duration-300 ease-out hover:border-primary/25 hover:shadow-[0_28px_60px_rgba(20,30,45,0.16)] dark:border-white/10 dark:bg-white/[0.04] dark:hover:shadow-[0_28px_60px_rgba(0,0,0,0.45)]"
    >
      <div className="relative h-64 shrink-0 overflow-hidden rounded-t-[28px] sm:h-[17rem]">
        {hasRealImage ? (
          <>
            {!loaded && (
              <div className="absolute inset-0 animate-pulse bg-ink/10 dark:bg-white/10" aria-hidden="true" />
            )}
            <Link href={href} className="absolute inset-0 z-0" aria-label={name}>
              <Image
                src={image}
                alt={name}
                fill
                sizes="(max-width: 767px) 88vw, (max-width: 1024px) 45vw, 340px"
                onLoad={() => setLoaded(true)}
                className={`object-cover transition-transform duration-500 ease-out group-hover:scale-105 ${
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
            className="absolute inset-0 z-0 flex items-center justify-center bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/5 transition-transform duration-500 ease-out group-hover:scale-105 dark:from-primary/20 dark:via-secondary/20 dark:to-white/5"
          >
            <CategoryIcon size={44} strokeWidth={1.5} className="text-primary/40" aria-hidden="true" />
          </Link>
        )}

        <span
          className="absolute start-3.5 top-3.5 z-10 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-[0_4px_14px_rgba(0,0,0,0.25)] ring-1 ring-white/30 backdrop-blur-md"
          style={{ backgroundColor: meta.color }}
        >
          <CategoryIcon size={10} aria-hidden="true" />
          {meta.label}
        </span>

        {featured && (
          <span className="absolute start-3.5 top-11 z-10 inline-flex items-center gap-1 rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-[0_4px_14px_rgba(245,158,11,0.45)] ring-1 ring-white/30 backdrop-blur-md">
            <Sparkles size={10} aria-hidden="true" />
            Featured
          </span>
        )}

        <div className="absolute end-3.5 top-3.5 z-10 inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/20 px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
          <Star size={12} fill="currentColor" className="text-primary" aria-hidden="true" />
          {rating.toFixed(1)}
          {reviewCount > 0 && <span className="font-normal text-white/75">({reviewCount})</span>}
        </div>

        {serviceId && (
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

        <div className={`mt-auto grid gap-3 border-t border-ink/8 pt-5 dark:border-white/10 ${phone ? "grid-cols-2" : "grid-cols-1"}`}>
          <Link
            href={href}
            className="inline-flex h-12 items-center justify-center rounded-full border border-ink/15 px-4 text-sm font-semibold text-ink transition-all duration-300 hover:border-primary hover:bg-primary/5 hover:text-primary dark:border-white/20 dark:text-white dark:hover:border-primary dark:hover:bg-primary/10"
          >
            View Details
          </Link>

          {phone && (
            <a
              href={`tel:${phone}`}
              className="inline-flex h-12 items-center justify-center gap-1.5 rounded-full bg-primary px-4 text-sm font-semibold text-white shadow-[0_10px_24px_rgba(245,158,11,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-[0_14px_30px_rgba(245,158,11,0.4)]"
            >
              <Phone size={14} aria-hidden="true" />
              Call
            </a>
          )}
        </div>
      </div>
    </m.div>
  );
}

export const PremiumServiceCard = memo(PremiumServiceCardBase);
