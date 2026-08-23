import { getTranslations } from "next-intl/server";
import Image from "next/image";
import { Instagram, ShieldAlert, CheckCircle2, HelpCircle, UtensilsCrossed, Images as ImagesIcon, MapPin, Phone, Clock, Star, Camera, MessageCircle } from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { EmptyState } from "@/components/shared/empty-state";
import { PrimaryButton, SecondaryButton } from "@/components/shared/buttons";
import { PartnerAcquisitionCta } from "@/components/shared/partner-acquisition-cta";
import { ProductsSection } from "@/components/shared/products-section";
import { ImageOnlyProductGrid } from "@/components/shared/image-only-product-grid";
import { InstagramPostEmbed } from "@/components/shared/instagram-post-embed";
import { LocationMapSection } from "@/components/shared/location-map-section";
import { VideoGallery } from "@/components/shared/video-gallery";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import type { Locale } from "@/lib/i18n/config";
import type { Restaurant, Product } from "@/types";

const BUSINESS_NAME = "The Village Hargeisa";

// A second Instagram account found during research that also carries this
// business's real logo and (via its linked Facebook Page) the same
// verified phone number — good evidence it's genuinely tied to this
// business too, even though its own bio doesn't call it the official
// account the way @the.village.hargeisa's does. The *primary* account
// (below) now lives on the real `restaurants.social_instagram` column —
// the same generic field any restaurant partner's page reads from — so a
// future partner with only one account needs nothing beyond that; this
// second entry is kept here as a page-specific supplementary fact, not a
// pattern every partner page needs to support.
const SECONDARY_INSTAGRAM_ACCOUNT = { handle: "@thevillagehargeisa", url: "https://www.instagram.com/thevillagehargeisa/" } as const;

// A single confirmed-real, currently-public post from the business's own
// account (found via web search of the account itself, not guessed) —
// embedded via Instagram's own official iframe (InstagramPostEmbed), never
// downloaded/re-hosted. Deliberately just one: adding more requires each
// post URL to be individually re-confirmed still public and still genuinely
// this business's own account before it's added here.
const FEATURED_INSTAGRAM_POST_URL = "https://www.instagram.com/p/DI6RSkEMOaM/";

/**
 * Private concept preview for The Village Hargeisa — mirrors the Flormar
 * preview pattern (see app/[locale]/preview/flormar): a REAL, database-
 * driven `restaurants` row + `products` rows (see lib/data/village-preview.ts),
 * not hardcoded constants. That row is `status: 'draft'`, RLS-invisible to
 * every public/anon read path — the actual privacy mechanism, not just this
 * route being unlinked/noindex (see the page file).
 *
 * `restaurant` currently holds only independently-verified facts (name,
 * location, phone, Google rating); `products` is empty until the business's
 * official menu is confirmed and entered — the Menu section below already
 * renders real `ProductsSection` cards the moment any exist, no code change
 * needed when that happens. What remains genuinely unverified (hours, which
 * single Instagram account is canonical, interior/food photography) is
 * still honestly labeled as such rather than guessed.
 */
