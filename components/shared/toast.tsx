"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, m } from "framer-motion";
import { CheckCircle2, X, XCircle } from "lucide-react";

export type ToastState = { type: "success" | "error"; message: string } | null;

export function useToast(durationMs = 4500) {
  const [toast, setToast] = useState<ToastState>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (type: "success" | "error", message: string) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setToast({ type, message });
      timeoutRef.current = setTimeout(() => setToast(null), durationMs);
    },
    [durationMs]
  );

  const dismiss = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast(null);
  }, []);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  return { toast, showToast, dismiss };
}

export function ToastViewport({ toast, onDismiss }: { toast: ToastState; onDismiss: () => void }) {
  return (
    <div aria-live="polite" className="pointer-events-none fixed inset-x-0 bottom-6 z-[100] flex justify-center px-4">
      <AnimatePresence>
        {toast && (
          <m.div
            role="status"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className={`pointer-events-auto flex max-w-sm items-start gap-3 rounded-2xl border px-5 py-4 text-sm shadow-2xl ${
              toast.type === "success"
                ? "border-emerald-500/20 bg-emerald-600 text-white"
                : "border-red-500/20 bg-red-600 text-white"
            }`}
          >
            {toast.type === "success" ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            ) : (
              <XCircle size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
            )}
            <p className="flex-1 leading-relaxed">{toast.message}</p>
            <button
              type="button"
              onClick={onDismiss}
              aria-label="Dismiss"
              className="shrink-0 rounded-full p-1 text-white/70 transition-colors hover:bg-white/15 hover:text-white"
            >
              <X size={15} aria-hidden="true" />
            </button>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}
