import { getTranslations } from "next-intl/server";
import { ShieldCheck, Lock, Zap, BadgeDollarSign } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { Reveal } from "@/components/home/reveal";

const trustPoints = [
  { icon: ShieldCheck, key: 1 },
  { icon: Lock, key: 2 },
  { icon: Zap, key: 3 },
  { icon: BadgeDollarSign, key: 4 },
] as const;

export async function TrustSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "joinRequest" });

  return (
    <section className="container-px mx-auto py-16 sm:py-20">
      <Reveal>
        <h2 className="text-balance text-center font-display text-2xl font-bold sm:text-3xl">{t("trustTitle")}</h2>
      </Reveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {trustPoints.map(({ icon: Icon, key }, i) => (
          <Reveal key={key} delay={i * 0.06}>
            <div className="flex h-full flex-col items-center gap-3 rounded-2xl border border-ink/8 bg-white p-6 text-center shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent-600">
                <Icon size={20} aria-hidden="true" />
              </span>
              <h3 className="font-display text-base font-bold">{t(`trust${key}Title` as "trust1Title")}</h3>
              <p className="text-xs leading-relaxed text-ink/55 dark:text-sand/55">{t(`trust${key}Description` as "trust1Description")}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
