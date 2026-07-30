import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getServices } from "@/lib/data/services";
import { PageHero } from "@/components/shared/page-hero";
import { ServicesPageClient } from "@/components/pages/services-page-client";
import { SERVICES_PUBLIC_ENABLED } from "@/lib/config/features";

export const revalidate = 3600;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  if (!SERVICES_PUBLIC_ENABLED) return {};
  return {
    title: "Essential Services in Hargeisa — Hospitals, Banks, Pharmacies & More",
    description:
      "Find hospitals, pharmacies, dental clinics, banks, ATMs, currency exchange, gas stations and car rentals in Hargeisa, Somaliland.",
    alternates: localeAlternates(locale as Locale, "/services"),
  };
}

export default async function ServicesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { q?: string; minRating?: string; sortBy?: string };
}) {
  // Services is temporarily hidden from the public site — see
  // lib/config/features.ts. Flip that flag back to re-enable; nothing else
  // here needs to change.
  if (!SERVICES_PUBLIC_ENABLED) notFound();

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
