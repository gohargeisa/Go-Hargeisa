"use client";

import Link from "next/link";
import Image from "next/image";
import { memo, useState } from "react";
import { useTranslations } from "next-intl";
import { MapPin, Phone, Sparkles, Star } from "lucide-react";
import { CATEGORY_CONFIG } from "@/components/city-map/category-config";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { AnimatedCard } from "@/components/shared/animated-card";
import { FloatingBadge } from "@/components/shared/floating-badge";
import { PrimaryButton, SecondaryButton } from "@/components/shared/buttons";
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
  const t = useTranslations("listings");
  const [loaded, setLoaded] = useState(false);

  const meta = CATEGORY_CONFIG[category];
  const CategoryIcon = meta.icon;
  const hasRealImage = Boolean(image) && !image.includes("placehold.co");

  return (
    <AnimatedCard className="group flex h-full w-full min-w-[288px] flex-col overflow-hidden rounded-xl3 border border-ink/8 bg-white shadow-soft transition-shadow duration-300 ease-premium hover:border-primary/25 hover:shadow-card dark:border-white/10 dark:bg-white/[0.04]">
      <div className="relative h-64 shrink-0 overflow-hidden rounded-t-xl3 sm:h-[17rem]">
        {hasRealImage ? (
          <>
            {!loaded && (
              <div className="skeleton absolute inset-0" aria-hidden="true" />
            )}
            <Link href={href} className="absolute inset-0 z-0" aria-label={name}>
              <Image
                src={image}
                alt={name}
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
          <FloatingBadge icon={Sparkles} position="bottom-start">
            {t("featuredBadge")}
          </FloatingBadge>
        )}

        {reviewCount > 0 && (
          <div className="absolute end-3.5 top-3.5 z-10 inline-flex items-center gap-1 rounded-full border border-white/30 bg-white/20 px-2.5 py-1 text-xs font-bold text-white shadow-sm backdrop-blur-md">
            <Star size={12} fill="currentColor" className="text-primary" aria-hidden="true" />
            {rating.toFixed(1)}
            <span className="font-normal text-white/75">({reviewCount})</span>
          </div>
        )}

        {serviceId && (
          <FavoriteButton
            listingType="service"
            listingId={serviceId}
            initiallyFavorited={initiallyFavorited}
            locale={locale}
            redirectPath={href}
            addLabel={t("addToFavorites", { name })}
            removeLabel={t("removeFromFavorites", { name })}
          />
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
          <SecondaryButton href={href} size="lg" compact>
            {t("viewDetails")}
          </SecondaryButton>

          {phone && (
            <PrimaryButton href={`tel:${phone}`} size="lg" compact>
              <Phone size={14} aria-hidden="true" />
              {t("call")}
            </PrimaryButton>
          )}
        </div>
      </div>
    </AnimatedCard>
  );
}

export const PremiumServiceCard = memo(PremiumServiceCardBase);
