"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { FlormarCampaign } from "@/lib/config/flormar-campaigns";
import type { PartnerTheme } from "@/lib/config/partner-themes";

const AUTOPLAY_MS = 6500;
const SWIPE_THRESHOLD_PX = 44;

/** "1052 / 942" -> 1.1167. Used to derive a split-layout slide's overall
 * container ratio from its image column's own crop ratio. */
function parseAspectRatio(value: string): number {
  const [w, h] = value.split("/").map((part) => parseFloat(part.trim()));
  return w / h;
}

/**
 * Flormar Hargeisa — campaign hero.
 *
 * A full-bleed banner — no outer side padding, no rounded card, no white
 * background anywhere — matching the business owner's own reference design
 * (a flat-colour hero banner, image edge-to-edge, text straight on top of
 * it). Each slide is ONE campaign photo (lib/config/flormar-campaigns.ts).
 * The photo is never cropped — its container is sized to the image's own
 * aspect ratio, so `object-fit: cover` has no overflow to trim.
 *
 * The product name/description/CTA sits directly on the photo (no card
 * behind it) at `current.overlayPosition` — a spot on that specific photo
 * measured (colour-variance scan + the zone's actual average pixel colour)
 * to be genuinely quiet background AND to tell whether dark or light text
 * actually reads there (`current.overlayTextColor` — not the same colour on
 * every slide). A text-shadow, not a card, is what keeps it legible against
 * whatever's directly behind it. Because the position is a fixed physical
 * spot on the photo, it does NOT mirror in RTL (the photo's own composition
 * doesn't mirror either) — only the text's own alignment follows the
 * locale. `current.overlayVerticalCenter` (the 3 current active slides, all
 * shot with a clean empty background running the photo's full height)
 * centres the text vertically instead of anchoring it to one measured band.
 *
 * One slide (`current.splitLayout`, currently only the retired
 * perfect-coverage-foundation — see its own config comment) is a deliberate
 * exception: the photo is cropped ON SCREEN to its left portion and the rest
 * of the hero becomes a solid colour-matched panel holding the text,
 * model-and-her-product on the left / text on the right.
 */
