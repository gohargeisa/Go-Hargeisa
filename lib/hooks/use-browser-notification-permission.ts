"use client";

import { useCallback, useEffect, useState } from "react";

export type BrowserNotificationPermission = "default" | "granted" | "denied" | "unsupported";

/**
 * Opt-in browser notifications for new incoming requests — deliberately
 * never requested automatically; `request()` only ever runs from a real
 * click (the bell's own toggle), matching the requirement that permission
 * is offered, never mandatory or auto-prompted. `notify()` is a no-op
 * whenever permission isn't "granted" (including "unsupported", e.g.
 * Safari's older permission model or a browser with Notification blocked
 * entirely), so callers can always call it unconditionally.
 */
export function useBrowserNotificationPermission() {
  const [permission, setPermission] = useState<BrowserNotificationPermission>("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission as BrowserNotificationPermission);
  }, []);

  const request = useCallback(async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    try {
      const result = await Notification.requestPermission();
      setPermission(result as BrowserNotificationPermission);
    } catch {
      // Some browsers throw if requestPermission() isn't called from a
      // user gesture — treat it the same as "denied" rather than crashing.
      setPermission("denied");
    }
  }, []);

  const notify = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (permission !== "granted" || typeof window === "undefined" || !("Notification" in window)) return;
      try {
        new Notification(title, options);
      } catch {
        // A background/inactive tab, or a browser quirk — never break the
        // dashboard over a native notification.
      }
    },
    [permission]
  );

  return { permission, request, notify };
}
