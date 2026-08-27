import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { MapPin, MessageCircle, ShieldCheck, Sparkles, Gem } from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { PrimaryButton, SecondaryButton } from "@/components/shared/buttons";
import { PinnacleProductGrid } from "@/components/pinnacle/pinnacle-product-grid";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import type { PartnerTheme } from "@/lib/config/partner-themes";
import type { Locale } from "@/lib/i18n/config";
import type { CityService, Product } from "@/types";

/**
 * Pinnacle Perfumes & Cosmetics — premium storefront for one specific,
 * real, published listing (city_services slug
 * "pinnacle-perfumes-and-cosmatics"), rendered in place of the generic
 * city-services detail page ONLY for this exact slug (see the conditional
 * branch in app/[locale]/city-services/[slug]/page.tsx) — every other
 * city_service listing keeps the generic page byte-for-byte unchanged.
 *
 * Every product row here (`products`) was individually verified against
 * the business's own real corporate catalog site, pinnacleperfumes.com —
 * name, brand, size (baked into `name` exactly as the site lists it),
 * image, and (as of the 2026-09-07 catalog pass) price, each cross-checked
 * against a specific numbered product listing on that site, never guessed
 * — see supabase/migrations/20260907000007_pinnacle_premium_catalog.sql's
 * own header comment for the full source trail. That site is shared
 * corporate infrastructure for a multi-country retailer (its own Contact
 * page is Tanzania-branch information, not Hargeisa's), so it's used here
 * ONLY as a product/brand/price source, never for contact details —
 * phone/WhatsApp/location below all come from this listing's own verified
 * `city_services` row instead (via `service.phone`/`.whatsapp`/`.mapsUrl`).
 *
 * No price is ever shown on the public storefront, by explicit request —
 * `products.price` stays populated in the database (verified alongside
 * everything else) for admin/future-commerce use only; every card's sole
 * CTA routes straight to WhatsApp instead. See PinnacleProductGrid, which
 * also owns search/brand/gender filtering and progressive "Load More"
 * pagination for the ~190-item public catalog (23 of the 213 total rows
 * are hidden — is_hidden = true, never deleted, still available for admin
 * review/correction) — see
 * supabase/migrations/20260907000008_pinnacle_image_audit_and_no_public_pricing.sql
 * and .../20260907000010_pinnacle_visual_image_audit.sql.
 *
 * IMPORTANT for any future product import from pinnacleperfumes.com (or a
 * similar third-party source): an HTTP-200 + non-placeholder-byte-size
 * check on an image URL is NECESSARY but NOT SUFFICIENT — that source's
 * own Odoo catalog was found to serve a real, normal-looking, but WRONG
 * photo for at least one product (a "VCA Orchidée Vanille" listing was
 * pointing at a genuine Chanel Coco Mademoiselle photo — confirmed by
 * downloading and viewing the exact live image). Only an actual visual
 * comparison (download + view + read the bottle/box label against
 * brand + fragrance line + concentration + size) catches this class of
 * bug; see the 000010 migration's own header comment for the full audit
 * methodology and results.
 */
