"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Heart, Loader2, MapPin, Star } from "lucide-react";
import { RatingBadge } from "./rating-badge";
import { toggleFavoriteAction } from "@/lib/actions/favorites";

type ListingType = "hotel" | "restaurant" | "cafe" | "attraction";

export function ListingCard({
  href, image, title, subtitle, rating, reviewCount, tag, priceRange,
  listingType, listingId, initiallyFavorited = false, locale,
}: {
  href: string; image: string; title: string; subtitle: string; rating: number;
  reviewCount: number; tag?: string; priceRange?: string; listingType?: ListingType;
  listingId?: string; initiallyFavorited?: boolean; locale?: string;
}) {
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

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
    <Link
      href={href}
      className="group flex h-full w-full min-w-[272px] flex-col overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-[0_10px_30px_rgba(20,30,45,0.08)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_18px_42px_rgba(20,30,45,0.16)] dark:border-white/10 dark:bg-white/[0.04]"
    >
      <div className="relative h-44 overflow-hidden sm:h-48">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width: 767px) 78vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
        <div className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1.5 text-xs font-bold text-ink shadow-sm backdrop-blur">
          <Star size={13} fill="currentColor" className="text-accent" /> {rating.toFixed(1)}
        </div>
        {listingType && listingId && (
          <button
            type="button"
            onClick={onToggleFavorite}
            disabled={isPending}
            aria-label={favorited ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm transition-transform hover:scale-105 disabled:opacity-60"
          >
            {isPending ? <Loader2 size={18} className="animate-spin" /> : <Heart size={18} fill={favorited ? "#F4B400" : "none"} color={favorited ? "#F4B400" : "#444"} />}
          </button>
        )}
        {tag && <span className="absolute bottom-3 left-3 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-white shadow-sm">{tag}</span>}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="truncate font-display text-xl font-bold text-ink dark:text-white">{title}</h3>
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
            Explore <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </div>
    </Link>
  );
}
