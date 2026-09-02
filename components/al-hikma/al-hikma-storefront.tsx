import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  Phone,
  MapPin,
  Sparkles,
  HeartHandshake,
  ShieldCheck,
  Leaf,
  Droplets,
  Wind,
  Hand,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  UserRound,
  CalendarCheck,
  Shirt,
  Clock,
} from "lucide-react";
import { WhatsAppIcon } from "@/components/shared/brand-icons";
import { Reveal } from "@/components/home/reveal";
import { SecondaryButton } from "@/components/shared/buttons";
import { HotelNavTabs, type HotelNavTab } from "@/components/shared/hotel-nav-tabs";
import { HijamaEducationSection } from "@/components/shared/hijama-education-section";
import { ReviewsSection } from "@/components/shared/reviews-section";
import { ReviewForm } from "@/components/shared/review-form";
import { AddToTripButton } from "@/components/shared/add-to-trip-button";
import { ShareButton } from "@/components/shared/share-button";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { ClaimBusinessButton } from "@/components/shared/claim-business-button";
import { AlHikmaGallery } from "@/components/al-hikma/al-hikma-gallery";
import {
  AL_HIKMA_HERO_IMAGE,
  AL_HIKMA_OVERVIEW_IMAGE,
  AL_HIKMA_SERVICE_IMAGES,
  AL_HIKMA_ILLUSTRATIVE_GALLERY,
} from "@/lib/config/al-hikma-media";
import { BRAND_LOGO } from "@/lib/config/brand";
import { formatOfferPricing } from "@/lib/utils/offer-status";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import { normalizeExternalUrl } from "@/lib/utils/normalize-url";
import type { PartnerTheme } from "@/lib/config/partner-themes";
import type { Locale } from "@/lib/i18n/config";
import type { CityService, Doctor, BusinessOffer, Review } from "@/types";

/**
 * Al-Hikma Hijama & Wellness Centre — bespoke premium storefront for one
 * specific, real, published listing (`city_services` slug
 * "al-hikma-hijama-wellness-centre"), rendered in place of the generic
 * city-services detail page ONLY for this exact slug (see the branch in
 * app/[locale]/city-services/[slug]/page.tsx). Every other city_service —
 * including any future Hijama clinic — keeps the generic page unchanged.
 *
 * Rhythm: full-bleed hero → sticky section tabs → trust strip → a contained
 * 2-column intro (Overview + Offer, with a sticky action rail) → then a run
 * of alternating full-width bands (visit guide → services → staff → Hijama
 * education → gallery → location → reviews) → a full-bleed emerald close
 * with the Go Hargeisa × Al-Hikma lockup. The full-width bands are what keep
 * the page from reading like the generic 2-column directory template.
 *
 * Content rules: the business's own copy (`service.description`,
 * `offer.title`/`offer.description`) is rendered verbatim — the data layer
 * already swaps in `description_ar`/`description_so` when the row has them
 * (Al-Hikma's are empty, so those locales fall back to English; flagged, not
 * faked). Every other string is UI chrome from the `alHikmaStorefront` i18n
 * namespace and is fully localised. No medical claims, no invented
 * credentials, no fabricated address/coordinates/hours.
 *
 * Imagery: the clinic has uploaded none of its own, so the hero, services
 * and gallery use licensed, self-hosted illustrative stock (see
 * lib/config/al-hikma-media.ts) — marked "illustrative", never captioned as
 * the actual premises or staff. `service.gallery` takes over automatically
 * the moment real photos are uploaded through Admin → City Services.
 */

function Eyebrow({ children, theme }: { children: React.ReactNode; theme: PartnerTheme }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em]"
      style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.08)`, color: theme.primaryStrong }}
    >
      {children}
    </span>
  );
}

function SectionHeading({
  id,
  eyebrow,
  title,
  theme,
  intro,
  center,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  theme: PartnerTheme;
  intro?: string;
  center?: boolean;
}) {
  return (
    <div className={`mb-8 ${center ? "text-center" : ""}`}>
      <Eyebrow theme={theme}>{eyebrow}</Eyebrow>
      <h2 id={id} className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-[1.75rem]">
        {title}
      </h2>
      {intro && (
        <p dir="auto" className={`mt-2 leading-relaxed text-ink/65 dark:text-sand/65 ${center ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>
          {intro}
        </p>
      )}
    </div>
  );
}