export async function TheVillageShowcase({ locale, restaurant, products }: { locale: Locale; restaurant: Restaurant; products: Product[] }) {
  const t = await getTranslations({ locale, namespace: "theVillagePreview" });
  const googleMapsUrl = restaurant.googleMapsUrl ?? `https://www.google.com/maps/search/?api=1&query=${restaurant.location.lat},${restaurant.location.lng}`;
  const whatsappHref = restaurant.whatsapp
    ? toWhatsAppHref(restaurant.whatsapp, "Hello The Village Hargeisa \u{1F44B} I found you on Go Hargeisa and would like to ask about today's menu and availability.")
    : undefined;

  // Primary account comes from the restaurant's own real `social_instagram`
  // column — the generic field every restaurant partner page reads from —
  // so this list degrades correctly to just one entry for a partner with
  // only one known account. The secondary entry is this page's own
  // supplementary research finding (see SECONDARY_INSTAGRAM_ACCOUNT above).
  const instagramAccounts = [
    ...(restaurant.socialInstagram ? [{ handle: `@${new URL(restaurant.socialInstagram).pathname.replaceAll("/", "")}`, url: restaurant.socialInstagram }] : []),
    SECONDARY_INSTAGRAM_ACCOUNT,
  ];

  return (
    <>
      <div className="border-b-4 border-dashed border-amber-400 bg-amber-50 px-5 py-3 text-center dark:bg-amber-950/20">
        <p className="text-xs font-bold uppercase tracking-[0.15em] text-amber-700 dark:text-amber-400">{t("previewBadge")}</p>
      </div>

      {/* Hero — the business's own verified logo (confirmed identical across
          both of its Instagram accounts, see instagramAccounts below) on a
          branded gradient, rather than any of the scraped
          supplier/social *photos* found during research: this project has
          no rights to publish those, and several may not even belong to
          this business. The logo itself is different — it's the business's
          own public brand mark, sourced directly from their official
          account, not a menu/interior photo. */}
      <div className="relative flex h-[42vh] max-h-[420px] min-h-[260px] w-full items-center justify-center overflow-hidden bg-gradient-to-br from-primary-800 via-primary-700 to-ink sm:h-[50vh] sm:max-h-[480px]">
        <div
          aria-hidden="true"
          className="absolute inset-0 opacity-[0.08]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1.5px)", backgroundSize: "22px 22px" }}
        />
        <div className="relative flex flex-col items-center gap-4 px-6 text-center">
          <span className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-full bg-white ring-1 ring-white/25 backdrop-blur-sm sm:h-32 sm:w-32">
            <Image src="/images/partners/the-village/logo.jpg" alt={`${BUSINESS_NAME} logo`} width={150} height={150} className="h-full w-full object-cover" />
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-xs font-semibold text-white/85 backdrop-blur-sm">
            <Camera size={12} aria-hidden="true" />
            {t("photosComingSoonLabel")}
          </span>
        </div>
      </div>

      <div className="container-px mx-auto flex flex-col items-center pt-8 text-center">
        <h1 className="text-balance font-display text-3xl font-bold sm:text-4xl lg:text-5xl">{BUSINESS_NAME}</h1>
        <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full border border-amber-400/60 bg-amber-400/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
          <ShieldAlert size={12} aria-hidden="true" />
          {t("previewBannerTitle")}
        </span>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-ink/65 dark:text-sand/65">{t("heroDescription")}</p>

        {restaurant.rating > 0 && (
          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-ink/12 bg-white px-3.5 py-1.5 text-xs font-semibold transition-colors hover:border-primary dark:border-white/15 dark:bg-white/[0.03]"
          >
            <Star size={13} className="fill-amber-400 text-amber-400" aria-hidden="true" />
            {restaurant.rating.toFixed(1)} · {restaurant.reviewCount} {t("googleReviewsLabel")}
          </a>
        )}

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <PrimaryButton href="#menu" size="md">
            <UtensilsCrossed size={15} aria-hidden="true" />
            {t("viewMenuCta")}
          </PrimaryButton>
          {whatsappHref && (
            <SecondaryButton href={whatsappHref} external size="md">
              <MessageCircle size={15} aria-hidden="true" />
              {t("contactCta")}
            </SecondaryButton>
          )}
        </div>
      </div>

      {/* MENU — the main offering, immediately after the hero (per the
          Premium Partner Showcase direction: the actual product/menu must
          be the star, not buried below verification/fact blocks). Renders
          real ProductsSection cards the moment `products` has any real
          rows (the business's official menu, entered exactly as provided —
          see lib/data/village-preview.ts); until then, an honest, premium
          "Coming Soon" treatment — not a plain empty box — with a real
          WhatsApp CTA. */}
      <div className="container-px mx-auto pt-10">
        <Reveal>
          <section
            id="menu"
            aria-labelledby="menu-heading"
            className="scroll-mt-36 rounded-xl3 border border-primary/15 bg-gradient-to-b from-primary/[0.05] to-transparent p-6 sm:p-10"
          >
            <div className="mx-auto mb-6 max-w-xl text-center">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-primary">{t("menuEyebrow")}</span>
              <h2 id="menu-heading" className="font-display text-2xl font-semibold sm:text-3xl">
                {t("viewMenuCta")}
              </h2>
            </div>
            {products.length > 0 ? (
              <ProductsSection
                products={products}
                storeName={restaurant.name}
                business={{
                  listingType: "restaurant",
                  listingId: restaurant.id,
                  businessName: restaurant.name,
                  deliveryEnabled: false,
                  addons: [],
                  whatsapp: restaurant.whatsapp,
                }}
                locale={locale}
              />
            ) : (
              <EmptyState icon={UtensilsCrossed} title={t("menuComingSoonTitle")} description={t("menuComingSoonBody")} />
            )}
          </section>
        </Reveal>
      </div>

      <Reveal>
        <div className="container-px mx-auto mt-10 max-w-2xl rounded-xl3 border border-amber-400/40 bg-amber-50/60 p-5 text-sm leading-relaxed text-ink/75 dark:border-amber-400/25 dark:bg-amber-950/10 dark:text-sand/75 sm:p-6">
          <p className="mb-1 flex items-center gap-2 font-display text-base font-bold text-amber-700 dark:text-amber-400">
            <ShieldAlert size={16} aria-hidden="true" />
            {t("previewBannerTitle")}
          </p>
          <p>{t("previewBannerBody")}</p>
        </div>
      </Reveal>

      <div className="container-px mx-auto grid gap-10 py-12 lg:grid-cols-2 lg:gap-12">
        {/* Verified */}
        <Reveal>
          <section aria-labelledby="verified-heading">
            <h2 id="verified-heading" className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-green-700 dark:text-green-400">
              <CheckCircle2 size={19} aria-hidden="true" />
              {t("verifiedFactsTitle")}
            </h2>
            <div className="space-y-3">
              <div className="rounded-xl2 border border-green-600/20 bg-green-600/5 p-4 dark:border-green-400/20 dark:bg-green-400/[0.06]">
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 text-sm font-semibold hover:underline"
                >
                  <MapPin size={15} className="mt-0.5 shrink-0 text-green-700 dark:text-green-400" aria-hidden="true" />
                  {t("verifiedNeighborhood")}
                </a>
                <p className="mt-2 text-xs text-ink/50 dark:text-sand/50">{t("verifiedLocationNote")}</p>
              </div>

              {restaurant.phone && (
                <div className="rounded-xl2 border border-green-600/20 bg-green-600/5 p-4 dark:border-green-400/20 dark:bg-green-400/[0.06]">
                  <a href={`tel:${restaurant.phone.replace(/\s/g, "")}`} className="flex items-center gap-2 text-sm font-semibold hover:underline">
                    <Phone size={15} className="shrink-0 text-green-700 dark:text-green-400" aria-hidden="true" />
                    {restaurant.phone}
                  </a>
                  <p className="mt-2 text-xs text-ink/50 dark:text-sand/50">{t("verifiedPhoneNote")}</p>
                </div>
              )}

              <div className="rounded-xl2 border border-green-600/20 bg-green-600/5 p-4 dark:border-green-400/20 dark:bg-green-400/[0.06]">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <ShieldAlert size={15} className="shrink-0 text-green-700 dark:text-green-400" aria-hidden="true" />
                  {t("verifiedLogoTitle")}
                </p>
                <p className="mt-2 text-xs text-ink/50 dark:text-sand/50">{t("verifiedLogoNote")}</p>
              </div>
            </div>
          </section>
        </Reveal>

        {/* Pending verification */}
        <Reveal delay={0.05}>
          <section aria-labelledby="pending-heading" id="contact">
            <h2 id="pending-heading" className="mb-4 flex items-center gap-2 font-display text-xl font-semibold text-amber-700 dark:text-amber-400">
              <HelpCircle size={19} aria-hidden="true" />
              {t("pendingFactsTitle")}
            </h2>
            <div className="space-y-3">
              <div className="rounded-xl2 border border-ink/8 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <Clock size={14} className="text-ink/50 dark:text-sand/50" aria-hidden="true" />
                  {t("pendingHoursTitle")}
                </p>
                <p className="mt-1.5 text-xs text-ink/60 dark:text-sand/60">{t("pendingHoursNote")}</p>
              </div>

              <div className="rounded-xl2 border border-ink/8 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
                <p className="flex items-center gap-2 text-sm font-semibold">
                  <MessageCircle size={14} className="text-ink/50 dark:text-sand/50" aria-hidden="true" />
                  {t("pendingEmailTitle")}
                </p>
                <p className="mt-1.5 text-xs text-ink/60 dark:text-sand/60">{t("pendingEmailNote")}</p>
              </div>
            </div>
          </section>
        </Reveal>
      </div>

      {/* Experience The Village — the real visual content this page can
          honestly show today. We have no distribution rights to download
          and re-host the business's Instagram photos (see
          instagram-post-embed.tsx), so the flagship visual here is
          Instagram's own official post embed — real content, served by
          Instagram itself, not scraped. Account cards below link straight
          to the verified profiles for everything beyond this one post. */}
      <div className="container-px mx-auto pb-14">
        <Reveal>
          <section aria-labelledby="experience-heading">
            <div className="mx-auto mb-6 max-w-xl text-center">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-primary">{t("experienceEyebrow")}</span>
              <h2 id="experience-heading" className="font-display text-2xl font-semibold sm:text-3xl">
                {t("experienceTitle")}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-ink/65 dark:text-sand/65">{t("experienceBody")}</p>
            </div>

            <div className="mx-auto grid max-w-4xl gap-6 sm:grid-cols-[1.1fr_0.9fr]">
              <InstagramPostEmbed url={FEATURED_INSTAGRAM_POST_URL} caption={t("featuredPostCaption")} />

              <div className="flex flex-col gap-3">
                {instagramAccounts.map((acc) => (
                  <a
                    key={acc.handle}
                    href={acc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-xl2 border border-ink/12 bg-white px-4 py-3.5 text-sm transition-colors hover:border-primary dark:border-white/15 dark:bg-white/[0.03]"
                  >
                    <Instagram size={18} className="shrink-0 text-ink/50 dark:text-sand/50" aria-hidden="true" />
                    <span className="font-semibold">{acc.handle}</span>
                  </a>
                ))}
                <div className="rounded-xl2 border border-ink/8 bg-ink/[0.02] p-4 text-xs leading-relaxed text-ink/55 dark:border-white/10 dark:bg-white/[0.02] dark:text-sand/55">
                  {t("socialsNote")}
                </div>
              </div>
            </div>
          </section>
        </Reveal>
      </div>

      {/* Gallery — renders real photos the moment restaurant.gallery has
          any (added the same way as any other listing's gallery, via the
          real DB row — see lib/data/village-preview.ts); until then, an
          honest "coming soon" rather than a scraped/unverified photo. */}
      <div className="container-px mx-auto pb-14">
        <Reveal>
          <section aria-labelledby="gallery-heading">
            <h2 id="gallery-heading" className="mb-5 font-display text-2xl font-semibold">
              {t("galleryTitle")}
            </h2>
            {restaurant.gallery.length > 0 ? (
              <ImageOnlyProductGrid images={restaurant.gallery.map((g) => g.url)} alt={restaurant.name} />
            ) : (
              <EmptyState icon={ImagesIcon} title={t("galleryTitle")} description={t("galleryComingSoonBody")} />
            )}
          </section>
        </Reveal>
      </div>

      {/* Videos — reuses the same VideoGallery every hotel/restaurant/cafe
          page already uses (components/shared/video-gallery.tsx). Renders
          nothing today since restaurant.videos is empty (no rights-cleared
          video exists yet) — the moment a real video URL is added to this
          DB row, it appears here automatically, no further code change. */}
      {restaurant.videos && restaurant.videos.length > 0 && (
        <div className="container-px mx-auto pb-14">
          <Reveal>
            <section aria-labelledby="videos-heading">
              <h2 id="videos-heading" className="mb-5 font-display text-2xl font-semibold">
                {t("videosTitle")}
              </h2>
              <VideoGallery videos={restaurant.videos} />
            </section>
          </Reveal>
        </div>
      )}

      {/* Location — the same reusable map section every other listing type
          uses (hotels/restaurants/cafes/etc), not a bespoke one-off. */}
      <div className="container-px mx-auto pb-14">
        <LocationMapSection locale={locale} address={restaurant.address} coords={restaurant.location} mapsHref={googleMapsUrl} name={restaurant.name} />
      </div>

      {/* Final CTA — only the buttons backed by real, verified data render;
          no fabricated "Book a table" or similar when that info doesn't
          exist yet. */}
      <Reveal>
        <section className="container-px mx-auto pb-14 text-center">
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">{t("finalCtaTitle")}</h2>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            {products.length > 0 && (
              <PrimaryButton href="#menu" size="md">
                <UtensilsCrossed size={15} aria-hidden="true" />
                {t("viewMenuCta")}
              </PrimaryButton>
            )}
            <SecondaryButton href={googleMapsUrl} external size="md">
              <MapPin size={15} aria-hidden="true" />
              {t("getDirectionsCta")}
            </SecondaryButton>
            {restaurant.phone && (
              <SecondaryButton href={`tel:${restaurant.phone.replace(/\s/g, "")}`} size="md">
                <Phone size={15} aria-hidden="true" />
                {t("callCta")}
              </SecondaryButton>
            )}
            <SecondaryButton href={instagramAccounts[0].url} external size="md">
              <Instagram size={15} aria-hidden="true" />
              {t("visitSocialCta")}
            </SecondaryButton>
          </div>
        </section>
      </Reveal>

      {/* Conversion — reuses the real, live /join flow, not a fabricated
          restaurant-specific pitch. */}
      <section className="border-t border-ink/8 bg-white py-6 text-center dark:border-white/10 dark:bg-white/[0.03]">
        <p className="font-display text-lg font-bold">{t("conversionTitle")}</p>
        <p className="mx-auto mt-1.5 max-w-lg text-sm text-ink/65 dark:text-sand/65">{t("conversionBody")}</p>
      </section>
      <PartnerAcquisitionCta locale={locale} />
    </>
  );
}
