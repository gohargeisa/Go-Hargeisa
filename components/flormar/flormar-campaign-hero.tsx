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

/**
 * Flormar Hargeisa — art-directed campaign hero (single integrated composition).
 *
 * NOT a two-column "photo beside text" layout. The whole section is ONE
 * designed scene: a shared blush/mauve canvas (gradient + soft light blooms
 * + a fine grain) runs edge to edge; the model photo is laid over it and
 * dissolved into it on every side by a radial blush vignette plus a warm
 * soft-light tint that pulls the studio grey of the source shot into the
 * Flormar palette. There is no rectangle, no card, no visible seam between
 * "text area" and "model area" — the editorial copy sits in the open blush
 * space the vignette clears, and the model reads as part of the artwork.
 *
 * Responsive is a re-composition, not a shrink:
 *  - lg+  : model occupies the trailing ~64% of the frame at full height,
 *           vignetted so its leading edge melts into the copy; copy is
 *           vertically centred in the cleared blush space.
 *  - < lg : model is full-bleed behind the scene, vignetted toward the
 *           bottom so it dissolves into a blush field where the copy sits.
 *
 * RTL: the vignette focus and copy side mirror via Tailwind's `rtl:` variant
 * (the layout root carries `dir="rtl"` for Arabic).
 *
 * Every slide is tied to the EXACT product the model holds
 * (lib/config/flormar-campaigns.ts): the primary CTA opens that product
 * (parent's `onShopCampaign` — modal → shade → cart), the secondary CTA
 * drops into the shop grid. Carousel state (index / autoplay / swipe /
 * AnimatePresence cross-fade) is unchanged from the previous version.
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

  // Longer product line — English-only content is acceptable (see the
  // config's own note). On a locale without its own translation we drop the
  // line rather than repeat the subtitle.
  const subtitle = t(current.subtitleKey);
  const description = t.has(current.descriptionKey) ? t(current.descriptionKey) : null;

  return (
    <section
      aria-label={t("heroCarouselLabel")}
      aria-roledescription="carousel"
      className="group relative isolate w-full overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* ── Shared campaign canvas (identical on every slide) ─────────── */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-br from-[#FCEEF4] via-[#F5DEEA] to-[#E7C7DA] dark:from-[#1b1016] dark:via-[#1b1016] dark:to-[#251120]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -end-24 -top-32 -z-10 h-[34rem] w-[34rem] rounded-full bg-[#F7B9D4]/50 blur-[120px] dark:bg-[#7a2a52]/40"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -start-40 bottom-[-14rem] -z-10 h-[36rem] w-[36rem] rounded-full bg-[#E7C9A8]/40 blur-[130px] dark:bg-[#5c3a48]/40"
      />
      {/* fine grain to marry the photo grade into the flat canvas */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35] mix-blend-soft-light"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: "140px 140px",
        }}
      />

      <div className="relative h-[84svh] min-h-[600px] w-full sm:h-[86svh] lg:h-[calc(100svh-9rem)] lg:max-h-[820px] lg:min-h-[620px]">
        {/* ── Model, dissolved into the canvas. Concurrent cross-fade (no
             `mode="wait"`): the model layer is absolutely positioned so the
             outgoing and incoming photos can overlap for a true dissolve
             without any layout effect, and there is never an empty frame. ── */}
        <AnimatePresence initial={false}>
          <m.div
            key={`model-${current.id}`}
            initial={reduceMotion ? undefined : { opacity: 0, scale: 1.03 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            /* The soft-edged mask is what removes any rectangular image
               boundary: the photo's own alpha feathers to nothing on every
               side, so the real campaign canvas behind (gradient + light
               blooms + grain) shows straight through — there is no overlay
               colour to mismatch and no hard edge anywhere. The model's
               centre stays 100% opaque and sharp. Focus sits over her on
               each breakpoint (mirrored in RTL). */
            style={
              {
                // The model is masked to a soft figure that dissolves on
                // every side into the campaign canvas — no rectangle. The
                // opaque core is generous enough that her face, hands and the
                // product stay 100% sharp; the feather is long so the
                // transition is atmospheric, not an edge. The copy-facing
                // side dissolves hardest.
                "--mask-mobile":
                  "radial-gradient(130% 100% at 50% 34%, #000000 42%, #00000000 92%)",
                "--mask-desktop":
                  "radial-gradient(74% 116% at 66% 40%, #000000 44%, #00000000 85%)",
                "--mask-desktop-rtl":
                  "radial-gradient(74% 116% at 34% 40%, #000000 44%, #00000000 85%)",
              } as React.CSSProperties
            }
            className="absolute inset-x-0 top-0 h-[56%] [-webkit-mask-image:var(--mask-mobile)] [-webkit-mask-repeat:no-repeat] [-webkit-mask-size:100%_100%] [mask-image:var(--mask-mobile)] [mask-repeat:no-repeat] [mask-size:100%_100%] sm:h-[64%] lg:inset-0 lg:h-full lg:start-auto lg:end-0 lg:w-[66%] lg:[-webkit-mask-image:var(--mask-desktop)] lg:[mask-image:var(--mask-desktop)] lg:rtl:[-webkit-mask-image:var(--mask-desktop-rtl)] lg:rtl:[mask-image:var(--mask-desktop-rtl)] xl:w-[62%]"
          >
            {/* Blurred, dimmed copy of the same shot sitting behind the sharp
                one — it turns the model's outline into a soft halo of her own
                colours before that fades to canvas, so the transition reads
                as atmosphere, not an edge. */}
            <Image
              src={current.image}
              alt=""
              aria-hidden="true"
              fill
              priority
              quality={35}
              sizes="70vw"
              className="object-cover opacity-70 blur-2xl"
              style={{ objectPosition: current.focalPoint ?? "50% 18%" }}
            />
            {/* Two crops of the same file (one network request under
                `images.unoptimized`): the mobile full-bleed frame and the
                desktop trailing-column frame want different focal points. */}
            <Image
              src={current.mobileImage ?? current.image}
              alt={t(current.titleKey)}
              fill
              priority
              quality={92}
              sizes="100vw"
              className="object-cover lg:hidden"
              style={{ objectPosition: current.mobileFocalPoint ?? current.focalPoint ?? "50% 12%" }}
            />
            <Image
              src={current.image}
              alt=""
              aria-hidden="true"
              fill
              priority
              quality={92}
              sizes="64vw"
              className="hidden object-cover lg:block"
              style={{ objectPosition: current.focalPoint ?? "50% 18%" }}
            />
            {/* Grey studio backdrop → Flormar blush, but weighted to the
                EDGES: each wash is a radial that's transparent over the
                model's face/hands and only turns opaque out where the plain
                background is (mirrored in RTL). So the neutral backdrop fully
                becomes pink and melts into the canvas, while her face keeps
                its natural tone and detail — no wash-out. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[radial-gradient(118%_104%_at_50%_34%,transparent_32%,#ECCBDB_80%)] lg:bg-[radial-gradient(80%_120%_at_64%_40%,transparent_30%,#EBCADA_92%)] lg:rtl:bg-[radial-gradient(80%_120%_at_36%_40%,transparent_30%,#EBCADA_92%)]"
            />
            {/* Desktop only: the studio backdrop survives strongest in the top
                and trailing-edge corners (right of her head, above her
                shoulder), where the radial above can't reach without touching
                her cheek. These edge-anchored linear washes turn just those
                bands fully blush, leaving the face untouched (mirrored RTL). */}
            <div
              aria-hidden="true"
              className="absolute inset-0 hidden lg:block bg-[linear-gradient(to_left,#EBCADA_0%,#EBCADA_9%,transparent_34%),linear-gradient(to_bottom,#E9C8D9_0%,transparent_18%)] rtl:bg-[linear-gradient(to_right,#EBCADA_0%,#EBCADA_9%,transparent_34%),linear-gradient(to_bottom,#E9C8D9_0%,transparent_18%)]"
            />
            {/* Mobile only: same idea for the full-bleed frame — dissolve just
                the outer side bands + the very top, where the plain backdrop
                shows past the model. Face sits well inside the clear middle. */}
            <div
              aria-hidden="true"
              className="absolute inset-0 lg:hidden bg-[linear-gradient(to_right,#ECCBDB_0%,transparent_15%),linear-gradient(to_left,#ECCBDB_0%,transparent_15%),linear-gradient(to_bottom,#E9C8D9_0%,transparent_13%)]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 mix-blend-soft-light bg-gradient-to-br from-[#F5BAD3]/38 via-[#E6AAC6]/24 to-[#D49FC0]/44"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 mix-blend-overlay bg-[#F7CBDF]/16"
            />
          </m.div>
        </AnimatePresence>

        {/* mobile only: a soft blush wash over the lower half so the copy
            always sits on a settled field even where the canvas runs light —
            sits OUTSIDE the masked model layer so it stays solid. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-[#F2D7E4] from-30% via-[#F2D7E4]/70 via-62% to-transparent dark:from-[#1b1016] dark:via-[#1b1016]/70 lg:hidden"
        />
        {/* desktop only: melts the model's lower edge into the canvas so the
            hero has no hard horizontal cut at its foot (the left edge is
            already dissolved by the model layer's own mask). Canvas-toned,
            not a flat panel. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 hidden h-32 bg-gradient-to-t from-[#EAD0DE] via-[#EAD0DE]/55 to-transparent dark:from-[#1b1016] dark:via-[#1b1016]/60 lg:block"
        />

        {/* ── Editorial copy, in the blush space below the model. The tall
             mobile `pb` clears the floating bottom nav / mobile action bar
             that overlays the foot of the viewport. ── */}
        <div className="relative z-20 flex h-full flex-col justify-end px-6 pb-[7.5rem] pt-20 sm:px-10 sm:pb-16 sm:pt-24 lg:justify-center lg:px-14 lg:py-16 xl:px-20">
          {/* soft bloom for guaranteed legibility wherever the model reaches */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-0 top-1/2 -z-10 h-[115%] w-[92%] -translate-x-[8%] -translate-y-1/2 rounded-full bg-[radial-gradient(closest-side,rgba(255,255,255,0.6),transparent)] blur-2xl dark:bg-[radial-gradient(closest-side,rgba(18,9,14,0.72),transparent)] rtl:left-auto rtl:right-0 rtl:translate-x-[8%] lg:w-[78%]"
          />
          <AnimatePresence initial={false} mode="wait">
            <m.div
              key={`copy-${current.id}`}
              initial={reduceMotion ? undefined : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
              className="max-w-lg"
            >
              <span
                className="inline-flex items-center rounded-full bg-white/75 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.2em] shadow-sm backdrop-blur-sm dark:bg-white/10"
                style={{ color: theme.primaryStrong }}
              >
                {t(current.eyebrowKey)}
              </span>
              <h1 className="mt-4 text-balance font-display text-[2.1rem] font-bold leading-[1.03] tracking-tight text-ink dark:text-sand sm:text-5xl lg:text-6xl xl:text-[4rem]">
                {t(current.titleKey)}
              </h1>
              <p className="mt-3 max-w-md text-pretty font-display text-lg font-semibold text-ink/85 dark:text-sand/85 sm:mt-4 sm:text-xl">
                {subtitle}
              </p>
              {description && (
                /* Hidden on phones so the mobile copy stays compact and the
                   model + product keep clear space above it; shown from `sm`
                   up (tablet + the unchanged desktop composition). */
                <p className="mt-3 hidden max-w-md text-pretty text-sm leading-relaxed text-ink/60 dark:text-sand/65 sm:block sm:text-[15px]">
                  {description}
                </p>
              )}
              <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-7">
                <button
                  type="button"
                  onClick={() => onShopCampaign(current)}
                  className="rounded-full px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-transform duration-300 ease-premium hover:-translate-y-0.5 active:scale-95"
                  style={{ backgroundColor: theme.primaryStrong }}
                >
                  {t(current.ctaKey)}
                </button>
                <a
                  href="#shop-all"
                  className="rounded-full border bg-white/50 px-7 py-3.5 text-sm font-bold backdrop-blur-sm transition-colors duration-300 hover:bg-white/80 dark:bg-white/10 dark:hover:bg-white/20"
                  style={{ borderColor: `rgba(${theme.primaryRgb}, 0.35)`, color: theme.primaryStrong }}
                >
                  {t("exploreCollection")}
                </a>
              </div>
            </m.div>
          </AnimatePresence>

          {multi && (
            <div className="relative z-10 mt-6 flex items-center gap-1.5 lg:mt-12">
              {campaigns.map((c, i) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => goTo(i)}
                  aria-label={t("heroGoToSlide", { n: i + 1 })}
                  aria-current={i === index}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === index ? "26px" : "7px",
                    backgroundColor: i === index ? theme.primaryStrong : `rgba(${theme.primaryRgb}, 0.3)`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {multi && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              aria-label={t("heroPrevSlide")}
              className="absolute bottom-4 end-4 z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-ink opacity-0 shadow-soft backdrop-blur-sm transition-opacity duration-300 hover:bg-white focus-visible:opacity-100 group-hover:opacity-100 lg:bottom-auto lg:end-auto lg:start-4 lg:top-1/2 lg:-translate-y-1/2"
            >
              <ChevronLeft size={20} aria-hidden="true" className="rtl:rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              aria-label={t("heroNextSlide")}
              className="absolute bottom-4 end-[3.75rem] z-30 flex h-10 w-10 items-center justify-center rounded-full bg-white/80 text-ink opacity-0 shadow-soft backdrop-blur-sm transition-opacity duration-300 hover:bg-white focus-visible:opacity-100 group-hover:opacity-100 lg:bottom-auto lg:end-4 lg:top-1/2 lg:-translate-y-1/2"
            >
              <ChevronRight size={20} aria-hidden="true" className="rtl:rotate-180" />
            </button>
          </>
        )}
      </div>
    </section>
  );
}
