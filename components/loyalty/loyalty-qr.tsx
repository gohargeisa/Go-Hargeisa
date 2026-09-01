"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Maximize2, X } from "lucide-react";
import { useScrollLock } from "@/lib/hooks/use-scroll-lock";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { recordLoyaltyEventAction } from "@/lib/actions/loyalty";

/**
 * Renders the membership QR (a server-generated inline SVG string) with a
 * tap-to-enlarge full-screen view for scanning at the counter. Fires a
 * one-time `qr_viewed` analytics event. No camera, no client QR library —
 * generation happens server-side.
 */
export function LoyaltyQr({
  svg,
  programId,
  memberId,
  caption,
  variant = "onDark",
}: {
  svg: string;
  programId: string;
  memberId: string;
  caption: string;
  variant?: "onDark" | "plain";
}) {
  const t = useTranslations("loyalty");
  const [open, setOpen] = useState(false);
  const logged = useRef(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useScrollLock(open);
  useFocusTrap(dialogRef, open);

  useEffect(() => {
    if (logged.current) return;
    logged.current = true;
    void recordLoyaltyEventAction(programId, "qr_viewed", memberId);
  }, [programId, memberId]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const frame =
    variant === "onDark"
      ? "bg-white"
      : "bg-white ring-1 ring-ink/10 dark:ring-white/10";

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group relative mx-auto flex w-full max-w-[240px] flex-col items-center gap-2 rounded-2xl ${frame} p-4 transition-transform duration-300 ease-premium hover:-translate-y-0.5 active:scale-[0.98]`}
        aria-label={t("enlargeQr")}
      >
        <span
          className="block w-full [&_svg]:h-auto [&_svg]:w-full"
          dangerouslySetInnerHTML={{ __html: svg }}
        />
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-ink/50">
          <Maximize2 size={12} aria-hidden="true" />
          {t("tapToEnlarge")}
        </span>
      </button>

      {open && (
        <div
          ref={dialogRef}
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center gap-6 bg-black/95 p-6 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-label={t("qrDialogTitle")}
          tabIndex={-1}
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute end-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
            aria-label={t("close")}
            style={{ marginTop: "env(safe-area-inset-top)" }}
          >
            <X size={20} aria-hidden="true" />
          </button>
          <div
            className="w-full max-w-sm rounded-3xl bg-white p-6 [&_svg]:h-auto [&_svg]:w-full"
            onClick={(e) => e.stopPropagation()}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
          <p className="max-w-xs text-center text-sm font-medium text-white/80">{caption}</p>
        </div>
      )}
    </>
  );
}
