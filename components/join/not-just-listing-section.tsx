import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Check } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { BRAND_LOGO } from "@/lib/config/brand";
import { Reveal } from "@/components/home/reveal";

const POINTS = ["notListingPoint1", "notListingPoint2", "notListingPoint3", "notListingPoint4"] as const;

/** "More Than a Business Listing" — illustrates the real Go Hargeisa ×
 * partner lockup (see components/shared/partner/partner-status-section.tsx,
 * which renders this exact badge on a business's own live page) using a
 * placeholder "[YOUR LOGO]" box rather than any real business's logo, since
 * this page isn't scoped to one business. The note under the badge is
 * explicit that it only appears post-approval — never implies every
 * applicant gets it automatically. */
export async function NotJustListingSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "joinRequest" });

  return (
    <section className="bg-ink/[0.02] py-16 dark:bg-white/[0.02] sm:py-24">
      <div className="container-px mx-auto grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
        <Reveal>
          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-primary-800">
            {t("notListingEyebrow")}
          </span>
          <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">
            {t("notListingTitle")}
          </h2>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-ink/70 dark:text-sand/70">{t("notListingBody")}</p>
          <ul className="mt-6 space-y-3">
            {POINTS.map((key) => (
              <li key={key} className="flex items-start gap-2.5 text-sm text-ink/70 dark:text-sand/70">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check size={12} aria-hidden="true" />
                </span>
                {t(key)}
              </li>
            ))}
          </ul>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="mx-auto flex max-w-sm flex-col items-center gap-6 rounded-3xl border border-ink/8 bg-white p-10 text-center shadow-card dark:border-white/10 dark:bg-white/[0.03]">
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-ink/40 dark:text-sand/40">
              {t("notListingLockupLabel")}
            </span>
            <div className="flex items-center gap-4">
              <div className="relative h-12 w-32">
                <Image src={BRAND_LOGO.light} alt="Go Hargeisa" fill sizes="128px" className="object-contain" />
              </div>
              <span className="text-2xl font-light text-ink/30 dark:text-sand/30" aria-hidden="true">
                ×
              </span>
              <div className="flex h-12 w-32 items-center justify-center rounded-lg border border-dashed border-ink/20 text-center text-[10px] font-semibold uppercase tracking-wide text-ink/40 dark:border-white/20 dark:text-sand/40">
                {t("notListingYourLogo")}
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-[0.18em] text-primary-700 dark:bg-primary/20 dark:text-primary-300">
              {t("notListingBadge")}
            </span>
            <p className="text-xs text-ink/45 dark:text-sand/45">{t("notListingBadgeNote")}</p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
