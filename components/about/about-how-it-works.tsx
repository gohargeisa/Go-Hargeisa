import { getTranslations } from "next-intl/server";
import { Search, Compass, MessageCircle, CalendarCheck } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { Reveal } from "@/components/home/reveal";

const steps = [
  { icon: Search, key: 1 },
  { icon: Compass, key: 2 },
  { icon: MessageCircle, key: 3 },
  { icon: CalendarCheck, key: 4 },
] as const;

/** About page's "How It Works": Discover / Explore / Connect / Book & Order
 * — the 4-step user journey, distinct from Join's own (business-facing)
 * how-it-works-section.tsx which walks a business through onboarding. */
export async function AboutHowItWorksSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "about" });

  return (
    <section className="container-px mx-auto py-16 md:py-24">
      <Reveal>
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary-800">
            {t("howEyebrow")}
          </span>
          <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">{t("howTitle")}</h2>
        </div>
      </Reveal>

      <div className="relative grid gap-10 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
        <div
          className="pointer-events-none absolute inset-x-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-ink/15 to-transparent dark:via-white/15 lg:block"
          aria-hidden="true"
        />
        {steps.map(({ icon: Icon, key }, i) => (
          <Reveal key={key} delay={i * 0.1} className="relative text-center">
            <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-sand bg-primary-700 text-white shadow-[0_10px_24px_rgba(245,158,11,0.35)] dark:border-ink">
              <Icon size={24} aria-hidden="true" />
            </div>
            <span className="mt-4 inline-block font-display text-sm font-bold uppercase tracking-[0.18em] text-primary-700">
              {t("howStepLabel", { number: key })}
            </span>
            <h3 className="mt-2 font-display text-lg font-bold">{t(`howStep${key}Title` as "howStep1Title")}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink/60 dark:text-sand/60">
              {t(`howStep${key}Description` as "howStep1Description")}
            </p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
