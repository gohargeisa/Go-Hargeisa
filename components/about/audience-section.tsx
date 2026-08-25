import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Home, Plane, Briefcase, ArrowRight, type LucideIcon } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { Reveal } from "@/components/home/reveal";

interface AudienceCard {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
  cta?: string;
}

/** "For People Who Call Hargeisa Home" / "For Visitors & Diaspora" / "For
 * Businesses" — three audiences the platform serves, per the About page
 * spec. Only the Businesses card carries a CTA (to /join); the other two
 * are purely descriptive, matching real, already-shipped capabilities. */
export async function AudienceSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "about" });

  const cards: AudienceCard[] = [
    {
      icon: Home,
      eyebrow: t("audienceResidentsEyebrow"),
      title: t("audienceResidentsTitle"),
      body: t("audienceResidentsBody"),
    },
    {
      icon: Plane,
      eyebrow: t("audienceVisitorsEyebrow"),
      title: t("audienceVisitorsTitle"),
      body: t("audienceVisitorsBody"),
    },
    {
      icon: Briefcase,
      eyebrow: t("audienceBusinessEyebrow"),
      title: t("audienceBusinessTitle"),
      body: t("audienceBusinessBody"),
      cta: t("audienceBusinessCta"),
    },
  ];

  return (
    <section className="bg-ink/[0.02] py-16 dark:bg-white/[0.02] md:py-24">
      <div className="container-px mx-auto">
        <div className="grid gap-6 lg:grid-cols-3">
          {cards.map(({ icon: Icon, eyebrow, title, body, cta }, i) => (
            <Reveal key={title} delay={i * 0.08}>
              <div className="flex h-full flex-col rounded-3xl border border-ink/8 bg-white p-8 shadow-soft dark:border-white/10 dark:bg-white/[0.03]">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                  <Icon size={22} aria-hidden="true" />
                </span>
                <span className="mt-5 text-xs font-bold uppercase tracking-[0.18em] text-primary-700">{eyebrow}</span>
                <h3 className="mt-2 font-display text-xl font-bold">{title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-ink/65 dark:text-sand/65">{body}</p>
                {cta && (
                  <Link
                    href={`/${locale}/join`}
                    className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary-700 transition-all duration-300 ease-premium hover:gap-2.5"
                  >
                    {cta}
                    <ArrowRight size={15} aria-hidden="true" />
                  </Link>
                )}
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
