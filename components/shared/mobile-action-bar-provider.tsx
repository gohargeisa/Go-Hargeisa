"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

/**
 * Tracks whether a page-level fixed bottom action bar (e.g.
 * components/shared/mobile-booking-bar.tsx on the hotel / restaurant / cafe
 * and the Flormar / Pinnacle / Emaankoo storefront pages) is currently
 * mounted.
 *
 * The global floating BottomNav (components/layout/bottom-nav.tsx) and any
 * such action bar both live at `fixed inset-x-3 bottom:max(0.75rem,
 * env(safe-area-inset-bottom))` — rendering both stacks two identical-position
 * bars on top of each other. BottomNav already hard-hides itself on the
 * hotels/restaurants/cafes detail routes via a path regex, but the
 * partner-storefront routes (`/city-services/<slug>`) reuse MobileBookingBar
 * without matching that regex, so the two collided there.
 *
 * A bar registers itself on mount through `useRegisterMobileActionBar()`;
 * BottomNav (and its in-flow spacer) read `useMobileActionBarPresent()` and
 * render nothing while any bar is registered. Reusable: any future
 * page-owned fixed bottom bar gets the same de-duplication for free just by
 * calling the hook.
 */
const MobileActionBarContext = createContext<{
  present: boolean;
  register: () => () => void;
} | null>(null);

export function MobileActionBarProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  const register = useCallback(() => {
    setCount((c) => c + 1);
    return () => setCount((c) => Math.max(0, c - 1));
  }, []);

  const value = useMemo(() => ({ present: count > 0, register }), [count, register]);

  return <MobileActionBarContext.Provider value={value}>{children}</MobileActionBarContext.Provider>;
}

/** Call from a component that renders a fixed bottom action bar — while it is
 * mounted the global BottomNav stays hidden so the two never overlap. */
export function useRegisterMobileActionBar() {
  // `register` is referentially stable (useCallback with no deps), so this
  // effect runs exactly once on mount and cleans up on unmount — it does not
  // re-fire when `present` flips and the context value object changes.
  const register = useContext(MobileActionBarContext)?.register;
  useEffect(() => {
    if (!register) return;
    return register();
  }, [register]);
}

export function useMobileActionBarPresent() {
  return useContext(MobileActionBarContext)?.present ?? false;
}
