import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { MapPin, ShoppingBag, Bell, Search, Star, Hotel as HotelIcon, UtensilsCrossed, Coffee, Compass, CalendarCheck, User, CheckCircle2 } from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { AppFloatingCard } from "@/components/home/app-floating-card";
import { GOOGLE_PLAY_URL } from "@/lib/config/features";
import type { Locale } from "@/lib/i18n/config";
import type { Hotel } from "@/types";

/**
 * Homepage "Go Hargeisa Mobile App" section — a premium platform-vision
 * showcase, not a business card. Full redesign (2026-08 pass): the phone
 * mockup is the main visual, built entirely from REAL Go Hargeisa content
 * (no fake app screens) — the real wordmark, the real Hero search copy
 * (`home.searchPlaceholder`), real category icons matching the site's own
 * nav (Hotels/Restaurants/Cafes), and one REAL, already-fetched hotel's
 * real photo/name/rating/price (`previewHotel`, passed from
 * app/[locale]/page.tsx — the same data its own hotel grid renders a few
 * sections down). No image-generation/screenshot tooling exists in this
 * environment and no native app exists yet to screenshot, so this is the
 * only honest way to show "the real product" rather than inventing one.
 *
 * The device bezel is a deliberately generic modern-Android silhouette
 * (punch-hole camera, bottom gesture pill) — no notch, no Dynamic Island,
 * no Apple iconography. Purely decorative (`aria-hidden` +
 * `pointer-events-none`), not a second non-functional copy of real
 * listing links.
 *
 * GOOGLE_PLAY_URL is still null (no live listing) — the availability chip
 * stays a plain, non-interactive "Coming Soon" indicator, never a link to
 * a store page that doesn't exist. It's styled like an app-store
 * availability badge (icon + two-line label) but deliberately doesn't
 * reproduce Google's actual trademarked Play Store badge artwork, which
 * this project has no license to use.
 *
 * The two floating notification-style cards (AppFloatingCard) are hidden
 * below `md` — there isn't enough width next to a usefully large phone on
 * a narrow viewport to add them without either shrinking the phone or
 * risking overflow, and one excellent phone beats a cramped composition.
 */
