import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { TheVillageShowcase } from "@/components/the-village/the-village-showcase";
import { getVillagePreviewData } from "@/lib/data/village-preview";

// Private/unlisted by construction, same pattern as app/[locale]/preview/flormar:
// `robots: { index: false, follow: false }` AND never linked from anywhere (no
// nav entry, no homepage card, not in app/sitemap.ts, no public-search entry).
// Reachable only by someone who already has this exact URL.
//
// The data itself is now real and database-driven (a real `restaurants` row
// + real `products` rows — see lib/data/village-preview.ts) rather than
// hardcoded constants. That row's `status: 'draft'` is the actual privacy
// mechanism (RLS makes it invisible to every public/anon read path) — this
// route being unlinked/noindex is a second, independent layer on top.
export const metadata: Metadata = {
  title: "The Village Hargeisa — Private Concept Preview",
  robots: { index: false, follow: false },
};

export default async function TheVillagePreviewPage({ params: { locale } }: { params: { locale: Locale } }) {
  const data = await getVillagePreviewData();
  if (!data) notFound();

  return <TheVillageShowcase locale={locale} restaurant={data.restaurant} products={data.products} />;
}
