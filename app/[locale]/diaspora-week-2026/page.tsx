import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  CalendarDays, MapPin, Users, Sparkles, Mic2, Handshake, Landmark, PartyPopper, MessagesSquare,
  Stamp, Wallet, Bus, Backpack, ArrowUpRight, Hotel as HotelIcon,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { safeJsonLd } from "@/lib/utils/json-ld";
import { DIASPORA_WEEK_START_ISO, DIASPORA_WEEK_END_ISO } from "@/lib/config/diaspora-week";
import { HARGEISA_CENTER } from "@/lib/mock-data";

import { getHotels } from "@/lib/data/hotels";
import { getRestaurants } from "@/lib/data/restaurants";
import { getCafes } from "@/lib/data/cafes";
import { getAttractions } from "@/lib/data/attractions";
import { getFeaturedOffersForHomepage } from "@/lib/data/offers";
import { RESTAURANTS_PUBLIC_ENABLED, CAFES_PUBLIC_ENABLED, filterHotelsForPresentation } from "@/lib/config/features";

import { Reveal } from "@/components/home/reveal";
import { ScrollRow } from "@/components/shared/scroll-row";
import { PremiumSectionHeading } from "@/components/shared/premium-section-heading";
import { FeatureGrid } from "@/components/shared/feature-grid";
import { FaqAccordion } from "@/components/shared/faq-accordion";
import { CTASection } from "@/components/shared/cta-section";
import { PrimaryButton, SecondaryButton } from "@/components/shared/buttons";
import { PremiumHotelCard } from "@/components/home/premium-hotel-card";
import { PremiumRestaurantCard } from "@/components/home/premium-restaurant-card";
import { PremiumCafeCard } from "@/components/home/premium-cafe-card";
import { PremiumAttractionCard } from "@/components/home/premium-attraction-card";
import { OfferCard } from "@/components/home/offer-card";
import { DiasporaWeekHero } from "@/components/diaspora-week/diaspora-week-hero";

export const revalidate = 3600;

const OG_IMAGE = "/images/og-image.png";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: "diasporaWeek" });
  const title = `${t("heroTitle")} — 2–6 August 2026`;
  const description = t("heroSubtitle");

  return {
    title,
    description,
    alternates: localeAlternates(locale as Locale, "/diaspora-week-2026"),
    openGraph: {
      title,
      description,
      url: `https://gohargeisa.com/${locale}/diaspora-week-2026`,
      type: "website",
      images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: t("heroTitle") }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [OG_IMAGE],
    },
  };
}

