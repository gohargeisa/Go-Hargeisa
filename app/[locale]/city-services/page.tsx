import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Building2 } from "lucide-react";
import { PremiumPageHero } from "@/components/shared/premium-page-hero";
import { PremiumSectionHeading } from "@/components/shared/premium-section-heading";
import { EmptyState } from "@/components/shared/empty-state";
import { CityServicesPageClient } from "@/components/pages/city-services-page-client";
import { getAllCityServices } from "@/lib/data/city-services";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { safeJsonLd } from "@/lib/utils/json-ld";
import type { EssentialServiceCategory } from "@/types";

export const revalidate = 3600;

/** schema.org type per category — used to build one structured-data entry
 * per published+featured city service (see the @graph built in the page
 * component below). */
const CATEGORY_SCHEMA_TYPE: Record<EssentialServiceCategory, string> = {
  hospital: "Hospital",
  bank: "BankOrCreditUnion",
  supermarket: "GroceryStore",
  pharmacy: "Pharmacy",
};

/** Reuses the shared hero photo — same swap-in-place pattern as attractions-hero.tsx / about-hero.tsx. */
const CITY_SERVICES_HERO_IMAGE = "/images/hero-bg.png";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "City Services — Hospitals, Banks, Supermarkets & Pharmacies",
    description: "Essential city services in Hargeisa: hospitals, banks, supermarkets, and pharmacies.",
    alternates: localeAlternates(locale as Locale, "/city-services"),
  };
}

export default async function CityServicesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { q?: string };
}) {
  const t = await getTranslations({ locale, namespace: "cityServices" });
  const byCategory = await getAllCityServices(locale);

  const allServices = Object.values(byCategory).flat();
  const jsonLd =
    allServices.length > 0
      ? {
          "@context": "https://schema.org",
          "@graph": allServices.map((s) => ({
            "@type": CATEGORY_SCHEMA_TYPE[s.category],
            name: s.name,
            description: s.description ?? undefined,
            image: s.image ?? undefined,
            telephone: s.phone ?? undefined,
            url: s.website ?? undefined,
            address: { "@type": "PostalAddress", addressLocality: "Hargeisa", addressCountry: "Somaliland" },
          })),
        }
      : null;

  return (
    <>
      {jsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(jsonLd) }} />}

      <PremiumPageHero
        image={CITY_SERVICES_HERO_IMAGE}
        imageAlt="Panoramic view of Hargeisa"
        eyebrow={t("eyebrow")}
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        scrollHint={t("scrollHint")}
      />

      <section className="container-px mx-auto py-10 md:py-14">
        {allServices.length === 0 ? (
          <EmptyState icon={Building2} title={t("noServicesTitle")} description={t("noServicesDescription")} className="mt-4" />
        ) : (
          <>
            <PremiumSectionHeading title={t("sectionsTitle")} subtitle={t("sectionsSubtitle")} className="mb-10 md:mb-14" />
            <CityServicesPageClient servicesByCategory={byCategory} locale={locale} initialQuery={searchParams.q} />
          </>
        )}
      </section>
    </>
  );
}
