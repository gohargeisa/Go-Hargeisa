import { getTranslations } from "next-intl/server";
import { ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { Reveal } from "@/components/home/reveal";

export async function JoinFinalCta({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "joinRequest" });

  return (
    <section className="container-px mx-auto pb-20 sm:pb-28">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary via-primary-600 to-navy-700 px-8 py-16 text-center shadow-premium-lg sm:px-16 sm:py-20">
          <div className="pointer-events-none absolute -top-16 -start-16 h-64 w-64 rounded-full bg-white/10 blur-3xl" aria-hidden="true" />
          <div className="pointer-events-none absolute -bottom-20 -end-10 h-72 w-72 rounded-full bg-navy/25 blur-3xl" aria-hidden="true" />

          <h2 className="relative text-balance font-display text-3xl font-bold text-white sm:text-4xl">{t("finalCtaTitle")}</h2>
          <p className="relative mx-auto mt-4 max-w-xl text-balance text-base text-white/90 sm:text-lg">{t("finalCtaSubtitle")}</p>

          <a
            href="#registration-form"
            className="relative mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-semibold text-primary-700 shadow-xl transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:shadow-2xl sm:text-base"
          >
            {t("finalCtaButton")}
            <ArrowRight size={18} aria-hidden="true" />
          </a>

          <p className="relative mx-auto mt-8 text-balance text-xs font-bold uppercase tracking-[0.14em] text-white/60">{t("finalCtaMobileTitle")}</p>
          <p className="relative mx-auto mt-2 max-w-lg text-balance text-xs text-white/70 sm:text-sm">{t("finalCtaMobileNote")}</p>
        </div>
      </Reveal>
    </section>
  );
}
