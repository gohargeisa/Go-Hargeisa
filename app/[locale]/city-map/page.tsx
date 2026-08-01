import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getCityServicePoints } from "@/lib/data/map-points";
import { PremiumPageHero } from "@/components/shared/premium-page-hero";
import { CityMapExperience } from "@/components/city-map/city-map-experience";

/** Reuses the shared hero photo — same swap-in-place pattern as attractions-hero.tsx / about-hero.tsx. */
const CITY_MAP_HERO_IMAGE = "/images/hero-bg.png";

// Public content changes infrequently; revalidate hourly instead of
// rendering on every request (this page no longer reads cookies, so
// it's eligible for static generation + ISR).
export const revalidate = 3600;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: Locale };
}): Promise<Metadata> {
  return {
    title: "Smart City Map — Hargeisa Services",
    description:
      "Find hospitals, pharmacies, mosques, ATMs, schools and other essential city services around Hargeisa, each with directions straight to Google Maps.",
    alternates: localeAlternates(locale as Locale, "/city-map"),
  };
}

export default async function CityMapPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const points = await getCityServicePoints();
  const t = await getTranslations({ locale, namespace: "cityMap" });

  return (
    <>
      <PremiumPageHero
        image={CITY_MAP_HERO_IMAGE}
        imageAlt="Panoramic view of Hargeisa"
        eyebrow={t("eyebrow")}
        title={t("title")}
        subtitle={t("subtitle")}
        scrollHint={t("scrollHint")}
      />

      <section className="container-px mx-auto py-8 md:py-10">
        <CityMapExperience points={points} locale={locale} />
      </section>
    </>
  );
}
