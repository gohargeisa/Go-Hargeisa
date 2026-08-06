import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getServices } from "@/lib/data/services";
import { getServiceCategories } from "@/lib/data/categories";
import { PremiumPageHero } from "@/components/shared/premium-page-hero";
import { ServicesPageClient } from "@/components/pages/services-page-client";
import { SERVICES_PUBLIC_ENABLED } from "@/lib/config/features";

/** Reuses the shared hero photo — same swap-in-place pattern as attractions-hero.tsx / about-hero.tsx. */
const SERVICES_HERO_IMAGE = "/images/hero-bg.png";

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
  const [services, allCategories] = await Promise.all([getServices({ q: searchParams.q }), getServiceCategories()]);

  return (
    <>
      <PremiumPageHero
        image={SERVICES_HERO_IMAGE}
        imageAlt="Panoramic view of Hargeisa"
        eyebrow={t("servicesEyebrow")}
        title={t("servicesTitle")}
        subtitle={t("servicesSubtitle")}
        scrollHint={t("servicesScrollHint")}
      />

      <ServicesPageClient locale={locale} initialServices={services} searchParams={searchParams} allCategories={allCategories} />
    </>
  );
}
