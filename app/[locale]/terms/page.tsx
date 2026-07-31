import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { FileText, Mail, ShieldAlert, UserCog } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { PremiumPageHero } from "@/components/shared/premium-page-hero";
import { Reveal } from "@/components/home/reveal";

/** Reuses the shared hero photo — same swap-in-place pattern as attractions-hero.tsx / about-hero.tsx. */
const TERMS_HERO_IMAGE = "/images/hero-bg.png";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Terms of Service — Go Hargeisa",
    alternates: localeAlternates(locale as Locale, "/terms"),
  };
}

export default async function TermsPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const t = await getTranslations({ locale, namespace: "terms" });
  const tFooter = await getTranslations({ locale, namespace: "footer" });

  const sections = [
    { icon: FileText, title: t("useOfContentTitle"), body: t("useOfContentText") },
    { icon: UserCog, title: t("userAccountsTitle"), body: t("userAccountsText") },
    { icon: ShieldAlert, title: t("liabilityTitle"), body: t("liabilityText") },
    { icon: Mail, title: t("contactTitle"), body: t("contactText") },
  ];

  return (
    <>
      <PremiumPageHero
        image={TERMS_HERO_IMAGE}
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
          {sections.map(({ icon: Icon, title, body }, i) => (
            <Reveal key={title} delay={Math.min(0.06 + i * 0.06, 0.24)}>
              <div className="rounded-xl3 border border-ink/8 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-white/[0.03] sm:p-8">
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Icon size={20} aria-hidden="true" />
                  </span>
                  <h2 className="font-display text-xl font-bold">{title}</h2>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-ink/70 dark:text-sand/70">{body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