export default async function DiasporaWeekPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const t = await getTranslations({ locale, namespace: "diasporaWeek" });

  const [hotelsRaw, restaurantsRaw, cafesRaw, attractionsRaw, featuredOffers] = await Promise.all([
    getHotels({ featuredOnly: true }),
    RESTAURANTS_PUBLIC_ENABLED ? getRestaurants({ featuredOnly: true }) : Promise.resolve([]),
    CAFES_PUBLIC_ENABLED ? getCafes({ featuredOnly: true, locale }) : Promise.resolve([]),
    getAttractions(),
    getFeaturedOffersForHomepage(12),
  ]);

  const hotels = filterHotelsForPresentation(hotelsRaw);
  const restaurants = restaurantsRaw;
  const cafes = cafesRaw;
  const attractions = attractionsRaw.filter((a) => a.featured);

  const infoCards = [
    { icon: CalendarDays, title: t("infoDatesTitle"), body: t("infoDatesBody") },
    { icon: MapPin, title: t("infoLocationTitle"), body: t("infoLocationBody") },
    { icon: Sparkles, title: t("infoThemeTitle"), body: t("infoThemeBody") },
    { icon: Users, title: t("infoAudienceTitle"), body: t("infoAudienceBody") },
  ];

  const highlights = [
    { icon: PartyPopper, title: t("highlight1Title"), body: t("highlight1Body") },
    { icon: Handshake, title: t("highlight2Title"), body: t("highlight2Body") },
    { icon: Landmark, title: t("highlight3Title"), body: t("highlight3Body") },
    { icon: Mic2, title: t("highlight4Title"), body: t("highlight4Body") },
    { icon: Users, title: t("highlight5Title"), body: t("highlight5Body") },
    { icon: MessagesSquare, title: t("highlight6Title"), body: t("highlight6Body") },
  ];

  const tips = [
    { icon: Stamp, title: t("tip1Title"), body: t("tip1Body") },
    { icon: Wallet, title: t("tip2Title"), body: t("tip2Body") },
    { icon: Bus, title: t("tip3Title"), body: t("tip3Body") },
    { icon: Backpack, title: t("tip4Title"), body: t("tip4Body") },
  ];

  const faqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
    { q: t("faq4Q"), a: t("faq4A") },
    { q: t("faq5Q"), a: t("faq5A") },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: t("heroTitle"),
    description: t("heroSubtitle"),
    startDate: DIASPORA_WEEK_START_ISO,
    endDate: DIASPORA_WEEK_END_ISO,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    image: [`https://gohargeisa.com${OG_IMAGE}`],
    location: {
      "@type": "Place",
      name: "Hargeisa, Somaliland",
      address: { "@type": "PostalAddress", addressLocality: "Hargeisa", addressCountry: "Somaliland" },
      geo: { "@type": "GeoCoordinates", latitude: HARGEISA_CENTER.lat, longitude: HARGEISA_CENTER.lng },
    },
    organizer: { "@type": "Organization", name: "Go Hargeisa", url: "https://gohargeisa.com" },
    url: `https://gohargeisa.com/${locale}/diaspora-week-2026`,
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />

      <DiasporaWeekHero locale={locale} />

      {/* ============ About Event ============ */}
      <section className="container-px mx-auto py-16 md:py-24">
        <Reveal>
          <PremiumSectionHeading eyebrow={t("aboutEyebrow")} title={t("aboutTitle")} className="mb-8 md:mb-10" />
          <div className="mx-auto max-w-3xl space-y-5 text-center text-base leading-8 text-ink/70 dark:text-sand/70 md:text-lg">
            <p>{t("aboutBody1")}</p>
            <p>{t("aboutBody2")}</p>
          </div>
        </Reveal>
      </section>

      {/* ============ Event Information ============ */}
      <section className="bg-white py-16 dark:bg-white/[0.03] md:py-24">
        <div className="container-px mx-auto">
          <Reveal>
            <PremiumSectionHeading eyebrow={t("infoEyebrow")} title={t("infoTitle")} subtitle={t("infoSubtitle")} className="mb-10 md:mb-14" />
            <FeatureGrid items={infoCards} columns={4} />
          </Reveal>
        </div>
      </section>

      {/* ============ Event Highlights ============ */}
      <section id="highlights" className="container-px mx-auto scroll-mt-24 py-16 md:py-24">
        <Reveal>
          <PremiumSectionHeading eyebrow={t("highlightsEyebrow")} title={t("highlightsTitle")} subtitle={t("highlightsSubtitle")} className="mb-10 md:mb-14" />
          <FeatureGrid items={highlights} columns={3} />
        </Reveal>
      </section>

      {/* ============ Recommended Hotels ============ */}
      {hotels.length > 0 && (
        <section id="hotels" className="scroll-mt-24 bg-white py-16 dark:bg-white/[0.03] md:py-24">
          <div className="container-px mx-auto">
            <Reveal>
              <PremiumSectionHeading eyebrow={t("hotelsEyebrow")} title={t("hotelsTitle")} subtitle={t("hotelsSubtitle")} className="mb-10 md:mb-14" />
            </Reveal>
            <Reveal delay={0.1}>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {hotels.map((h) => (
                  <PremiumHotelCard
                    key={h.id}
                    href={`/${locale}/hotels/${h.slug}`}
                    image={h.coverImage}
                    name={h.name}
                    address={h.address}
                    rating={h.rating}
                    reviewCount={h.reviewCount}
                    priceRange={h.priceRange}
                    amenities={h.amenities}
                    featured={h.featured}
                    hotelId={h.id}
                    locale={locale}
                    website={h.website}
                  />
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ============ Recommended Restaurants ============ */}
      {restaurants.length > 0 && (
        <section id="restaurants" className="scroll-mt-24 py-16 md:py-24">
          <div className="container-px mx-auto">
            <Reveal>
              <PremiumSectionHeading eyebrow={t("restaurantsEyebrow")} title={t("restaurantsTitle")} subtitle={t("restaurantsSubtitle")} className="mb-10 md:mb-14" />
            </Reveal>
            <Reveal delay={0.1}>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {restaurants.map((r) => (
                  <PremiumRestaurantCard
                    key={r.id}
                    href={`/${locale}/restaurants/${r.slug}`}
                    image={r.coverImage}
                    name={r.name}
                    address={r.address}
                    rating={r.rating}
                    reviewCount={r.reviewCount}
                    priceRange={r.priceRange}
                    cuisine={r.cuisine}
                    featured={r.featured}
                    reservable={r.reservable}
                    restaurantId={r.id}
                    locale={locale}
                    website={r.website}
                    phone={r.phone}
                  />
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ============ Recommended Cafés ============ */}
      {cafes.length > 0 && (
        <section id="cafes" className="scroll-mt-24 bg-white py-16 dark:bg-white/[0.03] md:py-24">
          <div className="container-px mx-auto">
            <Reveal>
              <PremiumSectionHeading eyebrow={t("cafesEyebrow")} title={t("cafesTitle")} subtitle={t("cafesSubtitle")} className="mb-10 md:mb-14" />
            </Reveal>
            <Reveal delay={0.1}>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {cafes.map((c) => (
                  <PremiumCafeCard
                    key={c.id}
                    href={`/${locale}/cafes/${c.slug}`}
                    image={c.coverImage}
                    name={c.name}
                    address={c.address}
                    rating={c.rating}
                    reviewCount={c.reviewCount}
                    specialDrinks={c.specialDrinks}
                    wifi={c.wifi}
                    workingSpace={c.workingSpace}
                    featured={c.featured}
                    cafeId={c.id}
                    locale={locale}
                    phone={c.phone}
                  />
                ))}
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ============ Tourist Attractions ============ */}
      {attractions.length > 0 && (
        <section id="attractions" className="scroll-mt-24 py-16 md:py-24">
          <div className="container-px mx-auto">
            <Reveal>
              <PremiumSectionHeading eyebrow={t("attractionsEyebrow")} title={t("attractionsTitle")} subtitle={t("attractionsSubtitle")} className="mb-10 md:mb-14" />
            </Reveal>
            <Reveal delay={0.1}>
              <ScrollRow>
                {attractions.map((a) => (
                  <PremiumAttractionCard
                    key={a.id}
                    href={`/${locale}/attractions/${a.slug}`}
                    image={a.coverImage}
                    name={a.name}
                    address={a.address}
                    rating={a.rating}
                    reviewCount={a.reviewCount}
                    category={a.category}
                    shortDescription={a.shortDescription}
                    featured={a.featured}
                    attractionId={a.id}
                    locale={locale}
                  />
                ))}
              </ScrollRow>
            </Reveal>
          </div>
        </section>
      )}

      {/* ============ Special Offers ============ */}
      {featuredOffers.length > 0 && (
        <section className="py-16 md:py-24">
          <div className="container-px mx-auto">
            <Reveal>
              <PremiumSectionHeading eyebrow={t("offersEyebrow")} title={t("offersTitle")} subtitle={t("offersSubtitle")} className="mb-10 md:mb-14" />
            </Reveal>
            <Reveal delay={0.1}>
              <ScrollRow>
                {featuredOffers.map((offer) => (
                  <OfferCard key={offer.id} offer={offer} locale={locale} />
                ))}
              </ScrollRow>
            </Reveal>
          </div>
        </section>
      )}

      {/* ============ Travel Tips ============ */}
      <section id="travel-tips" className="bg-white py-16 dark:bg-white/[0.03] md:py-24">
        <div className="container-px mx-auto">
          <Reveal>
            <PremiumSectionHeading eyebrow={t("tipsEyebrow")} title={t("tipsTitle")} subtitle={t("tipsSubtitle")} className="mb-10 md:mb-14" />
            <FeatureGrid items={tips} columns={4} />
            <div className="mt-8 text-center">
              <SecondaryButton href={`/${locale}/travel-guide`}>
                {t("tipsFullGuideCta")}
                <ArrowUpRight size={16} aria-hidden="true" />
              </SecondaryButton>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ============ FAQ ============ */}
      <section className="container-px mx-auto py-16 md:py-24">
        <Reveal>
          <div className="mx-auto max-w-3xl">
            <PremiumSectionHeading eyebrow={t("faqEyebrow")} title={t("faqTitle")} className="mb-10" />
            <FaqAccordion items={faqs} />
          </div>
        </Reveal>
      </section>

      {/* ============ CTA ============ */}
      <section className="container-px mx-auto pb-20 md:pb-28">
        <CTASection tone="dark" icon={HotelIcon} title={t("ctaTitle")} subtitle={t("ctaSubtitle")}>
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <PrimaryButton href={`/${locale}/contact`} size="lg" className="bg-white text-primary hover:bg-white/90">
              {t("ctaPrimary")}
            </PrimaryButton>
            <SecondaryButton
              href={`/${locale}/hotels`}
              size="lg"
              className="border-white/40 bg-white/10 text-white backdrop-blur-md hover:border-white hover:bg-white/20 hover:text-white"
            >
              {t("ctaSecondary")}
            </SecondaryButton>
          </div>
        </CTASection>
      </section>
    </>
  );
}
