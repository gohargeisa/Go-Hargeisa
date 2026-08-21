import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { getCityServiceCategories, getCategories } from "@/lib/data/categories";
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
  // The 3 owner-claimable core tables get a fixed-card treatment on this
  // form — a small, justified structural constant (which *tables* have
  // their own dedicated listing type + ownership/claims workflow), not a
  // hardcoded category *name*/icon/label list. Every displayed label/icon
  // below comes live from these categories rows. Attractions/events are
  // deliberately excluded — no owner/claims workflow exists for them.
  // The "other" dropdown's source: every City Services category (Hospitals
  // & Clinics, Pharmacies, ...) — the exact same getCityServiceCategories()
  // the City Services page itself reads from, so there is one source of
  // truth for that taxonomy, not a second copy sourced separately here.
  // The generic `services` vertical (Travel Agencies, Apartments, Real
  // Estate, Electronics, Transportation) has been retired and is no longer
  // offered here.
  const [cityServiceCategories, hotelCategories, restaurantCategories, cafeCategories] = await Promise.all([
    getCityServiceCategories(),
    getCategories("hotels"),
    getCategories("restaurants"),
    getCategories("cafes"),
  ]);
  const serviceCategories = cityServiceCategories;
  const coreCategories = [...hotelCategories, ...restaurantCategories, ...cafeCategories];

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
            <JoinRequestForm locale={locale} serviceCategories={serviceCategories} coreCategories={coreCategories} />
          </div>
        </Reveal>
      </section>

      <TrustSection locale={locale} />
      <JoinFaq />
      <JoinFinalCta locale={locale} />
    </>
  );
}
