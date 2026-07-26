"use client";

import { useEffect } from "react";

/**
 * Warns via the browser's native confirmation dialog if the user tries to
 * close the tab, reload, or navigate away with unsaved form changes. Does
 * NOT intercept in-app Next.js Link/router navigation — the browser gives
 * no reliable, non-hacky hook for that in the App Router, so this covers
 * the common real-world cases (accidental reload/close/back) rather than
 * every possible navigation.
 */
export function useUnsavedChangesWarning(hasUnsavedChanges: boolean) {
  useEffect(() => {
    if (!hasUnsavedChanges) return;

    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [hasUnsavedChanges]);
}
