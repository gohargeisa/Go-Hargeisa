import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Sparkles, ShoppingBag, ShieldCheck, Tag, MessageCircle, MapPin } from "lucide-react";
import { WhatsAppIcon } from "@/components/shared/brand-icons";
import { Reveal } from "@/components/home/reveal";
import { SecondaryButton } from "@/components/shared/buttons";
import { HotelNavTabs, type HotelNavTab } from "@/components/shared/hotel-nav-tabs";
import { ReviewsSection } from "@/components/shared/reviews-section";
import { ReviewForm } from "@/components/shared/review-form";
import { LocationMapSection } from "@/components/shared/location-map-section";
import { OpenStatusBadge } from "@/components/shared/open-status-badge";
import { MamaBabyCareProductGrid } from "@/components/mama-baby-care/mama-baby-care-product-grid";
import { MamaBabyCareCatalog } from "@/components/mama-baby-care/mama-baby-care-catalog";
import { MamaBabyCareGallery } from "@/components/mama-baby-care/mama-baby-care-gallery";
import { productCategoryLabel } from "@/lib/config/product-categories";
import { formatDayRange, formatTime12h } from "@/lib/utils/opening-hours";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import { resolveMapsUrl } from "@/lib/utils/google-maps";
import {
  MAMA_BABY_CARE_HERO_IMAGES,
  MAMA_BABY_CARE_LIFESTYLE_IMAGES,
  MAMA_BABY_CARE_GALLERY_IMAGES,
} from "@/lib/config/mama-baby-care-media";
import type { PartnerTheme } from "@/lib/config/partner-themes";
import type { Locale } from "@/lib/i18n/config";
import type { CityService, Product, ProductCategory, Review } from "@/types";

/**
 * Mama & Baby Care — bespoke premium storefront for one specific, real,
 * published listing (`city_services` slug "mama-baby-care"), rendered in
 * place of the generic city-services detail page ONLY for this exact slug
 * (see the branch in app/[locale]/city-services/[slug]/page.tsx). Every
 * other city_service listing, including any future kids/baby retailer,
 * keeps the generic page unchanged.
 *
 * This is a retail catalog, not a services/appointment business — no
 * booking flow, no cart/checkout (the brief is explicit: WhatsApp contact
 * only, never a fake payment flow). Every product card shows image + name
 * + category, no price anywhere (not even "price on request" text) — see
 * MamaBabyCareProductCard's own header comment for why that's a bespoke
 * card rather than the universal cart-integrated ProductCard.
 *
 * Imagery: the shop supplied 42 real product photos (Sept 2026, see
 * lib/config/mama-baby-care-media.ts's header comment) but no lifestyle/
 * family photography — the hero and "lifestyle" band below are built as
 * clean editorial arrangements of the shop's own real product photos
 * rather than substituting stock photos of children/families, which
 * can't be verified as licensed the way Al-Hikma's Pexels set was.
 */
