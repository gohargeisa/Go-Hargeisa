import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Plane, Car, Bus, ParkingCircle } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { PremiumPageHero } from "@/components/shared/premium-page-hero";
import { FeatureGrid } from "@/components/shared/feature-grid";
import { Reveal } from "@/components/home/reveal";

/** Reuses the shared hero photo — same swap-in-place pattern as attractions-hero.tsx / about-hero.tsx. */
const TRANSPORTATION_HERO_IMAGE = "/images/hero-bg.png";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Getting Around Hargeisa — Transportation Guide",
  description: "How to get to and around Hargeisa: airport transfers, taxis, car rental and shared transport.",
    alternates: localeAlternates(locale as Locale, "/transportation"),
  };
}

export default async function TransportationPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const t = await getTranslations({ locale, namespace: "transportation" });

  const options = [
    { icon: Plane, title: t("airportTransfersTitle"), body: t("airportTransfersBody") },
    { icon: Car, title: t("taxisTitle"), body: t("taxisBody") },
    { icon: Bus, title: t("minibusesTitle"), body: t("minibusesBody") },
    { icon: ParkingCircle, title: t("rentalTitle"), body: t("rentalBody") },
  ];

  return (
    <>
      <PremiumPageHero
        image={TRANSPORTATION_HERO_IMAGE}
        imageAlt="Panoramic view of Hargeisa"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        scrollHint={t("scrollHint")}
      />
      <section className="container-px mx-auto py-16 md:py-24">
        <Reveal>
          <FeatureGrid items={options} columns={2} />
        </Reveal>
      </section>
    </>
  );
}
