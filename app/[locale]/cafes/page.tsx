import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { PageHero } from "@/components/shared/page-hero";
import { ComingSoonSection } from "@/components/shared/coming-soon-section";


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
}: {
  params: { locale: Locale };
}) {
  // Cafes are not yet open for public listings under the current business
  // policy — no cafe data is queried or rendered here, real or mock.
  const t = await getTranslations({ locale, namespace: "comingSoon" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  return (
    <>
      <PageHero
  eyebrow={`☕ ${tNav("cafes")}`}
  title={t("cafesTitle")}
  subtitle={t("cafesDescription")}
  image="/images/cafes/hero.png"
/>

      <ComingSoonSection type="cafe" locale={locale} />
    </>
  );
}
