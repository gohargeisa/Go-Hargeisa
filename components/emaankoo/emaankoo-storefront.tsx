import { getTranslations } from "next-intl/server";
import {
  ShieldCheck, MapPin, Phone, ShoppingBag, Truck, PackageSearch, FileCheck2,
  Building2, PackageCheck, PartyPopper, ExternalLink,
} from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { SocialLinks } from "@/components/shared/social-links";
import { BusinessPhotoGallery } from "@/components/shared/business-photo-gallery";
import { OrderRequestButton } from "@/components/emaankoo/order-request-form";
import { EventRequestButton } from "@/components/emaankoo/event-request-form";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import { resolveMapsUrl } from "@/lib/utils/google-maps";
import { EMAANKOO_GALLERY_CATEGORIES } from "@/lib/utils/gallery-categories";
import type { PartnerTheme } from "@/lib/config/partner-themes";
import type { Locale } from "@/lib/i18n/config";
import type { CityService } from "@/types";

/**
 * Emaankoo Group's premium partner profile — a bespoke storefront like
 * Pinnacle/Flormar (the generic Overview/Products/Gallery template doesn't
 * have a "Request an Order"/"Request an Event" concept, a global-shopping
 * platform showcase, or a services grid — see the partner-themes.ts
 * EMAANKOO_THEME comment for the full reasoning). Deliberately NOT wrapped
 * in `PartnerThemeScope`: the brief is explicit that Emaankoo's magenta is
 * an accent only and must never retint the site's own primary/CTA colors
 * the way Lavender/Flormar/Pinnacte do — every button here uses the site's
 * own default amber classes; only a few genuinely decorative touches
 * (badges, icons) use `theme.accent*` directly.
 *
 * No product catalog — this partner's workflow is "request → manual quote
 * → approval", not a fixed-price cart (see lib/actions/purchase-requests.ts).
 * No claims of official partnership with SHEIN/Amazon/Noon/iHerb/Alibaba —
 * every mention below is deliberately worded as "request products from",
 * per the brief.
 */
