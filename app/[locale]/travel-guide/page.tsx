import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import {
  Stamp, Plane, Bus, Coins, ShieldAlert, PhoneCall, Wifi,
  Users, Sun, Backpack, HelpCircle,
} from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { PageHero } from "@/components/shared/page-hero";
import { FaqAccordion } from "@/components/shared/faq-accordion";
import { FeatureGrid } from "@/components/shared/feature-grid";
import { Reveal } from "@/components/home/reveal";
import { placeholderImage } from "@/lib/placeholder-image";

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
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        image={placeholderImage("Hargeisa Travel Guide", { tone: "secondary" })}
      />
      <section className="container-px mx-auto py-10 md:py-14">
        <Reveal>
          <FeatureGrid items={sections} />
        </Reveal>

        <Reveal delay={0.08}>
          <div className="mt-16 max-w-3xl">
            <h2 className="mb-6 flex items-center gap-2 font-display text-2xl font-semibold">
              <HelpCircle size={22} className="text-secondary" aria-hidden="true" /> {t("faqTitle")}
            </h2>
            <FaqAccordion items={faqs} />
          </div>
        </Reveal>
      </section>
    </>
  );
}
