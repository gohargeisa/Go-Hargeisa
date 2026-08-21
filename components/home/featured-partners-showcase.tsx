import { getTranslations } from "next-intl/server";
import { Reveal } from "@/components/home/reveal";
import { FeaturedPartnersCarousel } from "@/components/home/featured-partners-carousel";
import { FeaturedPartnerCard } from "@/components/home/featured-partner-card";
import type { Locale } from "@/lib/i18n/config";
import type { FeaturedPartnerShowcaseItem } from "@/lib/data/featured-partner-showcase";

/**
 * Homepage "Smart Featured Partners" — data already resolved by the caller
 * (getFeaturedPartnerShowcase), same "page.tsx fetches, section renders"
 * convention every other homepage section already follows (see
 * ExploreHargeisaSection). Renders nothing at all when there are zero
 * featured partners — no fake/placeholder businesses, no empty-state
 * message either, matching the spec's stated preference for hiding the
 * section entirely rather than showing a subtle empty state.
 */
export async function FeaturedPartnersShowcase({ partners, locale }: { partners: FeaturedPartnerShowcaseItem[]; locale: Locale }) {
  if (partners.length === 0) return null;

  const t = await getTranslations({ locale, namespace: "home" });

  return (
    <section className="py-16 md:py-24">
      <div className="container-px mx-auto">
        <Reveal>
          <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary-800">
              {t("featuredPartnersEyebrow")}
            </span>
            <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
              {t("featuredPartnersTitle")}
            </h2>
            <p className="mt-2 text-ink/60 dark:text-sand/60">{t("featuredPartnersSubtitle")}</p>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <FeaturedPartnersCarousel>
            {partners.map((partner) => (
              <FeaturedPartnerCard key={`${partner.listingType}-${partner.id}`} partner={partner} />
            ))}
          </FeaturedPartnersCarousel>
        </Reveal>
      </div>
    </section>
  );
}
