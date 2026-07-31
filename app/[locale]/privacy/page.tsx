import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Check, Mail, ShieldCheck, Sliders } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { PremiumPageHero } from "@/components/shared/premium-page-hero";
import { Reveal } from "@/components/home/reveal";

/** Reuses the shared hero photo — same swap-in-place pattern as attractions-hero.tsx / about-hero.tsx. */
const PRIVACY_HERO_IMAGE = "/images/hero-bg.png";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Privacy Policy — Go Hargeisa",
    alternates: localeAlternates(locale as Locale, "/privacy"),
  };
}

export default async function PrivacyPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const t = await getTranslations({ locale, namespace: "privacy" });
  const tFooter = await getTranslations({ locale, namespace: "footer" });

  const infoItems = [t("infoItem1"), t("infoItem2"), t("infoItem3"), t("infoItem4")];

  return (
    <>
      <PremiumPageHero
        image={PRIVACY_HERO_IMAGE}
        imageAlt="Panoramic view of Hargeisa"
        eyebrow={tFooter("legal")}
        title={t("title")}
        subtitle={t("lastUpdated")}
        scrollHint={t("scrollHint")}
      />

      <section className="container-px mx-auto max-w-3xl py-16 md:py-24">
        <Reveal>
          <p className="text-base leading-relaxed text-ink/70 dark:text-sand/70">{t("intro")}</p>
        </Reveal>

        <div className="mt-10 space-y-6">
          <Reveal delay={0.06}>
            <div className="rounded-xl3 border border-ink/8 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-white/[0.03] sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <ShieldCheck size={20} aria-hidden="true" />
                </span>
                <h2 className="font-display text-xl font-bold">{t("infoTitle")}</h2>
              </div>
              <ul className="mt-5 space-y-3">
                {infoItems.map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-sm leading-relaxed text-ink/70 dark:text-sand/70">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check size={11} aria-hidden="true" />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="rounded-xl3 border border-ink/8 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-white/[0.03] sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Sliders size={20} aria-hidden="true" />
                </span>
                <h2 className="font-display text-xl font-bold">{t("useTitle")}</h2>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink/70 dark:text-sand/70">{t("useText")}</p>
            </div>
          </Reveal>

          <Reveal delay={0.18}>
            <div className="rounded-xl3 border border-ink/8 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-white/[0.03] sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Mail size={20} aria-hidden="true" />
                </span>
                <h2 className="font-display text-xl font-bold">{t("contactTitle")}</h2>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink/70 dark:text-sand/70">{t("contactText")}</p>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
