import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { getCityServicePoints } from "@/lib/data/map-points";
import { PageHero } from "@/components/shared/page-hero";
import { CityMapExperience } from "@/components/city-map/city-map-experience";

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
      "Find hospitals, pharmacies, mosques, ATMs, schools and other essential city services around Hargeisa on an interactive map.",
    alternates: { canonical: `/${locale}/city-map` },
  };
}

export default async function CityMapPage() {
  const points = await getCityServicePoints();

  return (
    <>
      <PageHero
        eyebrow="🗺 Smart City Map"
        title="Essential Services Around Hargeisa"
        subtitle="Hospitals, pharmacies, mosques, ATMs, schools and more — find what you need, wherever you are."
        image="/images/hero-bg.png"
      />

      <section className="container-px mx-auto py-8 md:py-10">
        <div className="overflow-hidden rounded-xl3 border border-ink/8 shadow-card dark:border-white/10">
          <CityMapExperience points={points} />
        </div>
      </section>
    </>
  );
}
