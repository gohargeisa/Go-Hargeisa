import { getTranslations } from "next-intl/server";
import { safeJsonLd } from "@/lib/utils/json-ld";
import { Phone, CalendarCheck, CreditCard, Truck, ClipboardCheck } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import type { Restaurant, Product } from "@/types";
import { Reveal } from "@/components/home/reveal";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { ViewTracker } from "@/components/shared/view-tracker";
import { MobileBookingBar } from "@/components/shared/mobile-booking-bar";
import { TableReservationButton } from "@/components/shared/table-reservation-button";
import { LocationMapSection } from "@/components/shared/location-map-section";
import { SocialLinks } from "@/components/shared/social-links";
import { WhatsAppIcon } from "@/components/shared/brand-icons";
import { resolveMapsUrl } from "@/lib/utils/google-maps";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import type { AddToCartBusiness } from "@/lib/cart/cart-context";
import { ExcellenceCafeHero } from "./excellence-cafe-hero";
import { ExcellenceCafeFeatured } from "./excellence-cafe-featured";
import { TextFirstMenuSection } from "@/components/shared/text-first-menu-section";
import { ExcellenceCafeBuffet } from "./excellence-cafe-buffet";
import { ExcellenceCafeGallery } from "./excellence-cafe-gallery";
import { ExcellenceCafeStickyBar } from "./excellence-cafe-sticky-bar";

// The restaurant's own printed-menu section order (see lib/data/
// excellence-cafe-menu-seed.ts) — not alphabetical. Any category present in
// the data but missing here still renders, appended after these (see
// TextFirstMenuSection's own fallback-to-first-appearance-order behavior).
const EXCELLENCE_CAFE_CATEGORY_ORDER = [
  "Breakfast",
  "Main Courses",
  "Pastas",
  "Kids Menu",
  "Burgers",
  "Sandwiches",
  "Wraps",
  "Pizza",
  "Salads",
  "Dessert",
  "Coffee",
  "Iced Coffee",
  "Tea",
  "Frappes",
];

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-2 block text-[11px] font-bold uppercase tracking-[0.22em] text-primary-700 dark:text-primary-300">
      {children}
    </span>
  );
}

/**
 * Excellence Café — dedicated premium restaurant experience. Rendered only
 * from its own private preview route (app/[locale]/preview/excellence-cafe)
 * for now; wiring it into the public restaurants/[slug] route (mirroring
 * The Village's own slug branch there) is a later, separate step. Reuses
 * the shared cart / ProductDetailModal / TableReservationButton / map stack
 * — no parallel systems, same discipline as
 * components/the-village/the-village-experience.tsx.
 */
