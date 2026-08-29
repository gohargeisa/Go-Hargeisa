import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { MapPin, ShoppingBag, CalendarCheck } from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { GOOGLE_PLAY_URL } from "@/lib/config/features";
import type { Locale } from "@/lib/i18n/config";

/**
 * Homepage "Go Hargeisa Mobile App" section. The Android app went live on
 * Google Play (Early Access) on 2026-08-29 — this section now links its CTA
 * straight to the real listing (GOOGLE_PLAY_URL in lib/config/features.ts)
 * instead of the old non-interactive "Coming Soon" pill it showed while the
 * app was unpublished.
 *
 * The hero visual is the marketing image supplied for this launch
 * (public/images/google-play.png — the Hargeisa airplane monument, an
 * Android phone mockup of the real app UI, and Explore/Order/Book feature
 * icons, all already composed into one image). It replaces the previous
 * from-scratch phone-mockup markup entirely — per the asset brief, nothing
 * is layered on top of it (no second phone, no floating cards), it's shown
 * at its native 3:2 aspect ratio via `object-contain` so it's never cropped
 * or distorted, and the two floating "Booking Confirmed"/"New Place
 * Discovered" notification cards (tied to that old mockup) are gone with
 * it. The Explore/Order/Book highlights are still rendered as real,
 * translated text in the left column even though the image already shows
 * them as pixels, because the image's labels are English-only and can't
 * follow the page's locale.
 */
export async function AppPromotionSection({ locale }: { locale: Locale }) {
  const t = await getTranslations({ locale, namespace: "home" });

  const highlights = [
    { icon: MapPin, key: "appHighlightExplore" as const },
    { icon: ShoppingBag, key: "appHighlightOrder" as const },
    { icon: CalendarCheck, key: "appHighlightBook" as const },
  ];

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Sophisticated Go Hargeisa background — deep ink→secondary gradient,
          a soft glow anchored behind the hero visual, and a very faint
          dotted "map" texture for a subtle Hargeisa-discovery cue. No
          generic SaaS purple/blue, no literal (unverified) landmarks. */}
      <div className="absolute inset-0 bg-gradient-to-br from-ink via-ink to-secondary-900" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1px)", backgroundSize: "26px 26px" }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute end-[-10%] top-1/2 h-[560px] w-[560px] -translate-y-1/2 rounded-full bg-primary/20 blur-[120px]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute start-[-15%] bottom-[-15%] h-[420px] w-[420px] rounded-full bg-navy/30 blur-[110px]"
        aria-hidden="true"
      />

      <div className="container-px relative mx-auto">
        <div className="grid items-center gap-16 lg:grid-cols-2 lg:gap-10">
          {/* LEFT — copy */}
          <Reveal>
            <div className="text-center lg:text-start">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-white/80">
                {t("appPromoEyebrow")}
              </span>

              <h2 className="mt-5 text-balance font-display text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.25rem] lg:leading-[1.05]">
                {t("appPromoTitle")}
              </h2>

              <p className="mx-auto mt-5 max-w-lg text-balance text-base leading-7 text-white/70 lg:mx-0 lg:text-lg">
                {t("appPromoDescription")}
              </p>

              <ul className="mx-auto mt-8 grid max-w-md grid-cols-1 gap-2.5 sm:grid-cols-3 lg:mx-0">
                {highlights.map(({ icon: Icon, key }) => (
                  <li
                    key={key}
                    className="flex items-center justify-center gap-2 rounded-xl2 border border-white/10 bg-white/5 px-3 py-2.5 text-center text-xs font-semibold text-white/80 sm:flex-col sm:gap-1.5 sm:py-4"
                  >
                    <Icon size={15} className="shrink-0 text-primary-300" aria-hidden="true" />
                    <span>{t(key)}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-9 flex flex-col items-center gap-3 lg:items-start">
                <a
                  href={GOOGLE_PLAY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-3 text-ink shadow-[0_16px_40px_rgba(0,0,0,0.3)] transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:shadow-[0_20px_46px_rgba(0,0,0,0.35)]"
                >
                  <PlayBadgeIcon />
                  <span className="text-sm font-bold sm:text-base">{t("appPromoDownloadCta")}</span>
                </a>
                <p className="text-xs font-medium text-white/60">{t("appPromoAvailableNow")}</p>
              </div>
            </div>
          </Reveal>

          {/* RIGHT — launch visual */}
          <Reveal delay={0.1} y={32}>
            <div className="relative mx-auto aspect-[3/2] w-full max-w-xl overflow-hidden rounded-3xl shadow-[0_40px_80px_rgba(0,0,0,0.45)]">
              <Image
                src="/images/google-play.png"
                alt={t("appPromoTitle")}
                fill
                sizes="(min-width: 1024px) 50vw, 100vw"
                className="object-contain"
                priority
              />
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/** Generic, original "play" glyph — not a reproduction of Google's actual
 * trademarked Play Store icon/badge artwork, which this project has no
 * license to use. Just a rounded triangle-in-circle, the same visual
 * shorthand app-availability indicators commonly use. */
function PlayBadgeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="11" className="fill-ink" />
      <path d="M9.5 7.5L16.5 12L9.5 16.5V7.5Z" className="fill-white" />
    </svg>
  );
}
