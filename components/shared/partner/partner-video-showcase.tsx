"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useReducedMotion } from "framer-motion";
import { Play, Pause, Film } from "lucide-react";
import type { PartnerTheme } from "@/lib/config/partner-themes";

/**
 * Reusable "Cinematic Product Showcase" — a full-bleed campaign-style video
 * band, part of the Partner Branding System (not Flormar-specific: any
 * future partner with a real campaign video/poster reuses this unchanged).
 *
 * Every requirement from the brief, all handled centrally here rather than
 * left to each caller:
 * - Responsive container: `aspect-[4/5] sm:aspect-[4/3]`, always
 *   `object-cover` so nothing distorts. Deliberately NOT 16:9 — for a
 *   vertical (9:16) source, `object-cover`'s visible fraction of the
 *   source's height is (1 / containerRatio) × sourceRatio, independent of
 *   actual pixel size: at 16:9 (1.78) that's only ~32% of the video's
 *   height, at 4:3 (1.33) it's ~42%. The narrower ratio keeps meaningfully
 *   more of a vertical clip's actual action/subject in frame — 16:9 read
 *   as "excessively zoomed" on a real vertical source in review, cropping
 *   into the middle of the action rather than showing it. Still a clearly
 *   wide/landscape full-bleed band, not square or portrait.
 * - `muted` + `playsInline` + `loop` always set together — required by
 *   every mobile browser for inline autoplay to work at all; never
 *   attempted with sound (a hard product/UX rule, not just this file's).
 * - Autoplay only actually engages when `prefers-reduced-motion` is NOT
 *   set. Reduced-motion users get the poster frame (or gradient fallback)
 *   plus a manual Play/Pause control instead of unrequested motion.
 * - Three explicit states — loading (skeleton), ready (video), error
 *   (falls back to `posterImage`, then a themed gradient) — a failed/404
 *   video can never leave a permanent blank box.
 * - No `videoUrl` at all (Flormar's current, real state — no official
 *   footage exists yet) skips the `<video>` element entirely and shows the
 *   honest "coming soon" themed placeholder, exactly like BrandedPlaceholder
 *   does for photos. Passing a real `videoUrl` later needs no other change
 *   here — this component was built for that handoff.
 */
export function PartnerVideoShowcase({
  theme,
  videoUrl,
  posterImage,
  alt,
  eyebrow,
  title,
  description,
}: {
  theme: PartnerTheme;
  videoUrl?: string;
  posterImage?: string;
  alt: string;
  eyebrow?: string;
  title?: string;
  description?: string;
}) {
  const t = useTranslations("partnerVideoShowcase");
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(videoUrl ? "loading" : "error");
  const [playing, setPlaying] = useState(false);

  const showVideo = !!videoUrl && status !== "error";
  const autoplayAllowed = !reduceMotion;

  function togglePlayback() {
    const el = videoRef.current;
    if (!el) return;
    if (el.paused) {
      el.play();
      setPlaying(true);
    } else {
      el.pause();
      setPlaying(false);
    }
  }

  return (
    <section className="relative aspect-[4/5] w-full overflow-hidden bg-ink sm:aspect-[4/3]">
      {showVideo ? (
        <>
          {status === "loading" && <div className="skeleton absolute inset-0" aria-hidden="true" />}
          <video
            ref={videoRef}
            src={videoUrl}
            poster={posterImage}
            muted
            loop
            playsInline
            autoPlay={autoplayAllowed}
            preload="metadata"
            aria-label={alt}
            className={`h-full w-full object-cover transition-opacity duration-500 ${status === "ready" ? "opacity-100" : "opacity-0"}`}
            onCanPlay={() => {
              setStatus("ready");
              if (autoplayAllowed) setPlaying(true);
            }}
            onError={() => setStatus("error")}
          />
          {!autoplayAllowed && status === "ready" && (
            <button
              type="button"
              onClick={togglePlayback}
              aria-label={playing ? t("pauseVideo") : t("playVideo")}
              className="absolute inset-0 m-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/90 text-ink shadow-xl transition-transform hover:scale-105"
            >
              {playing ? <Pause size={24} aria-hidden="true" /> : <Play size={24} className="ms-0.5" aria-hidden="true" />}
            </button>
          )}
        </>
      ) : posterImage ? (
        // Video missing/failed but a real poster photo exists — show that
        // rather than the gradient placeholder, still never a blank box.
        // eslint-disable-next-line @next/next/no-img-element -- fallback path only, no next/image optimization needed for a rare error state
        <img src={posterImage} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div
          className="flex h-full w-full flex-col items-center justify-center gap-3 text-center text-white"
          style={{ background: `linear-gradient(150deg, ${theme.primaryDeep} 0%, ${theme.primary} 60%, ${theme.primaryMid} 100%)` }}
        >
          <span
            className="flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: `rgba(${theme.accentRgb}, 0.18)`, color: theme.accentSoft }}
          >
            <Film size={24} aria-hidden="true" />
          </span>
          <p className="text-sm font-semibold uppercase tracking-wide text-white/85">{t("comingSoon")}</p>
        </div>
      )}

      {(eyebrow || title || description) && (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-2 px-6 pb-10 pt-24 text-center text-white sm:pb-14"
          style={{ background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.55) 100%)" }}
        >
          {eyebrow && <span className="text-xs font-bold uppercase tracking-[0.2em] text-white/85">{eyebrow}</span>}
          {title && <h2 className="text-balance font-display text-2xl font-bold sm:text-3xl">{title}</h2>}
          {description && <p className="max-w-md text-balance text-sm text-white/80 sm:text-base">{description}</p>}
        </div>
      )}
    </section>
  );
}
