import type { Metadata } from "next";
import Link from "next/link";
import {
  Compass,
  Globe2,
  Handshake,
  Lightbulb,
  Map as MapIcon,
  MessageCircleHeart,
  Rocket,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Hotel as HotelIcon,
} from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getHotels } from "@/lib/data/hotels";
import { getRestaurants } from "@/lib/data/restaurants";
import { getCafes } from "@/lib/data/cafes";
import { getAttractions } from "@/lib/data/attractions";
import { getCityServicesGroupedByCategory } from "@/lib/data/city-services";
import { RESTAURANTS_PUBLIC_ENABLED, CAFES_PUBLIC_ENABLED, filterHotelsForPresentation } from "@/lib/config/features";
import { AboutHero } from "@/components/about/about-hero";
import { OurStorySection } from "@/components/about/our-story-section";
import { AudienceSection } from "@/components/about/audience-section";
import { AboutHowItWorksSection } from "@/components/about/about-how-it-works";
import { AboutStats, type AboutStatItem } from "@/components/about/about-stats";
import { PlatformPreviewMockup } from "@/components/about/platform-preview-mockup";
import { AppPromotionSection } from "@/components/home/app-promotion-section";
import { PartnerGridSection } from "@/components/shared/partner/partner-grid-section";
import { PremiumPartnershipCta } from "@/components/shared/partner/premium-partnership-cta";
import { FeatureGrid } from "@/components/shared/feature-grid";
import { GlassCard } from "@/components/shared/glass-card";
import { CTASection } from "@/components/shared/cta-section";
import { Reveal } from "@/components/home/reveal";

export const revalidate = 3600;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "About Go Hargeisa — Making Hargeisa Smarter",
    description:
      "Go Hargeisa is a smart discovery, connection and booking platform for Hargeisa — helping residents, visitors, the diaspora and local businesses discover, connect and book across the city.",
    alternates: localeAlternates(locale as Locale, "/about"),
  };
}

