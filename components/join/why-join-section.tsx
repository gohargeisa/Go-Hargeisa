import { getTranslations } from "next-intl/server";
import { Eye, Users, Map, MessageCircle, CalendarCheck, BadgeCheck } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { Reveal } from "@/components/home/reveal";

const benefits = [
  { icon: Eye, key: 1 },
  { icon: Users, key: 2 },
  { icon: Map, key: 3 },
  { icon: MessageCircle, key: 4 },
  { icon: CalendarCheck, key: 5 },
  { icon: BadgeCheck, key: 6 },
] as const;

export async function WhyJoinSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "joinRequest" });

  return (
    <section className="container-px mx-auto py-20 sm:py-24">
      <Reveal>
        <h2 className="text-balance text-center font-display text-3xl font-bold sm:text-4xl">{t("whyJoinTitle")}</h2>
      </Reveal>

      <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {benefits.map(({ icon: Icon, key }, i) => (
          <Reveal key={key} delay={i * 0.06}>
            <div className="group h-full rounded-3xl border border-ink/8 bg-white p-7 shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1.5 hover:shadow-card dark:border-white/10 dark:bg-white/[0.03]">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary transition-transform duration-300 ease-premium group-hover:scale-110">
                <Icon size={22} aria-hidden="true" />
              </span>
              <h3 className="mt-5 font-display text-lg font-bold">{t(`benefit${key}Title` as "benefit1Title")}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/60 dark:text-sand/60">
                {t(`benefit${key}Description` as "benefit1Description")}
              </p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
