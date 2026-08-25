import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ShoppingCart, MapPin, Phone as PhoneIcon, Smartphone, ShoppingBag } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getCityServiceBySlug, getCityServicesGroupedByCategory } from "@/lib/data/city-services";
import { getCategoryById } from "@/lib/data/categories";
import { getProductsForListing } from "@/lib/data/products";
import { ProductsSection } from "@/components/shared/products-section";
import { getMyReviewForListing } from "@/lib/data/reviews";
import { isListingFavorited } from "@/lib/data/favorites";
import { HotelHeaderTop } from "@/components/shared/hotel-header-top";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { EmptyState } from "@/components/shared/empty-state";
import { SocialLinks } from "@/components/shared/social-links";
import { ReviewsSection } from "@/components/shared/reviews-section";
import { ReviewForm } from "@/components/shared/review-form";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { ShareButton } from "@/components/shared/share-button";
import { CityServiceCard } from "@/components/shared/city-service-card";
import { SecondaryButton, PrimaryButton } from "@/components/shared/buttons";
import { resolveMapsUrl } from "@/lib/utils/google-maps";
import { LocationMapSection } from "@/components/shared/location-map-section";
import { Reveal } from "@/components/home/reveal";
import { safeJsonLd } from "@/lib/utils/json-ld";
import { categoryDisplayName } from "@/lib/utils/category-href";
import { PartnerStatusSection } from "@/components/shared/partner/partner-status-section";
import { MobileBookingBar } from "@/components/shared/mobile-booking-bar";

// Same reasoning as every other listing page in this codebase: content
// changes infrequently, so ISR beats rendering on every request.
export const revalidate = 3600;

// The official Waafi Market customer app — verified to exist at this exact
// package ID (Google Play page loads, real "Waafi Market" listing, not the
// separate "Waafi Market Seller" app). Never invented; hardcoded here
// rather than in the DB since it's the one genuinely static fact about a
// specific third-party app listing, not business data that changes.
const WAAFI_PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=com.waafimarket.userapp";

/**
 * Waafi Market's real, verified location — cross-checked against two
 * independent public sources (both put it on Jigjiga Yar Road, Hargeisa).
 * Display-only, same override-without-a-DB-write pattern already used for
 * Lavender Café/Flowers — city_services has no generic `address` text
 * column, and no precise coordinates were verified, so this is text only;
 * the map/coords below correctly stay unset rather than guessed.
 */
const WAAFI_MARKET_ADDRESS: Record<Locale, string> = {
  en: "Jigjiga Yar Road, Hargeisa, Somaliland",
  ar: "طريق جيجيغا يار، هرجيسا، صوماليلاند",
  so: "Jidka Jigjiga Yar, Hargeysa, Somaliland",
};

/**
 * Supermarket store page — a dedicated route (like /flowers/[slug]) rather
 * than a bespoke storefront component (like Flormar/Pinnacle): Waafi Market
 * currently has no verified logo, hero photo, hours, or product catalog, so
 * a from-scratch storefront would be mostly empty chrome. This route
 * instead assembles the SAME shared components the generic
 * /city-services/[slug] page already uses (HotelHeaderTop, ProductsSection
 * + EmptyState, LocationMapSection, ReviewsSection, PartnerStatusSection),
 * plus the handful of things genuinely specific to a supermarket
 * (Shop Products / Get Directions / Contact hero CTAs, an official-app
 * section). Reads the exact same `city_services` row and real `products`
 * table the generic page and universal cart already use — no new listing
 * type, no new cart/checkout system. See lib/config/categories: the
 * `supermarket` category (target_table='city_services',
 * schema_org_type='GroceryStore') already existed, dormant, before this
 * page — only activated (is_active/supports_products/supports_gallery),
 * never redesigned.
 */
export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}): Promise<Metadata> {
  const service = await getCityServiceBySlug(slug, locale);
  if (!service) return {};
  return {
    title: `${service.name} — Supermarket in Hargeisa`,
    description: service.description ?? undefined,
    openGraph: service.image ? { images: [service.image] } : undefined,
    alternates: localeAlternates(locale, `/supermarkets/${service.slug}`),
  };
}

