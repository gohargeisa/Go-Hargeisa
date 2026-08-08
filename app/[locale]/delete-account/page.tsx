import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Check, ListOrdered, Trash2, Archive, Mail } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { localeAlternates } from "@/lib/i18n/alternates";
import { PremiumPageHero } from "@/components/shared/premium-page-hero";
import { Reveal } from "@/components/home/reveal";

/** Reuses the shared hero photo — same swap-in-place pattern as privacy/page.tsx and terms/page.tsx. */
const DELETE_ACCOUNT_HERO_IMAGE = "/images/hero-bg.png";

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  return {
    title: "Delete Account | Go Hargeisa",
    description: "Delete your Go Hargeisa account permanently.",
    alternates: localeAlternates(locale as Locale, "/delete-account"),
  };
}

export default async function DeleteAccountPage({
  params: { locale },
}: {
  params: { locale: Locale };
}) {
  const t = await getTranslations({ locale, namespace: "deleteAccount" });
  const tFooter = await getTranslations({ locale, namespace: "footer" });

  const steps = [t("step1"), t("step2"), t("step3"), t("step4"), t("step5"), t("step6")];
  const deletedData = [t("dataItem1"), t("dataItem2"), t("dataItem3"), t("dataItem4"), t("dataItem5")];

  return (
    <>
      <PremiumPageHero
        image={DELETE_ACCOUNT_HERO_IMAGE}
        imageAlt="Panoramic view of Hargeisa"
        eyebrow={tFooter("legal")}
        title={t("title")}
        subtitle={t("subtitle")}
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
                  <ListOrdered size={20} aria-hidden="true" />
                </span>
                <h2 className="font-display text-xl font-bold">{t("stepsTitle")}</h2>
              </div>
              <ol className="mt-5 space-y-3">
                {steps.map((step, i) => (
                  <li key={step} className="flex items-start gap-3 text-sm leading-relaxed text-ink/70 dark:text-sand/70">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {i + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          </Reveal>

          <Reveal delay={0.12}>
            <div className="rounded-xl3 border border-ink/8 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-white/[0.03] sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Trash2 size={20} aria-hidden="true" />
                </span>
                <h2 className="font-display text-xl font-bold">{t("dataTitle")}</h2>
              </div>
              <ul className="mt-5 space-y-3">
                {deletedData.map((item) => (
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

          <Reveal delay={0.18}>
            <div className="rounded-xl3 border border-ink/8 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-white/[0.03] sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Archive size={20} aria-hidden="true" />
                </span>
                <h2 className="font-display text-xl font-bold">{t("retentionTitle")}</h2>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink/70 dark:text-sand/70">{t("retentionText")}</p>
            </div>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="rounded-xl3 border border-ink/8 bg-white p-6 shadow-soft dark:border-white/10 dark:bg-white/[0.03] sm:p-8">
              <div className="flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Mail size={20} aria-hidden="true" />
                </span>
                <h2 className="font-display text-xl font-bold">{t("contactTitle")}</h2>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-ink/70 dark:text-sand/70">{t("contactText")}</p>
              <a
                href="mailto:info@gohargeisa.com"
                className="mt-2 inline-block text-sm font-semibold text-primary hover:underline"
              >
                info@gohargeisa.com
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </>
  );
}
