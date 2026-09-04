"use client";

import { useEffect, useRef } from "react";
import { pushAndroidBackHandler } from "@/lib/mobile/android-back";

/**
 * While `active` is true, the Android hardware Back button closes this
 * overlay (invokes `onBack`) instead of navigating the page underneath or
 * exiting the app. Registration is LIFO — the most recently opened overlay
 * handles Back first, so nested overlays (e.g. a lightbox inside a product
 * modal) unwind one layer per press.
 *
 * No-op on the web and on iOS (see lib/mobile/android-back.ts). `onBack`
 * does not need to be memoised — it is read through a ref, so changing its
 * identity never re-registers the handler.
 */
export function useAndroidBackHandler(active: boolean, onBack: () => void): void {
  const onBackRef = useRef(onBack);
  useEffect(() => {
    onBackRef.current = onBack;
  });

  useEffect(() => {
    if (!active) return;
    const unregister = pushAndroidBackHandler(() => onBackRef.current());
    return unregister;
  }, [active]);
}
