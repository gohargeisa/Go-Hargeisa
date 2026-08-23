import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { getPartnerTheme } from "@/lib/config/partner-themes";
import { getFlormarPreviewData } from "@/lib/data/flormar-preview";
import { PartnerThemeScope } from "@/components/shared/partner/partner-theme-scope";
import { PartnerPartnershipFooter } from "@/components/shared/partner/partner-partnership-footer";
import { FlormarStorefront } from "@/components/flormar/flormar-storefront";
import { FlormarPromoBanner } from "@/components/home/flormar-promo-banner";

// Private/unlisted by construction: `robots: { index: false, follow: false }`
// AND never linked from anywhere (no nav entry, no homepage card, not in
// app/sitemap.ts's explicit staticRoutes list, no public-search entry) —
// see PHASE 17/18 of the Flormar brief. Reachable only by someone who
// already has this exact URL. `notFound()` if the theme is ever disabled,
// so flipping `enabled: false` in partner-themes.ts also fully hides this
// route, not just the live listing page.
//
// The product data itself is now real and database-driven (a real
// `city_services` row + real `products` rows, reconciled against the
// authoritative Excel catalog — see lib/data/flormar-preview.ts) rather
// than the static mock file this page used to import directly. That row's
// `status: 'draft'` is the actual privacy mechanism (RLS makes it invisible
// to every public/anon read path) — the noindex/unlinked route above is a
// second, independent layer on top of that, not the only one.
export const metadata: Metadata = {
  title: "Flormar Hargeisa — Private Preview",
  robots: { index: false, follow: false },
};

export default async function FlormarPreviewPage({ params: { locale } }: { params: { locale: Locale } }) {
  const theme = getPartnerTheme("city_service", "flormar-hargeisa");
  if (!theme) notFound();

  const data = await getFlormarPreviewData();
  if (!data) notFound();

  return (
    <>
      <PartnerThemeScope theme={theme}>
        <FlormarStorefront theme={theme} locale={locale} products={data.products} />
        <PartnerPartnershipFooter theme={theme} locale={locale} />
      </PartnerThemeScope>

      {/* HOMEPAGE PROMO PREVIEW — not live. FlormarPromoBanner is not
          mounted on the real homepage (app/[locale]/page.tsx) yet; this is
          the only place it renders, purely so it can be reviewed before
          the project owner approves publishing it there. Rendered outside
          PartnerThemeScope on purpose, in plain Go Hargeisa page chrome, to
          show exactly how it would look sitting on the real homepage. */}
      <div className="border-t-4 border-dashed border-amber-400 bg-amber-50 py-10 dark:bg-amber-950/20">
        <p className="mx-auto max-w-2xl px-5 text-center text-xs font-bold uppercase tracking-[0.2em] text-amber-700 dark:text-amber-400">
          Homepage promo preview — not published to the real homepage
        </p>
        <FlormarPromoBanner locale={locale} />
      </div>
    </>
  );
}
