"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { ArrowRight, Building2, MapPin, Star } from "lucide-react";

export function PremiumCard({
  href,
  image,
  title,
  subtitle,
  rating,
  reviewCount,
  priceRange,
  tag,
}: {
  href: string;
  image: string;
  title: string;
  subtitle: string;
  rating: number;
  reviewCount: number;
  priceRange?: string;
  tag?: string;
}) {
  const [loaded, setLoaded] = useState(false);
  const hasRealImage = Boolean(image) && !image.includes("placehold.co");

  return (
    <div className="group flex h-full w-full min-w-[272px] flex-col overflow-hidden rounded-3xl border border-ink/8 bg-white shadow-[0_6px_20px_rgba(20,30,45,0.06)] transition-all duration-300 ease-out hover:-translate-y-1 hover:border-primary/25 hover:shadow-[0_20px_45px_rgba(20,30,45,0.14)] dark:border-white/10 dark:bg-white/[0.04] dark:hover:shadow-[0_20px_45px_rgba(0,0,0,0.4)]">
      <Link href={href} className="relative block h-48 shrink-0 overflow-hidden rounded-t-3xl sm:h-52" aria-label={title}>
        {hasRealImage ? (
          <>
            {!loaded && (
              <div className="absolute inset-0 animate-pulse bg-ink/10 dark:bg-white/10" aria-hidden="true" />
            )}
            <Image
              src={image}
              alt={title}
              fill
              sizes="(max-width: 767px) 78vw, (max-width: 1024px) 33vw, 25vw"
              onLoad={() => setLoaded(true)}
              className={`object-cover transition-all duration-500 ease-out group-hover:scale-105 ${
                loaded ? "opacity-100" : "opacity-0"
              }`}
            />
          </>
        ) : (
          <div
            className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/5 dark:from-primary/20 dark:via-secondary/20 dark:to-white/5"
            aria-hidden="true"
          >
            <Building2 size={36} strokeWidth={1.5} className="text-primary/40" />
          </div>
        )}

        <div
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-black/5 to-transparent"
          aria-hidden="true"
        />

        {tag && (
          <span className="absolute start-3 top-3 inline-flex items-center rounded-full bg-primary/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
            {tag}
          </span>
        )}

        <div className="absolute end-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-ink shadow-sm backdrop-blur-sm dark:bg-ink/90 dark:text-white">
          <Star size={12} fill="currentColor" className="text-primary" aria-hidden="true" />
          {rating.toFixed(1)}
          {reviewCount > 0 && (
            <span className="font-normal text-ink/50 dark:text-sand/50">({reviewCount})</span>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col gap-2.5 p-5">
        <Link href={href}>
          <h3 className="line-clamp-1 font-display text-lg font-bold text-ink transition-colors group-hover:text-primary dark:text-white">
            {title}
          </h3>
        </Link>
        <p className="flex items-center gap-1.5 text-sm text-ink/60 dark:text-sand/60">
          <MapPin size={14} className="shrink-0 text-primary" aria-hidden="true" />
          <span className="line-clamp-1">{subtitle}</span>
        </p>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-ink/8 pt-3 dark:border-white/10">
          {priceRange ? (
            <span className="font-display text-sm font-bold text-primary">{priceRange}</span>
          ) : (
            <span aria-hidden="true" />
          )}
          <Link
            href={href}
            className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-all group-hover:gap-1.5"
          >
            View Details
            <ArrowRight size={14} aria-hidden="true" className="transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
