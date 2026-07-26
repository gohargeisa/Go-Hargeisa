import Link from "next/link";
import { useTranslations } from "next-intl";
import { Coffee, Sparkles, Handshake, ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { Reveal } from "@/components/home/reveal";

const placeholderCards = [
  { key: "card1", labelKey: "cafesComingSoonCard1Label" },
  { key: "card2", labelKey: "cafesComingSoonCard2Label" },
  { key: "card3", labelKey: "cafesComingSoonCard3Label" },
] as const;

export function CafesComingSoonSection({ locale }: { locale: Locale }) {
  const t = useTranslations("home");

  return (
    <section className="bg-white py-16 dark:bg-white/[0.03] md:py-24">
      <div className="container-px mx-auto">
        <Reveal>
          <div className="relative overflow-hidden rounded-xl3 border border-white/10 bg-gradient-to-br from-ink via-secondary-800 to-ink px-6 py-14 shadow-2xl sm:px-10 md:px-16 md:py-20">
            <div
              className="absolute -top-20 -end-16 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="absolute -bottom-24 -start-16 h-64 w-64 rounded-full bg-accent/15 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative mx-auto max-w-2xl text-center">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
                <Sparkles size={13} aria-hidden="true" />
                {t("cafesComingSoonBadge")}
              </span>

              <h2 className="mt-6 text-balance font-display text-3xl font-bold text-white sm:text-4xl md:text-5xl">
                {t("cafesComingSoonTitle")}
              </h2>

              <p className="mx-auto mt-5 max-w-xl text-balance leading-7 text-white/75 md:text-lg">
                {t("cafesComingSoonDescription")}
              </p>

              <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
                <Link
                  href={`/${locale}/contact`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 sm:w-auto"
                >
                  <Handshake size={16} aria-hidden="true" />
                  {t("cafesComingSoonPartnerButton")}
                </Link>
                <Link
                  href={`/${locale}/hotels`}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/15 sm:w-auto"
                >
                  {t("cafesComingSoonExploreButton")}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </div>
            </div>

            <div className="relative mt-14 grid gap-5 sm:grid-cols-3">
              {placeholderCards.map(({ key, labelKey }) => (
                <div
                  key={key}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/15 bg-white/5 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-white/30 hover:bg-white/10 hover:shadow-2xl"
                >
                  <div className="relative h-40 overflow-hidden bg-gradient-to-br from-primary/30 via-secondary-700/40 to-transparent">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Coffee
                        size={44}
                        strokeWidth={1.5}
                        className="text-white/25 transition-transform duration-500 group-hover:scale-110"
                        aria-hidden="true"
                      />
                    </div>
                    <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-white backdrop-blur-sm">
                      {t("cafesComingSoonBadge")}
                    </span>
                  </div>

                  <div className="flex flex-1 flex-col p-5">
                    <span className="text-xs font-semibold uppercase tracking-wide text-primary-300">
                      {t(labelKey)}
                    </span>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-white/70">
                      {t("cafesComingSoonCardText")}
                    </p>
                    <button
                      type="button"
                      disabled
                      aria-disabled="true"
                      title={t("cafesComingSoonBadge")}
                      className="mt-5 inline-flex w-full cursor-not-allowed items-center justify-center rounded-full border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white/50"
                    >
                      {t("cafesComingSoonViewDetails")}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
