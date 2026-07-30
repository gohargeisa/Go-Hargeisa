import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { JoinRequestForm } from "@/components/shared/join-request-form";
import { JoinHero } from "@/components/join/join-hero";
import { WhyJoinSection } from "@/components/join/why-join-section";
import { HowItWorksSection } from "@/components/join/how-it-works-section";
import { TrustSection } from "@/components/join/trust-section";
import { JoinFaq } from "@/components/join/join-faq";
import { JoinFinalCta } from "@/components/join/join-final-cta";
import { Reveal } from "@/components/home/reveal";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "List Your Business — Go Hargeisa",
    description: "Apply to list your hotel, restaurant, or café on Go Hargeisa.",
    alternates: localeAlternates(locale as Locale, "/join"),
  };
}

export default async function JoinPage({ params: { locale } }: { params: { locale: Locale } }) {
  const t = await getTranslations({ locale, namespace: "joinRequest" });

  return (
    <>
      <JoinHero locale={locale} />
      <WhyJoinSection locale={locale} />
      <HowItWorksSection locale={locale} />

      <section id="registration-form" className="container-px mx-auto max-w-2xl scroll-mt-20 py-20 sm:py-24">
        <Reveal>
          <div className="text-center">
            <h2 className="text-balance font-display text-3xl font-bold sm:text-4xl">{t("formSectionTitle")}</h2>
            <p className="mt-3 text-balance text-ink/60 dark:text-sand/60">{t("formSectionSubtitle")}</p>
          </div>
        </Reveal>

        <Reveal delay={0.1} className="mt-10">
          <div className="rounded-[2rem] border border-ink/8 bg-white p-6 shadow-card dark:border-white/10 dark:bg-white/[0.03] sm:p-9">
            <JoinRequestForm />
          </div>
        </Reveal>
      </section>

      <TrustSection locale={locale} />
      <JoinFaq />
      <JoinFinalCta locale={locale} />
    </>
  );
}
