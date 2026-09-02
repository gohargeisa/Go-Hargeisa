import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { safeJsonLd } from "@/lib/utils/json-ld";
import { Phone, Instagram, CalendarCheck, UtensilsCrossed } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Restaurant, Product, Review, BusinessOffer } from "@/types";
import { Reveal } from "@/components/home/reveal";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ViewTracker } from "@/components/shared/view-tracker";
import { MobileBookingBar } from "@/components/shared/mobile-booking-bar";
import { TableReservationButton } from "@/components/shared/table-reservation-button";
import { FavoriteButton } from "@/components/shared/favorite-button";
import { ReviewsSection } from "@/components/shared/reviews-section";
import { ReviewForm } from "@/components/shared/review-form";
import { ListingOffersSection } from "@/components/shared/listing-offers-section";
import { LocationMapSection } from "@/components/shared/location-map-section";
import { WhatsAppIcon, TikTokIcon } from "@/components/shared/brand-icons";
import { resolveMapsUrl } from "@/lib/utils/google-maps";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import type { AddToCartBusiness } from "@/lib/cart/cart-context";
import { THE_VILLAGE_DISH_DESCRIPTIONS } from "@/lib/config/the-village-menu-details";
import { VillageHero } from "./village-hero";
import { VillageMenu } from "./village-menu";
import { VillageSignatureSelection } from "./village-signature-selection";
import { VillageExperienceStories } from "./village-experience-stories";
import { VillageStickyBar } from "./village-sticky-bar";

const REAL_IMAGE_PREFIX =
  "https://pvzuibidhfuizmaleznx.supabase.co/storage/v1/object/public/listing-images/restaurants/the-village-hargeisa/";

// The Village Hargeisa's own TikTok profile, supplied by the restaurant.
// Not yet stored in restaurants.social_tiktok (this pass makes no
// production DB write); surfaced scoped to this page only, the same
// pattern as VILLAGE_SECONDARY_INSTAGRAM in restaurants/[slug]/page.tsx.
// If social_tiktok is later populated in the DB it takes precedence (see
// the Contact section below).
const VILLAGE_TIKTOK = { handle: "@thevillageharg", url: "https://www.tiktok.com/@thevillageharg" };

// "Dishes Worth Trying" (signatureHeading) is auto-filled from the menu
// items that carry a genuine, Village-owned photograph. Two deliberate,
// display-time-only adjustments (no DB write):
//   • exclude "Hummus with Chicken Shawarma" — the same sandwich family as
//     "Meat Shawarma on Saj Bread", already shown.
//   • lead with "Shiish Kebab" so the Grills (Mediterranean BBQ) section
//     is represented (it already has a real photo, so the card stays a
//     photo card, not a placeholder).
const SIGNATURE_EXCLUDE = new Set(["Hummus with Chicken Shawarma"]);
const SIGNATURE_LEAD = ["Shiish Kebab"];

const ORIGINAL_MENU_IMAGES = [
  { src: "/images/partners/the-village/menu/menu-1-pizza-pasta-manakeesh.jpg", page: 1 },
  { src: "/images/partners/the-village/menu/menu-2-shawarma-sandwiches-burgers.jpg", page: 2 },
  { src: "/images/partners/the-village/menu/menu-3-breakfast-sides.jpg", page: 3 },
  { src: "/images/partners/the-village/menu/menu-4-grills.jpg", page: 4 },
];

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-primary-700 dark:text-primary-300">
      {children}
    </span>
  );
}

/**
 * The Village Hargeisa — dedicated premium restaurant experience. Rendered
 * ONLY for slug `the-village-hargeisa` (see restaurants/[slug]/page.tsx);
 * every other restaurant keeps the shared layout untouched. Reuses the
 * shared cart / ProductDetailModal / TableReservationButton / reviews /
 * favourites / map stack — no parallel systems.
 */
