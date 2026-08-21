import { useEffect } from "react";

let lockCount = 0;
let savedScrollY = 0;

/**
 * Locks page scroll while `active` is true — used by every overlay (side
 * menu, search, notifications, account menu, bottom sheets, drawers,
 * modals) so the page behind can't scroll while one is open. Reference-
 * counted at module scope so if two overlays are ever open at once, scroll
 * only gets restored when the last one closes, not the first.
 *
 * Uses `position: fixed` on <body> (saving/restoring scrollY) rather than
 * just `overflow: hidden` — plain overflow:hidden doesn't stop iOS Safari's
 * background rubber-band/touch scroll, which is exactly the "page still
 * scrolls behind the overlay" bug this exists to close off.
 *
 * The restore-on-unlock scroll MUST be instant, not animated: `html` sets
 * `scroll-behavior: smooth` globally (app/globals.css), which a plain
 * `window.scrollTo(x, y)` inherits — restoring the background position
 * this way visibly animates the page scrolling back into place instead of
 * silently reappearing where the user actually left it, and worse, in dev
 * (React 18 Strict Mode double-invokes every effect: mount → cleanup →
 * mount) the *second* mount's `window.scrollY` read lands mid-animation
 * (effectively still ~0), permanently corrupting `savedScrollY` and
 * producing a real "page jumps to the top and stays there" bug on close.
 * `behavior: "instant"` in the options-object form of scrollTo overrides
 * the inherited CSS smoothness for this one call, closing both the visible
 * jank and the Strict Mode race in one fix.
 */
export function useScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;

    if (lockCount === 0) {
      savedScrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${savedScrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";
    }
    lockCount++;

    return () => {
      lockCount--;
      if (lockCount === 0) {
        document.body.style.position = "";
        document.body.style.top = "";
        document.body.style.left = "";
        document.body.style.right = "";
        document.body.style.overflow = "";
        window.scrollTo({ top: savedScrollY, left: 0, behavior: "instant" });
      }
    };
  }, [active]);
}
