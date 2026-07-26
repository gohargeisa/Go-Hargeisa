"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowUpRight,
  Bell,
  Car,
  CheckCircle2,
  Coffee,
  Dumbbell,
  Heart,
  Loader2,
  MapPin,
  Plane,
  Snowflake,
  Sparkles,
  Trees,
  UtensilsCrossed,
  Users,
  Waves,
  Wifi,
  Wine,
  Zap,
} from "lucide-react";
import { RatingBadge } from "./rating-badge";
import { toggleFavoriteAction } from "@/lib/actions/favorites";

const AMENITY_ICONS: { match: RegExp; icon: typeof Wifi }[] = [
  { match: /wi[\s-]?fi/i, icon: Wifi },
  { match: /park/i, icon: Car },
  { match: /breakfast/i, icon: Coffee },
  { match: /restaurant|dining/i, icon: UtensilsCrossed },
  { match: /gym|fitness/i, icon: Dumbbell },
  { match: /garden/i, icon: Trees },
  { match: /shuttle|airport/i, icon: Plane },
  { match: /air ?condition|\bac\b/i, icon: Snowflake },
  { match: /generator|power/i, icon: Zap },
  { match: /conference|meeting/i, icon: Users },
  { match: /room service|concierge/i, icon: Bell },
  { match: /pool/i, icon: Waves },
  { match: /spa/i, icon: Sparkles },
  { match: /bar\b/i, icon: Wine },
];

function amenityIcon(label: string) {
  return AMENITY_ICONS.find((a) => a.match.test(label))?.icon ?? CheckCircle2;
}

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
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const [isPending, startTransition] = useTransition();
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

  return (
    <div className="group flex h-full w-full min-w-[280px] flex-col overflow-hidden rounded-3xl border border-ink/8 bg-white shadow-[0_10px_30px_rgba(20,30,45,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/25 hover:shadow-[0_24px_55px_rgba(20,30,45,0.18)] dark:border-white/10 dark:bg-white/[0.04] dark:hover:shadow-[0_24px_55px_rgba(0,0,0,0.45)]">
      {/* Image */}
      <div className="relative h-56 shrink-0 overflow-hidden rounded-t-3xl sm:h-60">
        <Link href={href} className="absolute inset-0 z-0" aria-label={name}>
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 767px) 84vw, (max-width: 1024px) 45vw, 320px"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
          />
        </Link>

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent"
          aria-hidden="true"
        />

        {featured && (
          <span className="absolute start-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm">
            <Sparkles size={12} aria-hidden="true" />
            Featured
          </span>
        )}

        {hotelId && (
          <button
            type="button"
            onClick={onToggleFavorite}
            disabled={isPending}
            aria-label={favorited ? `Remove ${name} from favorites` : `Add ${name} to favorites`}
            className="absolute end-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm transition-transform hover:scale-105 disabled:opacity-60"
          >
            {isPending ? (
              <Loader2 size={17} className="animate-spin" aria-hidden="true" />
            ) : (
              <Heart
                size={17}
                fill={favorited ? "#F4B400" : "none"}
                color={favorited ? "#F4B400" : "#444"}
                aria-hidden="true"
              />
            )}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-3 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <Link href={href} className="min-w-0">
            <h3 className="truncate font-display text-lg font-bold text-ink transition-colors group-hover:text-primary dark:text-white sm:text-xl">
              {name}
            </h3>
          </Link>
          <div className="shrink-0">
            <RatingBadge rating={rating} reviewCount={reviewCount} />
          </div>
        </div>

        <p className="flex items-center gap-1.5 text-sm text-ink/60 dark:text-sand/60">
          <MapPin size={15} className="shrink-0 text-primary" aria-hidden="true" />
          <span className="line-clamp-1">{address}</span>
        </p>

        {visibleAmenities.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Amenities">
            {visibleAmenities.map((amenity) => {
              const Icon = amenityIcon(amenity);
              return (
                <li
                  key={amenity}
                  className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2.5 py-1 text-xs font-medium text-ink/70 dark:bg-white/10 dark:text-sand/70"
                >
                  <Icon size={12} aria-hidden="true" />
                  {amenity}
                </li>
              );
            })}
            {extraAmenityCount > 0 && (
              <li className="inline-flex items-center rounded-full bg-ink/5 px-2.5 py-1 text-xs font-medium text-ink/50 dark:bg-white/10 dark:text-sand/50">
                +{extraAmenityCount}
              </li>
            )}
          </ul>
        )}

        <div className="mt-auto space-y-3 border-t border-ink/8 pt-4 dark:border-white/10">
          {priceRange && (
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">
                Starting from
              </p>
              <p className="font-display text-xl font-bold text-primary">{priceRange}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Link
              href={href}
              className="inline-flex items-center justify-center rounded-full border border-ink/15 px-3 py-2.5 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white dark:hover:border-primary"
            >
              View Details
            </Link>

            {website ? (
              <a
                href={website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-1 rounded-full bg-primary px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Book Now
                <ArrowUpRight size={14} aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            ) : (
              <Link
                href={href}
                className="inline-flex items-center justify-center rounded-full bg-primary px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-700"
              >
                Book Now
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
