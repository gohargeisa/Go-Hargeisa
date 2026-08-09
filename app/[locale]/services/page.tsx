import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Building2 } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getCityServicesGroupedByCategory } from "@/lib/data/city-services";
import { PremiumPageHero } from "@/components/shared/premium-page-hero";
import { EmptyState } from "@/components/shared/empty-state";
import { CityServicesPageClient } from "@/components/pages/city-services-page-client";
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
    title: "Essential Services in Hargeisa — Hospitals, Pharmacies & More",
    description:
      "Find hospitals, pharmacies, dental clinics, schools, mosques, gas stations and more essential services in Hargeisa, Somaliland.",
    alternates: localeAlternates(locale as Locale, "/services"),
  };
}

/**
 * /services is a second, differently-URL'd entry point onto the exact same
 * city_services data /city-services already renders — not a separate
 * `services`-table hub. The `services` table (and its own category
 * taxonomy, target_table='services') is real and untouched, but currently
 * has zero rows in production, so a hub built on it had nothing to ever
 * show. Reuses getCityServicesGroupedByCategory and CityServicesPageClient
 * verbatim (same component /city-services uses) rather than building a
 * second rendering path for the same data — city service detail links
 * still resolve to /city-services/[slug] (CityServiceCard's own hardcoded
 * href), the one real detail route, regardless of which hub page a visitor
 * arrived from.
 */
export default async function ServicesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { q?: string };
}) {
  if (!SERVICES_PUBLIC_ENABLED) notFound();

  const t = await getTranslations("home");
  const tCityServices = await getTranslations({ locale, namespace: "cityServices" });
  const groups = await getCityServicesGroupedByCategory(locale);
  const allServices = groups.flatMap((g) => g.items);

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

      <section className="container-px mx-auto py-10 md:py-14">
        {allServices.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={tCityServices("noServicesTitle")}
            description={tCityServices("noServicesDescription")}
            className="mt-4"
          />
        ) : (
          <CityServicesPageClient groups={groups} locale={locale} initialQuery={searchParams.q} basePath={`/${locale}/services`} />
        )}
      </section>
    </>
  );
}
