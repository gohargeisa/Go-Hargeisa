import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { localeAlternates } from "@/lib/i18n/alternates";
import type { Locale } from "@/lib/i18n/config";
import { ComingSoonSection } from "@/components/shared/coming-soon-section";
import { SUPERMARKET_ENABLED } from "@/lib/config/features";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Supermarket — Coming Soon | Go Hargeisa",
    description: "Order groceries and everyday essentials online from Hargeisa's supermarkets — coming soon.",
    alternates: localeAlternates(locale as Locale, "/supermarket"),
  };
}

// Independent module, not a `categories` row — see docs/supermarket-architecture.md.
// Placeholder only: the real storefront (product catalog, cart, checkout)
// is a future build, tracked separately from the generic Business Listings
// system this page deliberately does not touch.
export default async function SupermarketPage({ params: { locale } }: { params: { locale: Locale } }) {
  if (!SUPERMARKET_ENABLED) notFound();

  return <ComingSoonSection locale={locale} type="supermarket" />;
}
