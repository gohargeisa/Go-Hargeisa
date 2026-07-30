import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Plane, Car, Bus, ParkingCircle } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { PageHero } from "@/components/shared/page-hero";
import { FeatureGrid } from "@/components/shared/feature-grid";
import { Reveal } from "@/components/home/reveal";
import { placeholderImage } from "@/lib/placeholder-image";

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
      <PageHero
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        image={placeholderImage("Getting Around Hargeisa", { tone: "primary" })}
      />
      <section className="container-px mx-auto py-10 md:py-14">
        <Reveal>
          <FeatureGrid items={options} columns={2} />
        </Reveal>
      </section>
    </>
  );
}
