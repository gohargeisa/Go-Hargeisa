import Image from "next/image";
import { getTranslations } from "next-intl/server";
import {
  ShoppingBag, Plane, PackageSearch, FileCheck2, Building2, Truck,
  ShieldCheck, MapPin, Phone, Mail, Search, Send, CreditCard,
  PackageCheck, Boxes, Globe2,
} from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { WhatsAppIcon } from "@/components/shared/brand-icons";
import { OrderRequestButton } from "@/components/emaankoo/order-request-form";
import { EmaankooGallery } from "@/components/emaankoo/emaankoo-gallery";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import { resolveMapsUrl } from "@/lib/utils/google-maps";
import type { PartnerTheme } from "@/lib/config/partner-themes";
import type { Locale } from "@/lib/i18n/config";
import type { CityService } from "@/types";

/**
 * Emaankoo Group — premium GLOBAL SHOPPING & LOGISTICS storefront for the one
 * real published listing (city_services slug "emaankoo-group"), rendered in
 * place of the generic city-services detail page ONLY for this exact slug
 * (see the conditional branch in app/[locale]/city-services/[slug]/page.tsx).
 *
 * SCOPE — this page is Emaankoo's e-commerce / sourcing / shipping / logistics
 * / delivery business ONLY. Emaankoo also runs a separate Events &
 * Entertainment business; NONE of that appears here (no events section, no
 * "Request an Event" CTA, no event/summer-camp/costume imagery). That data
 * stays untouched in the database for a future dedicated Emaankoo Events page:
 *   - the gallery below is hand-curated: everything tagged `activities` plus a
 *     small denylist of mis-tagged event posters / a watermarked booth photo /
 *     a sideways photo are filtered out (EXCLUDED_GALLERY_URL_FRAGMENTS);
 *   - the services grid renders the 6 shopping/logistics services only (the
 *     7th, entertainment-events, is dropped).
 *
 * Every fact here comes from real Emaankoo material — the `city_services` row
 * (name / phone / whatsapp / email / maps_url, all re-verified against the DB)
 * plus the business's own Company Profile poster and "We Offer Order From"
 * platforms poster (both in this listing's gallery). The 6 services and
 * "customs support" wording are on the Company Profile poster's own "Our
 * Service" list and in `city_services.description`; nothing is a guarantee
 * (no delivery time / price / customs-clearance / arrival-date promise). No
 * founding year, customer counts, awards, partnerships, or statistics are
 * claimed — none are documented. The founder credit (Iman Sheikh, feminine
 * wording in every locale) is from the same Company Profile poster.
 * Contacts: the verified `city_services` row (primary) plus the business's
 * two additional verified contacts (SECONDARY_PHONE / SECONDARY_EMAIL).
 * "Contact Emaankoo" opens the verified WhatsApp directly. The address value
 * stays Latin-script + LTR in every locale (only its label is translated).
 *
 * Deliberately NOT wrapped in PartnerThemeScope (same call as before): the
 * brief keeps Emaankoo's magenta an accent only. CTAs use the site's own
 * amber `primary-700`; `theme.accent*` is used only for eyebrows/icons/rules.
 */

// Gallery URLs kept in the DB but excluded from THIS page's presentation:
// event/entertainment material (preserved for the future Emaankoo Events
// page) plus two quality issues. Matched by the unique id in the storage URL.
const EXCLUDED_GALLERY_URL_FRAGMENTS = [
  "3e2aad53", // "branded office space" — carries an "MM TV" broadcaster watermark + red border frame
  "0e44aa26", // "SHEIN order bags" — stored sideways (90° rotated), reads as broken on a premium grid
  "91c2670c", // "company brochure" — actually the EVENTS brochure ("leading event management company")
  "d7e46e92", // "kids events promotional poster" — events
  "7c3bb9b1", // "Summer Camp 2026 poster" — events
  "4511e230", // "Summer Camp 2026 poster" — events
];

