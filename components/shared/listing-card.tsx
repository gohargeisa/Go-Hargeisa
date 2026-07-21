"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Heart, Loader2, ArrowRight } from "lucide-react";
import { RatingBadge } from "./rating-badge";
import { toggleFavoriteAction } from "@/lib/actions/favorites";

type ListingType = "hotel" | "restaurant" | "cafe" | "attraction";

export function ListingCard({
  href,
  image,
  title,
  subtitle,
  rating,
  reviewCount,
  tag,
  priceRange,
  listingType,
  listingId,
  initiallyFavorited = false,
  locale,
}: {
  href: string;
  image: string;
  title: string;
  subtitle: string;
  rating: number;
  reviewCount: number;
  tag?: string;
  priceRange?: string;
  listingType?: ListingType;
  listingId?: string;
  initiallyFavorited?: boolean;
  locale?: string;
}) {
  const [favorited, setFavorited] = useState(initiallyFavorited);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onToggleFavorite(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!listingType || !listingId) return;

    startTransition(async () => {
      const result = await toggleFavoriteAction(listingType, listingId);

      if (!result.ok) {
        if (result.error === "sign-in-required" && locale) {
          router.push(
            `/${locale}/auth/login?next=${encodeURIComponent(href)}`
          );
        }
        return;
      }

      setFavorited(result.favorited ?? false);
    });
  }

  return (
    <Link
      href={href}
      className="group block w-full max-w-3xl overflow-hidden rounded-3xl border border-white/10 bg-white dark:bg-zinc-900 shadow-2xl transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
    >
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          sizes="(max-width:768px)100vw,1000px"
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Rating */}
        <div className="absolute top-5 left-5 rounded-full bg-white/95 px-4 py-2 text-sm font-bold shadow-xl backdrop-blur">
          ⭐ {rating.toFixed(1)}
        </div>

        {/* Favorite */}
        {listingType && listingId && (
          <button
            type="button"
            onClick={onToggleFavorite}
            disabled={isPending}
            className="absolute top-5 right-5 flex h-12 w-12 items-center justify-center rounded-full bg-white/95 shadow-xl transition-all hover:scale-110"
          >
            {isPending ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Heart
                size={22}
                fill={favorited ? "#F4B400" : "none"}
                color={favorited ? "#F4B400" : "#444"}
              />
            )}
          </button>
        )}

        {/* Tag */}
        {tag && (
          <span className="absolute bottom-5 left-5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white shadow-lg">
            {tag}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-7">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-display text-3xl font-bold text-gray-900 dark:text-white">
              {title}
            </h3>

            <p className="mt-2 flex items-center gap-2 text-base text-gray-500 dark:text-gray-400">
              <MapPin size={17} />
              {subtitle}
            </p>
          </div>

          {priceRange && (
            <div className="rounded-xl bg-primary/10 px-4 py-2">
              <span className="text-2xl font-bold text-primary">
                {priceRange}
              </span>
            </div>
          )}
        </div>

        <div className="mt-5">
          <RatingBadge
            rating={rating}
            reviewCount={reviewCount}
          />
        </div>

        {/* Features */}
<div className="mt-6 flex flex-wrap gap-2">
  {listingType === "hotel" && (
    <>
      <Feature text="📶 Free WiFi" />
      <Feature text="🍳 Breakfast" />
      <Feature text="🚗 Parking" />
      <Feature text="🏊 Swimming Pool" />
      <Feature text="🛏 Premium Rooms" />
    </>
  )}

  {listingType === "restaurant" && (
    <>
      <Feature text="🥩 Somali Cuisine" />
      <Feature text="🔥 BBQ & Grill" />
      <Feature text="🥗 Fresh Meals" />
      <Feature text="👨‍👩‍👧 Family Friendly" />
      <Feature text="🥤 Soft Drinks" />
    </>
  )}

  {listingType === "cafe" && (
    <>
      <Feature text="☕ Specialty Coffee" />
      <Feature text="🥐 Fresh Bakery" />
      <Feature text="📶 Free WiFi" />
      <Feature text="💻 Work Friendly" />
      <Feature text="🍰 Desserts" />
    </>
  )}

  {listingType === "attraction" && (
    <>
      <Feature text="📸 Photography" />
      <Feature text="🎟 Tourist Attraction" />
      <Feature text="🗺 Guided Tours" />
      <Feature text="🌍 Landmark" />
    </>
  )}
</div>

        <div className="mt-7 border-t border-gray-200 dark:border-zinc-700 pt-6">
          <div className="flex justify-end">
            <div className="flex items-center gap-3 rounded-2xl bg-primary px-6 py-3 text-white font-semibold shadow-lg transition-all duration-300 group-hover:gap-5">
              View Details
              <ArrowRight
                size={20}
                className="transition-transform group-hover:translate-x-1"
              />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}function Feature({ text }: { text: string }) {
  return (
    <span className="rounded-full border border-zinc-200 bg-gray-100 dark:bg-zinc-800 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 transition-all duration-300 hover:bg-primary hover:text-white">
      {text}
    </span>
  );
}