import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getCafes } from "@/lib/data/cafes";
import { PageHero } from "@/components/shared/page-hero";
import { CafesPageClient } from "@/components/pages/cafes-page-client";
import { ComingSoonSection } from "@/components/shared/coming-soon-section";
import { CAFES_PUBLIC_ENABLED } from "@/lib/config/features";

// Public content changes infrequently; revalidate hourly instead of
// rendering on every request (mirrors hotels/restaurants).
export const revalidate = 3600;

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Cafes in Hargeisa — Coffee & Working Spots",
    description: "Modern cafes in Hargeisa with WiFi, working space and specialty drinks.",
    alternates: localeAlternates(locale as Locale, "/cafes"),
  };
}

export default async function CafesPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { q?: string; minRating?: string; sortBy?: string };
}) {
  const t = await getTranslations("home");
  const tNav = await getTranslations("nav");
  // Cafes are temporarily hidden site-wide for the hotel presentation
  // (lib/config/features.ts) — skip the fetch entirely and always show
  // Coming Soon in that case, even if a visitor searches.
  const cafes = CAFES_PUBLIC_ENABLED ? await getCafes({ q: searchParams.q, locale }) : [];

  return (
    <>
      <PageHero eyebrow={`☕ ${tNav("cafes")}`} title={t("cafesTitle")} subtitle={t("cafesSubtitle")} image="/images/cafes/hero.png" />

      {CAFES_PUBLIC_ENABLED ? (
        <CafesPageClient locale={locale} initialCafes={cafes} searchParams={searchParams} />
      ) : (
        <ComingSoonSection locale={locale} type="cafes" />
      )}
    </>
  );
}