export default async function SupermarketDetailPage({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}) {
  const service = await getCityServiceBySlug(slug, locale);
  if (!service) notFound();

  const category = await getCategoryById(service.categoryId);
  if (!category || category.targetTable !== "city_services" || !category.supportsProducts) notFound();

  const t = await getTranslations("common");
  const td = await getTranslations("detail");
  const tp = await getTranslations("products");
  const tl = await getTranslations("listings");
  const tNav = await getTranslations("nav");
  const thome = await getTranslations("home");

  const [myReview, isFavorited, allGroups, products] = await Promise.all([
    getMyReviewForListing("city_service", service.id),
    isListingFavorited("city_service", service.id),
    getCityServicesGroupedByCategory(locale),
    getProductsForListing(service.id),
  ]);

  const moreSupermarkets = (allGroups.find((g) => g.category.id === service.categoryId)?.items ?? [])
    .filter((s) => s.id !== service.id)
    .slice(0, 4);

  const categoryLabel = categoryDisplayName(category, locale);
  const googleMapsHref = resolveMapsUrl(service.coords, service.mapsUrl);
  const showProducts = products.length > 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": category.schemaOrgType ?? "GroceryStore",
    name: service.name,
    description: service.description ?? undefined,
    image: service.image ?? undefined,
    telephone: service.phone ?? undefined,
    url: `https://gohargeisa.com/${locale}/supermarkets/${service.slug}`,
    ...(service.reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: service.rating, reviewCount: service.reviewCount } }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <Breadcrumbs
        items={[
          { label: tNav("supermarketLabel"), href: `/${locale}/supermarket` },
          { label: service.name, href: `/${locale}/supermarkets/${service.slug}` },
        ]}
      />

      <HotelHeaderTop
        logo={service.logoUrl}
        name={service.name}
        rating={service.rating}
        reviewCount={service.reviewCount}
        categoryLabel={categoryLabel}
        showRating={service.reviewCount > 0}
        locale={locale}
        isPartner={service.isPartner}
        fallbackIcon={category.icon}
        fallbackColor={category.color}
        logoFit="contain"
      />

      <Reveal delay={0.05}>
        <div className="container-px mx-auto mt-6 flex flex-wrap items-center justify-center gap-3">
          {showProducts && (
            <PrimaryButton href="#shop" size="sm">
              <ShoppingBag size={15} aria-hidden="true" />
              {td("shopProducts")}
            </PrimaryButton>
          )}
          {googleMapsHref && (
            <SecondaryButton href={googleMapsHref} external size="sm">
              <MapPin size={15} aria-hidden="true" />
              {tl("getDirections")}
            </SecondaryButton>
          )}
          {service.phone && (
            <SecondaryButton href={`tel:${service.phone}`} size="sm">
              <PhoneIcon size={15} aria-hidden="true" />
              {t("contactUs")}
            </SecondaryButton>
          )}
        </div>
      </Reveal>

      <SocialLinks
        instagram={service.socialInstagram}
        facebook={service.socialFacebook}
        tiktok={service.socialTiktok}
        snapchat={service.socialSnapchat}
        x={service.socialX}
        youtube={service.socialYoutube}
        telegram={service.socialTelegram}
        labels={{
          instagram: td("followInstagram"),
          facebook: td("followFacebook"),
          tiktok: td("followTiktok"),
          snapchat: td("followSnapchat"),
          x: td("followX"),
          youtube: td("followYoutube"),
          telegram: td("followTelegram"),
        }}
        className="container-px mx-auto mt-3 justify-center"
      />

      {/* SHOP — the main feature. Honest empty state until Waafi Market
          provides a real, verified product catalog (see the import script
          this page's data layer is ready for) — never fabricated products. */}
      <Reveal>
        <section
          id="shop"
          aria-labelledby="shop-heading"
          className="scroll-mt-36 border-t border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-white/[0.03] sm:py-20"
        >
          <div className="container-px mx-auto">
            <div className="mx-auto mb-8 max-w-2xl text-center">
              <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-primary">{tp("shopEyebrow")}</span>
              <h2 id="shop-heading" className="font-display text-2xl font-semibold sm:text-3xl">
                {tp("shopSectionTitle", { store: service.name })}
              </h2>
            </div>
            {showProducts ? (
              <ProductsSection
                products={products}
                storeName={service.name}
                business={{
                  listingType: "city_service",
                  listingId: service.id,
                  businessName: service.name,
                  deliveryEnabled: false,
                  addons: [],
                }}
                locale={locale}
              />
            ) : (
              <EmptyState
                icon={ShoppingCart}
                title={tp("shopComingSoonTitle")}
                description={td("catalogComingSoonBody", { store: service.name })}
                action={
                  service.phone ? (
                    <a
                      href={`tel:${service.phone}`}
                      className="inline-flex items-center gap-2 rounded-full bg-primary-700 px-5 py-2.5 text-sm font-bold text-white transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-800 active:scale-95"
                    >
                      <PhoneIcon size={16} aria-hidden="true" />
                      {t("contactUs")}
                    </a>
                  ) : undefined
                }
              />
            )}
          </div>
        </section>
      </Reveal>

      {/* SHOP WITH THE OFFICIAL APP — verified Google Play link only, never
          claims a real Waafi Market order can be placed through Go Hargeisa
          unless a real ordering integration exists (it doesn't yet). */}
      <Reveal>
        <section className="border-t border-ink/8 py-14 dark:border-white/10 sm:py-20">
          <div className="container-px mx-auto max-w-2xl text-center">
            <span className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary-700">
              <Smartphone size={22} aria-hidden="true" />
            </span>
            <h2 className="font-display text-2xl font-semibold sm:text-3xl">{td("shopWithAppTitle")}</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink/65 dark:text-sand/65 sm:text-base">{td("shopWithAppBody")}</p>
            <div className="mt-6">
              <PrimaryButton href={WAAFI_PLAY_STORE_URL} external size="lg">
                {thome("appPromoGetItOnGooglePlay") /* reused verbatim from the homepage app-promo copy */}
              </PrimaryButton>
            </div>
          </div>
        </section>
      </Reveal>

      <div className="container-px mx-auto grid gap-10 py-10 lg:grid-cols-3 lg:gap-12">
        <div className="lg:col-span-2 space-y-14">
          {service.description && (
            <Reveal>
              <section id="overview" aria-labelledby="overview-heading" className="scroll-mt-36">
                <h2 id="overview-heading" className="mb-5 font-display text-2xl font-semibold">
                  {td("overview")}
                </h2>
                <p className="leading-relaxed text-ink/75 dark:text-sand/75">{service.description}</p>
              </section>
            </Reveal>
          )}

          <LocationMapSection
            locale={locale}
            address={WAAFI_MARKET_ADDRESS[locale]}
            coords={service.coords}
            mapsHref={googleMapsHref}
            name={service.name}
          />

          <Reveal>
            <section id="reviews" aria-labelledby="reviews-heading" className="scroll-mt-36">
              <h2 id="reviews-heading" className="mb-5 font-display text-2xl font-semibold">
                {t("reviews")}
              </h2>
              <ReviewsSection
                rating={service.rating}
                reviewCount={service.reviewCount}
                reviews={service.reviews}
                locale={locale}
                pathToRevalidate={`/${locale}/supermarkets/${service.slug}`}
              />
              <div className="mt-6">
                <ReviewForm
                  key={myReview?.id ?? "new"}
                  listingType="city_service"
                  listingId={service.id}
                  locale={locale}
                  pathToRevalidate={`/${locale}/supermarkets/${service.slug}`}
                  allowPhotos
                  existingReview={myReview}
                />
              </div>
            </section>
          </Reveal>
        </div>

        <aside className="h-fit space-y-3 rounded-xl3 border border-ink/8 p-6 shadow-card dark:border-white/10 lg:sticky lg:top-24">
          <ShareButton title={service.name} />
          <FavoriteButton
            listingType="city_service"
            listingId={service.id}
            locale={locale}
            initiallyFavorited={isFavorited}
            count={service.favoriteCount}
            showSpinner={false}
            size={15}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-ink/15 py-3 text-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary dark:border-white/20 dark:text-white"
            addLabel={tl("addToFavorites", { name: service.name })}
            removeLabel={tl("removeFromFavorites", { name: service.name })}
          />
        </aside>
      </div>

      {moreSupermarkets.length > 0 && (
        <section className="border-t border-ink/8 bg-white py-14 dark:border-white/10 dark:bg-white/[0.03] sm:py-20">
          <div className="container-px mx-auto">
            <Reveal>
              <h2 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">{td("moreSupermarketsTitle")}</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {moreSupermarkets.map((s) => (
                  <CityServiceCard key={s.id} service={s} category={category} locale={locale} />
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      <PartnerStatusSection
        isPartner={service.isPartner}
        logoUrl={service.logoUrl}
        businessName={service.name}
        locale={locale}
      />

      <MobileBookingBar
        listingType="city_service"
        listingId={service.id}
        name={service.name}
        phone={service.phone ?? undefined}
        locale={locale}
        initiallyFavorited={isFavorited}
      />
    </>
  );
}
