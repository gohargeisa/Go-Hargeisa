import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getCafes } from "@/lib/data/cafes";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { PageHero } from "@/components/shared/page-hero";
import { ComingSoonSection } from "@/components/shared/coming-soon-section";
import { CafesPageClient } from "@/components/pages/cafes-page-client";

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
  searchParams: { q?: string; minRating?: string; sortBy?: string };
}) {
  // Mirrors hotels/restaurants: only ever show real, published listings —
  // never mock/seed data. When there truly are none yet, fall back to the
  // "Coming Soon" state instead of an empty grid.
  const cafes = isSupabaseConfigured() ? await getCafes({ q: searchParams.q }) : [];
  const t = await getTranslations({ locale, namespace: "comingSoon" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const showComingSoon = cafes.length === 0 && !searchParams.q;

  return (
    <>
      <PageHero eyebrow={`☕ ${tNav("cafes")}`} title={t("cafesTitle")} image="/images/cafes/hero.png" />

      {showComingSoon ? (
        <ComingSoonSection type="cafe" locale={locale} />
      ) : (
        <CafesPageClient locale={locale} initialCafes={cafes} searchParams={searchParams} />
      )}
    </>
  );
}
