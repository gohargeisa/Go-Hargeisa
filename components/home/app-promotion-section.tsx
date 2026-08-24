import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Smartphone, MapPin, ShoppingBag, Bell, Search, Star } from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { GOOGLE_PLAY_URL } from "@/lib/config/features";
import type { Locale } from "@/lib/i18n/config";
import type { Hotel } from "@/types";

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
 *
 * `previewHotel` (optional, homepage passes its own already-fetched first
 * hotel — see app/[locale]/page.tsx) drives the small device-frame preview
 * below: no native app exists yet to screenshot, and this environment has
 * no image-generation/screenshot tooling, so instead of fabricating fake
 * app screens the frame shows the REAL site's real search copy
 * (`home.searchPlaceholder`, the same string Hero.tsx's actual search bar
 * uses) and one REAL hotel's real photo/name/address/rating/price — the
 * same data the homepage's own hotel grid just rendered a few sections
 * down, laid out in a small purpose-built card (not a scaled clone of
 * PremiumHotelCard, which assumes far more width). The bezel is a
 * deliberately generic modern-Android silhouette (centered punch-hole
 * camera, bottom gesture pill) with no notch, no Dynamic Island, no Apple
 * iconography, and no fabricated status-bar/OS chrome. Purely decorative —
 * `aria-hidden` + `pointer-events-none` — not a second, non-functional copy
 * of the real hotel card's links/buttons. Renders nothing extra when no
 * hotel is available (never shows a frame with placeholder/fake content).
 */
export async function AppPromotionSection({ locale, previewHotel }: { locale: Locale; previewHotel?: Hotel }) {
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
              {previewHotel ? (
                <div
                  aria-hidden="true"
                  className="pointer-events-none mx-auto w-[240px] shrink-0 select-none md:mx-0 md:w-[260px]"
                >
                  {/* Generic modern-Android silhouette — dark bezel, centered
                      punch-hole camera, bottom gesture pill. No notch, no
                      Dynamic Island, no OS-specific status bar. */}
                  <div className="relative rounded-[2.75rem] border-[6px] border-ink/90 bg-ink/90 p-2 shadow-[0_30px_60px_rgba(0,0,0,0.45)]">
                    <div
                      className="absolute left-1/2 top-3.5 z-10 h-2 w-2 -translate-x-1/2 rounded-full bg-white/25"
                    />
                    <div className="relative overflow-hidden rounded-[2.1rem] bg-sand">
                      <div className="flex flex-col gap-3 px-3.5 pb-6 pt-6">
                        <div className="flex items-center gap-1.5">
                          <Image src="/images/logo.png" alt="" width={64} height={42} className="h-5 w-auto object-contain" />
                        </div>

                        <div className="flex items-center gap-2 rounded-full bg-white px-3 py-2 shadow-sm">
                          <Search size={13} className="shrink-0 text-ink/40" />
                          <span className="truncate text-[11px] text-ink/45">{t("searchPlaceholder")}</span>
                        </div>

                        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
                          <div className="relative h-24 w-full">
                            <Image
                              src={previewHotel.coverImage}
                              alt=""
                              fill
                              sizes="240px"
                              className="object-cover"
                            />
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
                            {previewHotel.priceRange && (
                              <p className="text-[10px] font-bold text-primary-700">{previewHotel.priceRange}</p>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-center pb-2.5">
                        <div className="h-1 w-20 rounded-full bg-ink/15" />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mx-auto flex h-28 w-28 shrink-0 items-center justify-center rounded-3xl bg-white/10 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35)] backdrop-blur-md md:mx-0 md:h-32 md:w-32">
                  <Image
                    src="/icons/icon-512.png"
                    alt="Go Hargeisa"
                    width={96}
                    height={96}
                    className="h-full w-full rounded-2xl object-contain"
                  />
                </div>
              )}

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
