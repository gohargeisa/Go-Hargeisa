"use client";

import { useEffect } from "react";
import { AnimatePresence, m, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";

/**
 * Generic mobile bottom sheet. Same slide-up + backdrop pattern already used
 * by the hotel/restaurant/cafe mobile booking bars, extracted here so new
 * features (like the Smart City Map) don't duplicate it a fourth time.
 */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}) {
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <m.div
            initial={reduceMotion ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            className="fixed inset-0 z-[60] bg-black/50 lg:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
          <m.div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={reduceMotion ? undefined : { y: "100%" }}
            animate={{ y: 0 }}
            exit={reduceMotion ? undefined : { y: "100%" }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-[60] max-h-[85vh] overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl dark:bg-ink lg:hidden"
          >
            <div className="mb-4 flex items-center justify-between gap-3">
              {title && <p className="font-display text-lg font-semibold">{title}</p>}
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="ms-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink/5 transition-colors hover:bg-ink/10 dark:bg-white/10 dark:hover:bg-white/15"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            {children}
          </m.div>
        </>
      )}
    </AnimatePresence>
  );
}