export async function AppPromotionSection({ locale, previewHotel }: { locale: Locale; previewHotel?: Hotel }) {
  const t = await getTranslations({ locale, namespace: "home" });
  const tNav = await getTranslations({ locale, namespace: "nav" });
  // "searchPlaceholder" actually lives under the "hero" namespace (the
  // real homepage search bar in components/home/hero.tsx), not "home" —
  // a pre-existing mistake in this component that silently rendered the
  // raw i18n key in the phone mockup's search bar. Fixed here.
  const th = await getTranslations({ locale, namespace: "hero" });
  const hasLiveListing = !!GOOGLE_PLAY_URL;

  const highlights = [
    { icon: MapPin, key: "appHighlightExplore" as const },
    { icon: ShoppingBag, key: "appHighlightOrder" as const },
    { icon: Bell, key: "appHighlightNotify" as const },
  ];

  return (
    <section className="relative overflow-hidden py-20 md:py-28">
      {/* Sophisticated Go Hargeisa background — deep ink→secondary gradient,
          a soft glow anchored behind where the phone sits, and a very
          faint dotted "map" texture for a subtle Hargeisa-discovery cue.
          No generic SaaS purple/blue, no literal (unverified) landmarks. */}
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

              <div className="mt-9 flex justify-center lg:justify-start">
                {hasLiveListing ? (
                  <a
                    href={GOOGLE_PLAY_URL!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-3 rounded-2xl bg-white px-5 py-3 text-ink shadow-[0_16px_40px_rgba(0,0,0,0.3)] transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:shadow-[0_20px_46px_rgba(0,0,0,0.35)]"
                  >
                    <PlayBadgeIcon />
                    <span className="text-start leading-tight">
                      <span className="block text-[10px] font-semibold uppercase tracking-wide text-ink/55">{t("appPromoGetItOnGooglePlay")}</span>
                      <span className="block text-sm font-bold">Google Play</span>
                    </span>
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-3 rounded-2xl border border-white/20 bg-white/[0.06] px-5 py-3 backdrop-blur-md">
                    <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/10">
                      <PlayBadgeIcon muted />
                      <span className="absolute -end-1 -top-1 flex h-2.5 w-2.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-primary" />
                      </span>
                    </span>
                    <span className="text-start leading-tight">
                      <span className="block text-[10px] font-bold uppercase tracking-[0.14em] text-primary-300">{t("appPromoComingSoon")}</span>
                      <span className="block text-sm font-bold text-white">Google Play</span>
                    </span>
                  </span>
                )}
              </div>
            </div>
          </Reveal>

          {/* RIGHT — phone + floating cards */}
          <div className="relative flex justify-center lg:justify-end">
            <Reveal delay={0.1} y={32}>
              <div className="relative">
                {previewHotel ? (
                  <div aria-hidden="true" className="pointer-events-none w-[260px] select-none sm:w-[280px]">
                    {/* Generic modern-Android silhouette — dark bezel, centered
                        punch-hole camera, bottom gesture pill. No notch, no
                        Dynamic Island, no OS-specific status bar. */}
                    <div className="relative rounded-[2.75rem] border-[6px] border-ink/90 bg-ink/90 p-2 shadow-[0_40px_80px_rgba(0,0,0,0.5)]">
                      <div className="absolute left-1/2 top-3.5 z-10 h-2 w-2 -translate-x-1/2 rounded-full bg-white/25" />
                      <div className="relative overflow-hidden rounded-[2.1rem] bg-sand">
                        <div className="flex flex-col gap-3 px-3.5 pb-4 pt-6">
                          <div className="flex items-center gap-1.5">
                            <Image src="/images/logo-web.png" alt="" width={64} height={42} className="h-5 w-auto object-contain" />
                          </div>

                          <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
                            <Search size={13} className="shrink-0 text-ink/40" />
                            <span className="truncate text-[11px] text-ink/45">{th("searchPlaceholder")}</span>
                          </div>

                          <div className="flex items-center justify-between px-1">
                            {[
                              { icon: HotelIcon, label: tNav("hotels") },
                              { icon: UtensilsCrossed, label: tNav("restaurants") },
                              { icon: Coffee, label: tNav("cafes") },
                            ].map(({ icon: Icon, label }) => (
                              <span key={label} className="flex flex-col items-center gap-1">
                                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary-700">
                                  <Icon size={15} aria-hidden="true" />
                                </span>
                                <span className="max-w-[54px] truncate text-[8px] font-semibold text-ink/55">{label}</span>
                              </span>
                            ))}
                          </div>

                          <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                            <div className="relative h-24 w-full">
                              <Image src={previewHotel.coverImage} alt="" fill sizes="280px" className="object-cover" />
                              {previewHotel.reviewCount > 0 && (
                                <div className="absolute end-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-white/90 px-1.5 py-0.5 text-[9px] font-bold text-ink">
                                  <Star size={9} fill="currentColor" className="text-primary" />
                                  {previewHotel.rating.toFixed(1)}
                                </div>
                              )}
                            </div>
                            <div className="space-y-1 p-2.5">
                              <p className="line-clamp-1 text-[11px] font-bold text-ink">{previewHotel.name}</p>
                              <p className="line-clamp-1 text-[9px] text-ink/50">{previewHotel.address}</p>
                              {previewHotel.priceRange && <p className="text-[10px] font-bold text-primary-700">{previewHotel.priceRange}</p>}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-around border-t border-ink/8 px-4 py-2.5">
                          {[Compass, Search, CalendarCheck, User].map((Icon, i) => (
                            <Icon key={i} size={15} className={i === 0 ? "text-primary-700" : "text-ink/30"} aria-hidden="true" />
                          ))}
                        </div>
                        <div className="flex justify-center pb-2.5 pt-1">
                          <div className="h-1 w-20 rounded-full bg-ink/15" />
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-3xl bg-white/10 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md">
                    <Image src="/icons/icon-512.png" alt="Go Hargeisa" width={96} height={96} className="h-full w-full rounded-2xl object-contain" />
                  </div>
                )}

                {previewHotel && (
                  <>
                    <AppFloatingCard
                      icon={<CheckCircle2 size={16} aria-hidden="true" />}
                      label={t("appCardBookingConfirmed")}
                      delay={0.5}
                      className="pointer-events-none absolute -start-10 top-10 hidden w-[168px] md:block"
                    />
                    <AppFloatingCard
                      icon={<MapPin size={16} aria-hidden="true" />}
                      label={t("appCardNewPlace")}
                      delay={0.8}
                      duration={4.6}
                      className="pointer-events-none absolute -end-8 bottom-16 hidden w-[176px] md:block"
                    />
                  </>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Generic, original "play" glyph — not a reproduction of Google's actual
 * trademarked Play Store icon/badge artwork, which this project has no
 * license to use. Just a rounded triangle-in-circle, the same visual
 * shorthand app-availability indicators commonly use. */
function PlayBadgeIcon({ muted = false }: { muted?: boolean }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="11" className={muted ? "fill-white/15" : "fill-ink"} />
      <path d="M9.5 7.5L16.5 12L9.5 16.5V7.5Z" className={muted ? "fill-white/80" : "fill-white"} />
    </svg>
  );
}
