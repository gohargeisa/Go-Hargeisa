import type { Metadata } from "next";
import Link from "next/link";
import { History, HeartHandshake, ShieldCheck, Wallet } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getAttractions } from "@/lib/data/attractions";
import { AttractionsHero } from "@/components/attractions/attractions-hero";
import { AttractionsPageClient } from "@/components/attractions/attractions-page-client";
import { FeatureGrid } from "@/components/shared/feature-grid";
import { CTASection } from "@/components/shared/cta-section";
import { Reveal } from "@/components/home/reveal";

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
    title: "Tourist Attractions in Hargeisa",
    description: "Landmarks, museums, markets and nature spots to visit in Hargeisa, Somaliland.",
    alternates: localeAlternates(locale as Locale, "/attractions"),
  };
}

export default async function AttractionsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: Locale };
  searchParams: { q?: string };
}) {
  const t = await getTranslations({ locale, namespace: "home" });
  const tp = await getTranslations({ locale, namespace: "attractionsPage" });
  const attractions = await getAttractions({ q: searchParams.q });

  const whyVisitItems = [
    { icon: History, title: tp("whyHistoryTitle"), body: tp("whyHistoryBody") },
    { icon: HeartHandshake, title: tp("whyCultureTitle"), body: tp("whyCultureBody") },
    { icon: ShieldCheck, title: tp("whySafetyTitle"), body: tp("whySafetyBody") },
    { icon: Wallet, title: tp("whyValueTitle"), body: tp("whyValueBody") },
  ];

  return (
    <>
      <AttractionsHero
        eyebrow={t("attractionsEyebrow")}
        title={t("attractionsTitle")}
        subtitle={tp("heroSubtitle")}
        exploreLabel={tp("heroExplore")}
        scrollHint={tp("scrollHint")}
      />

      <AttractionsPageClient locale={locale} attractions={attractions} />

      {/* Why Visit Hargeisa — editorial section */}
      <section className="bg-white py-16 dark:bg-white/[0.03] md:py-24">
        <div className="container-px mx-auto">
          <Reveal>
            <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary-800">
                {tp("whyVisitEyebrow")}
              </span>
              <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
                {tp("whyVisitTitle")}
              </h2>
              <p className="mt-2 text-ink/60 dark:text-sand/60">{tp("whyVisitSubtitle")}</p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <FeatureGrid items={whyVisitItems} columns={4} />
          </Reveal>
        </div>
      </section>

      {/* CTA before footer */}
      <section className="container-px mx-auto py-16 md:py-24">
        <CTASection title={tp("ctaTitle")} subtitle={tp("ctaSubtitle")}>
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href={`/${locale}/hotels`}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-accent px-7 py-3.5 text-sm font-semibold text-white shadow-[0_10px_25px_rgba(0,0,0,0.2)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-accent-600 hover:shadow-[0_14px_30px_rgba(0,0,0,0.28)]"
            >
              {tp("ctaBookHotel")}
            </Link>
            <Link
              href={`/${locale}/restaurants`}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/20"
            >
              {tp("ctaFindRestaurants")}
            </Link>
          </div>
        </CTASection>
      </section>
    </>
  );
}
