import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getServices } from "@/lib/data/services";
import { PageHero } from "@/components/shared/page-hero";
import { ServicesPageClient } from "@/components/pages/services-page-client";

export const revalidate = 3600;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Essential Services in Hargeisa — Hospitals, Banks, Pharmacies & More",
    description:
      "Find hospitals, pharmacies, dental clinics, banks, ATMs, currency exchange, gas stations and car rentals in Hargeisa, Somaliland.",
    alternates: { canonical: `/${locale}/services` },
  };
}

export default async function ServicesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { q?: string; minRating?: string; sortBy?: string };
}) {
  const t = await getTranslations("home");
  const tNav = await getTranslations("nav");
  const services = await getServices({ q: searchParams.q });

  return (
    <>
      <PageHero eyebrow={`🧭 ${tNav("services")}`} title={t("servicesTitle")} subtitle={t("servicesSubtitle")} image="/images/hero-bg.png" />

      <ServicesPageClient locale={locale} initialServices={services} searchParams={searchParams} />
    </>
  );
}
