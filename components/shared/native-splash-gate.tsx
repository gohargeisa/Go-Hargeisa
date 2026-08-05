"use client";

import { createContext, useContext, useMemo, useRef, type ReactNode } from "react";

/**
 * Coordinates the native splash hand-off (capacitor-bootstrap.tsx, which
 * calls SplashScreen.hide()) with the web splash overlay (splash-overlay.tsx,
 * mounted only on the homepage) — two siblings under app/[locale]/layout.tsx
 * with no direct relationship, same cross-sibling problem search-overlay-
 * provider.tsx solves for the search takeover. reportReady() fires once the
 * overlay's own hero/logo images have actually loaded; waitUntilReady()
 * races that against a timeout so a stalled or never-mounted overlay (any
 * non-homepage cold-launch route) can never hang the native splash hide.
 */
type NativeSplashGate = {
  reportReady: () => void;
  waitUntilReady: (timeoutMs: number) => Promise<void>;
};

const NativeSplashGateContext = createContext<NativeSplashGate | null>(null);

export function NativeSplashGateProvider({ children }: { children: ReactNode }) {
  const readyPromiseRef = useRef<Promise<void> | null>(null);
  const resolveRef = useRef<(() => void) | null>(null);

  function getReadyPromise() {
    if (!readyPromiseRef.current) {
      readyPromiseRef.current = new Promise<void>((resolve) => {
        resolveRef.current = resolve;
      });
    }
    return readyPromiseRef.current;
  }

  const value = useMemo<NativeSplashGate>(
    () => ({
      reportReady: () => {
        getReadyPromise();
        resolveRef.current?.();
      },
      waitUntilReady: (timeoutMs: number) =>
        Promise.race([
          getReadyPromise(),
          new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
        ]),
    }),
    []
  );

  return <NativeSplashGateContext.Provider value={value}>{children}</NativeSplashGateContext.Provider>;
}

export function useNativeSplashGate() {
  const ctx = useContext(NativeSplashGateContext);
  if (!ctx) throw new Error("useNativeSplashGate must be used within NativeSplashGateProvider");
  return ctx;
}
