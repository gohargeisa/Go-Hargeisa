"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Coffee, Heart, Loader2, MapPin, Phone, Sparkles, Star, Wifi } from "lucide-react";
import { toggleFavoriteAction } from "@/lib/actions/favorites";

const MAX_VISIBLE_DRINKS = 3;

/**
 * Listing-page cafe card, matching components/shared/hotel-card.tsx exactly
 * (same sizing, spacing, badges, hover treatment) so /cafes reads as the
 * same product quality as /hotels. Separate from
 * components/home/premium-cafe-card.tsx, which is homepage-only.
 */
export function CafeCard({
  href,
  image,
  name,
  address,
  rating,
  reviewCount,
  specialDrinks = [],
  wifi = false,
  workingSpace = false,
  phone,
  featured = false,
  cafeId,
  locale,
  initiallyFavorited = false,
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
  phone?: string;
  featured?: boolean;
  cafeId?: string;
  locale?: string;
  initiallyFavorited?: boolean;
}) {
  const t = useTranslations("listings");
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const [isPending, startTransition] = useTransition();
  const [loaded, setLoaded] = useState(false);
  const router = useRouter();

  function onToggleFavorite() {
    if (!cafeId) return;
    startTransition(async () => {
      const result = await toggleFavoriteAction("cafe", cafeId);
      if (!result.ok) {
        if (result.error === "sign-in-required" && locale) {
          router.push(`/${locale}/auth/login?next=${encodeURIComponent(href)}`);
        }
        return;
      }
      setFavorited(result.favorited ?? false);
    });
  }

  const allHighlights = [
    ...(wifi ? ["WiFi"] : []),
    ...(workingSpace ? ["Workspace"] : []),
    ...specialDrinks,
  ];
  const highlights = allHighlights.slice(0, MAX_VISIBLE_DRINKS);
  const extraCount = allHighlights.length - highlights.length;
  // coverImage is always a non-empty string (real photo or a generic brand
  // placeholder URL) — treat the generic placeholder the same as "no photo
  // yet" and show an elegant in-card fallback instead of the flat blue
  // placehold.co image (same convention as HotelCard).
  const hasRealImage = Boolean(image) && !image.includes("placehold.co");

  return (
    <div className="group flex h-full w-full min-w-[280px] flex-col overflow-hidden rounded-3xl border border-ink/8 bg-white shadow-[0_6px_20px_rgba(20,30,45,0.06)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_20px_45px_rgba(20,30,45,0.14)] dark:border-white/10 dark:bg-white/[0.04] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
      {/* Image */}
      <div className="relative h-56 shrink-0 overflow-hidden rounded-t-3xl sm:h-60">
        {hasRealImage ? (
          <>
            {!loaded && (
              <div className="absolute inset-0 animate-pulse bg-ink/10 dark:bg-white/10" aria-hidden="true" />
            )}
            <Link href={href} className="absolute inset-0 z-0" aria-label={name}>
              <Image
                src={image}
                alt={`${name} — cafe interior`}
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
            <Coffee size={40} strokeWidth={1.5} className="text-primary/40" aria-hidden="true" />
          </Link>
        )}

        {featured && (
          <span className="absolute start-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-primary/95 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm backdrop-blur-sm">
            <Sparkles size={10} aria-hidden="true" />
            {t("featuredBadge")}
          </span>
        )}

        {/* Rating badge — top-end, over the image */}
        <div className="absolute end-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-ink shadow-sm backdrop-blur-sm dark:bg-ink/90 dark:text-white">
          <Star size={12} fill="currentColor" className="text-primary" aria-hidden="true" />
          {rating.toFixed(1)}
          {reviewCount > 0 && (
            <span className="font-normal text-ink/50 dark:text-sand/50">({reviewCount})</span>
          )}
        </div>

        {cafeId && (
          <button
            type="button"
            onClick={onToggleFavorite}
            disabled={isPending}
            aria-label={favorited ? t("removeFromFavorites", { name }) : t("addToFavorites", { name })}
            className="absolute end-3 bottom-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm transition-transform hover:scale-105 disabled:opacity-60 dark:bg-ink/90 dark:text-white"
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

        {highlights.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label={t("amenitiesAriaLabel")}>
            {highlights.map((item) => (
              <li
                key={item}
                className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-medium text-ink/70 dark:bg-white/10 dark:text-sand/70"
              >
                {item === "WiFi" ? <Wifi size={12} aria-hidden="true" /> : item === "Workspace" ? <Coffee size={12} aria-hidden="true" /> : null}
                {item}
              </li>
            ))}
            {extraCount > 0 && (
              <li className="inline-flex items-center rounded-full bg-ink/5 px-2.5 py-1 text-[11px] font-medium text-ink/50 dark:bg-white/10 dark:text-sand/50">
                +{extraCount}
              </li>
            )}
          </ul>
        )}

        <div className={`mt-auto grid gap-3 border-t border-ink/8 pt-4 dark:border-white/10 ${phone ? "grid-cols-2" : "grid-cols-1"}`}>
          <Link
            href={href}
            className="inline-flex h-11 items-center justify-center rounded-full border border-ink/15 px-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white dark:hover:border-primary"
          >
            {t("viewDetails")}
          </Link>

          {phone && (
            <a
              href={`tel:${phone}`}
              className="inline-flex h-11 items-center justify-center gap-1.5 rounded-full bg-primary px-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
            >
              <Phone size={14} aria-hidden="true" />
              Call
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