export async function PinnacleStorefront({
  theme,
  service,
  products,
  locale,
}: {
  theme: PartnerTheme;
  service: CityService;
  products: Product[];
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: "pinnacleStorefront" });
  const th = await getTranslations({ locale, namespace: "hotelDetail" });
  // "getDirections" lives in the "listings" namespace, not "hotelDetail" —
  // calling th("getDirections") rendered the raw key "hotelDetail.
  // getDirections" to customers instead of translated text.
  const tl = await getTranslations({ locale, namespace: "listings" });

  const whatsappNumber = service.whatsapp ?? service.phone ?? undefined;
  const generalWhatsappHref = whatsappNumber ? toWhatsAppHref(whatsappNumber, t("whatsappGeneralMessage")) : undefined;

  // Real category facets Pinnacle's own catalog actually exposes (the
  // sidebar filter list on pinnacleperfumes.com/shop includes "Men
  // Perfumes", "Women Perfumes", "Unisex" alongside dozens of brand names).
  // These cards stay WhatsApp-inquiry shortcuts (simple, no shared state
  // with the catalog grid below); the catalog itself now also has its own
  // working gender dropdown (see PinnacleProductGrid) now that gender is
  // populated for the large majority of the verified catalog.
  const CATEGORIES: { key: string; icon: typeof Sparkles; titleKey: "categoryMenTitle" | "categoryWomenTitle" | "categoryUnisexTitle" }[] = [
    { key: "men", icon: Sparkles, titleKey: "categoryMenTitle" },
    { key: "women", icon: Gem, titleKey: "categoryWomenTitle" },
    { key: "unisex", icon: ShieldCheck, titleKey: "categoryUnisexTitle" },
  ];

  const brands = service.brands ?? [];

  return (
    <>
      {/* Hero — real logo on a premium black/gold gradient. No heroImage:
          no verified interior/exterior photo exists for the Hargeisa branch
          (see PINNACLE_THEME's own comment) — a fabricated/stock photo would
          misrepresent what this specific store looks like, so this uses the
          same honest gradient-plus-real-logo fallback FlormarStorefront's
          own "no heroImage" branch already renders elsewhere on the site. */}
      <section className="relative flex min-h-[520px] items-center justify-center overflow-hidden px-5 py-24 text-center text-white">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{ background: `linear-gradient(155deg, ${theme.primaryDeep} 0%, ${theme.primary} 55%, ${theme.primaryMid} 100%)` }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1.5px)", backgroundSize: "26px 26px" }}
        />
        <div className="relative flex max-w-2xl flex-col items-center">
          <div className="relative mb-6 h-20 w-20 overflow-hidden rounded-full bg-white p-3 shadow-lg sm:h-24 sm:w-24">
            <Image src={theme.partnerLogo} alt={theme.partnerName} fill sizes="96px" className="object-contain p-2" priority />
          </div>
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em]"
            style={{ borderColor: `rgba(${theme.accentRgb}, 0.6)`, color: theme.accentSoft }}
          >
            {t("heroEyebrow")}
          </span>
          <h1 className="mt-6 text-balance font-display text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">{theme.partnerName}</h1>
          <p className="mt-4 text-balance font-display text-lg font-semibold text-white/85 sm:text-xl">{t("heroTagline")}</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="#catalog"
              className="inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              style={{ backgroundColor: theme.accentStrong }}
            >
              {t("exploreCollectionCta")}
            </a>
            {generalWhatsappHref && (
              <SecondaryButton href={generalWhatsappHref} external size="lg" className="!border-white/40 !text-white hover:!border-white">
                <MessageCircle size={16} aria-hidden="true" />
                {th("whatsapp")}
              </SecondaryButton>
            )}
            {service.mapsUrl && (
              <SecondaryButton href={service.mapsUrl} external size="lg" className="!border-white/40 !text-white hover:!border-white">
                <MapPin size={16} aria-hidden="true" />
                {tl("getDirections")}
              </SecondaryButton>
            )}
          </div>
        </div>
      </section>

      {/* Brand story — quoting the business's own verified description
          (city_services.description, already on file for this listing), not
          invented copy. The three values below are the same three principles
          that text itself states ("Authenticity, Excellence, and Trust"). */}
      <section className="py-16 sm:py-24">
        <div className="container-px mx-auto max-w-2xl text-center">
          <Reveal>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]"
              style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.08)`, color: theme.primaryStrong }}
            >
              {t("storyEyebrow")}
            </span>
            <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">{t("storyTitle")}</h2>
            {service.description && (
              <p className="mt-4 whitespace-pre-line text-start leading-relaxed text-ink/70 dark:text-sand/70 sm:text-center">{service.description}</p>
            )}
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, titleKey: "valueAuthenticityTitle" as const, bodyKey: "valueAuthenticityBody" as const },
              { icon: Gem, titleKey: "valueExcellenceTitle" as const, bodyKey: "valueExcellenceBody" as const },
              { icon: Sparkles, titleKey: "valueTrustTitle" as const, bodyKey: "valueTrustBody" as const },
            ].map((v) => (
              <div key={v.titleKey} className="rounded-xl3 border border-ink/8 p-5 text-start dark:border-white/10">
                <v.icon size={20} style={{ color: theme.accentStrong }} aria-hidden="true" />
                <p className="mt-3 font-display text-sm font-bold">{t(v.titleKey)}</p>
                <p className="mt-1.5 text-xs leading-relaxed text-ink/60 dark:text-sand/60">{t(v.bodyKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Shop by Category — real category facets Pinnacle's own catalog
          exposes (see CATEGORIES comment above), each a WhatsApp inquiry
          prompt rather than a filtered grid the verified sample can't fully
          back yet. */}
      <section className="bg-white py-16 dark:bg-white/[0.03] sm:py-24">
        <div className="container-px mx-auto">
          <Reveal>
            <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]"
                style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.08)`, color: theme.primaryStrong }}
              >
                {t("categoryEyebrow")}
              </span>
              <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">{t("categoryTitle")}</h2>
            </div>
          </Reveal>
          <div className="grid gap-4 sm:grid-cols-3">
            {CATEGORIES.map((cat) => {
              const href = whatsappNumber ? toWhatsAppHref(whatsappNumber, t("whatsappCategoryMessage", { category: t(cat.titleKey) })) : undefined;
              return (
                <a
                  key={cat.key}
                  href={href}
                  target={href ? "_blank" : undefined}
                  rel={href ? "noopener noreferrer" : undefined}
                  className="group flex flex-col items-center gap-3 rounded-xl3 border border-ink/8 px-6 py-10 text-center shadow-soft transition-transform duration-300 hover:-translate-y-1 dark:border-white/10"
                >
                  <span
                    className="flex h-14 w-14 items-center justify-center rounded-full"
                    style={{ backgroundColor: `rgba(${theme.accentRgb}, 0.12)`, color: theme.accentStrong }}
                  >
                    <cat.icon size={22} aria-hidden="true" />
                  </span>
                  <p className="font-display text-base font-bold">{t(cat.titleKey)}</p>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.accentStrong }}>
                    {th("whatsapp")} →
                  </p>
                </a>
              );
            })}
          </div>
        </div>
      </section>

      {/* Product Catalog — every product verified against the business's own
          real catalog site (see this component's own header comment). No
          pricing anywhere; search/filter/pagination live in
          PinnacleProductGrid. */}
      {products.length > 0 && (
        <section id="catalog" className="py-16 sm:py-24">
          <div className="container-px mx-auto">
            <Reveal>
              <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]"
                  style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.08)`, color: theme.primaryStrong }}
                >
                  {t("catalogEyebrow")}
                </span>
                <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">{t("catalogTitle")}</h2>
              </div>
            </Reveal>
            <PinnacleProductGrid theme={theme} products={products} whatsappNumber={whatsappNumber} locale={locale} />
          </div>
        </section>
      )}

      {/* Featured Brands — the real, verified brand list from Pinnacle's own
          catalog (city_services.brands), not invented. Text-only cards: no
          per-brand logo asset exists for any of these (verified — the source
          site shows brand names only, no brand-logo imagery), so a name-only
          premium chip is the honest representation rather than an invented
          logo. */}
      {brands.length > 0 && (
        <section className="bg-white py-16 dark:bg-white/[0.03] sm:py-24">
          <div className="container-px mx-auto">
            <Reveal>
              <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]"
                  style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.08)`, color: theme.primaryStrong }}
                >
                  {t("brandsEyebrow")}
                </span>
                <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">{t("brandsTitle")}</h2>
              </div>
            </Reveal>
            <div className="flex flex-wrap justify-center gap-2.5">
              {brands.map((brand) => (
                <span
                  key={brand}
                  className="rounded-full border px-4 py-2 text-sm font-semibold"
                  style={{ borderColor: `rgba(${theme.primaryRgb}, 0.15)`, color: theme.primaryStrong }}
                >
                  {brand}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Contact / footer — real, verified Hargeisa contact only (never the
          Tanzania-branch info found on pinnacleperfumes.com's own Contact
          page — see this file's header comment). */}
      <section className="py-16 sm:py-24">
        <div className="container-px mx-auto max-w-xl text-center">
          <Reveal>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]"
              style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.08)`, color: theme.primaryStrong }}
            >
              {t("visitEyebrow")}
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold">{t("visitTitle")}</h2>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {service.phone && (
                <PrimaryButton href={`tel:${service.phone}`} size="md">
                  {th("call")}
                </PrimaryButton>
              )}
              {generalWhatsappHref && (
                <SecondaryButton href={generalWhatsappHref} external size="md">
                  <MessageCircle size={15} aria-hidden="true" />
                  {th("whatsapp")}
                </SecondaryButton>
              )}
              {service.mapsUrl && (
                <SecondaryButton href={service.mapsUrl} external size="md">
                  <MapPin size={15} aria-hidden="true" />
                  {tl("getDirections")}
                </SecondaryButton>
              )}
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
