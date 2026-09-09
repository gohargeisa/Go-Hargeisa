import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { CalendarCheck, ChevronDown, MapPin, Phone, UtensilsCrossed } from "lucide-react";
import { TableReservationButton } from "@/components/shared/table-reservation-button";
import { WhatsAppIcon } from "@/components/shared/brand-icons";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import type { Locale } from "@/lib/i18n/config";
import type { Restaurant } from "@/types";
import { EXCELLENCE_CAFE_HERO } from "@/lib/config/excellence-cafe-photos";

/**
 * Excellence Café — cinematic hero. Excellence-Café-only. Background is a
 * real photo of this restaurant's own food (a full mezze spread on branded
 * plates — see lib/config/excellence-cafe-photos.ts); no stock imagery, no
 * Google Maps imagery. Structure mirrors components/the-village/village-
 * hero.tsx (same proven layout/CTA pattern), with an added Call/WhatsApp/
 * Directions row per this page's own "Contact & Services" requirement —
 * The Village's hero doesn't need one since its own Contact section already
 * covers that; Excellence Café's brief asks for it directly in the hero.
 */
export async function ExcellenceCafeHero({
  restaurant,
  locale,
  mapsHref,
}: {
  restaurant: Restaurant;
  locale: Locale;
  mapsHref: string;
}) {
  const t = await getTranslations({ locale, namespace: "excellenceCafe" });

  const telHref = restaurant.phone ? `tel:${restaurant.phone.replace(/\s/g, "")}` : undefined;
  const whatsappHref = restaurant.whatsapp ? toWhatsAppHref(restaurant.whatsapp, t("whatsappGreeting")) : undefined;

  return (
    <section className="relative isolate flex min-h-[88vh] flex-col justify-end overflow-hidden bg-ink text-white">
      <Image
        src={EXCELLENCE_CAFE_HERO.src}
        alt={t("heroPhotoAlt")}
        fill
        priority
        sizes="100vw"
        className="object-cover object-[50%_42%]"
      />
      <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink via-ink/50 to-ink/20" />

      <div className="container-px relative mx-auto w-full max-w-3xl pb-14 pt-28 text-center sm:pb-20">
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
        <p className="mx-auto mt-5 max-w-xl text-balance text-center text-[15px] leading-relaxed text-white/75 sm:text-base">
          {t("heroTagline")}
        </p>

        <div className="mx-auto mt-5 flex max-w-md flex-col items-center gap-1.5 text-sm text-white/75 sm:flex-row sm:justify-center sm:gap-4">
          <span className="inline-flex items-center gap-1.5">
            <MapPin size={14} className="shrink-0 text-white/50" aria-hidden="true" />
            {restaurant.address}
          </span>
          <span className="hidden sm:inline text-white/30">·</span>
          <span>{restaurant.openingHours}</span>
        </div>

        <div className="mt-9 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
          <a
            href="#menu"
            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary-700 px-7 text-[15px] font-bold text-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-card active:scale-95"
          >
            <UtensilsCrossed size={16} aria-hidden="true" />
            {t("heroViewMenu")}
          </a>
          {restaurant.reservable && (
            <TableReservationButton
              listingType="restaurant"
              listingId={restaurant.id}
              businessName={restaurant.name}
              locale={locale}
              label={t("heroBookTable")}
              icon={<CalendarCheck size={16} aria-hidden="true" />}
              className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-white/30 px-7 text-[15px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-white/70"
            />
          )}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm">
          {telHref && (
            <a href={telHref} dir="ltr" className="inline-flex items-center gap-1.5 text-white/70 underline-offset-4 hover:text-white hover:underline">
              <Phone size={13} aria-hidden="true" />
              {t("heroCall")}
            </a>
          )}
          {whatsappHref && (
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-white/70 underline-offset-4 hover:text-white hover:underline"
            >
              <WhatsAppIcon size={13} aria-hidden="true" />
              {t("heroWhatsApp")}
            </a>
          )}
          <a
            href={mapsHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-white/70 underline-offset-4 hover:text-white hover:underline"
          >
            <MapPin size={13} aria-hidden="true" />
            {t("heroDirections")}
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
