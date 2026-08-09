"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { m, useReducedMotion } from "framer-motion";
import { HeroBackground } from "@/components/home/hero-background";
import { useNativeSplashGate } from "@/components/shared/native-splash-gate";

const SESSION_KEY = "gh:splashShown";

type Phase = "waiting" | "enter" | "exit";

/**
 * Web-rendered half of the two-layer splash (see native-splash-gate.tsx for
 * the other half): the native OS splash (Theme.SplashScreen / LaunchScreen
 * .storyboard) can only ever show one static frame, so this overlay — mounted
 * only on the homepage, the sole route a native cold launch ever lands on —
 * recreates the same Hero photo with full Framer Motion animation on top of
 * it, then fades away once the real Hero (same component, same props, same
 * cached /_next/image bytes) is already underneath. reportReady() fires the
 * instant this overlay's own timeline begins, which is also the instant the
 * native splash is told it's safe to hide — so the two layers show the
 * identical frame at the handoff point instead of a jump cut.
 *
 * Renders null forever for every normal web visitor (isNative stays false)
 * and for any repeat cold-launch within the same app session (sessionStorage
 * flag) — this is not a route-transition splash, only a true first launch.
 */
export function SplashScreenOverlay() {
  const t = useTranslations("splash");
  const reduceMotion = useReducedMotion();
  const { reportReady } = useNativeSplashGate();

  const [shouldShow, setShouldShow] = useState(false);
  const [heroLoaded, setHeroLoaded] = useState(false);
  const [logoLoaded, setLogoLoaded] = useState(false);
  const [phase, setPhase] = useState<Phase>("waiting");

  // Deliberately an effect, not a lazy useState initializer: `window` isn't
  // available during the server render this page still goes through, so a
  // lazy initializer would read consistently `false` on the server and
  // (on native) `true` on the client — a hydration mismatch. Costing this
  // one extra tick is free here: the native OS splash is still covering the
  // entire screen the whole time, since it's only ever hidden once
  // reportReady() fires below, which itself waits on shouldShow.
  useEffect(() => {
    const isNative = (window as typeof window & { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
      ?.isNativePlatform?.() === true;
    if (!isNative) return;
    if (sessionStorage.getItem(SESSION_KEY) === "1") return;

    sessionStorage.setItem(SESSION_KEY, "1");
    setShouldShow(true);
  }, []);

  useEffect(() => {
    if (shouldShow && heroLoaded && logoLoaded && phase === "waiting") {
      setPhase("enter");
      reportReady();
    }
  }, [shouldShow, heroLoaded, logoLoaded, phase, reportReady]);

  useEffect(() => {
    if (phase !== "enter") return;
    // This timer starts the same instant the fade-in above does (both fire
    // from the same "enter" transition), so total on-screen time for the
    // logo is this 2000ms (which the 500ms fade-in ramps up within) plus
    // the 350ms fade-out below — ~2.35s end to end, landing in the
    // "roughly 2-3 seconds, not excessive" range.
    const timer = setTimeout(() => setPhase("exit"), 2000);
    return () => clearTimeout(timer);
  }, [phase]);

  const [unmounted, setUnmounted] = useState(false);
  useEffect(() => {
    if (phase !== "exit") return;
    const timer = setTimeout(() => setUnmounted(true), 350);
    return () => clearTimeout(timer);
  }, [phase]);

  if (!shouldShow || unmounted) return null;

  const visible = phase !== "waiting";

  return (
    <m.div
      aria-hidden="true"
      className="fixed inset-0 z-splash flex flex-col items-center justify-center overflow-hidden"
      animate={{ opacity: phase === "exit" ? 0 : 1 }}
      transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    >
      <m.div
        className="absolute inset-0 blur-[2px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 1 : 0 }}
        transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      >
        <HeroBackground reduceMotion={!!reduceMotion} priority onReady={() => setHeroLoaded(true)} />
        <div className="absolute inset-0 bg-ink/40" />
      </m.div>

      <m.div
        className="relative z-10"
        initial={{ opacity: 0, scale: reduceMotion ? 1 : 0.96 }}
        animate={{ opacity: visible ? 1 : 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="relative aspect-[768/418] w-[42vw] max-w-[220px]">
          <Image
            src="/images/logo-mark.png"
            alt="Go Hargeisa"
            fill
            sizes="220px"
            priority
            onLoad={() => setLogoLoaded(true)}
            className="object-contain drop-shadow-[0_8px_24px_rgba(0,0,0,0.25)]"
          />
        </div>
      </m.div>

      <m.p
        className="relative z-10 mt-4 max-w-[90vw] text-balance text-center text-xs font-semibold uppercase tracking-[0.3em] text-white/85"
        initial={{ opacity: 0 }}
        animate={{ opacity: visible ? 0.85 : 0 }}
        transition={{ duration: 0.3, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
      >
        {t("tagline")}
      </m.p>
    </m.div>
  );
}
