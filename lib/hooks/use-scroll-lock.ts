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
        window.scrollTo(0, savedScrollY);
      }
    };
  }, [active]);
}
