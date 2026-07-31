import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  Stamp, Plane, Bus, Coins, ShieldAlert, PhoneCall, Wifi,
  Users, Sun, Backpack,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { PremiumPageHero } from "@/components/shared/premium-page-hero";
import { PremiumSectionHeading } from "@/components/shared/premium-section-heading";
import { FaqAccordion } from "@/components/shared/faq-accordion";
import { FeatureGrid } from "@/components/shared/feature-grid";
import { Reveal } from "@/components/home/reveal";

/** Reuses the shared hero photo — same swap-in-place pattern as attractions-hero.tsx / about-hero.tsx. */
const TRAVEL_GUIDE_HERO_IMAGE = "/images/hero-bg.png";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Hargeisa Travel Guide — Visa, Safety, Transport & More",
    description: "Everything you need to know before visiting Hargeisa: visa requirements, airport guide, currency, safety tips and more.",
    alternates: localeAlternates(locale as Locale, "/travel-guide"),
  };
}

export default async function TravelGuidePage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const t = await getTranslations({ locale, namespace: "travelGuide" });

  const sections = [
    { icon: Stamp, title: t("visaTitle"), body: t("visaBody") },
    { icon: Plane, title: t("airportTitle"), body: t("airportBody") },
    { icon: Bus, title: t("transportTitle"), body: t("transportBody") },
    { icon: Coins, title: t("currencyTitle"), body: t("currencyBody") },
    { icon: ShieldAlert, title: t("safetyTitle"), body: t("safetyBody") },
    { icon: PhoneCall, title: t("emergencyTitle"), body: t("emergencyBody") },
    { icon: Wifi, title: t("internetTitle"), body: t("internetBody") },
    { icon: Users, title: t("customsTitle"), body: t("customsBody") },
    { icon: Sun, title: t("bestTimeTitle"), body: t("bestTimeBody") },
    { icon: Backpack, title: t("packingTitle"), body: t("packingBody") },
  ];

  const faqs = [
    { q: t("faq1Q"), a: t("faq1A") },
    { q: t("faq2Q"), a: t("faq2A") },
    { q: t("faq3Q"), a: t("faq3A") },
  ];

  return (
    <>
      <PremiumPageHero
        image={TRAVEL_GUIDE_HERO_IMAGE}
        imageAlt="Panoramic view of Hargeisa"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        scrollHint={t("scrollHint")}
      />

      <section className="container-px mx-auto py-16 md:py-24">
        <Reveal>
          <PremiumSectionHeading
            eyebrow={t("infoEyebrow")}
            title={t("infoTitle")}
            subtitle={t("infoSubtitle")}
            className="mb-10 md:mb-14"
          />
          <FeatureGrid items={sections} />
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mx-auto mt-16 max-w-3xl md:mt-24">
            <PremiumSectionHeading eyebrow={t("faqEyebrow")} title={t("faqTitle")} className="mb-8" />
            <FaqAccordion items={faqs} />
          </div>
        </Reveal>
      </section>
    </>
  );
}