export async function TheVillageExperience({
  locale,
  restaurant,
  products,
  offers,
  myReview,
  isFavorited,
  whatsappFallback,
}: {
  locale: Locale;
  restaurant: Restaurant;
  products: Product[];
  offers: BusinessOffer[];
  myReview: Review | null;
  isFavorited: boolean;
  whatsappFallback?: string;
}) {
  const t = await getTranslations({ locale, namespace: "theVillage" });
  const tc = await getTranslations({ locale, namespace: "common" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  const td = await getTranslations({ locale, namespace: "detail" });
  const tl = await getTranslations({ locale, namespace: "listings" });

  const mapsHref =
    resolveMapsUrl(restaurant.location, restaurant.googleMapsUrl) ??
    `https://www.google.com/maps/search/?api=1&query=${restaurant.location.lat},${restaurant.location.lng}`;
  const telHref = restaurant.phone ? `tel:${restaurant.phone.replace(/\s/g, "")}` : undefined;
  const whatsappHref = restaurant.whatsapp ? toWhatsAppHref(restaurant.whatsapp, t("whatsappGreeting")) : undefined;
  const instagramUrl = restaurant.socialInstagram;
  const instagramHandle = instagramUrl
    ? `@${new URL(instagramUrl).pathname.replace(/\//g, "")}`
    : undefined;
  // Prefer a real DB value if one is ever set; otherwise the Village-owned
  // profile const above. Handle is derived from the URL path (which for
  // TikTok already contains the leading "@").
  const tiktokUrl = restaurant.socialTiktok || VILLAGE_TIKTOK.url;
  const tiktokHandle = `@${new URL(tiktokUrl).pathname.replace(/[/@]/g, "")}`;
  const pathToRevalidate = `/${locale}/restaurants/${restaurant.slug}`;

  const business: AddToCartBusiness = {
    listingType: "restaurant",
    listingId: restaurant.id,
    businessName: restaurant.name,
    deliveryEnabled: Boolean(restaurant.productsDeliveryEnabled),
    addons: [],
    whatsapp: restaurant.whatsapp,
  };

  // The stored description ends with an hours-status disclaimer; opening
  // hours are deliberately omitted from this page entirely (no section, no
  // "call ahead" line), so that one trailing sentence is trimmed at render
  // — the rest of the real description is shown verbatim. No DB write.
  const introDescription = restaurant.description
    .replace(/\s*Opening hours have not yet been confirmed[^.]*\.\s*$/i, "")
    .trim();

  const hasAuthenticImage = (p: Product) => Boolean(p.image?.startsWith(REAL_IMAGE_PREFIX));

  // Two display-time transforms, neither a DB write:
  //  1. non-authentic `image` dropped — the menu is text-first, only genuine
  //     Village photography is ever shown (Wikipedia/Unsplash/Pexels
  //     placeholders would misrepresent the restaurant's own food).
  //  2. a verified description filled in from the restaurant's printed menu
  //     (THE_VILLAGE_DISH_DESCRIPTIONS) — only where the DB has none, exactly
  //     the FLORMAR_PRODUCT_DESCRIPTIONS pattern. Existing DB descriptions
  //     win.
  const menuProducts: Product[] = products.map((p) => {
    const verifiedDescription = !p.description ? THE_VILLAGE_DISH_DESCRIPTIONS[p.name] : undefined;
    return {
      ...p,
      ...(hasAuthenticImage(p) ? null : { image: undefined, gallery: [] }),
      ...(verifiedDescription ? { description: verifiedDescription } : null),
    };
  });

  // Signature Selection uses the same enriched products, keeping only those
  // with genuine Village photography (their real image survives the
  // transform above), minus SIGNATURE_EXCLUDE, with SIGNATURE_LEAD pulled
  // to the front — see those consts' comment.
  const signatureProducts = menuProducts
    .filter((p) => !p.isHidden && hasAuthenticImage(p) && !SIGNATURE_EXCLUDE.has(p.name))
    .sort((a, b) => {
      const la = SIGNATURE_LEAD.indexOf(a.name);
      const lb = SIGNATURE_LEAD.indexOf(b.name);
      if (la !== lb) return (la === -1 ? 99 : la) - (lb === -1 ? 99 : lb);
      return Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder;
    })
    .slice(0, 6);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    description: restaurant.shortDescription,
    image: restaurant.coverImage,
    logo: restaurant.logo,
    address: { "@type": "PostalAddress", streetAddress: restaurant.address, addressLocality: "Hargeisa", addressCountry: "Somaliland" },
    geo: { "@type": "GeoCoordinates", latitude: restaurant.location.lat, longitude: restaurant.location.lng },
    telephone: restaurant.phone,
    servesCuisine: restaurant.cuisine,
    priceRange: restaurant.priceRange,
    hasMenu: `${pathToRevalidate}#menu`,
    ...(instagramUrl || tiktokUrl
      ? { sameAs: [instagramUrl, tiktokUrl].filter(Boolean) }
      : {}),
    ...(restaurant.reviewCount > 0
      ? { aggregateRating: { "@type": "AggregateRating", ratingValue: restaurant.rating, reviewCount: restaurant.reviewCount } }
      : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />
      <ViewTracker listingType="restaurant" listingId={restaurant.id} />

      <Breadcrumbs
        items={[
          { label: tNav("restaurants"), href: `/${locale}/restaurants` },
          { label: restaurant.name, href: pathToRevalidate },
        ]}
      />

      <VillageHero restaurant={restaurant} locale={locale} mapsHref={mapsHref} />

      {/* Introduction — asymmetric editorial */}
      <section className="container-px mx-auto max-w-6xl py-16 sm:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-16">
          {restaurant.coverImage && (
            <Reveal>
              <div className="relative mx-auto aspect-[4/5] w-full max-w-sm overflow-hidden rounded-xl border border-ink/10 lg:mx-0 lg:max-w-none dark:border-white/10">
                <Image
                  src={restaurant.coverImage}
                  alt={restaurant.name}
                  fill
                  sizes="(max-width: 1023px) 90vw, 40vw"
                  className="object-cover"
                />
              </div>
            </Reveal>
          )}
          <Reveal delay={0.05}>
            <div>
              <SectionEyebrow>{t("introEyebrow")}</SectionEyebrow>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t("introHeading")}</h2>
              <p dir="auto" className="mt-5 leading-relaxed text-ink/75 dark:text-sand/75">{introDescription}</p>

              <dl className="mt-8 grid gap-px overflow-hidden rounded-xl border border-ink/10 bg-ink/10 dark:border-white/10 dark:bg-white/10 sm:grid-cols-3">
                <div className="bg-white p-4 dark:bg-ink">
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-ink/45 dark:text-sand/45">{t("cuisineLabel")}</dt>
                  <dd className="mt-1 text-sm font-medium">{restaurant.cuisine.join(" · ")}</dd>
                </div>
                <div className="bg-white p-4 dark:bg-ink">
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-ink/45 dark:text-sand/45">{t("priceLabel")}</dt>
                  <dd className="mt-1 text-sm font-medium">{restaurant.priceRange}</dd>
                </div>
                <div className="bg-white p-4 dark:bg-ink">
                  <dt className="text-[11px] font-bold uppercase tracking-wide text-ink/45 dark:text-sand/45">{t("neighbourhoodLabel")}</dt>
                  <dd className="mt-1 text-sm font-medium">Sha'ab Area</dd>
                </div>
              </dl>

              <div className="mt-6">
                <FavoriteButton
                  listingType="restaurant"
                  listingId={restaurant.id}
                  locale={locale}
                  initiallyFavorited={isFavorited}
                  count={restaurant.favoriteCount}
                  redirectPath={pathToRevalidate}
                  addLabel={tl("addToFavorites", { name: restaurant.name })}
                  removeLabel={tl("removeFromFavorites", { name: restaurant.name })}
                  className="rounded-full border border-ink/15 px-4 py-2 dark:border-white/15"
                />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {offers.length > 0 && (
        <section className="container-px mx-auto max-w-6xl pb-4">
          <Reveal>
            <ListingOffersSection
              offers={offers}
              title={td("offersTabLabel")}
              couponLabel={td("offerCouponCodeLabel")}
              validUntilLabel={(date) => td("offerValidUntil", { date })}
              saveLabel={(amount) => td("offerSave", { amount })}
              percentOffLabel={(pct) => td("offerPercentOff", { pct })}
            />
          </Reveal>
        </section>
      )}

      {/* Signature Selection — only real Village photography */}
      {signatureProducts.length >= 3 && (
        <section className="border-y border-ink/8 bg-white py-16 dark:border-white/10 dark:bg-white/[0.02] sm:py-20">
          <div className="container-px mx-auto max-w-6xl">
            <Reveal>
              <div className="mb-8 text-center">
                <SectionEyebrow>{t("signatureEyebrow")}</SectionEyebrow>
                <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t("signatureHeading")}</h2>
              </div>
            </Reveal>
            <Reveal delay={0.05}>
              <VillageSignatureSelection
                products={signatureProducts}
                business={business}
                locale={locale}
                storeName={restaurant.name}
              />
            </Reveal>
          </div>
        </section>
      )}

      {/* Visual experience — editorial photography of the space */}
      <VillageExperienceStories locale={locale} />

      {/* THE MENU */}
      <section id="menu" className="container-px mx-auto max-w-4xl py-16 sm:py-24" style={{ scrollMarginTop: 80 }}>
        <Reveal>
          <div className="mb-10 text-center">
            <SectionEyebrow>{t("menuEyebrow")}</SectionEyebrow>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">{t("menuHeading")}</h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ink/60 dark:text-sand/60">{t("menuIntro")}</p>
          </div>
        </Reveal>
        <VillageMenu
          products={menuProducts}
          business={business}
          locale={locale}
          storeName={restaurant.name}
          originalMenuImages={ORIGINAL_MENU_IMAGES}
        />
      </section>

      {/* Reservation */}
      {restaurant.reservable && (
        <section id="reservation" className="border-y border-ink/8 bg-ink py-16 text-white dark:border-white/10 sm:py-24">
          <div className="container-px mx-auto max-w-2xl text-center">
            <Reveal>
              <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-primary-300">{t("reserveEyebrow")}</span>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t("reserveHeading")}</h2>
              <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-white/70">{t("reserveBody")}</p>
              <div className="mt-8 flex justify-center">
                <TableReservationButton
                  listingType="restaurant"
                  listingId={restaurant.id}
                  businessName={restaurant.name}
                  locale={locale}
                  label={t("heroReserve")}
                  icon={<CalendarCheck size={16} aria-hidden="true" />}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary-700 px-8 text-[15px] font-bold text-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-card active:scale-95"
                />
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* Contact */}
      <section id="contact" className="container-px mx-auto max-w-2xl py-16 sm:py-24">
        <Reveal>
          <div className="text-center">
            <SectionEyebrow>{t("contactHeading")}</SectionEyebrow>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t("contactHeading")}</h2>
          </div>
          <ul className="mt-8 space-y-2.5">
            {telHref && (
              <li>
                <a
                  href={telHref}
                  dir="ltr"
                  className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3.5 text-sm font-semibold transition-colors hover:border-primary dark:border-white/10 dark:bg-white/[0.02]"
                >
                  <Phone size={16} className="shrink-0 text-ink/45 dark:text-sand/45" aria-hidden="true" />
                  {restaurant.phone}
                  <span className="ms-auto text-xs font-normal text-ink/45 dark:text-sand/45">{t("contactCall")}</span>
                </a>
              </li>
            )}
            {whatsappHref && (
              <li>
                <a
                  href={whatsappHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  dir="ltr"
                  className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3.5 text-sm font-semibold transition-colors hover:border-primary dark:border-white/10 dark:bg-white/[0.02]"
                >
                  <WhatsAppIcon size={16} aria-hidden="true" />
                  {restaurant.whatsapp}
                  <span className="ms-auto text-xs font-normal text-ink/45 dark:text-sand/45">{t("contactWhatsApp")}</span>
                </a>
              </li>
            )}
            {instagramUrl && instagramHandle && (
              <li>
                <a
                  href={instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3.5 text-sm font-semibold transition-colors hover:border-primary dark:border-white/10 dark:bg-white/[0.02]"
                >
                  <Instagram size={16} className="shrink-0 text-ink/45 dark:text-sand/45" aria-hidden="true" />
                  <span dir="ltr">{instagramHandle}</span>
                  <span className="ms-auto text-xs font-normal text-ink/45 dark:text-sand/45">{t("contactInstagram")}</span>
                </a>
              </li>
            )}
            {tiktokUrl && (
              <li>
                <a
                  href={tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 rounded-xl border border-ink/10 bg-white px-4 py-3.5 text-sm font-semibold transition-colors hover:border-primary dark:border-white/10 dark:bg-white/[0.02]"
                >
                  <TikTokIcon size={16} className="shrink-0 text-ink/45 dark:text-sand/45" aria-hidden="true" />
                  <span dir="ltr">{tiktokHandle}</span>
                  <span className="ms-auto text-xs font-normal text-ink/45 dark:text-sand/45">{t("contactTiktok")}</span>
                </a>
              </li>
            )}
          </ul>
        </Reveal>
      </section>

      {/* Location — the shared, platform-standard section (address + keyless
          map + "Open in Google Maps"); no bespoke embed added on top. */}
      <div className="container-px mx-auto max-w-4xl pb-8">
        <LocationMapSection
          locale={locale}
          address={restaurant.address}
          coords={restaurant.location}
          mapsHref={mapsHref}
          name={restaurant.name}
        />
      </div>

      {/* Reviews */}
      <section id="reviews" className="border-t border-ink/8 bg-white py-16 dark:border-white/10 dark:bg-white/[0.02] sm:py-20">
        <div className="container-px mx-auto max-w-4xl">
          <Reveal>
            <h2 className="mb-6 font-display text-2xl font-semibold sm:text-3xl">{tc("reviews")}</h2>
            <ReviewsSection
              rating={restaurant.rating}
              reviewCount={restaurant.reviewCount}
              reviews={restaurant.reviews}
              locale={locale}
              pathToRevalidate={pathToRevalidate}
            />
            <div className="mt-6">
              <ReviewForm
                key={myReview?.id ?? "new"}
                listingType="restaurant"
                listingId={restaurant.id}
                locale={locale}
                pathToRevalidate={pathToRevalidate}
                allowPhotos
                existingReview={myReview}
              />
            </div>
          </Reveal>
        </div>
      </section>

      {/* Final CTA */}
      <section className="container-px mx-auto max-w-2xl py-16 text-center sm:py-24">
        <Reveal>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t("finalCtaHeading")}</h2>
          <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-ink/60 dark:text-sand/60">{t("finalCtaBody")}</p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-center">
            {restaurant.reservable && (
              <TableReservationButton
                listingType="restaurant"
                listingId={restaurant.id}
                businessName={restaurant.name}
                locale={locale}
                label={t("heroReserve")}
                icon={<CalendarCheck size={16} aria-hidden="true" />}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary-700 px-7 text-[15px] font-bold text-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-card active:scale-95"
              />
            )}
            <a
              href="#menu"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-ink/15 px-7 text-[15px] font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
            >
              <UtensilsCrossed size={16} aria-hidden="true" />
              {t("heroExploreMenu")}
            </a>
          </div>
        </Reveal>
      </section>

      <MobileBookingBar
        listingType="restaurant"
        listingId={restaurant.id}
        name={restaurant.name}
        phone={restaurant.phone}
        whatsappFallback={whatsappFallback}
        locale={locale}
      />
      <VillageStickyBar
        listingId={restaurant.id}
        businessName={restaurant.name}
        reservable={restaurant.reservable}
        locale={locale}
      />
    </>
  );
}
