import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { getExcellenceCafePreviewData } from "@/lib/data/excellence-cafe-preview";
import { ExcellenceCafeExperience } from "@/components/excellence-cafe/excellence-cafe-experience";
import { PartnerThemeScope } from "@/components/shared/partner/partner-theme-scope";
import { PartnerPartnershipFooter } from "@/components/shared/partner/partner-partnership-footer";
import { getPartnerTheme } from "@/lib/config/partner-themes";

// Private/unlisted by construction, same pattern as app/[locale]/preview/the-village:
// `robots: { index: false, follow: false }` AND never linked from anywhere (no
// nav entry, no homepage card, not in app/sitemap.ts, no public-search entry).
// Reachable only by someone who already has this exact URL.
//
// The data is real and database-driven (a real `restaurants` row + real
// `products` rows — see lib/data/excellence-cafe-preview.ts) but that row's
// `status: 'draft'` is the actual privacy mechanism (RLS makes it invisible
// to every public/anon read path) — this route being unlinked/noindex is a
// second, independent layer on top.
export const metadata: Metadata = {
  title: "Excellence Café — Private Preview",
  robots: { index: false, follow: false },
};

export default async function ExcellenceCafePreviewPage({ params: { locale } }: { params: { locale: Locale } }) {
  const data = await getExcellenceCafePreviewData();
  if (!data) notFound();

  const theme = getPartnerTheme("restaurant", data.restaurant.slug);
  if (!theme) notFound();

  return (
    <PartnerThemeScope theme={theme}>
      <ExcellenceCafeExperience locale={locale} restaurant={data.restaurant} products={data.products} />
      <PartnerPartnershipFooter theme={theme} locale={locale} />
    </PartnerThemeScope>
  );
}
