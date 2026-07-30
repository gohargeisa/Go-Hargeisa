import { getTranslations } from "next-intl/server";
import { FileEdit, ClipboardCheck, Rocket } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { Reveal } from "@/components/home/reveal";

const steps = [
  { icon: FileEdit, key: 1 },
  { icon: ClipboardCheck, key: 2 },
  { icon: Rocket, key: 3 },
] as const;

export async function HowItWorksSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "joinRequest" });

  return (
    <section className="bg-ink/[0.02] py-20 dark:bg-white/[0.02] sm:py-24">
      <div className="container-px mx-auto">
        <Reveal>
          <h2 className="text-balance text-center font-display text-3xl font-bold sm:text-4xl">{t("howItWorksTitle")}</h2>
        </Reveal>

        <div className="relative mt-16 grid gap-10 sm:grid-cols-3 sm:gap-6">
          {/* Connecting line, desktop only */}
          <div className="pointer-events-none absolute inset-x-0 top-8 hidden h-px bg-gradient-to-r from-transparent via-ink/15 to-transparent dark:via-white/15 sm:block" aria-hidden="true" />

          {steps.map(({ icon: Icon, key }, i) => (
            <Reveal key={key} delay={i * 0.12} className="relative text-center">
              <div className="relative z-10 mx-auto flex h-16 w-16 items-center justify-center rounded-full border-4 border-sand bg-primary text-white shadow-[0_10px_24px_rgba(245,158,11,0.35)] dark:border-ink">
                <Icon size={26} aria-hidden="true" />
              </div>
              <span className="mt-4 inline-block font-display text-sm font-bold uppercase tracking-[0.18em] text-primary">
                {t("stepLabel", { number: key })}
              </span>
              <h3 className="mt-2 font-display text-xl font-bold">{t(`step${key}Title` as "step1Title")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/60 dark:text-sand/60">{t(`step${key}Description` as "step1Description")}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
