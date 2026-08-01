"use client";

import { useRef } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { m, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, Building2, UtensilsCrossed, Coffee, MapPin, PartyPopper, Users, TrendingUp, Sparkles as SparklesIcon } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/utils/shimmer";
import { AnimatedBackground } from "@/components/shared/animated-background";
import { PrimaryButton, SecondaryButton } from "@/components/shared/buttons";
import { CountdownTimer } from "@/components/diaspora-week/countdown-timer";
import { DIASPORA_WEEK_START_ISO, DIASPORA_WEEK_END_ISO } from "@/lib/config/diaspora-week";

// Fixed positions (not Math.random()) so server-rendered and first-client-
// render markup match exactly — this is a "use client" component, which
// Next still server-renders once before hydrating, so any per-render
// randomness here would trigger a hydration mismatch warning.
const PARTICLES = [
  { left: "6%", top: "18%", size: 5, delay: 0 },
  { left: "14%", top: "62%", size: 3, delay: 0.6 },
  { left: "23%", top: "34%", size: 4, delay: 1.2 },
  { left: "31%", top: "78%", size: 3, delay: 1.8 },
  { left: "40%", top: "12%", size: 5, delay: 0.3 },
  { left: "49%", top: "58%", size: 3, delay: 2.1 },
  { left: "57%", top: "24%", size: 4, delay: 0.9 },
  { left: "65%", top: "70%", size: 3, delay: 1.5 },
  { left: "73%", top: "40%", size: 5, delay: 0.4 },
  { left: "80%", top: "16%", size: 3, delay: 2.4 },
  { left: "87%", top: "64%", size: 4, delay: 1.1 },
  { left: "93%", top: "30%", size: 3, delay: 1.7 },
  { left: "10%", top: "88%", size: 3, delay: 2.7 },
  { left: "60%", top: "88%", size: 4, delay: 0.7 },
] as const;

const QUICK_ACCESS = [
  { emoji: "🏨", icon: Building2, key: "quickHotels", href: "#hotels" },
  { emoji: "🍽", icon: UtensilsCrossed, key: "quickRestaurants", href: "#restaurants" },
  { emoji: "☕", icon: Coffee, key: "quickCafes", href: "#cafes" },
  { emoji: "📍", icon: MapPin, key: "quickAttractions", href: "#attractions" },
  { emoji: "🎉", icon: PartyPopper, key: "quickEvents", href: "#highlights" },
] as const;

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay: 0.08 * i, ease: [0.22, 1, 0.36, 1] },
  }),
};

