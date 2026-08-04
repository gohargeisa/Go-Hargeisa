"use client";

import { useEffect, useState } from "react";

export interface NetworkStatus {
  isOnline: boolean;
}

function initialOnlineGuess(): boolean {
  if (typeof navigator === "undefined") return true;
  return navigator.onLine;
}

/**
 * Single source of truth for online/offline state across the app —
 * `@capacitor/network` (already a dependency, previously unused anywhere in
 * the repo) on native, `navigator.onLine` + `online`/`offline` events on
 * web. Structured like lib/hooks/use-visitor-location.ts: one small
 * single-purpose hook, graceful degradation, no throwing.
 */
export function useNetworkStatus(): NetworkStatus {
  const [isOnline, setIsOnline] = useState<boolean>(initialOnlineGuess);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | null = null;

    async function setupNative(): Promise<boolean> {
      const { Capacitor } = await import("@capacitor/core");
      if (!Capacitor.isNativePlatform()) return false;

      const { Network } = await import("@capacitor/network");
      const status = await Network.getStatus();
      if (cancelled) return true;
      setIsOnline(status.connected);

      const handle = await Network.addListener("networkStatusChange", (next) => {
        if (!cancelled) setIsOnline(next.connected);
      });
      cleanup = () => {
        handle.remove();
      };
      return true;
    }

    function setupWeb() {
      setIsOnline(navigator.onLine);
      const onOnline = () => setIsOnline(true);
      const onOffline = () => setIsOnline(false);
      window.addEventListener("online", onOnline);
      window.addEventListener("offline", onOffline);
      cleanup = () => {
        window.removeEventListener("online", onOnline);
        window.removeEventListener("offline", onOffline);
      };
    }

    setupNative()
      .then((usedNative) => {
        if (!usedNative && !cancelled) setupWeb();
      })
      .catch(() => {
        if (!cancelled) setupWeb();
      });

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return { isOnline };
}
