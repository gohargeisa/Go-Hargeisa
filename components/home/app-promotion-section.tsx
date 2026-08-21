import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Smartphone, MapPin, ShoppingBag, Bell } from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { GOOGLE_PLAY_URL } from "@/lib/config/features";
import type { Locale } from "@/lib/i18n/config";

/**
 * Homepage "Go Hargeisa Mobile App" promotion — deliberately NOT a business
 * card (no logo badge, no partner-style CTA button, its own distinct
 * gradient/layout) so it reads as platform-level content, not another
 * listing. Purely promotional: GOOGLE_PLAY_URL is null until a real Google
 * Play listing exists, so the CTA area renders as a plain, non-interactive
 * "Coming Soon" pill — never a clickable link to a URL that doesn't exist
 * yet. The app icon shown is the project's own real PWA icon
 * (public/icons/icon-512.png, already used by manifest.json) — not a
 * fabricated screenshot of app screens that don't exist.
 */
export async function AppPromotionSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "home" });
  const hasLiveListing = !!GOOGLE_PLAY_URL;

  const highlights = [
    { icon: MapPin, key: "appHighlightExplore" as const },
    { icon: ShoppingBag, key: "appHighlightOrder" as const },
    { icon: Bell, key: "appHighlightNotify" as const },
  ];

  return (
    <section className="py-16 md:py-24">
      <div className="container-px mx-auto">
        <Reveal>
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-[32px] border border-secondary/20 bg-gradient-to-br from-ink via-ink to-secondary-900 p-6 shadow-premium-lg sm:p-12 md:p-16">
            <div
              className="pointer-events-none absolute -end-24 -top-24 h-72 w-72 rounded-full bg-secondary/20 blur-3xl"
              aria-hidden="true"
            />
            <div
              className="pointer-events-none absolute -start-16 -bottom-16 h-56 w-56 rounded-full bg-primary/15 blur-3xl"
              aria-hidden="true"
            />

            <div className="relative grid gap-10 md:grid-cols-[auto,1fr] md:items-center md:gap-14">
              <div className="mx-auto flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-white/10 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md md:mx-0 md:h-32 md:w-32">
                <Image
                  src="/icons/icon-512.png"
                  alt="Go Hargeisa"
                  width={96}
                  height={96}
                  className="h-full w-full rounded-2xl object-contain"
                />
              </div>

              <div className="text-center md:text-start">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                  <Smartphone size={13} aria-hidden="true" />
                  {t("appPromoEyebrow")}
                </span>

                <h2 className="mt-4 text-balance font-display text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-[2.75rem]">
                  {t("appPromoTitle")}
                </h2>

                <p className="mx-auto mt-4 max-w-xl text-balance text-base leading-7 text-white/70 md:mx-0 md:text-lg">
                  {t("appPromoDescription")}
                </p>

                <ul className="mx-auto mt-7 flex max-w-md flex-col gap-3 md:mx-0">
                  {highlights.map(({ icon: Icon, key }) => (
                    <li key={key} className="flex items-center justify-center gap-2.5 text-sm text-white/80 md:justify-start">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10">
                        <Icon size={15} aria-hidden="true" />
                      </span>
                      {t(key)}
                    </li>
                  ))}
                </ul>

                <div className="mt-8">
                  {hasLiveListing ? (
                    <a
                      href={GOOGLE_PLAY_URL!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2.5 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-ink shadow-[0_12px_30px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(0,0,0,0.3)]"
                    >
                      {t("appPromoGetItOnGooglePlay")}
                    </a>
                  ) : (
                    <span className="inline-flex items-center gap-2 rounded-2xl border border-white/25 bg-white/5 px-5 py-3 text-sm font-semibold text-white/85">
                      <span className="relative flex h-2 w-2 shrink-0">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
                        <span className="relative inline-flex h-2 w-2 rounded-full bg-secondary" />
                      </span>
                      {t("appPromoComingSoon")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
