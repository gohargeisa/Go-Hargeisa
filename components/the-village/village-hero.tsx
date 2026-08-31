import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { CalendarCheck, ChevronDown, Star, UtensilsCrossed } from "lucide-react";
import { TableReservationButton } from "@/components/shared/table-reservation-button";
import type { Locale } from "@/lib/i18n/config";
import type { Restaurant } from "@/types";
import { THE_VILLAGE_HERO } from "@/lib/config/the-village-photos";

/**
 * The Village Hargeisa — cinematic hero. Village-only. Background is the
 * curated Hero photograph (THE_VILLAGE_HERO — a real photo of this
 * restaurant's own terrace at golden hour; the logo still comes from the DB
 * row). No stock imagery, no social-media imagery. Structure, typography,
 * overlay and CTAs are unchanged — only the photography was improved.
 *
 * The source frame is phone-portrait, so the crop is biased upward
 * (`object-[50%_44%] md:object-[50%_38%]`) to hold the sunset sky + terrace
 * in view on both a wide desktop band and a taller mobile crop.
 */
export async function VillageHero({
  restaurant,
  locale,
  mapsHref,
}: {
  restaurant: Restaurant;
  locale: Locale;
  mapsHref: string;
}) {
  const t = await getTranslations({ locale, namespace: "theVillage" });

  return (
    <section className="relative isolate flex min-h-[88vh] flex-col justify-end overflow-hidden bg-ink text-white">
      <Image
        src={THE_VILLAGE_HERO.src}
        alt={t("heroPhotoAlt")}
        fill
        priority
        sizes="100vw"
        className="object-cover object-[50%_44%] md:object-[50%_38%]"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink via-ink/45 to-ink/15" />

      <div className="container-px relative mx-auto w-full max-w-3xl pb-20 pt-28 text-center sm:pb-24">
        {restaurant.logo && (
          <span className="mx-auto mb-7 flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-white shadow-lg ring-1 ring-white/20 sm:h-24 sm:w-24">
            <Image
              src={restaurant.logo}
              alt={`${restaurant.name} logo`}
              width={96}
              height={96}
              className="h-full w-full object-cover"
              priority
            />
          </span>
        )}

        <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-white/60">{t("heroEyebrow")}</p>
        <h1 className="mt-4 text-balance font-display text-[2.4rem] font-bold leading-[1.05] tracking-tight sm:text-6xl">
          {restaurant.name}
        </h1>
        {restaurant.shortDescription && (
          <p dir="auto" className="mx-auto mt-5 max-w-xl text-balance text-center text-[15px] leading-relaxed text-white/75 sm:text-base">
            {restaurant.shortDescription}
          </p>
        )}

        {restaurant.rating > 0 && (
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white/85 backdrop-blur-sm transition-colors hover:border-white/50"
          >
            <Star size={13} className="fill-amber-400 text-amber-400" aria-hidden="true" />
            {restaurant.rating.toFixed(1)} · {restaurant.reviewCount} {t("ratingOnGoogle")}
          </a>
        )}

        <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
          {restaurant.reservable && (
            <TableReservationButton
              listingType="restaurant"
              listingId={restaurant.id}
              businessName={restaurant.name}
              locale={locale}
              label={t("heroReserve")}
              icon={<CalendarCheck size={16} aria-hidden="true" />}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary-700 px-7 text-[15px] font-bold text-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-card active:scale-95"
            />
          )}
          <a
            href="#menu"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-white/30 px-7 text-[15px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-white/70"
          >
            <UtensilsCrossed size={16} aria-hidden="true" />
            {t("heroExploreMenu")}
          </a>
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-5 flex flex-col items-center gap-1 text-white/45"
      >
        <span className="text-[10px] font-semibold uppercase tracking-[0.2em]">{t("heroScrollHint")}</span>
        <ChevronDown size={16} className="animate-bounce motion-reduce:animate-none" />
      </div>
    </section>
  );
}