export async function EmaankooStorefront({ theme, service, locale }: { theme: PartnerTheme; service: CityService; locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "emaankooStorefront" });
  const tl = await getTranslations({ locale, namespace: "listings" });
  const th = await getTranslations({ locale, namespace: "hotelDetail" });

  const ADDRESS = "Alloore Mall, Star Area, Hargeisa, Somaliland";
  const SECONDARY_PHONE = "+252639275466";
  const SECONDARY_EMAIL = "amooo5817@gmail.com";
  const mapsHref = resolveMapsUrl(null, service.mapsUrl);
  const whatsappHref = service.whatsapp ? toWhatsAppHref(service.whatsapp) : undefined;

  const SERVICES = [
    { icon: ShoppingBag, key: "international-shopping" },
    { icon: Truck, key: "global-shipping" },
    { icon: PackageSearch, key: "order-tracking" },
    { icon: FileCheck2, key: "customs-assistance" },
    { icon: Building2, key: "business-sourcing" },
    { icon: PackageCheck, key: "procurement-delivery" },
    { icon: PartyPopper, key: "entertainment-events" },
  ] as const;

  const PLATFORMS = ["shein", "amazon", "noon", "iherb", "alibaba"] as const;

  const PRIMARY_CLASS =
    "inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary-700 px-6 text-[15px] font-bold text-white shadow-soft transition-all duration-300 ease-out hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-card active:scale-95";
  const SECONDARY_CLASS =
    "inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-ink/15 px-6 text-[15px] font-semibold text-ink transition-all duration-200 hover:-translate-y-0.5 hover:border-primary hover:text-primary dark:border-white/20 dark:text-white";

  return (
    <>
      {/* Hero */}
      <Reveal>
        <section className="container-px mx-auto pt-8 text-center">
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em]"
            style={{ backgroundColor: `rgba(${theme.accentRgb}, 0.1)`, color: theme.accentStrong }}
          >
            <ShieldCheck size={12} aria-hidden="true" />
            {t("verifiedPartnerBadge")}
          </span>
          <h1 className="mt-4 font-display text-3xl font-bold sm:text-4xl">{service.name}</h1>
          <p className="mt-2 text-sm font-semibold text-ink/60 dark:text-sand/60 sm:text-base">{t("tagline")}</p>
          <p className="mt-2 flex items-center justify-center gap-1.5 text-sm text-ink/55 dark:text-sand/55">
            <MapPin size={14} aria-hidden="true" /> {t("locationLine")}
          </p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <OrderRequestButton listingId={service.id} locale={locale} className={PRIMARY_CLASS} label={t("requestAnOrder")} />
            <EventRequestButton listingId={service.id} locale={locale} className={SECONDARY_CLASS} label={t("requestAnEvent")} />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-[#25D366] hover:underline">
                {th("whatsapp")}
              </a>
            )}
            {service.phone && (
              <a href={`tel:${service.phone}`} className="inline-flex items-center gap-1 text-sm font-semibold text-ink/70 hover:text-primary dark:text-sand/70">
                <Phone size={13} aria-hidden="true" /> {th("call")}
              </a>
            )}
            {mapsHref && (
              <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm font-semibold text-ink/70 hover:text-primary dark:text-sand/70">
                <MapPin size={13} aria-hidden="true" /> {tl("getDirections")}
              </a>
            )}
          </div>
        </section>
      </Reveal>

      {/* About */}
      <Reveal delay={0.05}>
        <section className="container-px mx-auto mt-10 max-w-2xl text-center">
          <h2 className="font-display text-2xl font-bold">{t("aboutHeading")}</h2>
          <p className="mt-4 text-sm leading-relaxed text-ink/70 dark:text-sand/70 sm:text-base">{t("aboutBody")}</p>
          <p className="mt-4 text-sm italic leading-relaxed text-ink/55 dark:text-sand/55">{t("missionStatement")}</p>
        </section>
      </Reveal>

      {/* Services */}
      <Reveal delay={0.05}>
        <section className="container-px mx-auto mt-16">
          <h2 className="text-center font-display text-2xl font-bold">{t("servicesHeading")}</h2>
          {/* Centered flex-wrap instead of a rigid grid: with 7 services, a
           * 2- or 3-column grid always strands the last card alone on its
           * own row, left-aligned against empty space. Flex + justify-center
           * means an incomplete last row centers itself instead, at every
           * breakpoint, without dropping or resizing any card unevenly —
           * each card's width still matches the grid math it replaces
           * (2-up on sm, 3-up on lg). */}
          <div className="mx-auto mt-8 flex max-w-4xl flex-wrap justify-center gap-4">
            {SERVICES.map(({ icon: Icon, key }) => (
              <div
                key={key}
                className="w-full rounded-2xl border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03] sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.667rem)]"
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-full"
                  style={{ backgroundColor: `rgba(${theme.accentRgb}, 0.1)`, color: theme.accentStrong }}
                >
                  <Icon size={20} aria-hidden="true" />
                </div>
                <h3 className="mt-3 font-display text-base font-bold">{t(`service_${key}_title`)}</h3>
                <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t(`service_${key}_body`)}</p>
              </div>
            ))}
          </div>
        </section>
      </Reveal>

      {/* Shop Globally */}
      <Reveal delay={0.05}>
        <section className="container-px mx-auto mt-16 max-w-3xl text-center">
          <h2 className="font-display text-2xl font-bold">{t("shopGloballyHeading")}</h2>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink/65 dark:text-sand/65">{t("shopGloballyBody")}</p>
          <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink/40 dark:text-sand/40">{t("shopGloballyDisclaimer")}</p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {PLATFORMS.map((p) => (
              <span key={p} className="rounded-full border border-ink/12 px-5 py-2.5 text-sm font-bold dark:border-white/15">
                {t(`platform_${p}`)}
              </span>
            ))}
            <span className="rounded-full border border-dashed border-ink/12 px-5 py-2.5 text-sm font-semibold text-ink/50 dark:border-white/15 dark:text-sand/50">
              {t("platformOther")}
            </span>
          </div>
        </section>
      </Reveal>

      {/* Gallery — empty gracefully, no images supplied yet (BusinessPhotoGallery returns null when images.length === 0). */}
      {service.gallery.length > 0 && (
        <Reveal delay={0.05}>
          <section className="container-px mx-auto mt-16">
            <h2 className="mb-5 font-display text-2xl font-bold">{t("galleryHeading")}</h2>
            <BusinessPhotoGallery
              images={service.gallery}
              alt={service.name}
              categories={EMAANKOO_GALLERY_CATEGORIES}
              tileAspectClassName="aspect-[3/4]"
            />
          </section>
        </Reveal>
      )}

      {/* Subtle partnership attribution — a compact line, not the shared
       * PartnerStatusSection's full logo-lockup + "Join Go Hargeisa" CTA
       * block: on a page the visitor reached BY viewing Emaankoo's own
       * Go Hargeisa listing, that block's own acquisition pitch and second
       * CTA is redundant, and it also competed with the final contact CTA
       * right below it. The partner relationship itself is still stated,
       * just compact and not another button. */}
      {service.isPartner && (
        <div className="container-px mx-auto mt-10 flex items-center justify-center gap-1.5 text-xs font-medium text-ink/40 dark:text-sand/40">
          <ShieldCheck size={12} aria-hidden="true" />
          {t("partnershipAttribution")}
        </div>
      )}

      {/* Final contact CTA */}
      <Reveal delay={0.05}>
        <section className="container-px mx-auto mt-16 max-w-2xl pb-16 text-center">
          <h2 className="font-display text-2xl font-bold">{t("contactHeading")}</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-ink/65 dark:text-sand/65">{t("contactBody")}</p>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <OrderRequestButton listingId={service.id} locale={locale} className={PRIMARY_CLASS} label={t("requestAnOrder")} />
            <EventRequestButton listingId={service.id} locale={locale} className={SECONDARY_CLASS} label={t("requestAnEvent")} />
          </div>

          <div className="mt-6">
            <SocialLinks
              phone={service.phone ?? undefined}
              whatsapp={service.whatsapp ?? undefined}
              email={service.email ?? undefined}
              instagram={service.socialInstagram}
              facebook={service.socialFacebook}
              labels={{
                phone: th("call"),
                whatsapp: th("whatsapp"),
                email: t("emailLabel"),
                instagram: t("followInstagram"),
                facebook: t("followFacebook"),
              }}
              className="justify-center"
            />
          </div>

          <div className="mt-6 space-y-1 text-sm text-ink/60 dark:text-sand/60">
            <p>{service.phone}</p>
            <p>{SECONDARY_PHONE}</p>
            {service.email && <p>{service.email}</p>}
            <p>{SECONDARY_EMAIL}</p>
            <p>{ADDRESS}</p>
          </div>

          {mapsHref && (
            <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              {tl("getDirections")} <ExternalLink size={12} aria-hidden="true" />
            </a>
          )}
        </section>
      </Reveal>
    </>
  );
}
