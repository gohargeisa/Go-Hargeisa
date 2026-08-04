"use client";

import { useEffect, useState } from "react";

export interface VisitorLocation {
  lat: number;
  lng: number;
}

/**
 * Requests the browser/WebView's Geolocation API once on mount so City
 * Services cards can show a "X km away" distance — the one place in the app
 * that asks for real device location, scoped narrowly to this card's own
 * distance display. Silently resolves to `null` (no card-breaking error UI)
 * when the visitor denies the prompt, the API is unavailable, or the page
 * isn't served over a secure context that allows it.
 */
export function useVisitorLocation(): VisitorLocation | null {
  const [location, setLocation] = useState<VisitorLocation | null>(null);

  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    let cancelled = false;
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (cancelled) return;
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        // Denied, timed out, or unavailable — the card just omits distance.
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 5 * 60 * 1000 }
    );
    return () => {
      cancelled = true;
    };
  }, []);

  return location;
}
