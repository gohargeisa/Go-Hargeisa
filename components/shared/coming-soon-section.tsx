import Link from "next/link";
import { useTranslations } from "next-intl";
import { Coffee, Handshake, Mail, Sparkles, UtensilsCrossed } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { Reveal } from "@/components/home/reveal";

const icons = { restaurant: UtensilsCrossed, cafe: Coffee } as const;

export function ComingSoonSection({
  type,
  locale,
}: {
  type: "restaurant" | "cafe";
  locale: Locale;
}) {
  const t = useTranslations("comingSoon");
  const Icon = icons[type];
  const title = type === "restaurant" ? t("restaurantsTitle") : t("cafesTitle");
  const description =
    type === "restaurant" ? t("restaurantsDescription") : t("cafesDescription");

  return (
    <section className="container-px mx-auto py-16 md:py-24">
      <Reveal>
        <div className="relative mx-auto max-w-3xl overflow-hidden rounded-xl3 border border-white/10 bg-gradient-to-br from-ink via-secondary-800 to-ink px-6 py-14 text-center shadow-2xl sm:px-10 md:px-16 md:py-16">
          <div
            className="absolute -top-20 -end-16 h-72 w-72 rounded-full bg-primary/20 blur-3xl"
            aria-hidden="true"
          />
          <div
            className="absolute -bottom-24 -start-16 h-64 w-64 rounded-full bg-accent/15 blur-3xl"
            aria-hidden="true"
          />

          <div className="relative mx-auto max-w-xl">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-white backdrop-blur-sm">
              <Sparkles size={13} aria-hidden="true" />
              {t("badge")}
            </span>

            <div className="mx-auto mt-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10 text-white">
              <Icon size={28} strokeWidth={1.75} aria-hidden="true" />
            </div>

            <h2 className="mt-6 text-balance font-display text-3xl font-bold text-white sm:text-4xl">
              {title}
            </h2>

            <p className="mx-auto mt-5 max-w-lg text-balance leading-7 text-white/75 md:text-lg">
              {description}
            </p>

            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link
                href={`/${locale}/contact`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 sm:w-auto"
              >
                <Handshake size={16} aria-hidden="true" />
                {t("partnerButton")}
              </Link>
              <Link
                href={`/${locale}/contact`}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-white/25 bg-white/5 px-6 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/15 sm:w-auto"
              >
                <Mail size={16} aria-hidden="true" />
                {t("contactButton")}
              </Link>
            </div>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
