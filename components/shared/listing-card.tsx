"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Heart, Loader2, MapPin, Star } from "lucide-react";
import { RatingBadge } from "./rating-badge";
import { toggleFavoriteAction } from "@/lib/actions/favorites";

type ListingType = "hotel" | "restaurant" | "cafe" | "attraction" | "service";

export function ListingCard({
  href, image, title, subtitle, rating, reviewCount, tag, priceRange,
  listingType, listingId, initiallyFavorited = false, locale,
}: {
  href: string; image: string; title: string; subtitle: string; rating: number;
  reviewCount: number; tag?: string; priceRange?: string; listingType?: ListingType;
  listingId?: string; initiallyFavorited?: boolean; locale?: string;
}) {
  const t = useTranslations("listings");
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  function onToggleFavorite(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (!listingType || !listingId) return;

    startTransition(async () => {
      const result = await toggleFavoriteAction(listingType, listingId);
      if (!result.ok) {
        if (result.error === "sign-in-required" && locale) {
          router.push(`/${locale}/auth/login?next=${encodeURIComponent(href)}`);
        }
        return;
      }
      setFavorited(result.favorited ?? false);
    });
  }

  return (
    <motion.div
      whileHover={reduceMotion ? undefined : { y: -6 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      className="group h-full w-full min-w-[272px]"
    >
      <Link
        href={href}
        className="flex h-full flex-col overflow-hidden rounded-3xl border border-ink/8 bg-white shadow-[0_8px_24px_rgba(20,30,45,0.07)] transition-shadow duration-300 ease-premium hover:border-primary/25 hover:shadow-[0_24px_50px_rgba(20,30,45,0.16)] dark:border-white/10 dark:bg-white/[0.04] dark:hover:shadow-[0_24px_50px_rgba(0,0,0,0.45)]"
      >
        <div className="relative h-44 overflow-hidden sm:h-48">
          {!loaded && <div className="skeleton absolute inset-0" aria-hidden="true" />}
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 767px) 78vw, (max-width: 1024px) 33vw, 25vw"
            onLoad={() => setLoaded(true)}
            className={`object-cover transition-all duration-500 ease-premium group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          <div className="absolute start-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1.5 text-xs font-bold text-ink shadow-sm backdrop-blur">
            <Star size={13} fill="currentColor" className="text-primary" /> {rating.toFixed(1)}
          </div>
          {listingType && listingId && (
            <button
              type="button"
              onClick={onToggleFavorite}
              disabled={isPending}
              aria-label={favorited ? t("removeFromFavorites", { name: title }) : t("addToFavorites", { name: title })}
              className="absolute end-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm transition-transform duration-300 hover:scale-110 active:scale-95 disabled:opacity-60"
            >
              {isPending ? <Loader2 size={18} className="animate-spin" /> : <Heart size={18} fill={favorited ? "#F4B400" : "none"} color={favorited ? "#F4B400" : "#444"} />}
            </button>
          )}
          {tag && <span className="absolute bottom-3 start-3 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm">{tag}</span>}
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
            {priceRange && <span className="rounded-lg bg-primary/10 px-2.5 py-1.5 text-sm font-bold text-primary">{priceRange}</span>}
          </div>
          <div className="mt-auto flex items-center justify-between border-t border-ink/8 pt-4 dark:border-white/10">
            <RatingBadge rating={rating} reviewCount={reviewCount} />
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-all group-hover:gap-2">
              {t("explore")} <ArrowRight size={16} className="transition-transform group-hover:translate-x-1 rtl:rotate-180" />
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
