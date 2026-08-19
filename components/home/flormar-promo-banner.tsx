"use client";

import Link from "next/link";
import { Sparkles, ArrowUpRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { m, useReducedMotion } from "framer-motion";
import { getPartnerTheme } from "@/lib/config/partner-themes";
import type { Locale } from "@/lib/i18n/config";

/**
 * Homepage-shaped Flormar promo card — same slot/weight as
 * BusinessJoinBanner (components/home/business-join-banner.tsx), themed
 * with FLORMAR_THEME's own rose/gold palette instead of the site's amber
 * default, so it reads as "a specific partner's ad," not another generic
 * platform CTA. Copy is deliberately honest about being unpublished (see
 * the `disclaimer` string) — no invented launch date, discount, or claim
 * that shopping is live today.
 *
 * NOT mounted on the real homepage (app/[locale]/page.tsx) yet — per the
 * project owner's explicit instruction, this only renders inside the
 * private, unlisted /preview/flormar route until publication is approved.
 * Wiring it into the real homepage later is a one-line import + JSX add
 * in page.tsx; nothing here needs to change to do that.
 */
export function FlormarPromoBanner({ locale }: { locale: Locale }) {
  const t = useTranslations("flormarPromoBanner");
  const reduceMotion = useReducedMotion();
  const theme = getPartnerTheme("city_service", "flormar-hargeisa");
  if (!theme) return null;

  return (
    <section className="container-px mx-auto pb-6 pt-8 md:pt-10">
      <m.div
        initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
        whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-80px" }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative overflow-hidden rounded-[2.5rem] px-6 py-14 text-center shadow-premium-lg sm:px-12 sm:py-16"
        style={{ background: `linear-gradient(150deg, ${theme.primaryDeep} 0%, ${theme.primary} 55%, ${theme.primaryMid} 100%)` }}
      >
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1.5px)", backgroundSize: "26px 26px" }}
        />

        <div className="relative mx-auto max-w-xl">
          <span
            className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em]"
            style={{ borderColor: `rgba(${theme.accentRgb}, 0.6)`, color: theme.accentSoft }}
          >
            <Sparkles size={12} aria-hidden="true" />
            {t("badge")}
          </span>

          <h2 className="mt-5 text-balance font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {t("headline")}
          </h2>

          <p className="mx-auto mt-4 max-w-md text-balance text-base leading-7 text-white/85">
            {t("subtitle")}
          </p>

          <div className="mt-8 flex items-center justify-center">
            <Link
              href={`/${locale}/preview/flormar`}
              className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5"
              style={{ backgroundColor: theme.accentStrong }}
            >
              {t("cta")}
              <ArrowUpRight size={16} aria-hidden="true" className="transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </div>

          <p className="mt-6 text-xs font-medium text-white/60">{t("disclaimer")}</p>
        </div>
      </m.div>
    </section>
  );
}
