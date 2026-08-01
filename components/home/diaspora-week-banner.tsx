import { getTranslations } from "next-intl/server";
import { PartyPopper, ArrowUpRight } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { CTASection } from "@/components/shared/cta-section";
import { PrimaryButton } from "@/components/shared/buttons";

/**
 * Promo banner for Somaliland Diaspora Week 2026 — reuses CTASection
 * (the same gradient + blurred-blob panel used by the newsletter and join
 * final-CTA sections) rather than a bespoke design, per the event page's
 * own "use the existing design system" requirement. Gated by
 * lib/config/diaspora-week.ts's DIASPORA_WEEK_END_ISO in app/[locale]/page.tsx
 * — this component itself always renders when mounted.
 */
export async function DiasporaWeekBanner({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "diasporaWeek" });

  return (
    <section className="container-px mx-auto pb-4 pt-8 md:pt-10">
      <CTASection
        tone="dark"
        eyebrow={t("bannerEyebrow")}
        icon={PartyPopper}
        title={t("bannerTitle")}
        subtitle={t("bannerSubtitle")}
      >
        <PrimaryButton href={`/${locale}/diaspora-week-2026`} size="lg" className="bg-white text-primary hover:bg-white/90">
          {t("bannerCta")}
          <ArrowUpRight size={16} aria-hidden="true" />
        </PrimaryButton>
      </CTASection>
    </section>
  );
}
