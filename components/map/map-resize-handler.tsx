"use client";

import { useEffect } from "react";
import { useMap } from "react-leaflet";

/**
 * Leaflet measures its container once at init and never re-measures on its
 * own. Any map mounted inside something still animating/resizing at that
 * moment (a Framer Motion reveal, a tab/accordion opening, a flex layout
 * still settling) gets stuck rendering tiles for whatever size the
 * container happened to be at that instant — the classic "cropped corner"
 * map bug. A ResizeObserver on the actual container catches every
 * subsequent size change and tells Leaflet to re-measure via
 * invalidateSize(), so the map always fills its final container size.
 */
export function MapResizeHandler() {
  const map = useMap();

  useEffect(() => {
    const container = map.getContainer();

    // Covers the common case (container already at final size, just
    // measured too early) without waiting for a ResizeObserver tick.
    const raf = requestAnimationFrame(() => map.invalidateSize());

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(container);

    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [map]);

  return null;
}
