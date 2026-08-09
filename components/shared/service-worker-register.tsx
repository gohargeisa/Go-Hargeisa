"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    // A browser that already had an old service worker controlling this
    // origin from before a deploy has no way to self-heal on its own — the
    // browser only checks for a new worker on navigation, and even then the
    // new one doesn't take over an already-open page until this event
    // fires. Without this listener, that visitor keeps being served
    // whatever the OLD worker decides (the exact stale-content class of bug
    // fixed in sw.js — see its own comments) until they happen to close
    // every tab on this origin or manually clear site data. Reloading once
    // when control actually changes hands is the standard fix: the `reloaded`
    // guard keeps it to exactly one reload per update (including the very
    // first install, where clients.claim() also fires this once — an
    // accepted, common tradeoff, not a bug).
    let reloaded = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (reloaded) return;
      reloaded = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register("/sw.js")
      .then((registration) => {
        // Don't wait for the browser's own periodic check (which can be
        // hours away) — ask immediately so an already-affected visitor
        // recovers on this very visit, not their next one.
        registration.update().catch(() => {});
      })
      .catch((err) => {
        // Service worker registration failed - continue without PWA support
        if (process.env.NODE_ENV === "development") {
          console.warn("Service worker registration failed");
        }
      });
  }, []);

  return null;
}
