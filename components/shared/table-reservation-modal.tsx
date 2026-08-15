"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { TableReservationForm } from "@/components/shared/table-reservation-form";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { useScrollLock } from "@/lib/hooks/use-scroll-lock";

/**
 * Same fixed-overlay chrome as BookingRequestModal (focus trap, scroll
 * lock, Escape-to-close, full-screen on mobile / centered card on desktop)
 * wrapped around TableReservationForm — kept as its own component (rather
 * than generalizing BookingRequestModal itself) so the hotel booking flow
 * stays untouched while reservations get an identical, proven UX shell.
 */
export function TableReservationModal({
  listingType,
  listingId,
  businessName,
  locale,
  variant = "table",
  onClose,
}: {
  listingType: "restaurant" | "cafe" | "service";
  listingId: string;
  businessName: string;
  locale: string;
  variant?: "table" | "viewing";
  onClose: () => void;
}) {
  const t = useTranslations(variant === "viewing" ? "propertyViewing" : "tableReservation");
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef);
  useScrollLock(true);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-0 sm:p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t("modalTitle")}
        tabIndex={-1}
        className="relative flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-ink sm:h-auto sm:max-h-[92vh] sm:max-w-lg sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/8 p-5 dark:border-white/10">
          <div>
            <p className="font-display text-xl font-extrabold tracking-tight">{t("modalTitle")}</p>
            <p className="mt-0.5 text-sm text-ink/60 dark:text-sand/60">{businessName}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink/5 transition-colors hover:bg-ink/10 dark:bg-white/10 dark:hover:bg-white/15"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          <TableReservationForm listingType={listingType} listingId={listingId} locale={locale} variant={variant} onClose={onClose} />
        </div>
      </div>
    </div>
  );
}