export async function AlHikmaStorefront({
  theme,
  service,
  locale,
  categoryLabel,
  doctors,
  offers,
  myReview,
  isFavorited,
}: {
  theme: PartnerTheme;
  service: CityService;
  locale: Locale;
  categoryLabel: string;
  doctors: Doctor[];
  offers: BusinessOffer[];
  myReview: Review | null;
  isFavorited: boolean;
}) {
  const t = await getTranslations({ locale, namespace: "alHikmaStorefront" });
  const td = await getTranslations({ locale, namespace: "detail" });
  const ta = await getTranslations({ locale, namespace: "appointments" });
  const th = await getTranslations({ locale, namespace: "hotelDetail" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const tl = await getTranslations({ locale, namespace: "listings" });
  const thj = await getTranslations({ locale, namespace: "hijamaEducation" });
  const tpf = await getTranslations({ locale, namespace: "partnerFooter" });

  const path = `/${locale}/city-services/${service.slug}`;
  const bookHref = `${path}/book`;
  const callHref = service.phone ? `tel:${service.phone}` : undefined;
  const whatsappNumber = service.whatsapp ?? service.phone ?? undefined;
  const whatsappHref = whatsappNumber ? toWhatsAppHref(whatsappNumber, t("whatsappMessage")) : undefined;
  const tiktokHref = service.socialTiktok ? normalizeExternalUrl(service.socialTiktok) : undefined;

  const offer = offers[0];
  const pricing = offer ? formatOfferPricing(offer) : null;

  const hasOwnGallery = service.gallery.length > 0;
  const galleryImages = hasOwnGallery ? service.gallery : AL_HIKMA_ILLUSTRATIVE_GALLERY;
  const galleryWhatsappHref = whatsappNumber
    ? toWhatsAppHref(whatsappNumber, td("chatAboutGalleryMessage", { name: service.name }))
    : undefined;

  const hasReviews = service.reviewCount > 0;

  const trust = [
    { icon: HeartHandshake, key: "sunnah" },
    { icon: ShieldCheck, key: "hygiene" },
    { icon: Sparkles, key: "specialist" },
    { icon: Leaf, key: "calm" },
  ] as const;

  const glance = [
    { icon: HeartHandshake, key: "sunnah" },
    { icon: Droplets, key: "cupping" },
    { icon: Hand, key: "massage" },
    { icon: CalendarClock, key: "appointment" },
  ] as const;

  const services = [
    { icon: Droplets, key: "hijama", img: AL_HIKMA_SERVICE_IMAGES.hijama },
    { icon: Droplets, key: "wet", img: AL_HIKMA_SERVICE_IMAGES.wet },
    { icon: Wind, key: "dry", img: AL_HIKMA_SERVICE_IMAGES.dry },
    { icon: Hand, key: "massage", img: AL_HIKMA_SERVICE_IMAGES.massage },
  ] as const;

  const visitSteps = [
    { icon: CalendarCheck, key: "step1" },
    { icon: Shirt, key: "step2" },
    { icon: Clock, key: "step3" },
  ] as const;

  const navTabs: HotelNavTab[] = [
    { id: "overview", label: td("overview") },
    ...(offer ? [{ id: "offer", label: td("offersTabLabel") }] : []),
    { id: "visit", label: t("navDetails") },
    { id: "services", label: t("navServices") },
    ...(doctors.length > 0 ? [{ id: "staff", label: ta("staffLabel") }] : []),
    { id: "hijama-education", label: thj("navTab") },
    { id: "gallery", label: tc("gallery") },
    { id: "location", label: td("location") },
    { id: "reviews", label: tc("reviews") },
  ];

  /** Booking + contact actions on a deep-green surface — gold primary pill,
   * white-outline secondaries; on mobile the two secondaries share one row. */
  function CtaRow({ className = "", center = false }: { className?: string; center?: boolean }) {
    const secondaryClass = "!border-white/40 !text-white hover:!border-white sm:!w-auto";
    return (
      <div
        className={`flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 ${center ? "sm:justify-center" : ""} ${className}`}
      >
        <Link
          href={bookHref}
          className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 ease-premium hover:-translate-y-0.5 active:scale-95 sm:w-auto"
          style={{ backgroundColor: theme.accentStrong }}
        >
          {ta("bookAppointmentButton")}
          <ArrowRight size={15} aria-hidden="true" />
        </Link>
        {(callHref || whatsappHref) && (
          <div className="grid grid-cols-2 gap-2.5 sm:flex sm:gap-3">
            {callHref && (
              <SecondaryButton href={callHref} size="md" fullWidth className={secondaryClass}>
                <Phone size={14} aria-hidden="true" />
                {th("call")}
              </SecondaryButton>
            )}
            {whatsappHref && (
              <SecondaryButton href={whatsappHref} external size="md" fullWidth className={secondaryClass}>
                <WhatsAppIcon size={14} aria-hidden="true" />
                {th("whatsapp")}
              </SecondaryButton>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative flex min-h-[33rem] flex-col justify-end overflow-hidden lg:min-h-[37rem]">
        <Image src={AL_HIKMA_HERO_IMAGE} alt="" fill priority sizes="100vw" className="object-cover object-center" />
        {/* Legibility stack keyed off the theme: an even wash, a strong
            bottom-anchored deep-green gradient under the copy, and a
            left-side darkening — so the photo still reads up top. */}
        <div aria-hidden="true" className="absolute inset-0" style={{ backgroundColor: theme.primaryDeep, opacity: 0.3 }} />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: `linear-gradient(to top, ${theme.primaryDeep} 0%, rgba(${theme.primaryRgb}, 0.5) 44%, rgba(${theme.primaryRgb}, 0.08) 100%)`,
          }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: `linear-gradient(to right, rgba(${theme.primaryRgb}, 0.55), transparent 64%)` }}
        />

        <div className="relative container-px mx-auto w-full max-w-6xl pb-10 pt-28 text-white sm:pb-14 sm:pt-32">
          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white p-1.5 shadow-lg sm:h-14 sm:w-14">
              <Image src={theme.partnerLogo} alt={theme.partnerName} width={56} height={56} className="h-full w-full object-contain" />
            </span>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white"
              style={{ backgroundColor: theme.accentStrong }}
            >
              <Sparkles size={12} aria-hidden="true" />
              {t("heroPartnerBadge")}
            </span>
          </div>

          <h1 className="mt-5 max-w-3xl text-balance font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-5xl">
            {service.name}
          </h1>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm text-white/85">
            <span className="inline-flex items-center gap-1.5">
              <Sparkles size={14} aria-hidden="true" /> {categoryLabel}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} aria-hidden="true" /> {td("locality")}
            </span>
            {hasReviews ? (
              <span className="inline-flex items-center gap-1.5">
                <span className="font-semibold text-white">{service.rating.toFixed(1)}</span>
                <span aria-hidden="true">★</span>
                <span className="text-white/70">({service.reviewCount})</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-semibold">
                {t("heroNewBadge")}
              </span>
            )}
          </div>

          <p dir="auto" className="mt-4 max-w-xl text-balance leading-relaxed text-white/85">
            {t("heroTagline")}
          </p>

          <CtaRow className="mt-7" />

          <div className="mt-4 flex items-center gap-2.5">
            <FavoriteButton
              listingType="city_service"
              listingId={service.id}
              locale={locale}
              initiallyFavorited={isFavorited}
              redirectPath={path}
              size={16}
              addLabel={tl("addToFavorites", { name: service.name })}
              removeLabel={tl("removeFromFavorites", { name: service.name })}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/40 text-white transition-colors hover:bg-white/10"
            />
            <ShareButton
              title={service.name}
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/10"
            />
          </div>
        </div>
      </section>

      <HotelNavTabs tabs={navTabs} />

      {/* ── TRUST STRIP ──────────────────────────────────────────── */}
      <section className="border-b border-ink/8 bg-white dark:border-white/10 dark:bg-white/[0.02]">
        <div className="container-px mx-auto max-w-6xl py-8">
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
            {trust.map(({ icon: Icon, key }) => (
              <div key={key} className="flex items-start gap-3">
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.09)`, color: theme.primaryStrong }}
                >
                  <Icon size={17} aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold">{t(`trust.${key}.title`)}</p>
                  <p dir="auto" className="mt-0.5 text-xs leading-relaxed text-ink/55 dark:text-sand/55">
                    {t(`trust.${key}.body`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTRO: OVERVIEW + STICKY ACTION RAIL ──────────────────── */}
      <div className="container-px mx-auto grid max-w-6xl gap-x-10 gap-y-10 py-14 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0">
          <section id="overview" className="scroll-mt-36">
            <Reveal>
              <SectionHeading eyebrow={t("overviewEyebrow")} title={t("overviewTitle")} theme={theme} />
              <div className="grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-start">
                <div>
                  {service.description && (
                    <p dir="auto" className="leading-relaxed text-ink/75 dark:text-sand/75">
                      {service.description}
                    </p>
                  )}
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {glance.map(({ icon: Icon, key }) => (
                      <div
                        key={key}
                        className="flex items-center gap-2.5 rounded-xl2 border border-ink/8 px-3.5 py-3 dark:border-white/10"
                      >
                        <Icon size={16} style={{ color: theme.primaryStrong }} aria-hidden="true" />
                        <span className="text-xs font-semibold leading-tight text-ink/80 dark:text-sand/80">
                          {t(`glance.${key}`)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <figure className="overflow-hidden rounded-xl3">
                  <div className="relative aspect-[4/5]">
                    <Image
                      src={AL_HIKMA_OVERVIEW_IMAGE}
                      alt={t("overviewImageAlt")}
                      fill
                      sizes="(max-width: 768px) 100vw, 360px"
                      className="object-cover"
                    />
                  </div>
                  <figcaption className="mt-2 text-xs italic text-ink/45 dark:text-sand/45">{t("illustrativeNote")}</figcaption>
                </figure>
              </div>
            </Reveal>
          </section>
        </div>

        {/* Sticky action rail */}
        <aside className="h-fit space-y-3 rounded-xl3 border border-ink/8 p-5 shadow-card dark:border-white/10 lg:sticky lg:top-28">
          <Link
            href={bookHref}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-bold text-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 active:scale-95"
            style={{ backgroundColor: theme.primaryStrong }}
          >
            <CalendarClock size={15} aria-hidden="true" />
            {ta("bookAppointmentButton")}
          </Link>
          {callHref && (
            <SecondaryButton href={callHref} size="md" fullWidth>
              <Phone size={14} aria-hidden="true" />
              {th("call")}
            </SecondaryButton>
          )}
          {whatsappHref && (
            <SecondaryButton href={whatsappHref} external size="md" fullWidth>
              <WhatsAppIcon size={14} aria-hidden="true" />
              {th("whatsapp")}
            </SecondaryButton>
          )}

          <div className="!mt-4 flex items-start gap-2.5 border-t border-ink/8 pt-4 dark:border-white/10">
            <CheckCircle2 size={16} className="mt-0.5 shrink-0" style={{ color: theme.primaryStrong }} aria-hidden="true" />
            <p className="text-xs leading-relaxed text-ink/55 dark:text-sand/55">{t("sidebarNote")}</p>
          </div>

          <div className="!mt-4 space-y-2 border-t border-ink/8 pt-4 dark:border-white/10">
            <AddToTripButton locale={locale} listingType="city_service" listingId={service.id} />
            <ShareButton title={service.name} />
            <div className="flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white">
              <FavoriteButton
                listingType="city_service"
                listingId={service.id}
                locale={locale}
                initiallyFavorited={isFavorited}
                showSpinner={false}
                size={15}
                className="inline-flex items-center"
                addLabel={tl("addToFavorites", { name: service.name })}
                removeLabel={tl("removeFromFavorites", { name: service.name })}
              />
              <span>{th("save")}</span>
              {(service.favoriteCount ?? 0) > 0 && (
                <span className="text-ink/45 dark:text-sand/45">{service.favoriteCount}</span>
              )}
            </div>
            <ClaimBusinessButton
              listingType="city_service"
              listingId={service.id}
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-full border border-ink/15 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
            />
          </div>

          {tiktokHref && (
            <a
              href={tiktokHref}
              target="_blank"
              rel="noopener noreferrer"
              className="!mt-4 flex items-center justify-center gap-2 border-t border-ink/8 pt-4 text-xs font-semibold text-ink/60 transition-colors hover:text-primary dark:border-white/10 dark:text-sand/60"
            >
              {td("followTiktok")}
              <ArrowRight size={12} aria-hidden="true" />
            </a>
          )}
        </aside>
      </div>

      {/* ── FEATURED OFFER — full-width band ─────────────────────── */}
      {offer && (
        <section id="offer" className="scroll-mt-36 border-t border-ink/8 dark:border-white/10" style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.05)` }}>
          <div className="container-px mx-auto max-w-3xl py-14 sm:py-16">
            <Reveal>
              <div className="overflow-hidden rounded-xl3 border bg-white shadow-card dark:bg-white/[0.03]" style={{ borderColor: `rgba(${theme.primaryRgb}, 0.18)` }}>
                <div className="flex flex-col items-center gap-6 p-7 text-center sm:flex-row sm:items-center sm:gap-9 sm:p-9 sm:text-start">
                  {pricing ? (
                    <div className="flex shrink-0 flex-col items-center gap-2 text-center">
                      <span className="text-base text-ink/40 line-through dark:text-sand/40">${pricing.original}</span>
                      <span className="font-display text-[3.5rem] font-extrabold leading-none sm:text-[4rem]" style={{ color: theme.primaryStrong }}>
                        ${pricing.sale}
                      </span>
                      <div className="mt-1.5 flex flex-wrap justify-center gap-1.5">
                        <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold text-white" style={{ backgroundColor: theme.primaryStrong }}>
                          {td("offerSave", { amount: pricing.save })}
                        </span>
                        <span
                          className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                          style={{ backgroundColor: `rgba(${theme.accentRgb}, 0.18)`, color: theme.accentStrong }}
                        >
                          {td("offerPercentOff", { pct: pricing.pct })}
                        </span>
                      </div>
                    </div>
                  ) : (
                    offer.discountValue != null && (
                      <span className="shrink-0 rounded-full px-3 py-1 text-sm font-bold text-white" style={{ backgroundColor: theme.primaryStrong }}>
                        {offer.discountType === "percentage" ? `${offer.discountValue}% OFF` : `$${offer.discountValue} OFF`}
                      </span>
                    )
                  )}

                  <span aria-hidden="true" className="hidden w-px self-stretch bg-ink/10 dark:bg-white/10 sm:block" />

                  <div className="min-w-0 flex-1">
                    <span
                      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white"
                      style={{ backgroundColor: theme.primaryStrong }}
                    >
                      {t("offerEyebrow")}
                    </span>
                    <h2 className="mt-3 font-display text-xl font-bold sm:text-2xl">{offer.title}</h2>
                    {offer.description && (
                      <p dir="auto" className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/65 dark:text-sand/65 sm:mx-0">
                        {offer.description}
                      </p>
                    )}
                    <Link
                      href={bookHref}
                      className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold text-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 active:scale-95"
                      style={{ backgroundColor: theme.primaryStrong }}
                    >
                      {ta("bookAppointmentButton")}
                      <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                    <p className="mt-3 text-[11px] leading-relaxed text-ink/45 dark:text-sand/45">{t("offerFinePrint")}</p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── VISIT GUIDE ("Details") ──────────────────────────────── */}
      <section id="visit" className="scroll-mt-36 border-y border-ink/8 bg-white dark:border-white/10 dark:bg-white/[0.02]">
        <div className="container-px mx-auto max-w-5xl py-14 sm:py-16">
          <Reveal>
            <SectionHeading eyebrow={t("visit.eyebrow")} title={t("visit.title")} theme={theme} center />
            <div className="grid gap-6 sm:grid-cols-3">
              {visitSteps.map(({ icon: Icon, key }, i) => (
                <div key={key} className="text-center">
                  <span
                    className="mx-auto flex h-12 w-12 items-center justify-center rounded-full"
                    style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.1)`, color: theme.primaryStrong }}
                  >
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <p className="mt-3 text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: theme.accentStrong }}>
                    {t("visit.stepLabel", { n: i + 1 })}
                  </p>
                  <h3 className="mt-1 font-display text-base font-semibold">{t(`visit.${key}.title`)}</h3>
                  <p dir="auto" className="mx-auto mt-1.5 max-w-xs text-sm leading-relaxed text-ink/65 dark:text-sand/65">
                    {t(`visit.${key}.body`)}
                  </p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── SERVICES ─────────────────────────────────────────────── */}
      <section id="services" className="scroll-mt-36">
        <div className="container-px mx-auto max-w-6xl py-14 sm:py-16">
          <Reveal>
            <SectionHeading eyebrow={t("servicesEyebrow")} title={t("servicesTitle")} theme={theme} intro={t("servicesIntro")} center />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {services.map(({ icon: Icon, key, img }) => (
                <div
                  key={key}
                  className="flex flex-col overflow-hidden rounded-xl3 border border-ink/8 bg-white shadow-soft dark:border-white/10 dark:bg-white/[0.03]"
                >
                  <div className="relative aspect-[4/3]">
                    <Image src={img} alt="" fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 280px" className="object-cover" />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <span
                      className="flex h-10 w-10 items-center justify-center rounded-lg"
                      style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.1)`, color: theme.primaryStrong }}
                    >
                      <Icon size={18} aria-hidden="true" />
                    </span>
                    <h3 className="mt-3 font-display text-base font-semibold">{t(`services.${key}.name`)}</h3>
                    <p dir="auto" className="mt-1.5 flex-1 text-sm leading-relaxed text-ink/65 dark:text-sand/65">
                      {t(`services.${key}.body`)}
                    </p>
                    <Link
                      href={bookHref}
                      className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold"
                      style={{ color: theme.primaryStrong }}
                    >
                      {ta("bookAppointmentButton")} <ArrowRight size={14} aria-hidden="true" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <p dir="auto" className="mx-auto mt-5 max-w-2xl text-center text-xs leading-relaxed text-ink/45 dark:text-sand/45">
              {t("servicesDisclaimer")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* ── STAFF — bespoke card ─────────────────────────────────── */}
      {doctors.length > 0 && (
        <section id="staff" className="scroll-mt-36 border-t border-ink/8 bg-white dark:border-white/10 dark:bg-white/[0.02]">
          <div className="container-px mx-auto max-w-5xl py-14 sm:py-16">
            <Reveal>
              <SectionHeading eyebrow={t("staffEyebrow")} title={t("staffTitle")} theme={theme} center />
              <div className="mx-auto max-w-2xl space-y-4">
                {doctors.map((doctor) => {
                  const role =
                    (locale === "ar" && doctor.specialtyAr) || (locale === "so" && doctor.specialtySo) || doctor.specialty;
                  const bio = (locale === "ar" && doctor.bioAr) || (locale === "so" && doctor.bioSo) || doctor.bio;
                  return (
                    <div
                      key={doctor.id}
                      className="flex flex-col gap-5 rounded-xl3 border border-ink/8 p-6 shadow-soft dark:border-white/10 sm:flex-row sm:items-center sm:gap-6"
                      style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.035)` }}
                    >
                      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full sm:h-20 sm:w-20">
                        {doctor.photo ? (
                          <Image src={doctor.photo} alt={doctor.name} fill sizes="80px" className="object-cover" />
                        ) : (
                          <div
                            className="flex h-full w-full items-center justify-center"
                            style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.12)`, color: theme.primaryStrong }}
                          >
                            <UserRound size={28} aria-hidden="true" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-lg font-semibold">{doctor.name}</p>
                        {role && (
                          <p className="mt-0.5 text-sm font-semibold" style={{ color: theme.primaryStrong }}>
                            {role}
                          </p>
                        )}
                        <p dir="auto" className="mt-2 text-sm leading-relaxed text-ink/60 dark:text-sand/60">
                          {bio || t("staffBlurb")}
                        </p>
                      </div>
                      <Link
                        href={`${bookHref}?doctor=${doctor.id}`}
                        className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 active:scale-95"
                        style={{ backgroundColor: theme.primaryStrong }}
                      >
                        {ta("bookAppointment")}
                        <ArrowRight size={14} aria-hidden="true" />
                      </Link>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ── HIJAMA EDUCATION (renders its own #hijama-education) ──── */}
      <section className="border-t border-ink/8 dark:border-white/10" style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.04)` }}>
        <div className="container-px mx-auto max-w-4xl space-y-12 py-14 sm:py-16">
          <HijamaEducationSection locale={locale} />
        </div>
      </section>

      {/* ── GALLERY ─────────────────────────────────────────────── */}
      <section id="gallery" className="scroll-mt-36 border-t border-ink/8 bg-white dark:border-white/10 dark:bg-white/[0.02]">
        <div className="container-px mx-auto max-w-6xl py-14 sm:py-16">
          <Reveal>
            <SectionHeading eyebrow={t("galleryEyebrow")} title={t("galleryTitle")} theme={theme} center />
            <AlHikmaGallery
              images={galleryImages}
              isIllustrative={!hasOwnGallery}
              illustrativeNote={t("illustrativeNote")}
              whatsappHref={galleryWhatsappHref}
              whatsappPromptText={td("chatAboutGallery", { name: service.name })}
              whatsappButtonLabel={th("whatsapp")}
            />
          </Reveal>
        </div>
      </section>

      {/* ── LOCATION — bespoke (no map: no verified coordinates) ──── */}
      <section id="location" className="scroll-mt-36 border-t border-ink/8 dark:border-white/10" style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.04)` }}>
        <div className="container-px mx-auto max-w-2xl py-14 sm:py-16">
          <Reveal>
            <div className="rounded-xl3 border border-ink/8 bg-white p-8 text-center shadow-card dark:border-white/10 dark:bg-white/[0.03] sm:p-10">
              <span
                className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.1)`, color: theme.primaryStrong }}
              >
                <MapPin size={26} aria-hidden="true" />
              </span>
              <div className="mt-4">
                <Eyebrow theme={theme}>{td("location")}</Eyebrow>
              </div>
              <p className="mt-2 font-display text-xl font-bold sm:text-2xl">{td("locality")}</p>
              <p dir="auto" className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-ink/65 dark:text-sand/65">
                {t("locationBody")}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2.5">
                {callHref && (
                  <a
                    href={callHref}
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
                  >
                    <Phone size={13} aria-hidden="true" />
                    {th("call")}
                  </a>
                )}
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
                  >
                    <WhatsAppIcon size={13} aria-hidden="true" />
                    {th("whatsapp")}
                  </a>
                )}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── REVIEWS ─────────────────────────────────────────────── */}
      <section id="reviews" className="scroll-mt-36 border-t border-ink/8 bg-white dark:border-white/10 dark:bg-white/[0.02]">
        <div className="container-px mx-auto max-w-3xl py-14 sm:py-16">
          <Reveal>
            <SectionHeading eyebrow={tc("reviews")} title={t("reviewsTitle")} theme={theme} center />
            <ReviewsSection
              rating={service.rating}
              reviewCount={service.reviewCount}
              reviews={service.reviews}
              locale={locale}
              pathToRevalidate={path}
            />
            <div className="mt-6">
              <ReviewForm
                key={myReview?.id ?? "new"}
                listingType="city_service"
                listingId={service.id}
                locale={locale}
                pathToRevalidate={path}
                allowPhotos
                existingReview={myReview}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CLOSING CTA + PARTNERSHIP LOCKUP ─────────────────────── */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: `linear-gradient(160deg, ${theme.primaryStrong} 0%, ${theme.primaryDeep} 100%)` }}
        />
        <div className="relative container-px mx-auto max-w-3xl py-16 text-center text-white sm:py-20">
          <Leaf size={24} className="mx-auto mb-4 opacity-70" aria-hidden="true" />
          <h2 className="text-balance font-display text-2xl font-bold sm:text-3xl">{t("ctaTitle")}</h2>
          <p dir="auto" className="mx-auto mt-3 max-w-lg text-balance text-white/85">{t("ctaBody")}</p>
          <CtaRow className="mt-7 items-center" center />

          <div className="mt-12 border-t border-white/15 pt-8">
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-white/55">{tpf("heading")}</p>
            <div className="mt-4 flex items-center justify-center gap-5">
              <Image src={BRAND_LOGO.dark} alt="Go Hargeisa" width={132} height={40} className="h-9 w-auto object-contain sm:h-10" />
              <span aria-hidden="true" className="h-8 w-px bg-white/25" />
              <span className="inline-flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-white p-1 sm:h-12 sm:w-12">
                <Image src={theme.partnerLogo} alt={theme.partnerName} width={48} height={48} className="h-full w-full object-contain" />
              </span>
            </div>
            <p className="mt-3 text-sm font-semibold text-white/85">{service.name}</p>
          </div>
        </div>
      </section>
    </>
  );
}
