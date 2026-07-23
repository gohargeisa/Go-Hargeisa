import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getCafes } from "@/lib/data/cafes";
import { PageHero } from "@/components/shared/page-hero";
import { CafesPageClient } from "@/components/pages/cafes-page-client";
import { placeholderImage } from "@/lib/placeholder-image";

// Public content changes infrequently; revalidate hourly instead of
// rendering on every request (this page no longer reads cookies, so
// it's eligible for static generation + ISR).
export const revalidate = 3600;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Cafes in Hargeisa — Coffee & Working Spots",
  description: "Modern cafes in Hargeisa with WiFi, working space and specialty drinks.",
    alternates: { canonical: `/${locale}/cafes` },
  };
}

export default async function CafesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { q?: string; minPrice?: string; maxPrice?: string; minRating?: string; sortBy?: string };
}) {
  const t = await getTranslations("home");
  const cafes = await getCafes({ q: searchParams.q });

  return (
    <>
      <PageHero
        eyebrow="Sip"
        title={t("cafesTitle")}
        image={placeholderImage("Cafes in Hargeisa", { tone: "accent" })}
      />
      
      <CafesPageClient locale={locale} initialCafes={cafes} searchParams={searchParams} />
    </>
  );
}
