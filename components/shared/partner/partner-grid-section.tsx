import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BadgeCheck, ImageOff } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { getFeaturedPartnerShowcase } from "@/lib/data/featured-partner-showcase";
import { Reveal } from "@/components/home/reveal";
import { PrimaryButton } from "@/components/shared/buttons";

/**
 * Reusable "Our Partners" (About) / "All Partners" (Join) grid — every card
 * comes straight from getFeaturedPartnerShowcase(), the same real,
 * DB-driven (`is_partner = true`) query the homepage's Featured Partners
 * section already uses. No hardcoded business names/logos: an empty result
 * renders an honest "no partners yet" state instead of a fabricated list.
 */
export async function PartnerGridSection({
  locale,
  eyebrow,
  title,
  subtitle,
  ctaLabel,
}: {
  locale: Locale;
  eyebrow: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
}) {
  const [partners, t] = await Promise.all([
    getFeaturedPartnerShowcase(locale, 30),
    getTranslations({ locale, namespace: "partnerFooter" }),
  ]);

  return (
    <section className="container-px mx-auto py-16 md:py-24">
      <Reveal>
        <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary-800">
            {eyebrow}
          </span>
          <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">{title}</h2>
          <p className="mt-2 text-ink/60 dark:text-sand/60">{subtitle}</p>
        </div>
      </Reveal>

      {partners.length > 0 ? (
        <Reveal delay={0.1}>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {partners.map((p) => {
              const img = p.logo || p.image || null;
              return (
                <Link
                  key={`${p.listingType}-${p.id}`}
                  href={p.href}
                  className="group flex flex-col items-center gap-3 rounded-2xl border border-ink/8 bg-white p-6 text-center shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-card dark:border-white/10 dark:bg-white/[0.03]"
                >
                  {img ? (
                    <div className="relative h-14 w-full">
                      <Image src={img} alt={p.name} fill sizes="160px" className="object-contain" />
                    </div>
                  ) : (
                    <div className="flex h-14 w-full items-center justify-center text-ink/25 dark:text-sand/25">
                      <ImageOff size={22} aria-hidden="true" />
                    </div>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-[9px] font-bold uppercase tracking-wide text-primary-700 dark:bg-primary/20 dark:text-primary-300">
                    <BadgeCheck size={10} aria-hidden="true" />
                    {t("officialPartnerBadge")}
                  </span>
                  <p className="line-clamp-1 text-sm font-semibold">{p.name}</p>
                </Link>
              );
            })}
          </div>
        </Reveal>
      ) : (
        <Reveal delay={0.1}>
          <div className="mx-auto max-w-md rounded-2xl border border-dashed border-ink/15 bg-ink/[0.02] p-8 text-center dark:border-white/15 dark:bg-white/[0.02]">
            <p className="font-display text-lg font-bold">{t("noPartnersYetTitle")}</p>
            <p className="mt-2 text-sm text-ink/60 dark:text-sand/60">{t("noPartnersYetBody")}</p>
          </div>
        </Reveal>
      )}

      <div className="mt-10 flex justify-center">
        <PrimaryButton href={`/${locale}/join`}>{ctaLabel}</PrimaryButton>
      </div>
    </section>
  );
}