export async function ExcellenceCafeExperience({
  locale,
  restaurant,
  products,
}: {
  locale: Locale;
  restaurant: Restaurant;
  products: Product[];
}) {
  const t = await getTranslations({ locale, namespace: "excellenceCafe" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const mapsHref =
    resolveMapsUrl(restaurant.location, restaurant.googleMapsUrl) ??
    `https://www.google.com/maps/search/?api=1&query=${restaurant.location.lat},${restaurant.location.lng}`;
  const telHref = restaurant.phone ? `tel:${restaurant.phone.replace(/\s/g, "")}` : undefined;
  const whatsappHref = restaurant.whatsapp ? toWhatsAppHref(restaurant.whatsapp, t("whatsappGreeting")) : undefined;
  const pathToRevalidate = `/${locale}/restaurants/${restaurant.slug}`;

  const business: AddToCartBusiness = {
    listingType: "restaurant",
    listingId: restaurant.id,
    businessName: restaurant.name,
    deliveryEnabled: Boolean(restaurant.productsDeliveryEnabled),
    addons: [],
    whatsapp: restaurant.whatsapp,
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    name: restaurant.name,
    description: restaurant.shortDescription,
    image: restaurant.coverImage,
    logo: restaurant.logo,
    address: { "@type": "PostalAddress", streetAddress: restaurant.address, addressLocality: "Hargeisa", addressCountry: "Somaliland" },
    telephone: restaurant.phone,
    priceRange: restaurant.priceRange,
    hasMenu: `${pathToRevalidate}#menu`,
    ...(restaurant.socialInstagram || restaurant.socialTiktok || restaurant.socialFacebook
      ? { sameAs: [restaurant.socialInstagram, restaurant.socialTiktok, restaurant.socialFacebook].filter(Boolean) }
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

      <ExcellenceCafeHero restaurant={restaurant} locale={locale} mapsHref={mapsHref} />

      {/* 2. Restaurant Introduction */}
      <section className="container-px mx-auto max-w-3xl py-16 text-center sm:py-24">
        <Reveal>
          <SectionEyebrow>{t("introEyebrow")}</SectionEyebrow>
          <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t("introHeading")}</h2>
          <p dir="auto" className="mx-auto mt-5 max-w-2xl leading-relaxed text-ink/75 dark:text-sand/75">
            {restaurant.description}
          </p>
        </Reveal>
      </section>

      {/* 3. Featured Dishes */}
      <section className="border-y border-ink/8 bg-white py-16 dark:border-white/10 dark:bg-white/[0.02] sm:py-20">
        <div className="container-px mx-auto max-w-6xl">
          <Reveal>
            <div className="mb-8 text-center">
              <SectionEyebrow>{t("featuredEyebrow")}</SectionEyebrow>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t("featuredHeading")}</h2>
            </div>
          </Reveal>
          <Reveal delay={0.05}>
            <ExcellenceCafeFeatured />
          </Reveal>
        </div>
      </section>

      {/* 4. Digital Menu */}
      <section id="menu" className="container-px mx-auto max-w-5xl py-16 sm:py-24" style={{ scrollMarginTop: 80 }}>
        <Reveal>
          <div className="mb-10 text-center">
            <SectionEyebrow>{t("menuEyebrow")}</SectionEyebrow>
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-5xl">{t("menuHeading")}</h2>
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ink/60 dark:text-sand/60">{t("menuIntro")}</p>
          </div>
        </Reveal>
        <TextFirstMenuSection
          products={products}
          business={business}
          locale={locale}
          storeName={restaurant.name}
          categoryOrder={EXCELLENCE_CAFE_CATEGORY_ORDER}
        />
      </section>

      {/* 5. Daily Lunch Buffet */}
      <section className="border-y border-ink/8 bg-white py-16 dark:border-white/10 dark:bg-white/[0.02] sm:py-24">
        <div className="container-px mx-auto max-w-5xl">
          <Reveal>
            <ExcellenceCafeBuffet locale={locale} />
          </Reveal>
        </div>
      </section>

      {/* 6. Table Reservation */}
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
                  label={t("heroBookTable")}
                  icon={<CalendarCheck size={16} aria-hidden="true" />}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary-700 px-8 text-[15px] font-bold text-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-card active:scale-95"
                />
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* 7. Contact & Services */}
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
          </ul>

          {/* Verified-facts-only service notes (delivery method, reservation
              channel, payment methods) — no dedicated DB columns for this
              free text, so it's component-level copy sourced directly from
              the business owner's own supplied information, same as
              ExcellenceCafeBuffet's body text. */}
          <dl className="mt-6 grid gap-px overflow-hidden rounded-xl border border-ink/10 bg-ink/10 dark:border-white/10 dark:bg-white/10 sm:grid-cols-3">
            <div className="bg-white p-4 dark:bg-ink">
              <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink/45 dark:text-sand/45">
                <Truck size={13} aria-hidden="true" />
                {t("servicesDeliveryLabel")}
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed">{t("servicesDeliveryBody")}</dd>
            </div>
            <div className="bg-white p-4 dark:bg-ink">
              <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink/45 dark:text-sand/45">
                <ClipboardCheck size={13} aria-hidden="true" />
                {t("servicesReservationsLabel")}
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed">{t("servicesReservationsBody")}</dd>
            </div>
            <div className="bg-white p-4 dark:bg-ink">
              <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink/45 dark:text-sand/45">
                <CreditCard size={13} aria-hidden="true" />
                {t("servicesPaymentLabel")}
              </dt>
              <dd className="mt-1.5 text-sm leading-relaxed">{t("servicesPaymentBody")}</dd>
            </div>
          </dl>
        </Reveal>
      </section>

      {/* Location */}
      <div className="container-px mx-auto max-w-4xl pb-8">
        <LocationMapSection locale={locale} address={restaurant.address} coords={restaurant.location} mapsHref={mapsHref} name={restaurant.name} />
      </div>

      {/* 8. Gallery */}
      <section className="border-t border-ink/8 bg-white py-16 dark:border-white/10 dark:bg-white/[0.02] sm:py-20">
        <div className="container-px mx-auto max-w-6xl">
          <Reveal>
            <div className="mb-8 text-center">
              <SectionEyebrow>{t("galleryEyebrow")}</SectionEyebrow>
              <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{t("galleryHeading")}</h2>
            </div>
            <ExcellenceCafeGallery businessName={restaurant.name} />
          </Reveal>
        </div>
      </section>

      {/* 9. Social Media */}
      {(restaurant.socialInstagram || restaurant.socialFacebook || restaurant.socialTiktok) && (
        <section className="container-px mx-auto max-w-2xl py-16 text-center sm:py-20">
          <Reveal>
            <SectionEyebrow>{t("socialHeading")}</SectionEyebrow>
            <div className="mt-4 flex justify-center">
              <SocialLinks
                instagram={restaurant.socialInstagram}
                facebook={restaurant.socialFacebook}
                tiktok={restaurant.socialTiktok}
                labels={{ instagram: t("contactInstagram"), facebook: t("contactFacebook"), tiktok: t("contactTiktok") }}
              />
            </div>
          </Reveal>
        </section>
      )}

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
                label={t("heroBookTable")}
                icon={<CalendarCheck size={16} aria-hidden="true" />}
                className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary-700 px-7 text-[15px] font-bold text-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-card active:scale-95"
              />
            )}
            <a
              href="#menu"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-ink/15 px-7 text-[15px] font-semibold transition-colors hover:border-primary hover:text-primary dark:border-white/20"
            >
              {t("heroViewMenu")}
            </a>
          </div>
        </Reveal>
      </section>

      <MobileBookingBar
        listingType="restaurant"
        listingId={restaurant.id}
        name={restaurant.name}
        phone={restaurant.phone}
        locale={locale}
      />
      <ExcellenceCafeStickyBar
        listingId={restaurant.id}
        businessName={restaurant.name}
        reservable={restaurant.reservable}
        locale={locale}
      />
    </>
  );
}
