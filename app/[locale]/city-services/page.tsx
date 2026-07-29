import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Hospital, Landmark, ShoppingCart, Pill } from "lucide-react";
import { PageHero } from "@/components/shared/page-hero";
import { CityServiceCard } from "@/components/shared/city-service-card";
import { CityServiceEmptyCard } from "@/components/shared/city-service-empty-card";
import { getAllCityServices } from "@/lib/data/city-services";
import { placeholderImage } from "@/lib/placeholder-image";
import type { CityService, EssentialServiceCategory } from "@/types";

export const revalidate = 3600;

const SLOTS_PER_CATEGORY = 4;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "City Services — Hospitals, Banks, Supermarkets & Pharmacies",
    description: "Essential city services in Hargeisa: hospitals, banks, supermarkets, and pharmacies.",
    alternates: { canonical: `/${locale}/city-services` },
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
  const byCategory = await getAllCityServices();

  const sections: { key: EssentialServiceCategory; title: string; icon: typeof Hospital }[] = [
    { key: "hospital", title: t("hospitalsTitle"), icon: Hospital },
    { key: "bank", title: t("banksTitle"), icon: Landmark },
    { key: "supermarket", title: t("supermarketsTitle"), icon: ShoppingCart },
    { key: "pharmacy", title: t("pharmaciesTitle"), icon: Pill },
  ];

  return (
    <>
      <PageHero
        eyebrow={t("pageTitle")}
        title={t("pageTitle")}
        subtitle={t("pageSubtitle")}
        image={placeholderImage("City Services", { tone: "ink" })}
      />
      <section className="container-px mx-auto flex flex-col gap-14 py-14">
        {sections.map((s) => (
          <CategorySection key={s.key} title={s.title} icon={s.icon} services={byCategory[s.key]} />
        ))}
      </section>
    </>
  );
}
