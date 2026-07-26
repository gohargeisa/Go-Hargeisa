import type { Metadata } from "next";
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
  return (
    <>
      <PageHero
  eyebrow="☕ Cafes"
  title="Discover Hargeisa's Best Cafés"
  subtitle="We're partnering with Hargeisa's leading cafés to bring verified listings, beautiful photography, trusted recommendations, and premium coffee experiences soon."
  image="/images/cafes/hero.png"
/>

      <ComingSoonSection type="cafe" locale={locale} />
    </>
  );
}
