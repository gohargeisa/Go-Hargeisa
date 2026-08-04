"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Wires up native-shell behavior when this same web app is running inside
 * the Capacitor app (Capacitor.isNativePlatform() — false for every normal
 * browser visit to gohargeisa.com, so this is a pure no-op there, verified
 * by the early-return below before touching any @capacitor/* import's
 * runtime). Mounted once from app/[locale]/layout.tsx alongside
 * ServiceWorkerRegister, same "silent client component" pattern.
 *
 * Deliberately does NOT handle: external link handoff (tel:/mailto:/wa.me/
 * Google Maps — already free via Capacitor's own Bridge.launchIntent()/
 * WKWebView delegate, see capacitor.config.ts's allowNavigation comment),
 * offline screen (server.errorPath, also capacitor.config.ts — no JS
 * involved), keyboard resize mode (declarative in capacitor.config.ts's
 * plugins.Keyboard — no imperative call needed).
 */
export function CapacitorBootstrap() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    const cleanups: Array<() => void> = [];

    async function init() {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform() || cancelled) return;

      const [{ App }, { SplashScreen }] = await Promise.all([import("@capacitor/app"), import("@capacitor/splash-screen")]);

      // launchAutoHide is off (capacitor.config.ts) specifically so this
      // fires once React has actually hydrated real content — a fixed
      // timer would either cut the splash before the remote page (network-
      // dependent load time) has painted, or linger after it's ready.
      await SplashScreen.hide();

      // Hardware back button (Android): go back in-app history if there is
      // any, otherwise exit rather than getting stuck on a dead end.
      const backListener = await App.addListener("backButton", ({ canGoBack }) => {
        if (canGoBack) window.history.back();
        else App.exitApp();
      });
      cleanups.push(() => void backListener.remove());

      // Deep links / universal links (android:autoVerify intent-filter +
      // iOS associated domains, see android/.../AndroidManifest.xml and
      // ios/.../App.entitlements) resolve to a gohargeisa.com URL handed to
      // the already-running app here instead of a fresh WebView navigation
      // — routing it through Next's client router keeps the SPA state
      // (and is instant, no reload) rather than a full page load.
      const urlOpenListener = await App.addListener("appUrlOpen", ({ url }) => {
        try {
          const target = new URL(url);
          if (target.hostname === "gohargeisa.com" || target.hostname.endsWith(".gohargeisa.com")) {
            router.push(target.pathname + target.search);
          }
        } catch {
          // Malformed URL from an external caller — ignore rather than crash.
        }
      });
      cleanups.push(() => void urlOpenListener.remove());
    }

    init();
    return () => {
      cancelled = true;
      cleanups.forEach((fn) => fn());
    };
  }, [router]);

  return null;
}