export function FlormarCampaignHero({
  campaigns,
  theme,
  onShopCampaign,
  onActiveCampaignChange,
}: {
  campaigns: FlormarCampaign[];
  theme: PartnerTheme;
  onShopCampaign: (campaign: FlormarCampaign) => void;
  onActiveCampaignChange?: (campaign: FlormarCampaign) => void;
}) {
  const t = useTranslations("flormarPreview");
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const reduceMotion = useReducedMotion();
  const touchStartX = useRef<number | null>(null);

  const count = campaigns.length;
  const multi = count > 1;
  const current = campaigns[Math.min(index, count - 1)];

  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count]
  );

  // `index` is a dependency on purpose: any slide change — auto OR manual —
  // restarts the timer, so the AnimatePresence cross-fade always finishes a
  // full beat before the next change. Without it a dot-click landing in the
  // ~0.6s window of an auto-advance transition could change the key twice in
  // quick succession, which `mode="wait"` handles by briefly rendering
  // nothing.
  useEffect(() => {
    if (!multi || paused || reduceMotion) return;
    const timer = setTimeout(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => clearTimeout(timer);
  }, [multi, paused, reduceMotion, count, index]);

  useEffect(() => {
    if (current) onActiveCampaignChange?.(current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0]?.clientX ?? null;
  }
  function onTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchStartX.current) - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD_PX) return;
    goTo(dx < 0 ? index + 1 : index - 1);
  }

  if (!current) return null;

  const subtitle = t(current.subtitleKey);
  const isLight = current.overlayTextColor === "light";
  // Split-layout slides (currently just perfect-coverage-foundation — see
  // its own config comment) get their own container aspect ratio: the left
  // (image) column's crop ratio, widened out to account for the right
  // (text panel) column's share of the total width.
  const containerAspectRatio = current.splitLayout
    ? parseAspectRatio(current.splitLayout.imageAspectRatio) / current.splitLayout.imageWidthFraction
    : current.imageAspectRatio;

  return (
    <section
      aria-label={t("heroCarouselLabel")}
      aria-roledescription="carousel"
      /* No `container-px` — this is a full-bleed banner, flush with the
         sticky Flormar sub-header directly above it, matching the reference
         design exactly (that banner runs edge to edge with no page gutter
         of its own). Zero top padding — the hero starts immediately below
         the sub-nav; only a small bottom gap remains before the Rewards
         banner. */
      className="group relative w-full pb-1 sm:pb-2"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div
        className="relative w-full overflow-hidden"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <AnimatePresence initial={false} mode="wait">
          <m.div
            key={`slide-${current.id}`}
            initial={reduceMotion ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="relative flex w-full"
            style={{ aspectRatio: containerAspectRatio }}
          >
            {current.splitLayout ? (
              <>
                {/* Split layout (this slide only — see its config comment):
                    the photo is cropped ON SCREEN to its own left portion via
                    `object-position: 0% center` inside a column narrower than
                    the source image — a separate product cutout elsewhere in
                    the frame simply falls outside this crop. The source file
                    itself is never touched. */}
                <div className="relative h-full shrink-0" style={{ width: `${current.splitLayout.imageWidthFraction * 100}%` }}>
                  <Image
                    src={current.image}
                    alt={t(current.titleKey)}
                    fill
                    priority
                    quality={92}
                    sizes="60vw"
                    className="object-cover"
                    style={{ objectPosition: "0% 50%" }}
                  />
                </div>
                {/* Text panel — solid colour sampled from the photo's own
                    background right at the crop edge (see the config
                    comment), so the seam reads as a continuation of the same
                    backdrop rather than a mismatched block. Vertically
                    centred stack: badge, title, subtitle, CTA. */}
                <div
                  className="flex h-full flex-1 flex-col justify-center px-4 py-4 sm:px-8 lg:px-12"
                  style={{ backgroundColor: current.splitLayout.panelColor }}
                >
                  <span
                    className="inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] sm:text-[10px] lg:text-[11px]"
                    style={{ backgroundColor: "rgba(255,255,255,0.9)", color: theme.primaryStrong }}
                  >
                    {t(current.eyebrowKey)}
                  </span>
                  <h2 className="mt-2 text-balance font-display text-base font-bold leading-tight tracking-tight text-white sm:mt-3 sm:text-xl lg:text-3xl">
                    {t(current.titleKey)}
                  </h2>
                  <p className="mt-1.5 text-pretty font-display text-xs font-semibold text-white/90 sm:mt-2 sm:text-sm lg:text-base">
                    {subtitle}
                  </p>
                  <button
                    type="button"
                    onClick={() => onShopCampaign(current)}
                    className="mt-3 w-fit rounded-full px-3 py-1.5 text-[10px] font-bold text-white shadow-md transition-transform duration-300 ease-premium hover:-translate-y-0.5 active:scale-95 sm:mt-4 sm:px-5 sm:py-2 sm:text-xs lg:px-7 lg:py-2.5 lg:text-sm"
                    style={{ backgroundColor: theme.primaryStrong }}
                  >
                    {t(current.ctaKey)}
                  </button>
                </div>
              </>
            ) : (
              <>
                {/* The campaign photo, uncropped and edge-to-edge — the
                    container's aspect-ratio matches the source image's own
                    dimensions exactly, so `cover` never has any overflow to
                    trim, and this IS the hero's background (no page/white
                    background sits behind or around it). */}
                <Image
                  src={current.image}
                  alt={t(current.titleKey)}
                  fill
                  priority
                  quality={92}
                  sizes="100vw"
                  className="object-cover"
                />

                {/* Product info — directly on the photo, no card. Position is
                    a measured-quiet spot on THIS photo (see the config's own
                    comments); text colour is per-slide because the zones are
                    genuinely different backgrounds, not one colour reused.
                    The drop-shadow is what keeps it legible without a card or
                    a darkening overlay on the photo. `.campaign-overlay`
                    (globals.css) applies real mobile vs. desktop values via a
                    media query — see the config field's doc comment for why
                    inline `style` / Tailwind arbitrary classes can't do that
                    for data-driven values. */}
                <div
                  className={`campaign-overlay absolute max-w-[160px] sm:max-w-[240px] lg:max-w-[320px] ${
                    current.overlayVerticalCenter ? "!top-1/2 -translate-y-1/2" : ""
                  }`}
                  style={
                    {
                      "--campaign-overlay-top-mobile": current.overlayPosition.mobile.top,
                      "--campaign-overlay-left-mobile": current.overlayPosition.mobile.left,
                      "--campaign-overlay-width-mobile": current.overlayPosition.mobile.width,
                      "--campaign-overlay-top-desktop": current.overlayPosition.desktop.top,
                      "--campaign-overlay-left-desktop": current.overlayPosition.desktop.left,
                      "--campaign-overlay-width-desktop": current.overlayPosition.desktop.width,
                    } as React.CSSProperties
                  }
                >
                  <span
                    className={`items-center rounded-full px-2 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] sm:text-[10px] lg:text-[11px] ${
                      current.overlayCompact ? "hidden sm:inline-flex" : "inline-flex"
                    }`}
                    style={{ backgroundColor: isLight ? "rgba(255,255,255,0.9)" : `rgba(${theme.primaryRgb}, 0.12)`, color: theme.primaryStrong }}
                  >
                    {t(current.eyebrowKey)}
                  </span>
                  <h2
                    className={`text-balance font-display font-bold leading-tight tracking-tight [text-shadow:0_1px_10px_rgba(0,0,0,0.18)] ${
                      isLight ? "text-white" : "text-ink"
                    } ${current.overlayCompact ? "mt-0 text-xs sm:mt-2 sm:text-lg lg:text-2xl" : "mt-1.5 text-base sm:mt-2 sm:text-xl lg:text-3xl"}`}
                  >
                    {t(current.titleKey)}
                  </h2>
                  {!current.overlayCompact && (
                    <p
                      className={`mt-1 hidden text-pretty font-display text-xs font-semibold [text-shadow:0_1px_8px_rgba(0,0,0,0.16)] sm:block sm:text-sm lg:text-base ${
                        isLight ? "text-white/90" : "text-ink/80"
                      }`}
                    >
                      {subtitle}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => onShopCampaign(current)}
                    className="mt-2 rounded-full px-3 py-1.5 text-[10px] font-bold text-white shadow-md transition-transform duration-300 ease-premium hover:-translate-y-0.5 active:scale-95 sm:mt-3 sm:px-5 sm:py-2 sm:text-xs lg:px-7 lg:py-2.5 lg:text-sm"
                    style={{ backgroundColor: theme.primaryStrong }}
                  >
                    {t(current.ctaKey)}
                  </button>
                </div>
              </>
            )}

            {multi && (
              <div className="absolute inset-x-0 bottom-3 z-10 flex items-center justify-center gap-1.5 sm:bottom-5">
                {campaigns.map((c, i) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => goTo(i)}
                    aria-label={t("heroGoToSlide", { n: i + 1 })}
                    aria-current={i === index}
                    className="h-1.5 rounded-full shadow-sm transition-all duration-300"
                    style={{
                      width: i === index ? "22px" : "7px",
                      backgroundColor: i === index ? theme.primaryStrong : "rgba(255,255,255,0.7)",
                    }}
                  />
                ))}
              </div>
            )}
          </m.div>
        </AnimatePresence>

        {multi && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label={t("heroPrevSlide")}
              className="absolute start-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-ink opacity-0 shadow-soft backdrop-blur-sm transition-opacity duration-300 hover:bg-white focus-visible:opacity-100 group-hover:opacity-100"
            >
              <ChevronLeft size={20} aria-hidden="true" className="rtl:rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label={t("heroNextSlide")}
              className="absolute end-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-ink opacity-0 shadow-soft backdrop-blur-sm transition-opacity duration-300 hover:bg-white focus-visible:opacity-100 group-hover:opacity-100"
            >
              <ChevronRight size={20} aria-hidden="true" className="rtl:rotate-180" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