export async function EmaankooStorefront({
  theme,
  service,
  locale,
}: {
  theme: PartnerTheme;
  service: CityService;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: "emaankooStorefront" });
  const th = await getTranslations({ locale, namespace: "hotelDetail" });
  const tl = await getTranslations({ locale, namespace: "listings" });

  const whatsappHref = service.whatsapp ? toWhatsAppHref(service.whatsapp) : undefined;
  const mapsHref = resolveMapsUrl(service.coords, service.mapsUrl);

  // Primary contact comes from the verified `city_services` row (phone /
  // whatsapp / email). The secondary line and email are additional verified
  // Emaankoo contacts (confirmed by the business; the secondary email also
  // appears on the Company Profile poster). Never invented here.
  const SECONDARY_PHONE = "+252639275466";
  const SECONDARY_EMAIL = "amooo5817@gmail.com";

  // Hand-curated shopping/logistics photo set — see the component header.
  const curatedGallery = service.gallery.filter(
    (g) => g.category !== "activities" && !EXCLUDED_GALLERY_URL_FRAGMENTS.some((frag) => g.url.includes(frag))
  );
  const photoByFragment = (frag: string) => curatedGallery.find((g) => g.url.includes(frag)) ?? null;
  const marketplacePhoto = photoByFragment("fa29a475") ?? curatedGallery.find((g) => g.category === "products") ?? null;
  const logisticsPhoto =
    photoByFragment("992fe79d") ?? curatedGallery.find((g) => g.category === "products" && g !== marketplacePhoto) ?? null;
  // Hero photo — one real Emaankoo operations shot (the branded booth with
  // international parcels + SHEIN/Amazon/noon/iHerb banners). Deliberately
  // different from the marketplace/logistics section photos so nothing
  // repeats back-to-back; it still appears in the gallery too.
  const heroUsed = new Set([marketplacePhoto?.url, logisticsPhoto?.url]);
  const heroPrimaryPhoto =
    photoByFragment("19bf1651") ??
    curatedGallery.find((g) => g.category === "office" && !heroUsed.has(g.url)) ??
    marketplacePhoto ??
    logisticsPhoto;

  const SERVICES = [
    { icon: ShoppingBag, key: "international-shopping" },
    { icon: Plane, key: "global-shipping" },
    { icon: PackageSearch, key: "order-tracking" },
    { icon: FileCheck2, key: "customs-assistance" },
    { icon: Building2, key: "business-sourcing" },
    { icon: Truck, key: "procurement-delivery" },
  ] as const;

  const STEPS = [
    { n: "01", icon: Search, key: "find" },
    { n: "02", icon: Send, key: "share" },
    { n: "03", icon: CreditCard, key: "purchase" },
    { n: "04", icon: Plane, key: "ship" },
    { n: "05", icon: PackageCheck, key: "receive" },
  ] as const;

  const PLATFORMS = ["shein", "amazon", "noon", "iherb", "fordeal", "chicpoint"] as const;

  const LOGISTICS = [
    "logistics_market", "logistics_purchase", "logistics_shipping",
    "logistics_logistics", "logistics_destination", "logistics_delivery",
  ] as const;

  const TRUST = [
    { icon: ShieldCheck, key: "partner" },
    { icon: Boxes, key: "endtoend" },
    { icon: FileCheck2, key: "transparent" },
  ] as const;

  const PRIMARY_CLASS =
    "inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary-700 px-7 text-[15px] font-bold text-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-card active:scale-95";
  const SECONDARY_ON_DARK =
    "inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-white/30 px-7 text-[15px] font-semibold text-white transition-all duration-200 hover:-translate-y-0.5 hover:border-white/70";

  return (
    <>
      {/* ── 01 · Hero — dark navy ground, one large real operations photo
             carrying the visual weight; decoration kept to a faint texture
             and a section fade. Content renders immediately (no scroll
             reveal — it is above the fold). */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1.6px)", backgroundSize: "30px 30px" }}
          />
          {/* one restrained accent wash behind the photo — no stacked glows */}
          <div
            className="absolute -end-24 top-1/2 hidden h-[460px] w-[460px] -translate-y-1/2 rounded-full blur-[140px] lg:block"
            style={{ backgroundColor: `rgba(${theme.accentRgb}, 0.16)` }}
          />
        </div>

        <div className="container-px relative mx-auto grid max-w-6xl items-center gap-10 py-14 sm:py-16 lg:grid-cols-[1fr_1fr] lg:gap-16 lg:py-24">
          {/* Content — Arabic copy is shorter than EN/SO, so on the lg split
              layout it aligns to the top of the taller photo instead of
              centring (which left it sitting low); EN/SO stay centred. */}
          <div className={`text-center lg:text-start${locale === "ar" ? " lg:self-start" : ""}`}>
            {service.logoUrl && (
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl bg-white p-2 shadow-md sm:h-20 sm:w-20 lg:mx-0">
                <Image
                  src={service.logoUrl}
                  alt={`${service.name} logo`}
                  width={80}
                  height={80}
                  className="h-full w-full object-contain"
                  priority
                />
              </div>
            )}
            <p
              className="text-[11px] font-bold uppercase tracking-[0.22em]"
              style={{ color: theme.accentSoft }}
            >
              {service.name} · {t("heroEyebrow")}
            </p>
            <h1 className="mt-4 text-balance font-display text-[2rem] font-bold leading-[1.1] tracking-tight sm:text-[2.6rem] lg:text-[3.1rem]">
              {t("heroTitle")}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-balance text-[15px] leading-relaxed text-white/70 sm:text-base lg:mx-0">
              {t("heroSubtitle")}
            </p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-center lg:justify-start">
              <OrderRequestButton listingId={service.id} locale={locale} whatsapp={service.whatsapp ?? undefined} className={PRIMARY_CLASS} label={t("primaryCta")} />
              {/* "Contact Emaankoo" opens the business's own verified WhatsApp
                  directly (service.whatsapp from the DB); falls back to the
                  in-page contact section only if no WhatsApp is on file. */}
              {whatsappHref ? (
                <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className={SECONDARY_ON_DARK}>
                  <WhatsAppIcon size={16} aria-hidden="true" />
                  {t("secondaryCta")}
                </a>
              ) : (
                <a href="#contact" className={SECONDARY_ON_DARK}>
                  {t("secondaryCta")}
                </a>
              )}
            </div>
            {service.isPartner && (
              <p className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-white/45 lg:justify-start">
                <ShieldCheck size={13} aria-hidden="true" style={{ color: theme.accentSoft }} />
                <span>{t("trust_partner_title")}</span>
                <span aria-hidden="true" className="text-white/25">·</span>
                <span>{t("founderCredit")}</span>
              </p>
            )}
          </div>

          {/* One large operations photo */}
          {heroPrimaryPhoto && (
            <div className="relative mx-auto w-full max-w-md lg:mx-0 lg:max-w-none">
              <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 shadow-xl sm:aspect-[16/10] lg:aspect-[5/6]">
                <Image
                  src={heroPrimaryPhoto.url}
                  alt={heroPrimaryPhoto.alt || `${service.name} — international parcels and branded delivery bags`}
                  fill
                  sizes="(max-width: 1023px) 92vw, 46vw"
                  className="object-cover"
                  priority
                />
                <div aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-ink/45 via-transparent to-transparent" />
              </div>
            </div>
          )}
        </div>

        {/* fade into the light content below */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-transparent to-black/15" />
      </section>

      {/* ── 02 · Services ─────────────────────────────────────────────── */}
      <section className="container-px mx-auto max-w-6xl py-20 sm:py-24">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span aria-hidden="true" className="mx-auto mb-5 block h-0.5 w-10 rounded-full" style={{ backgroundColor: theme.accentStrong }} />
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t("servicesHeading")}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/60 dark:text-sand/60 sm:text-base">{t("servicesIntro")}</p>
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <div className="mt-12 grid gap-px overflow-hidden rounded-xl border border-ink/10 bg-ink/10 dark:border-white/10 dark:bg-white/10 sm:grid-cols-2 lg:grid-cols-3">
            {SERVICES.map(({ icon: Icon, key }) => (
              <div key={key} className="flex h-full flex-col bg-white p-6 transition-colors duration-200 hover:bg-ink/[0.015] dark:bg-ink dark:hover:bg-white/[0.03]">
                <Icon size={20} aria-hidden="true" style={{ color: theme.accentStrong }} />
                <h3 className="mt-4 font-display text-[17px] font-bold">{t(`service_${key}_title`)}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-ink/60 dark:text-sand/60">{t(`service_${key}_body`)}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ── 03 · The World Is Your Marketplace ────────────────────────── */}
      <section className="border-y border-ink/8 bg-white dark:border-white/10 dark:bg-white/[0.02]">
        <div className="container-px mx-auto grid max-w-6xl items-center gap-10 py-20 sm:py-24 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: theme.accentStrong }}>
                {t("brandLine")}
              </span>
              <h2 className="mt-3 text-balance font-display text-3xl font-bold tracking-tight sm:text-4xl">
                {t("positioningHeading")}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-ink/70 dark:text-sand/70">{t("positioningBody")}</p>
              <p className="mt-4 text-sm italic leading-relaxed text-ink/55 dark:text-sand/55">{t("missionStatement")}</p>
              {/* Real, verified from the business's own Company Profile poster —
                  Emaankoo Group's founder is a woman; wording is feminine in
                  every locale. */}
              <p className="mt-5 flex items-center gap-2 text-sm font-semibold text-ink/65 dark:text-sand/65">
                <ShieldCheck size={15} aria-hidden="true" style={{ color: theme.accentStrong }} />
                {t("founderCredit")}
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.08}>
            {marketplacePhoto ? (
              <div className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-ink/10 dark:border-white/10">
                <Image
                  src={marketplacePhoto.url}
                  alt={marketplacePhoto.alt || t("positioningHeading")}
                  fill
                  sizes="(max-width: 1023px) 100vw, 45vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className="flex aspect-[4/3] w-full items-center justify-center rounded-xl"
                style={{ backgroundColor: `rgba(${theme.accentRgb}, 0.08)`, color: theme.accentStrong }}
              >
                <Globe2 size={40} aria-hidden="true" />
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* ── 04 · How It Works (01–05) ─────────────────────────────────── */}
      <section className="container-px mx-auto max-w-6xl py-20 sm:py-24">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span aria-hidden="true" className="mx-auto mb-5 block h-0.5 w-10 rounded-full" style={{ backgroundColor: theme.accentStrong }} />
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t("howItWorksHeading")}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/60 dark:text-sand/60 sm:text-base">{t("howItWorksIntro")}</p>
          </div>
        </Reveal>
        <Reveal delay={0.05}>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-xl border border-ink/10 bg-ink/10 dark:border-white/10 dark:bg-white/10 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map(({ n, icon: Icon, key }) => (
              <li key={key} className="flex h-full flex-col bg-white p-5 dark:bg-ink">
                <div className="flex items-baseline gap-2">
                  <span className="font-display text-xl font-extrabold tracking-tight" style={{ color: theme.accentStrong }}>{n}</span>
                  <Icon size={15} aria-hidden="true" className="text-ink/35 dark:text-sand/35" />
                </div>
                <h3 className="mt-3 font-display text-[15px] font-bold">{t(`step_${key}_title`)}</h3>
                <p className="mt-1 text-sm leading-relaxed text-ink/60 dark:text-sand/60">{t(`step_${key}_body`)}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </section>

      {/* ── 05 · Shop From Global Markets (verified platforms) ────────── */}
      <section className="border-y border-ink/8 bg-white dark:border-white/10 dark:bg-white/[0.02]">
        <div className="container-px mx-auto max-w-4xl py-20 text-center sm:py-24">
          <Reveal>
            <span aria-hidden="true" className="mx-auto mb-5 block h-0.5 w-10 rounded-full" style={{ backgroundColor: theme.accentStrong }} />
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t("platformsHeading")}</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-ink/60 dark:text-sand/60">{t("platformsBody")}</p>
            <div className="mt-9 flex flex-wrap items-center justify-center gap-2.5">
              {PLATFORMS.map((p) => (
                <span
                  key={p}
                  className="rounded-lg border border-ink/12 px-5 py-2.5 text-sm font-bold tracking-tight text-ink/80 dark:border-white/15 dark:text-white/80"
                >
                  {t(`platform_${p}`)}
                </span>
              ))}
              <span className="rounded-lg border border-dashed border-ink/15 px-5 py-2.5 text-sm font-semibold text-ink/40 dark:border-white/15 dark:text-sand/40">
                {t("platformMore")}
              </span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── 06 · From Purchase to Destination (logistics timeline) ────── */}
      <section className="container-px mx-auto max-w-6xl py-20 sm:py-24">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span aria-hidden="true" className="mx-auto mb-5 block h-0.5 w-10 rounded-full" style={{ backgroundColor: theme.accentStrong }} />
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t("logisticsHeading")}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/60 dark:text-sand/60 sm:text-base">{t("logisticsIntro")}</p>
          </div>
        </Reveal>

        <div className="mt-12 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <ol className="relative space-y-0">
              {LOGISTICS.map((key, i) => (
                <li key={key} className="relative flex gap-4 pb-8 last:pb-0">
                  {i < LOGISTICS.length - 1 && (
                    <span
                      aria-hidden="true"
                      className="absolute start-[15px] top-8 h-[calc(100%-1rem)] w-px"
                      style={{ backgroundColor: `rgba(${theme.accentRgb}, 0.25)` }}
                    />
                  )}
                  <span
                    aria-hidden="true"
                    className="relative z-10 mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: theme.accentStrong }}
                  >
                    {i + 1}
                  </span>
                  <span className="pt-1 font-display text-lg font-semibold">{t(key)}</span>
                </li>
              ))}
            </ol>
          </Reveal>
          <Reveal delay={0.08}>
            {logisticsPhoto ? (
              <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl border border-ink/10 dark:border-white/10">
                <Image
                  src={logisticsPhoto.url}
                  alt={logisticsPhoto.alt || t("logisticsHeading")}
                  fill
                  sizes="(max-width: 1023px) 100vw, 45vw"
                  className="object-cover"
                />
              </div>
            ) : (
              <div
                className="flex aspect-[4/5] w-full items-center justify-center rounded-xl"
                style={{ backgroundColor: `rgba(${theme.accentRgb}, 0.08)`, color: theme.accentStrong }}
              >
                <Truck size={40} aria-hidden="true" />
              </div>
            )}
          </Reveal>
        </div>
      </section>

      {/* ── 07 · Product & Logistics Gallery (curated — no events) ────── */}
      {curatedGallery.length > 0 && (
        <section className="border-y border-ink/8 bg-white dark:border-white/10 dark:bg-white/[0.02]">
          <div className="container-px mx-auto max-w-6xl py-20 sm:py-24">
            <Reveal>
              <div className="mx-auto mb-10 max-w-2xl text-center">
                <span aria-hidden="true" className="mx-auto mb-5 block h-0.5 w-10 rounded-full" style={{ backgroundColor: theme.accentStrong }} />
                <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t("galleryHeading")}</h2>
                <p className="mt-3 text-sm leading-relaxed text-ink/60 dark:text-sand/60 sm:text-base">{t("gallerySubtitle")}</p>
              </div>
            </Reveal>
            <Reveal delay={0.06}>
              <EmaankooGallery images={curatedGallery} />
            </Reveal>
          </div>
        </section>
      )}

      {/* ── 08 · Trust / Business Information ─────────────────────────── */}
      <section id="contact" className="container-px mx-auto max-w-6xl scroll-mt-24 py-20 sm:py-24">
        <Reveal>
          <div className="mx-auto max-w-2xl text-center">
            <span aria-hidden="true" className="mx-auto mb-5 block h-0.5 w-10 rounded-full" style={{ backgroundColor: theme.accentStrong }} />
            <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">{t("trustHeading")}</h2>
          </div>
        </Reveal>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr_1fr] lg:gap-12">
          <Reveal>
            <div className="grid gap-px overflow-hidden rounded-xl border border-ink/10 bg-ink/10 dark:border-white/10 dark:bg-white/10 sm:grid-cols-3 lg:grid-cols-1">
              {TRUST.map(({ icon: Icon, key }) => (
                <div key={key} className="flex h-full gap-3.5 bg-white p-5 dark:bg-ink lg:items-start">
                  <Icon size={18} aria-hidden="true" className="mt-0.5 shrink-0" style={{ color: theme.accentStrong }} />
                  <div>
                    <h3 className="font-display text-[15px] font-bold">{t(`trust_${key}_title`)}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-ink/60 dark:text-sand/60">{t(`trust_${key}_body`)}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <div className="rounded-xl border border-ink/10 bg-white p-6 dark:border-white/10 dark:bg-white/[0.02]">
              <h3 className="font-display text-lg font-bold">{t("businessInfoHeading")}</h3>
              <dl className="mt-4 space-y-3.5 text-sm">
                <div className="flex gap-3">
                  <MapPin size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ink/40 dark:text-sand/40" />
                  <div>
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">{t("label_location")}</dt>
                    {/* Address value stays in Latin script and LTR in every
                        locale (the label above is translated; the address is
                        not). */}
                    <dd dir="ltr" className="mt-0.5 text-start text-ink/75 dark:text-sand/75">{t("addressLine")}</dd>
                  </div>
                </div>
                {service.phone && (
                  <div className="flex gap-3">
                    <Phone size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ink/40 dark:text-sand/40" />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">{t("label_phone")}</dt>
                      <dd className="mt-0.5">
                        <a href={`tel:${service.phone}`} className="text-ink/75 hover:text-primary dark:text-sand/75" dir="ltr">
                          {service.phone}
                        </a>
                      </dd>
                    </div>
                  </div>
                )}
                {service.whatsapp && (
                  <div className="flex gap-3">
                    <WhatsAppIcon size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ink/40 dark:text-sand/40" />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">{t("label_whatsapp")}</dt>
                      <dd className="mt-0.5">
                        <a
                          href={whatsappHref}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-ink/75 hover:text-primary dark:text-sand/75"
                          dir="ltr"
                        >
                          {service.whatsapp}
                        </a>
                      </dd>
                    </div>
                  </div>
                )}
                {service.email && (
                  <div className="flex gap-3">
                    <Mail size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ink/40 dark:text-sand/40" />
                    <div>
                      <dt className="text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">{t("label_email")}</dt>
                      <dd className="mt-0.5">
                        <a href={`mailto:${service.email}`} dir="ltr" className="block break-all text-start text-ink/75 hover:text-primary dark:text-sand/75">
                          {service.email}
                        </a>
                      </dd>
                    </div>
                  </div>
                )}
                <div className="flex gap-3 border-t border-ink/8 pt-3.5 dark:border-white/10">
                  <Phone size={16} aria-hidden="true" className="mt-0.5 shrink-0 text-ink/30 dark:text-sand/30" />
                  <div className="min-w-0">
                    <dt className="text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">{t("label_alsoReachable")}</dt>
                    <dd className="mt-1 space-y-1">
                      <a href={`tel:${SECONDARY_PHONE}`} dir="ltr" className="block text-start text-ink/70 hover:text-primary dark:text-sand/70">
                        {SECONDARY_PHONE}
                      </a>
                      <a href={`mailto:${SECONDARY_EMAIL}`} dir="ltr" className="block break-all text-start text-ink/70 hover:text-primary dark:text-sand/70">
                        {SECONDARY_EMAIL}
                      </a>
                    </dd>
                  </div>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap gap-2.5">
                {service.phone && (
                  <a href={`tel:${service.phone}`} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-ink/15 px-4 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white">
                    <Phone size={14} aria-hidden="true" /> {th("call")}
                  </a>
                )}
                {whatsappHref && (
                  <a
                    href={whatsappHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#25D366] px-4 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[#1FB855]"
                  >
                    <WhatsAppIcon size={14} aria-hidden="true" /> {th("whatsapp")}
                  </a>
                )}
                {mapsHref && (
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-10 items-center gap-1.5 rounded-full border border-ink/15 px-4 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
                  >
                    <MapPin size={14} aria-hidden="true" /> {tl("getDirections")}
                  </a>
                )}
              </div>
            </div>
          </Reveal>
        </div>

        {service.isPartner && (
          <div className="mt-10 flex items-center justify-center gap-1.5 text-xs font-medium text-ink/40 dark:text-sand/40">
            <ShieldCheck size={12} aria-hidden="true" />
            {t("partnershipAttribution")}
          </div>
        )}
      </section>

      {/* ── 09 · Final CTA ───────────────────────────────────────────── */}
      <section className="relative isolate overflow-hidden bg-ink text-white">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1.6px)", backgroundSize: "30px 30px" }}
          />
          <div
            className="absolute left-1/2 top-full h-[360px] w-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-[140px]"
            style={{ backgroundColor: `rgba(${theme.accentRgb}, 0.2)` }}
          />
        </div>
        <div className="container-px relative mx-auto max-w-2xl py-16 text-center sm:py-24">
          <Reveal>
            <h2 className="text-balance font-display text-[1.75rem] font-bold tracking-tight sm:text-4xl">{t("finalCtaHeading")}</h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/70 sm:text-base">{t("finalCtaBody")}</p>
            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
              <OrderRequestButton listingId={service.id} locale={locale} whatsapp={service.whatsapp ?? undefined} className={PRIMARY_CLASS} label={t("primaryCta")} />
              {whatsappHref && (
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full bg-[#25D366] px-7 text-[15px] font-bold text-white transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-[#1FB855] active:scale-95"
                >
                  <WhatsAppIcon size={17} aria-hidden="true" />
                  {t("whatsappCta")}
                </a>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
