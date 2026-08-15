import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Building2, MapPin, Star } from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { PartnerBadge } from "@/components/shared/partner-badge";
import { DynamicIcon } from "@/lib/utils/dynamic-icon";
import type { Locale } from "@/lib/i18n/config";

/**
 * Centered logo / name / rating block shown above the hero gallery — this
 * replaces the old image-overlay hero title (components/shared/hotel-hero.tsx,
 * now unused) per the spec's "logo above name" layout, while reusing the
 * exact same font-display / primary / accent tokens as the rest of the site.
 * Logo styled as a small "luxury badge" (fixed size, hairline white ring,
 * layered shadow, hover lift) per the premium-polish passes. Reused as-is by
 * the hotel, restaurant, and cafe detail pages — the category label (e.g.
 * "Premium Hotel", "Budget Restaurant") is computed by the caller via
 * `listingCategoryLabel` so this component stays listing-type-agnostic.
 */
export async function HotelHeaderTop({
  logo,
  name,
  rating,
  reviewCount,
  categoryLabel,
  showRating = true,
  locale,
  isPartner = false,
  fallbackIcon,
  fallbackColor,
  logoFit,
}: {
  logo?: string;
  name: string;
  rating: number;
  reviewCount: number;
  categoryLabel: string;
  /** Off for City Services categories where reviews are excluded entirely
   * (hospital/pharmacy/mosque/bank) — a "No reviews yet" star row would be
   * clutter on a page that will never collect reviews. */
  showRating?: boolean;
  /** Only needed when isPartner is true (renders the PartnerBadge). */
  locale?: Locale;
  /** True when this listing's status === 'published' — see
   * components/shared/partner-badge.tsx for why that's the gate. Callers
   * that don't pass this (or pass false) simply render no badge. */
  isPartner?: boolean;
  /** City Services only: when `logo` is absent, render this category icon
   * (lucide-react name, see lib/utils/dynamic-icon.tsx) tinted with
   * `fallbackColor` instead of the generic Building2 placeholder every other
   * listing type still gets. Omitted entirely by hotels/restaurants/cafes/
   * services, so their existing fallback is completely unchanged. */
  fallbackIcon?: string;
  fallbackColor?: string;
  /** "contain" preserves the logo's real aspect ratio (letterboxed, never
   * cropped/distorted) instead of the default "cover" crop-to-fill circle —
   * opt-in only (City Services), so hotels/restaurants/cafes/services keep
   * their exact existing `object-cover` treatment unless they explicitly
   * ask for the other one. */
  logoFit?: "cover" | "contain";
}) {
  const t = await getTranslations("common");

  return (
    <Reveal>
      {/* The site header is `fixed` (h-20 = 5rem, plus env(safe-area-inset-top)
          on notched phones) at every breakpoint, so this logo/identity block
          needs its own guaranteed clearance below it rather than relying on
          Breadcrumbs' incidental padding above it — Breadcrumbs is reused on
          non-business pages too and its height isn't guaranteed. Shared by
          every business detail page (hotels/restaurants/cafes/city-services/
          services), so fixing it here fixes the logo-clipped-by-header bug
          everywhere at once, current and future listings alike. */}
      <div className="container-px mx-auto flex flex-col items-center pt-[calc(4rem+env(safe-area-inset-top))] text-center">
        <div className="group relative mb-4 h-24 w-24 shrink-0 overflow-hidden rounded-full border border-white bg-white shadow-[0_4px_12px_rgba(15,23,42,0.10),0_14px_34px_rgba(15,23,42,0.14)] transition-all duration-300 ease-out hover:-translate-y-0.5 hover:scale-105 hover:shadow-[0_6px_16px_rgba(15,23,42,0.12),0_18px_40px_rgba(15,23,42,0.18)] dark:border-white/90 dark:bg-white/5 sm:mb-5 sm:h-[140px] sm:w-[140px]">
          {logo ? (
            <Image
              src={logo}
              alt={`${name} logo`}
              fill
              sizes="140px"
              quality={90}
              className={`${logoFit === "contain" ? "object-contain p-2.5" : "object-cover"} transition-transform duration-300 ease-out group-hover:scale-110`}
            />
          ) : fallbackIcon ? (
            <div
              className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/5 dark:from-primary/20 dark:via-secondary/20 dark:to-white/5"
              style={fallbackColor ? { color: fallbackColor } : undefined}
            >
              <DynamicIcon name={fallbackIcon} size={40} strokeWidth={1.5} className={fallbackColor ? undefined : "text-primary/50"} aria-hidden="true" />
            </div>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary/15 via-secondary/10 to-primary/5 dark:from-primary/20 dark:via-secondary/20 dark:to-white/5">
              <Building2 size={40} strokeWidth={1.5} className="text-primary/50" aria-hidden="true" />
            </div>
          )}
        </div>

        <h1 className="text-balance font-display text-3xl font-bold sm:text-4xl lg:text-5xl">{name}</h1>

        {isPartner && locale && (
          <div className="mt-2.5">
            <PartnerBadge locale={locale} />
          </div>
        )}

        {showRating && (
          <div className="mt-3.5 flex items-center gap-2.5">
            <div className={`flex gap-1 ${reviewCount > 0 ? "text-primary-600" : "text-ink/25 dark:text-sand/25"}`}>
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} size={19} fill={i < Math.round(rating) ? "currentColor" : "none"} strokeWidth={1.5} />
              ))}
            </div>
            {reviewCount > 0 ? (
              <>
                <span className="text-sm font-semibold">{rating.toFixed(1)}</span>
                <span className="text-sm text-ink/70 dark:text-sand/70">({reviewCount} reviews)</span>
              </>
            ) : (
              <span className="text-sm font-semibold text-ink/70 dark:text-sand/70">{t("noReviewsYet")}</span>
            )}
          </div>
        )}

        <div className="mt-2.5 flex flex-col items-center gap-1">
          <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/80 dark:text-sand/80">
            <MapPin size={14} className="shrink-0 text-primary" aria-hidden="true" />
            Hargeisa, Somaliland
          </span>
          <span className="text-xs font-medium uppercase tracking-wide text-ink/70 dark:text-sand/70">
            {categoryLabel}
          </span>
        </div>
      </div>
    </Reveal>
  );
}
