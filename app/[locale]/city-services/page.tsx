import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Hospital, Landmark, ShoppingCart, Pill } from "lucide-react";
import { PremiumPageHero } from "@/components/shared/premium-page-hero";
import { PremiumSectionHeading } from "@/components/shared/premium-section-heading";
import { CityServiceCard } from "@/components/shared/city-service-card";
import { CityServiceEmptyCard } from "@/components/shared/city-service-empty-card";
import { Reveal } from "@/components/home/reveal";
import { getAllCityServices } from "@/lib/data/city-services";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { safeJsonLd } from "@/lib/utils/json-ld";
import type { CityService, EssentialServiceCategory } from "@/types";

export const revalidate = 3600;

const SLOTS_PER_CATEGORY = 4;

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

function CategorySection({
  title,
  icon: Icon,
  services,
}: {
  title: string;
  icon: typeof Hospital;
  services: CityService[];
}) {
  const slots = [...services.slice(0, SLOTS_PER_CATEGORY)];
  const emptyCount = Math.max(0, SLOTS_PER_CATEGORY - slots.length);

  return (
    <div>
      <div className="mb-5 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon size={19} aria-hidden="true" />
        </div>
        <h2 className="font-display text-2xl font-bold text-ink dark:text-white">{title}</h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {slots.map((s) => (
          <CityServiceCard key={s.id} service={s} />
        ))}
        {Array.from({ length: emptyCount }).map((_, i) => (
          <CityServiceEmptyCard key={`empty-${i}`} />
        ))}
      </div>
    </div>
  );
}

export default async function CityServicesPage({ params: { locale } }: { params: { locale: string } }) {
  const t = await getTranslations({ locale, namespace: "cityServices" });
  const byCategory = await getAllCityServices(locale);

  const sections: { key: EssentialServiceCategory; title: string; icon: typeof Hospital }[] = [
    { key: "hospital", title: t("hospitalsTitle"), icon: Hospital },
    { key: "bank", title: t("banksTitle"), icon: Landmark },
    { key: "supermarket", title: t("supermarketsTitle"), icon: ShoppingCart },
    { key: "pharmacy", title: t("pharmaciesTitle"), icon: Pill },
  ];

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
        <PremiumSectionHeading title={t("sectionsTitle")} subtitle={t("sectionsSubtitle")} className="mb-10 md:mb-14" />
        <div className="flex flex-col gap-14">
          {sections.map((s, i) => (
            <Reveal key={s.key} delay={Math.min(i * 0.08, 0.24)}>
              <CategorySection title={s.title} icon={s.icon} services={byCategory[s.key]} />
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
