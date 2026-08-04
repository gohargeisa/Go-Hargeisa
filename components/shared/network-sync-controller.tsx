"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useNetworkStatus } from "@/lib/hooks/use-network-status";
import { useToast, ToastViewport } from "@/components/shared/toast";
import { refreshCurrentRoute } from "@/lib/offline/refresh-current-route";
import { runCacheSweepIfDue } from "@/lib/offline/cache-maintenance";

const SYNC_TAG = "gh-reconnect-sync";

async function registerBackgroundSync() {
  try {
    if (!("serviceWorker" in navigator) || !("SyncManager" in window)) return;
    const registration = await navigator.serviceWorker.ready;
    const withSync = registration as ServiceWorkerRegistration & {
      sync?: { register: (tag: string) => Promise<void> };
    };
    await withSync.sync?.register(SYNC_TAG);
  } catch {
    // Not supported, or the user denied background-permission prompts on
    // some platforms — the primary reconnect path below already covers
    // this without it (Android/Chrome-only enhancement, see public/sw.js).
  }
}

/**
 * Silent reconnect controller — mounted once in app/[locale]/layout.tsx.
 * Owns "refresh data automatically / refresh images / update changed
 * content silently" on regaining connectivity, and relays the service
 * worker's GH_CONTENT_UPDATED broadcast (a background revalidation that
 * detected real content drift while still nominally online) into the same
 * single-route refresh. Renders only a toast notification — no persistent UI.
 */
export function NetworkSyncController() {
  const t = useTranslations("offline");
  const router = useRouter();
  const { isOnline } = useNetworkStatus();
  const { toast, showToast, dismiss } = useToast();
  const wasOnlineRef = useRef(isOnline);

  // Once per mount (throttled internally to once/24h regardless of how
  // often the app is opened) — keeps the 30-day/150-entry caps enforced
  // without waiting on a reconnect that may not happen for a while.
  useEffect(() => {
    runCacheSweepIfDue();
  }, []);

  useEffect(() => {
    const wasOnline = wasOnlineRef.current;
    wasOnlineRef.current = isOnline;
    if (wasOnline || !isOnline) return;

    // offline → online transition
    refreshCurrentRoute(router);
    showToast("success", t("reconnectedToast"));
    registerBackgroundSync();
    runCacheSweepIfDue();
  }, [isOnline, router, showToast, t]);

  useEffect(() => {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;

    function onMessage(event: MessageEvent) {
      if (!event.data || event.data.type !== "GH_CONTENT_UPDATED") return;
      try {
        const updatedUrl = new URL(event.data.url);
        if (updatedUrl.pathname === window.location.pathname) {
          refreshCurrentRoute(router);
        }
      } catch {
        // Malformed message — ignore rather than throw.
      }
    }

    navigator.serviceWorker.addEventListener("message", onMessage);
    return () => navigator.serviceWorker.removeEventListener("message", onMessage);
  }, [router]);

  return <ToastViewport toast={toast} onDismiss={dismiss} />;
}
