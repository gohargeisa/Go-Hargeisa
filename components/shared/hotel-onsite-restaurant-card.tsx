import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Clock, UtensilsCrossed } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Restaurant } from "@/types";

/**
 * Shown only when a hotel links to an existing restaurant listing
 * (hotel.restaurant, set from restaurant_id in the admin form). Restaurants
 * don't have their own logo field in the data model, so this reuses the
 * restaurant's cover photo with an icon badge rather than a separate logo.
 */
export function HotelOnsiteRestaurantCard({
  restaurant,
  locale,
  viewLabel = "View Restaurant",
}: {
  restaurant: Restaurant;
  locale: Locale;
  viewLabel?: string;
}) {
  return (
    <div className="overflow-hidden rounded-3xl border border-ink/8 bg-white dark:border-white/10 dark:bg-white/[0.04]">
      <div className="relative h-40 w-full">
        <Image
          src={restaurant.coverImage}
          alt={restaurant.name}
          fill
          sizes="(max-width: 767px) 100vw, 600px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" aria-hidden="true" />
        <div className="absolute bottom-3 start-4 flex items-center gap-2 text-white">
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm">
            <UtensilsCrossed size={16} aria-hidden="true" />
          </span>
          <p className="font-display text-lg font-bold drop-shadow-sm">{restaurant.name}</p>
        </div>
      </div>

      <div className="space-y-3 p-5">
        {restaurant.cuisine.length > 0 && (
          <p className="text-sm text-ink/60 dark:text-sand/60">{restaurant.cuisine.join(" • ")}</p>
        )}
        {restaurant.openingHours && (
          <p className="flex items-center gap-1.5 text-sm text-ink/60 dark:text-sand/60">
            <Clock size={14} className="shrink-0 text-primary" aria-hidden="true" />
            {restaurant.openingHours}
          </p>
        )}
        <p className="line-clamp-2 text-sm text-ink/70 dark:text-sand/70">{restaurant.shortDescription}</p>
        <Link
          href={`/${locale}/restaurants/${restaurant.slug}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
        >
          {viewLabel}
          <ArrowUpRight size={14} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