export default async function AboutPage({ params: { locale } }: { params: { locale: Locale } }) {
  const t = await getTranslations({ locale, namespace: "about" });

  const [hotelsRaw, restaurants, cafes, attractions, cityServiceGroups] = await Promise.all([
    getHotels(),
    RESTAURANTS_PUBLIC_ENABLED ? getRestaurants() : Promise.resolve([]),
    CAFES_PUBLIC_ENABLED ? getCafes() : Promise.resolve([]),
    getAttractions(),
    getCityServicesGroupedByCategory(),
  ]);
  const hotels = filterHotelsForPresentation(hotelsRaw);
  const cityServicesCount = cityServiceGroups.reduce((sum, g) => sum + g.items.length, 0);

  // Every value below is a real, live-fetched count — never a hardcoded
  // estimate. A count of 0 (a disabled public feature, or a not-yet-seeded
  // table) renders as "Coming Soon" inside AboutStats, not a fabricated
  // number. There is deliberately no "Visitors"/"Partners"/"Reviews"/
  // "Bookings" stat here: no site-wide analytics or a public partners
  // count exists in this codebase to back one honestly.
  const stats: AboutStatItem[] = [
    { key: "hotels", value: hotels.length },
    { key: "restaurants", value: restaurants.length },
    { key: "cafes", value: cafes.length },
    { key: "attractions", value: attractions.length },
    { key: "cityServices", value: cityServicesCount },
  ];

  const storySteps = [
    { icon: Compass, label: "01", title: t("storyStep1Title"), description: t("storyStep1Body") },
    { icon: Handshake, label: "02", title: t("storyStep2Title"), description: t("storyStep2Body") },
    { icon: Users, label: "03", title: t("storyStep3Title"), description: t("storyStep3Body") },
  ];

  // Exactly the 4 pillars specified: Promote Hargeisa / Support Local
  // Businesses / Build Trust / Make Hargeisa Smarter.
  const missionItems = [
    { icon: Compass, title: t("missionPromoteTitle"), body: t("missionPromoteBody") },
    { icon: Handshake, title: t("missionBusinessTitle"), body: t("missionBusinessBody") },
    { icon: ShieldCheck, title: t("missionTrustTitle"), body: t("missionTrustBody") },
    { icon: Sparkles, title: t("missionSmarterTitle"), body: t("missionSmarterBody") },
  ];

  const whyItems = [
    { icon: ShieldCheck, title: t("whyListingsTitle"), body: t("whyListingsBody") },
    { icon: Sparkles, title: t("whyVerifiedTitle"), body: t("whyVerifiedBody") },
    { icon: MapIcon, title: t("whyMapsTitle"), body: t("whyMapsBody") },
    { icon: Globe2, title: t("whyLanguageTitle"), body: t("whyLanguageBody") },
    { icon: HotelIcon, title: t("whyBookingTitle"), body: t("whyBookingBody") },
    { icon: MessageCircleHeart, title: t("whyRecommendationsTitle"), body: t("whyRecommendationsBody") },
  ];

  const valueCards = [
    { icon: ShieldCheck, title: t("valuesAuthenticityTitle"), body: t("valuesAuthenticityBody") },
    { icon: Handshake, title: t("valuesTrustTitle"), body: t("valuesTrustBody") },
    { icon: Lightbulb, title: t("valuesInnovationTitle"), body: t("valuesInnovationBody") },
    { icon: Users, title: t("valuesCommunityTitle"), body: t("valuesCommunityBody") },
  ];

  // "The Platform" — only real, currently-live categories, matching the
  // same feature flags every other real listing count on this page respects.
  const platformCategories = [
    t("platformCategoryHotels"),
    ...(RESTAURANTS_PUBLIC_ENABLED ? [t("platformCategoryRestaurants")] : []),
    ...(CAFES_PUBLIC_ENABLED ? [t("platformCategoryCafes")] : []),
    t("platformCategoryAttractions"),
    t("platformCategoryCityServices"),
  ];

  return (
    <>
      <AboutHero
        locale={locale}
        eyebrow={t("eyebrow")}
        title={t("title")}
        tagline={t("heroTagline")}
        subtitle={t("heroSubtitle")}
        exploreLabel={t("heroExplore")}
        contactLabel={t("heroContact")}
        scrollHint={t("scrollHint")}
        localityLabel={t("localityLabel")}
      />

      <OurStorySection steps={storySteps} />

      {/* Why We Built It */}
      <section className="bg-white py-16 dark:bg-white/[0.03] md:py-24">
        <div className="container-px mx-auto max-w-3xl text-center">
          <Reveal>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary-800">
              {t("whyBuiltEyebrow")}
            </span>
            <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              {t("whyBuiltTitle")}
            </h2>
            <p className="mt-5 text-balance text-base leading-7 text-ink/70 dark:text-sand/70 sm:text-lg">
              {t("whyBuiltBody")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Our Vision */}
      <section className="container-px mx-auto py-16 md:py-24">
        <Reveal>
          <div className="relative overflow-hidden rounded-[2rem] border border-ink/8 bg-gradient-to-br from-secondary/[0.06] via-white to-primary/[0.05] p-8 text-center shadow-soft dark:border-white/10 dark:from-secondary/10 dark:via-ink dark:to-primary/10 sm:p-14">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Target size={26} aria-hidden="true" />
            </span>
            <span className="mt-6 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary-800">
              {t("visionEyebrow")}
            </span>
            <h2 className="mx-auto mt-3 max-w-2xl text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              {t("visionTitle")}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-base leading-7 text-ink/70 dark:text-sand/70 sm:text-lg">
              {t("visionBody")}
            </p>
          </div>
        </Reveal>
      </section>

      {/* For People Who Call Hargeisa Home / For Visitors & Diaspora / For Businesses */}
      <AudienceSection locale={locale} />

      {/* Partnership Identity + Our Partners */}
      <section className="bg-white pt-16 dark:bg-white/[0.03] md:pt-24">
        <div className="container-px mx-auto max-w-2xl text-center">
          <Reveal>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary-800">
              {t("partnershipIdentityEyebrow")}
            </span>
            <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              {t("partnershipIdentityTitle")}
            </h2>
            <p className="mt-4 text-balance text-ink/60 dark:text-sand/60">{t("partnershipIdentityBody")}</p>
          </Reveal>
        </div>
      </section>
      <PartnerGridSection
        locale={locale}
        eyebrow={t("partnersEyebrow")}
        title={t("partnersTitle")}
        subtitle={t("partnersSubtitle")}
        ctaLabel={t("partnersCta")}
      />

      {/* Premium Partnership — no pricing shown */}
      <PremiumPartnershipCta locale={locale} />

      {/* Our Mission — exactly 4 pillars */}
      <section className="bg-white py-16 dark:bg-white/[0.03] md:py-24">
        <div className="container-px mx-auto">
          <Reveal>
            <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary-800">
                {t("missionEyebrow")}
              </span>
              <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
                {t("missionTitle")}
              </h2>
              <p className="mt-2 text-ink/60 dark:text-sand/60">{t("missionSubtitle")}</p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <FeatureGrid items={missionItems} columns={4} />
          </Reveal>
        </div>
      </section>

      {/* Why Go Hargeisa */}
      <section className="container-px mx-auto py-16 md:py-24">
        <Reveal>
          <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary-800">
              {t("whyEyebrow")}
            </span>
            <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              {t("whyTitle")}
            </h2>
            <p className="mt-2 text-ink/60 dark:text-sand/60">{t("whySubtitle")}</p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <FeatureGrid items={whyItems} columns={3} />
        </Reveal>
      </section>

      {/* Trust — wording reflects that every listing is genuinely reviewed by our team before publishing */}
      <section className="bg-white py-16 dark:bg-white/[0.03] md:py-24">
        <div className="container-px mx-auto max-w-3xl text-center">
          <Reveal>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary-800">
              {t("trustEyebrow")}
            </span>
            <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              {t("trustTitle")}
            </h2>
            <p className="mt-5 text-balance text-base leading-7 text-ink/70 dark:text-sand/70 sm:text-lg">
              {t("trustBody")}
            </p>
          </Reveal>
        </div>
      </section>

      {/* Statistics — real Supabase-backed counts only, see stats[] above */}
      <section className="container-px mx-auto py-16 md:py-24">
        <Reveal>
          <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary-800">
              {t("statsEyebrow")}
            </span>
            <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              {t("statsTitle")}
            </h2>
            <p className="mt-2 text-ink/60 dark:text-sand/60">{t("statsSubtitle")}</p>
          </div>
        </Reveal>
        <AboutStats stats={stats} />
      </section>

      {/* Our Values — glassmorphism over a brand gradient panel */}
      <section className="bg-white py-16 dark:bg-white/[0.03] md:py-24">
        <div className="container-px mx-auto">
          <Reveal>
            <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-primary via-primary-700 to-secondary-800 p-8 shadow-premium-lg sm:p-12 md:p-16">
              <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
                <span className="inline-flex rounded-full border border-white/20 bg-white/10 px-5 py-2 text-sm font-semibold text-white backdrop-blur-sm">
                  {t("valuesEyebrow")}
                </span>
                <h2 className="mt-6 text-balance font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
                  {t("valuesTitle")}
                </h2>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {valueCards.map(({ icon: Icon, title, body }) => (
                  <GlassCard key={title} tone="light" blur="xl" className="p-6 text-white">
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15">
                      <Icon size={20} aria-hidden="true" />
                    </span>
                    <h3 className="mt-4 font-display text-base font-semibold">{title}</h3>
                    <p className="mt-1.5 text-sm leading-relaxed text-white/80">{body}</p>
                  </GlassCard>
                ))}
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* The Platform — "One Platform. The Whole City." */}
      <section className="container-px mx-auto py-16 md:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
          <Reveal>
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary-800">
              {t("platformEyebrow")}
            </span>
            <h2 className="mt-4 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              {t("platformTitle")}
            </h2>
            <p className="mt-5 max-w-lg text-base leading-relaxed text-ink/70 dark:text-sand/70">{t("platformBody")}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {platformCategories.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center rounded-full border border-ink/10 bg-sand/60 px-3.5 py-1.5 text-xs font-semibold text-ink/70 dark:border-white/10 dark:bg-white/5 dark:text-sand/70"
                >
                  {label}
                </span>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <PlatformPreviewMockup searchPlaceholder={t("platformMockupSearchPlaceholder")} />
          </Reveal>
        </div>
      </section>

      {/* How It Works — Discover / Explore / Connect / Book & Order */}
      <div className="bg-ink/[0.02] dark:bg-white/[0.02]">
        <AboutHowItWorksSection locale={locale} />
      </div>

      {/* Mobile App — reuses the same promo section as the homepage */}
      <AppPromotionSection locale={locale} />

      {/* The Future — inspirational, no unreleased-feature promises */}
      <section className="container-px mx-auto py-16 md:py-24">
        <CTASection tone="light" eyebrow={t("futureEyebrow")} icon={Rocket} title={t("futureTitle")} subtitle={t("futureBody")} />
      </section>

      {/* Final CTA */}
      <section className="container-px mx-auto py-16 md:py-24">
        <CTASection title={t("ctaTitle")} subtitle={t("ctaSubtitle")}>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={`/${locale}/hotels`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-600 hover:shadow-[0_14px_30px_rgba(0,0,0,0.28)]"
            >
              {t("ctaExploreHotels")}
            </Link>
            <Link
              href={`/${locale}/attractions`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/20"
            >
              {t("ctaBrowseAttractions")}
            </Link>
          </div>
        </CTASection>
      </section>
    </>
  );
}
