import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Eye, TrendingUp, BadgeCheck, LayoutDashboard, ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { Reveal } from "@/components/home/reveal";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/utils/shimmer";

const BENEFITS = [
  { icon: Eye, emoji: "🏨", key: 1 },
  { icon: TrendingUp, emoji: "📈", key: 2 },
  { icon: BadgeCheck, emoji: "⭐", key: 3 },
  { icon: LayoutDashboard, emoji: "📊", key: 4 },
] as const;

export async function JoinHero({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "joinRequest" });

  return (
    <section className="relative overflow-hidden pb-14 pt-14 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-24">
      {/* Real photo background, dark navy overlay — no flat color fill */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <Image
          src="/images/hero-bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          placeholder="blur"
          blurDataURL={SHIMMER_BLUR_DATA_URL}
          className="object-cover animate-kenburns"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/85 via-navy-800/80 to-navy-900/92" />
        <div className="absolute inset-0 bg-hero-gradient" />
      </div>

      <div className="pointer-events-none absolute -top-24 -end-24 -z-10 h-96 w-96 rounded-full bg-primary/20 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 -start-16 -z-10 h-80 w-80 rounded-full bg-accent/15 blur-3xl" aria-hidden="true" />

      <div className="container-px relative mx-auto max-w-4xl text-center">
        <Reveal>
          <Image
            src="/images/logo-web.png"
            alt="Go Hargeisa"
            width={700}
            height={467}
            className="mx-auto h-16 w-auto object-contain sm:h-20 md:h-24"
          />
        </Reveal>

        <Reveal delay={0.06}>
          <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/85 backdrop-blur-md">
            {t("eyebrow")}
          </span>
        </Reveal>

        <Reveal delay={0.12}>
          <h1 className="mt-6 text-balance font-display text-4xl font-bold leading-[1.1] text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.35)] sm:text-5xl lg:text-6xl">
            {t("heroHeadline")}
          </h1>
        </Reveal>

        <Reveal delay={0.18}>
          <p className="mx-auto mt-5 max-w-2xl text-balance text-base text-white/80 sm:text-lg lg:text-xl">
            {t("heroSubtitle")}
          </p>
        </Reveal>

        <Reveal delay={0.24}>
          <a
            href="#business-type"
            className="mt-9 inline-flex items-center gap-2 rounded-full bg-primary-700 px-9 py-4 text-base font-semibold text-white shadow-[0_10px_30px_rgba(245,158,11,0.4)] transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-800 hover:shadow-[0_16px_44px_rgba(245,158,11,0.5)]"
          >
            {t("heroCtaButton")}
            <ArrowRight size={19} aria-hidden="true" />
          </a>
        </Reveal>

        <Reveal delay={0.3}>
          <div className="mx-auto mt-14 grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-5">
            {BENEFITS.map(({ icon: Icon, emoji, key }) => (
              <div
                key={key}
                className="flex flex-col items-center rounded-2xl border border-white/15 bg-white/10 p-6 text-center backdrop-blur-xl transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-white/30 hover:bg-white/15"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 text-white">
                  <Icon size={22} aria-hidden="true" />
                </span>
                {/* Not a heading — see hero.tsx's category cards for the
                    same reasoning (axe heading-order: nothing between this
                    page's h1 and an h3 otherwise). */}
                <p className="mt-4 font-display text-base font-bold text-white">
                  <span aria-hidden="true">{emoji} </span>
                  {t(`heroBenefit${key}Title` as "heroBenefit1Title")}
                </p>
                <p className="mt-1.5 text-sm text-white/70">{t(`heroBenefit${key}Description` as "heroBenefit1Description")}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
