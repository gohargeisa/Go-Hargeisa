"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;
    if (process.env.NODE_ENV !== "production") return;

    navigator.serviceWorker.register("/sw.js").catch((err) => {
      // Service worker registration failed - continue without PWA support
      if (process.env.NODE_ENV === "development") {
        console.warn("Service worker registration failed");
      }
    });
  }, []);

  return null;
}
