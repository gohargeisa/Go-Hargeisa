"use client";

import { useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { X } from "lucide-react";
import { BookingForm } from "@/components/shared/booking-form";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { useScrollLock } from "@/lib/hooks/use-scroll-lock";
import { useAndroidBackHandler } from "@/lib/hooks/use-android-back-handler";
import type { Locale } from "@/lib/i18n/config";
import type { HotelRoom } from "@/types";

/**
 * Fixed-overlay chrome around the shared BookingForm — kept for the
 * quick-book entry points (per-room cards, the mobile sticky bar). The two
 * primary "Book Now" CTAs (hotel action bar, sidebar booking card) instead
 * navigate to the dedicated /hotels/[slug]/book page, which renders the
 * same BookingForm without this dialog wrapper.
 */
export function BookingRequestModal({
  locale,
  hotelId,
  hotelName,
  hotelRating,
  rooms = [],
  preselectedRoomId,
  whatsappNumber,
  onClose,
}: {
  locale: Locale;
  hotelId: string;
  hotelName: string;
  hotelRating?: number;
  rooms?: HotelRoom[];
  preselectedRoomId?: string;
  /** Set only in WhatsApp booking mode — after the booking is created, its
   * reference + these same form details are formatted into a WhatsApp
   * message and opened automatically (never an empty chat). */
  whatsappNumber?: string;
  onClose: () => void;
}) {
  const t = useTranslations("bookingRequest");
  const tCommon = useTranslations("common");
  const dialogRef = useRef<HTMLDivElement>(null);
  useFocusTrap(dialogRef);
  useScrollLock(true);
  useAndroidBackHandler(true, onClose);

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
        className="relative flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl dark:bg-ink sm:h-auto sm:max-h-[92vh] sm:max-w-4xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-ink/8 px-5 pb-5 pt-[max(1.25rem,env(safe-area-inset-top))] dark:border-white/10 sm:p-6">
          <p className="font-display text-2xl font-extrabold tracking-tight">{t("modalTitle")}</p>
          <button
            type="button"
            onClick={onClose}
            aria-label={tCommon("close")}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-ink/5 transition-colors hover:bg-ink/10 dark:bg-white/10 dark:hover:bg-white/15"
          >
            <X size={17} aria-hidden="true" />
          </button>
        </div>

        <BookingForm
          locale={locale}
          hotelId={hotelId}
          hotelName={hotelName}
          hotelRating={hotelRating}
          rooms={rooms}
          preselectedRoomId={preselectedRoomId}
          whatsappNumber={whatsappNumber}
          onClose={onClose}
        />
      </div>
    </div>
  );
}
