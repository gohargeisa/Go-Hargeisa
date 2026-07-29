"use client";

import { useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { BookingRequestModal } from "@/components/shared/booking-request-modal";
import type { HotelBookingCta } from "@/lib/utils/booking-cta";
import type { HotelRoom } from "@/types";

/**
 * Single reusable "Book Now" control every hotel booking surface (top action
 * bar, sidebar card, mobile sticky bar, per-room cards) renders instead of
 * re-implementing the external-link-vs-request-modal branch itself — the
 * `cta` (from lib/utils/booking-cta.ts) already decided which one applies.
 * Self-contained modal state per instance, same pattern as
 * components/shared/claim-business-button.tsx.
 */
export function HotelBookNowButton({
  cta,
  hotelId,
  hotelName,
  rooms = [],
  preselectedRoomId,
  className,
  iconSize = 15,
}: {
  cta: HotelBookingCta;
  hotelId: string;
  hotelName: string;
  rooms?: HotelRoom[];
  preselectedRoomId?: string;
  className: string;
  iconSize?: number;
}) {
  const [open, setOpen] = useState(false);

  if (cta.kind === "external") {
    return (
      <a href={cta.href} target="_blank" rel="noopener noreferrer" className={className}>
        {cta.label}
        <ArrowUpRight size={iconSize} aria-hidden="true" />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    );
  }

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {cta.label}
      </button>
      {open && (
        <BookingRequestModal
          hotelId={hotelId}
          hotelName={hotelName}
          rooms={rooms}
          preselectedRoomId={preselectedRoomId}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
