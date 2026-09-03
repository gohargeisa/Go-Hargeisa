"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useImageLoaded } from "@/lib/hooks/use-image-loaded";
import { AnimatedCard } from "@/components/shared/animated-card";
import type { FeaturedPartnerShowcaseItem } from "@/lib/data/featured-partner-showcase";

/**
 * One promotional card in the homepage "Smart Featured Partners" section —
 * every piece of copy/CTA already arrives fully resolved from
 * getFeaturedPartnerShowcase (category template or custom override, i18n
 * already applied); this component is purely presentational. Same visual
 * language as ListingCard (AnimatedCard lift, rounded-xl3, shadow-soft →
 * shadow-card on hover) so this reads as part of the existing homepage,
 * not a bolted-on new style — the difference is a prominent circular logo
 * badge over the image instead of a rating chip, and a real CTA button
 * instead of a plain "Explore" link.
 */
export function FeaturedPartnerCard({ partner }: { partner: FeaturedPartnerShowcaseItem }) {
  const { loaded, imgRef, onLoad } = useImageLoaded();

  return (
    <AnimatedCard lift={6} className="group h-full w-full min-w-[272px] sm:min-w-[300px]">
      <div className="flex h-full flex-col overflow-hidden rounded-xl3 border border-ink/8 bg-white shadow-soft transition-shadow duration-300 ease-premium hover:border-primary/25 hover:shadow-card dark:border-white/10 dark:bg-white/[0.04]">
        <Link href={partner.href} className="relative block h-40 overflow-hidden sm:h-44" aria-label={partner.name}>
          {!loaded && <div className="skeleton absolute inset-0" aria-hidden="true" />}
          {partner.image && (
            <Image
              ref={imgRef}
              src={partner.image}
              alt={partner.name}
              fill
              sizes="(max-width: 767px) 78vw, (max-width: 1024px) 33vw, 25vw"
              onLoad={onLoad}
              className={`object-cover transition-all duration-500 ease-premium group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
          {partner.categoryLabel && (
            <span className="absolute start-3 top-3 inline-flex items-center rounded-full bg-white/95 px-2.5 py-1 text-xs font-bold text-ink shadow-sm backdrop-blur">
              {partner.categoryLabel}
            </span>
          )}
        </Link>

        <div className={`relative flex flex-1 flex-col p-5 ${partner.logoBaked ? "" : "pt-9"}`}>
          {/* Logo badge — straddles the image/body seam like a business's
              own brand mark on a storefront card, prominent per the spec
              ("Partner logo prominently"). Falls back to the first letter
              of the name so a partner without a logo still gets a clean
              identity mark instead of a broken/missing image. Skipped when
              the card art already has the brand logo composited in
              (partner.logoBaked) — otherwise the logo would appear twice. */}
          {!partner.logoBaked && (
            <div className="absolute -top-8 start-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-white shadow-md dark:border-ink dark:bg-ink">
              {partner.logo ? (
                <Image src={partner.logo} alt="" width={64} height={64} className="h-full w-full object-cover" />
              ) : (
                <span className="font-display text-xl font-bold text-primary" aria-hidden="true">
                  {partner.name.charAt(0)}
                </span>
              )}
            </div>
          )}

          <h3 className="truncate font-display text-lg font-bold text-ink dark:text-white">{partner.name}</h3>

          <p className="mt-2 line-clamp-2 flex-1 text-sm leading-relaxed text-ink/60 dark:text-sand/65">{partner.promoText}</p>

          <Link
            href={partner.ctaHref}
            className="mt-4 inline-flex items-center justify-center gap-1.5 rounded-full bg-primary-700 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-800"
          >
            {partner.ctaLabel}
            <ArrowRight size={15} className="transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </AnimatedCard>
  );
}
