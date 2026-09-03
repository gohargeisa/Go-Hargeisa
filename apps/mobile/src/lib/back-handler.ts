/**
 * Android hardware / gesture Back handling.
 *
 * expo-router already pops the navigation stack on Back. This adds the two
 * behaviours a "real" Android app needs on top of that:
 *   - `useConfirmExitOnBack()` — on a root tab with an empty stack, the first
 *     Back press shows a "press again to exit" toast instead of closing the
 *     app instantly.
 *   - `useBackHandler(fn)` — let a screen (open sheet, search field, step in a
 *     flow) intercept Back and handle it itself.
 *
 * iOS has no hardware back, so these are no-ops there.
 */
import { useCallback, useEffect, useRef } from "react";
import { BackHandler, Platform, ToastAndroid } from "react-native";
import { router } from "expo-router";

/** Run `handler` on Back; return `true` from it to consume the event.
 *  `handler` should be stable (wrap it in `useCallback`). */
export function useBackHandler(handler: () => boolean): void {
  const ref = useRef(handler);

  useEffect(() => {
    ref.current = handler;
  }, [handler]);

  useEffect(() => {
    if (Platform.OS !== "android") return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () =>
      ref.current(),
    );
    return () => sub.remove();
  }, []);
}

/**
 * Attach on each root tab screen. While the tab's stack can still pop, Back
 * navigates back as usual; once at the tab root, a double-press within 2s is
 * required to leave the app.
 */
export function useConfirmExitOnBack(): void {
  const lastPress = useRef(0);

  const onBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return true;
    }
    const now = Date.now();
    if (now - lastPress.current < 2000) {
      BackHandler.exitApp();
      return true;
    }
    lastPress.current = now;
    ToastAndroid.show("Press back again to exit", ToastAndroid.SHORT);
    return true;
  }, []);

  useBackHandler(onBack);
}