export async function MamaBabyCareStorefront({
  theme,
  service,
  locale,
  products,
  myReview,
}: {
  theme: PartnerTheme;
  service: CityService;
  locale: Locale;
  products: Product[];
  myReview: Review | null;
}) {
  const t = await getTranslations({ locale, namespace: "mamaBabyCareStorefront" });
  const td = await getTranslations({ locale, namespace: "detail" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const th = await getTranslations({ locale, namespace: "hotelDetail" });
  const tw = await getTranslations("weekdays");

  const path = `/${locale}/city-services/${service.slug}`;
  const whatsappNumber = service.whatsapp ?? service.phone ?? undefined;
  const whatsappHref = whatsappNumber ? toWhatsAppHref(whatsappNumber, t("whatsappMessage")) : undefined;
  const mapsHref = resolveMapsUrl(service.coords, service.mapsUrl);

  const visible = products.filter((p) => !p.isHidden);
  const featured = visible.filter((p) => p.isFeatured).sort((a, b) => a.sortOrder - b.sortOrder);

  const categoriesPresent: ProductCategory[] = [];
  for (const p of visible) {
    if (p.category && !categoriesPresent.includes(p.category)) categoriesPresent.push(p.category);
  }
  const categoryCards = categoriesPresent.map((cat) => {
    const items = visible.filter((p) => p.category === cat);
    const cover = items.find((p) => p.isFeatured) ?? items[0];
    return { category: cat, label: productCategoryLabel(cat, locale) ?? cat, count: items.length, image: cover?.image };
  });

  const hasStructuredHours = !!service.openingHoursStructured && service.openingHoursStructured.length > 0;
  const hasHoursInfo = hasStructuredHours || service.is24Hours || service.temporarilyClosed || service.permanentlyClosed;
  const hasReviews = service.reviewCount > 0;

  const glance = [
    { icon: ShoppingBag, key: "variety" },
    { icon: Tag, key: "prices" },
    { icon: ShieldCheck, key: "quality" },
    { icon: MessageCircle, key: "whatsapp" },
  ] as const;

  const navTabs: HotelNavTab[] = [
    { id: "categories", label: t("navCategories") },
    { id: "shop-all", label: t("navProducts") },
    { id: "gallery", label: tc("gallery") },
    { id: "info", label: t("navInfo") },
    { id: "location", label: td("location") },
    ...(hasReviews || true ? [{ id: "reviews", label: tc("reviews") }] : []),
  ];

  function CtaRow({ className = "", center = false }: { className?: string; center?: boolean }) {
    return (
      <div className={`flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3 ${center ? "sm:justify-center" : ""} ${className}`}>
        <Link
          href="#shop-all"
          className="inline-flex w-full items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 ease-premium hover:-translate-y-0.5 active:scale-95 sm:w-auto"
          style={{ backgroundColor: theme.primaryStrong }}
        >
          <ShoppingBag size={15} aria-hidden="true" />
          {t("heroShopCta")}
        </Link>
        {whatsappHref && (
          <a
            href={whatsappHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 px-6 py-3 text-sm font-bold shadow-sm transition-all duration-300 ease-premium hover:-translate-y-0.5 active:scale-95 sm:w-auto"
            style={{ borderColor: theme.primaryStrong, color: theme.primaryStrong }}
          >
            <WhatsAppIcon size={15} aria-hidden="true" />
            {t("heroWhatsappCta")}
          </a>
        )}
      </div>
    );
  }

  return (
    <>
      {/* ── HERO ─────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden" style={{ background: `linear-gradient(160deg, ${theme.primarySoft} 0%, #FFF8F3 55%, ${theme.accentSoft} 100%)` }}>
        <div className="container-px relative mx-auto max-w-6xl py-16 sm:py-20">
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="inline-flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-white p-2 shadow-lg sm:h-16 sm:w-16">
                  <Image src={theme.partnerLogo} alt={theme.partnerName} width={64} height={64} className="h-full w-full object-contain" />
                </span>
                <span
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-white"
                  style={{ backgroundColor: theme.accentStrong }}
                >
                  <Sparkles size={12} aria-hidden="true" />
                  {t("heroCategoryLabel")}
                </span>
              </div>

              <h1 className="mt-5 max-w-xl text-balance font-display text-3xl font-bold leading-[1.1] tracking-tight sm:text-4xl lg:text-[2.75rem]">
                {service.name}
              </h1>

              <p dir="auto" className="mt-4 max-w-lg text-balance leading-relaxed text-ink/70 dark:text-sand/70">
                {t("heroTagline")}
              </p>

              {service.description && (
                <p dir="auto" className="mt-3 max-w-lg text-sm leading-relaxed text-ink/60 dark:text-sand/60">
                  {service.description}
                </p>
              )}

              <CtaRow className="mt-7" />
            </div>

            <div className="relative mx-auto grid w-full max-w-sm grid-cols-2 gap-3 sm:max-w-md">
              <div className="relative col-span-2 aspect-[5/3] overflow-hidden rounded-xl3 shadow-card">
                <Image src={MAMA_BABY_CARE_HERO_IMAGES.primary} alt="" fill sizes="(max-width: 1024px) 90vw, 420px" className="object-cover" priority />
              </div>
              <div className="relative aspect-square overflow-hidden rounded-xl2 shadow-soft">
                <Image src={MAMA_BABY_CARE_HERO_IMAGES.secondary} alt="" fill sizes="(max-width: 1024px) 45vw, 205px" className="object-cover" />
              </div>
              <div className="relative aspect-square overflow-hidden rounded-xl2 shadow-soft">
                <Image src={MAMA_BABY_CARE_HERO_IMAGES.tertiary} alt="" fill sizes="(max-width: 1024px) 45vw, 205px" className="object-cover" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <HotelNavTabs tabs={navTabs} />

      {/* ── FEATURED CATEGORIES → FEATURED PRODUCTS → SHOP ALL ──────
          One client component so a category-card click can actually filter
          the Shop All grid (previously it only scrolled to it). The
          Featured Products section renders exactly as before — passed in
          as a server-rendered slot so its position between Categories and
          Shop All (the approved order) doesn't change. */}
      <MamaBabyCareCatalog
        categoryCards={categoryCards}
        products={visible}
        whatsappNumber={whatsappNumber}
        storeName={service.name}
        locale={locale}
        theme={theme}
        featuredSection={
          featured.length > 0 ? (
            <section className="border-b border-ink/8 dark:border-white/10" style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.04)` }}>
              <div className="container-px mx-auto max-w-6xl py-14 sm:py-16">
                <Reveal>
                  <SectionHeading eyebrow={t("featuredEyebrow")} title={t("featuredTitle")} theme={theme} />
                  <MamaBabyCareProductGrid
                    products={featured}
                    whatsappNumber={whatsappNumber}
                    storeName={service.name}
                    locale={locale}
                    accentColor={theme.accentStrong}
                    primaryColor={theme.primaryStrong}
                  />
                </Reveal>
              </div>
            </section>
          ) : null
        }
      />

      {/* ── LIFESTYLE BAND ───────────────────────────────────────── */}
      <section className="relative overflow-hidden border-y border-ink/8 dark:border-white/10">
        <div className="container-px mx-auto grid max-w-6xl gap-10 py-14 sm:py-16 lg:grid-cols-2 lg:items-center lg:gap-12">
          <Reveal>
            <div className="relative">
              <div className="relative aspect-[4/5] w-full max-w-md overflow-hidden rounded-xl3 shadow-card sm:mx-auto lg:mx-0">
                <Image
                  src={MAMA_BABY_CARE_LIFESTYLE_IMAGES.primary}
                  alt={t("lifestyleImageAlt")}
                  fill
                  sizes="(max-width: 1024px) 80vw, 420px"
                  className="object-cover"
                />
              </div>
              <div className="absolute -bottom-6 -end-4 h-28 w-24 overflow-hidden rounded-xl2 border-4 border-white shadow-card dark:border-ink sm:h-36 sm:w-32">
                <Image
                  src={MAMA_BABY_CARE_LIFESTYLE_IMAGES.secondary}
                  alt={t("lifestyleImageAltSecondary")}
                  fill
                  sizes="140px"
                  className="object-cover"
                />
              </div>
            </div>
            <p className="mt-8 max-w-md text-xs italic text-ink/45 dark:text-sand/45 sm:mx-auto lg:mx-0">{t("lifestyleIllustrativeNote")}</p>
          </Reveal>
          <Reveal>
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em]"
              style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.08)`, color: theme.primaryStrong }}
            >
              {t("lifestyleEyebrow")}
            </span>
            <h2 className="mt-3 max-w-md text-balance font-display text-2xl font-bold tracking-tight sm:text-[1.75rem]">{t("lifestyleTitle")}</h2>
            <p dir="auto" className="mt-3 max-w-md leading-relaxed text-ink/65 dark:text-sand/65">
              {t("lifestyleBody")}
            </p>
            <a href="#shop-all" className="mt-5 inline-flex items-center gap-1.5 text-sm font-bold" style={{ color: theme.primaryStrong }}>
              {t("lifestyleCta")} <ShoppingBag size={14} aria-hidden="true" />
            </a>
          </Reveal>
        </div>
      </section>

      {/* ── GALLERY ─────────────────────────────────────────────── */}
      <section id="gallery" className="scroll-mt-36 bg-white dark:bg-white/[0.02]">
        <div className="container-px mx-auto max-w-6xl py-14 sm:py-16">
          <Reveal>
            <SectionHeading eyebrow={t("galleryEyebrow")} title={t("galleryTitle")} theme={theme} center />
            <MamaBabyCareGallery images={MAMA_BABY_CARE_GALLERY_IMAGES} />
          </Reveal>
        </div>
      </section>

      {/* ── BUSINESS INFO ────────────────────────────────────────── */}
      <section id="info" className="scroll-mt-36 border-t border-ink/8 dark:border-white/10" style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.04)` }}>
        <div className="container-px mx-auto max-w-5xl py-14 sm:py-16">
          <Reveal>
            <SectionHeading eyebrow={t("infoEyebrow")} title={t("infoTitle")} theme={theme} center />
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {glance.map(({ icon: Icon, key }) => (
                <div key={key} className="flex flex-col items-center gap-2.5 rounded-xl3 border border-ink/8 bg-white p-5 text-center shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full" style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.1)`, color: theme.primaryStrong }}>
                    <Icon size={18} aria-hidden="true" />
                  </span>
                  <p className="text-sm font-semibold">{t(`glance.${key}.title`)}</p>
                  <p className="text-xs leading-relaxed text-ink/55 dark:text-sand/55">{t(`glance.${key}.body`)}</p>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── LOCATION & HOURS ─────────────────────────────────────── */}
      <section className="border-t border-ink/8 bg-white dark:border-white/10 dark:bg-white/[0.02]">
        <div className="container-px mx-auto max-w-3xl py-14 sm:py-16">
          <Reveal>
            <LocationMapSection locale={locale} address={td("locality")} coords={service.coords} mapsHref={mapsHref} name={service.name} />
          </Reveal>

          {hasHoursInfo && (
            <Reveal>
              <div className="mt-10">
                <div className="mb-5 flex flex-wrap items-center gap-3">
                  <h2 className="font-display text-xl font-semibold">{td("openingHoursByDay")}</h2>
                  <OpenStatusBadge
                    groups={service.openingHoursStructured ?? []}
                    is24Hours={service.is24Hours}
                    temporarilyClosed={service.temporarilyClosed}
                    permanentlyClosed={service.permanentlyClosed}
                  />
                </div>
                {hasStructuredHours && (
                  <div className="divide-y divide-ink/8 overflow-hidden rounded-xl2 border border-ink/8 dark:divide-white/10 dark:border-white/10">
                    {service.openingHoursStructured!.map((group, i) => (
                      <div key={i} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-5">
                        <span className="min-w-0 break-words text-sm font-semibold">{formatDayRange(group.days, tw)}</span>
                        <span className="shrink-0 text-sm text-ink/70 dark:text-sand/70">
                          {formatTime12h(group.open)} – {formatTime12h(group.close)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </Reveal>
          )}
        </div>
      </section>

      {/* ── REVIEWS ─────────────────────────────────────────────── */}
      <section id="reviews" className="scroll-mt-36 border-t border-ink/8 dark:border-white/10" style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.04)` }}>
        <div className="container-px mx-auto max-w-3xl py-14 sm:py-16">
          <Reveal>
            <SectionHeading eyebrow={tc("reviews")} title={t("reviewsTitle")} theme={theme} center />
            <ReviewsSection rating={service.rating} reviewCount={service.reviewCount} reviews={service.reviews} locale={locale} pathToRevalidate={path} />
            <div className="mt-6">
              <ReviewForm key={myReview?.id ?? "new"} listingType="city_service" listingId={service.id} locale={locale} pathToRevalidate={path} allowPhotos existingReview={myReview} />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── CLOSING WHATSAPP CTA ─────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="absolute inset-0" style={{ background: `linear-gradient(160deg, ${theme.primaryStrong} 0%, ${theme.primaryDeep} 100%)` }} />
        <div className="relative container-px mx-auto max-w-2xl py-16 text-center text-white sm:py-20">
          <MapPin size={22} className="mx-auto mb-4 opacity-70" aria-hidden="true" />
          <h2 className="text-balance font-display text-2xl font-bold sm:text-3xl">{t("ctaTitle")}</h2>
          <p dir="auto" className="mx-auto mt-3 max-w-lg text-balance text-white/85">
            {t("ctaBody")}
          </p>
          <div className="mt-7 flex flex-col items-center gap-2.5 sm:flex-row sm:justify-center sm:gap-3">
            <Link
              href="#shop-all"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-bold shadow-lg transition-all duration-300 ease-premium hover:-translate-y-0.5 active:scale-95 sm:w-auto"
              style={{ color: theme.primaryStrong }}
            >
              <ShoppingBag size={15} aria-hidden="true" />
              {t("heroShopCta")}
            </Link>
            {whatsappHref && (
              <SecondaryButton href={whatsappHref} external size="md" className="!w-full !border-white/40 !text-white hover:!border-white sm:!w-auto">
                <WhatsAppIcon size={14} aria-hidden="true" />
                {th("whatsapp")}
              </SecondaryButton>
            )}
          </div>
        </div>
      </section>
    </>
  );
}

function SectionHeading({ eyebrow, title, theme, center }: { eyebrow: string; title: string; theme: PartnerTheme; center?: boolean }) {
  return (
    <div className={`mb-8 ${center ? "text-center" : ""}`}>
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em]"
        style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.08)`, color: theme.primaryStrong }}
      >
        {eyebrow}
      </span>
      <h2 className="mt-3 font-display text-2xl font-bold tracking-tight sm:text-[1.75rem]">{title}</h2>
    </div>
  );
}
