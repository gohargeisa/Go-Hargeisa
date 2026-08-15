"use client";

import { useState } from "react";
import { TableReservationModal } from "@/components/shared/table-reservation-modal";

/**
 * Self-contained "Reserve a Table" trigger — same own-modal-state pattern as
 * HotelBookNowButton, generic over listingType/listingId so it drives the
 * identical real reservation flow from every surface that needs it (top
 * action bar, sidebar card, dedicated page section) for any restaurant or
 * cafe, not just Sultan.
 */
export function TableReservationButton({
  listingType,
  listingId,
  businessName,
  locale,
  label,
  className,
  icon,
  variant = "table",
}: {
  listingType: "restaurant" | "cafe" | "service";
  listingId: string;
  businessName: string;
  locale: string;
  label: string;
  className: string;
  icon?: React.ReactNode;
  /** "viewing" switches the modal/form to Real Estate wording (Book a
   * Viewing, Number of Viewers, ...) via the propertyViewing translation
   * namespace instead of tableReservation — see TableReservationModal. */
  variant?: "table" | "viewing";
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {icon}
        {label}
      </button>
      {open && (
        <TableReservationModal
          listingType={listingType}
          listingId={listingId}
          businessName={businessName}
          locale={locale}
          variant={variant}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
