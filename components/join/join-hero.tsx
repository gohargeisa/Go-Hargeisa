import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Hotel, UtensilsCrossed, Coffee, ArrowRight } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { Reveal } from "@/components/home/reveal";
import { FloatingPhoneMockup } from "@/components/join/floating-phone-mockup";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/utils/shimmer";

const businessCards = [
  { icon: Hotel, key: "hotels" as const },
  { icon: UtensilsCrossed, key: "restaurants" as const },
  { icon: Coffee, key: "cafes" as const },
];

export async function JoinHero({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "joinRequest" });
  const tNav = await getTranslations({ locale, namespace: "nav" });

  const stats = [
    { value: t("statBusinessesValue"), label: t("statBusinessesLabel") },
    { value: t("statLanguagesValue"), label: t("statLanguagesLabel") },
    { value: t("statMapValue"), label: t("statMapLabel") },
    { value: t("statApprovalValue"), label: t("statApprovalLabel") },
  ];

  const cardLabel = { hotels: tNav("hotels"), restaurants: tNav("restaurants"), cafes: tNav("cafes") };

  return (
    <section className="relative overflow-hidden pb-12 pt-14 sm:pb-16 sm:pt-20 lg:pb-20 lg:pt-24">
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

      <div className="container-px relative mx-auto grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10">
        <div className="text-center lg:text-start">
          <Reveal>
            <Image
              src="/images/logo.png"
              alt="Go Hargeisa"
              width={520}
              height={180}
              className="mx-auto h-16 w-auto object-contain sm:h-20 md:h-24 lg:mx-0"
            />
          </Reveal>

          <Reveal delay={0.06}>
            <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/85 backdrop-blur-md">
              {t("eyebrow")}
            </span>
          </Reveal>

          <Reveal delay={0.12}>
            <h1 className="mt-6 text-balance font-display text-3xl font-bold leading-[1.12] text-white drop-shadow-[0_2px_16px_rgba(0,0,0,0.35)] sm:text-4xl lg:text-[2.75rem] lg:leading-[1.1]">
              {t("heroHeadline")}
            </h1>
          </Reveal>

          <Reveal delay={0.18}>
            <p className="mx-auto mt-4 max-w-xl text-balance text-base text-white/80 sm:text-lg lg:mx-0">
              {t("heroSubtitle")}
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mx-auto mt-8 grid max-w-lg grid-cols-3 gap-3 lg:mx-0">
              {businessCards.map(({ icon: Icon, key }) => (
                <div
                  key={key}
                  className="rounded-2xl border border-white/15 bg-white/10 p-4 text-center backdrop-blur-xl transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-white/30 hover:bg-white/15"
                >
                  <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-white">
                    <Icon size={19} aria-hidden="true" />
                  </span>
                  <p className="mt-2.5 text-xs font-semibold text-white/90 sm:text-sm">{cardLabel[key]}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="mx-auto mt-9 grid w-full max-w-lg grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-x-6 gap-y-5 sm:max-w-xl lg:mx-0 lg:max-w-none lg:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="flex min-w-0 flex-col items-center text-center">
                  <p className="font-display text-2xl font-bold text-white sm:text-3xl">{stat.value}</p>
                  <p className="mt-0.5 text-xs font-medium text-white/60 sm:text-sm">{stat.label}</p>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal delay={0.36}>
            <a
              href="#registration-form"
              className="mt-9 inline-flex items-center gap-2 rounded-full bg-primary px-9 py-4 text-base font-semibold text-white shadow-[0_10px_30px_rgba(245,158,11,0.4)] transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-[0_16px_44px_rgba(245,158,11,0.5)]"
            >
              {t("heroCtaButton")}
              <ArrowRight size={19} aria-hidden="true" />
            </a>
          </Reveal>
        </div>

        <Reveal delay={0.2} className="mx-auto hidden w-full max-w-sm lg:block">
          <FloatingPhoneMockup
            hotelName={t("mockupHotelName")}
            location={t("mockupLocation")}
            bookNowLabel={t("mockupBookNow")}
          />
        </Reveal>
      </div>
    </section>
  );
}