export function DiasporaWeekHero({ locale }: { locale: Locale }) {
  const t = useTranslations("diasporaWeek");
  const reduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);

  const initial = reduceMotion ? "show" : "hidden";

  const stats = [
    { icon: SparklesIcon, value: t("statDaysValue"), label: t("statDaysLabel") },
    { icon: Users, value: null, label: t("statVisitorsLabel") },
    { icon: TrendingUp, value: null, label: t("statInvestmentLabel") },
    { icon: PartyPopper, value: null, label: t("statCultureLabel") },
  ];

  return (
    <section
      ref={heroRef}
      className="relative flex min-h-[94vh] w-full items-center overflow-hidden pb-16 pt-32 sm:pb-20 sm:pt-36"
    >
      <m.div className="absolute inset-0" style={reduceMotion ? undefined : { y: parallaxY }}>
        <Image
          src="/images/hero-bg.png"
          alt={t("heroImageAlt")}
          fill
          priority
          sizes="100vw"
          placeholder="blur"
          blurDataURL={SHIMMER_BLUR_DATA_URL}
          className={`object-cover ${reduceMotion ? "" : "animate-kenburns"}`}
        />
      </m.div>

      {/* Dark gradient overlay — tuned for AA-contrast white text at every size used below */}
      <div className="absolute inset-0 bg-gradient-to-b from-navy-900/80 via-navy-900/65 to-navy-900/90" />
      <div className="absolute inset-0 bg-hero-gradient" />

      <AnimatedBackground variant="dark" />

      {!reduceMotion && (
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className="absolute rounded-full bg-white/70 animate-float"
              style={{
                left: p.left,
                top: p.top,
                width: p.size,
                height: p.size,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>
      )}

      <div className="container-px relative z-10 mx-auto flex w-full flex-col items-center text-center text-white">
        <m.span
          custom={0}
          initial={initial}
          animate="show"
          variants={fadeUp}
          className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/20"
        >
          <span aria-hidden="true">🇸🇴</span>
          {t("heroBadge")}
        </m.span>

        <m.p
          custom={1}
          initial={initial}
          animate="show"
          variants={fadeUp}
          className="mt-6 text-sm font-semibold uppercase tracking-[0.3em] text-primary-200"
        >
          {t("heroWelcome")}
        </m.p>

        <m.h1
          custom={2}
          initial={initial}
          animate="show"
          variants={fadeUp}
          className="mt-3 max-w-4xl text-balance font-display text-4xl font-bold leading-[1.05] drop-shadow-lg sm:text-5xl md:text-6xl lg:text-7xl"
        >
          {t("heroTitle")}
        </m.h1>

        <m.p
          custom={3}
          initial={initial}
          animate="show"
          variants={fadeUp}
          className="mt-5 text-balance text-base font-semibold text-white/95 sm:text-lg md:text-xl"
        >
          {t("heroDatesLocation")}
        </m.p>

        <m.p
          custom={4}
          initial={initial}
          animate="show"
          variants={fadeUp}
          className="mt-4 max-w-xl text-balance text-lg font-semibold italic text-primary-200 sm:text-xl"
        >
          &ldquo;{t("heroTheme")}&rdquo;
        </m.p>

        <m.p
          custom={5}
          initial={initial}
          animate="show"
          variants={fadeUp}
          className="mt-5 max-w-2xl text-balance text-base leading-7 text-white/85 sm:text-lg"
        >
          {t("heroSubtitle")}
        </m.p>

        <m.div custom={6} initial={initial} animate="show" variants={fadeUp} className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
          <PrimaryButton href={`/${locale}/explore`} size="lg">
            {t("heroCtaPrimary")}
          </PrimaryButton>
          <SecondaryButton
            href="#highlights"
            size="lg"
            className="border-white/40 bg-white/10 text-white backdrop-blur-md hover:border-white hover:bg-white/20 hover:text-white"
          >
            {t("heroCtaSecondary")}
          </SecondaryButton>
        </m.div>

        <m.div custom={7} initial={initial} animate="show" variants={fadeUp} className="mt-11 w-full">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-white/60">{t("countdownLabel")}</p>
          <CountdownTimer
            startIso={DIASPORA_WEEK_START_ISO}
            endIso={DIASPORA_WEEK_END_ISO}
            labels={{
              days: t("countdownDays"),
              hours: t("countdownHours"),
              minutes: t("countdownMinutes"),
              seconds: t("countdownSeconds"),
              live: t("countdownLive"),
              ended: t("countdownEnded"),
            }}
          />
        </m.div>

        <m.div
          custom={8}
          initial={initial}
          animate="show"
          variants={fadeUp}
          className="mt-11 grid w-full max-w-4xl grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
        >
          {stats.map(({ icon: Icon, value, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-5 backdrop-blur-xl transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-white/35 hover:bg-white/15"
            >
              <Icon size={22} className="text-primary-200" aria-hidden="true" />
              {value && <span className="font-display text-2xl font-extrabold tabular-nums">{value}</span>}
              <span className="text-xs font-semibold leading-tight text-white/85">{label}</span>
            </div>
          ))}
        </m.div>

        <m.nav
          custom={9}
          initial={initial}
          animate="show"
          variants={fadeUp}
          aria-label={t("quickAccessAriaLabel")}
          className="mt-8 flex w-full max-w-2xl flex-wrap items-center justify-center gap-2.5"
        >
          {QUICK_ACCESS.map(({ emoji, key, href }) => (
            <a
              key={key}
              href={href}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <span aria-hidden="true">{emoji}</span>
              {t(key)}
            </a>
          ))}
        </m.nav>
      </div>

      {!reduceMotion && (
        <m.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="absolute inset-x-0 bottom-6 z-10 flex flex-col items-center gap-1.5 text-white/80"
          aria-hidden="true"
        >
          <span className="text-[11px] font-medium uppercase tracking-[0.2em]">{t("heroScrollHint")}</span>
          <m.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown size={20} />
          </m.span>
        </m.div>
      )}
    </section>
  );
}
