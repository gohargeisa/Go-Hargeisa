"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { TableReservationModal } from "@/components/shared/table-reservation-modal";

/**
 * Self-contained "Reserve a Table" trigger — same own-modal-state pattern as
 * HotelBookNowButton, generic over listingType/listingId so it drives the
 * identical real reservation flow from every surface that needs it (top
 * action bar, sidebar card, dedicated page section) for any restaurant or
 * cafe, not just Sultan.
 *
 * The modal is portalled out of this button's own render position: this
 * component gets used from inside hero sections that set `isolate` (e.g.
 * components/the-village/village-hero.tsx's `relative isolate` hero), and
 * `isolation: isolate` opens a stacking context that traps any descendant —
 * so an in-tree modal (z-modal / 80) would paint *under* the fixed site
 * header (z-50), which is a sibling of that hero section at the root,
 * leaving the reservation form visually stuck behind the header with no
 * visible title or close button. Portalling out of that context is the same
 * fix already used for this exact bug shape in
 * components/emaankoo/order-request-form.tsx.
 *
 * Portal target is the nearest `[data-partner-theme]` ancestor (see
 * components/shared/partner/partner-theme-scope.tsx) when the trigger sits
 * inside one, falling back to `document.body` otherwise — a themed cafe's
 * modal (e.g. Lavender) needs to stay inside that div to inherit its `--pt-*`
 * CSS custom properties; portaling straight to `document.body` would have
 * silently reverted its buttons to the default site color.
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
  const buttonRef = useRef<HTMLButtonElement>(null);
  const portalTargetRef = useRef<Element | null>(null);

  function onOpen() {
    portalTargetRef.current = buttonRef.current?.closest("[data-partner-theme]") ?? document.body;
    setOpen(true);
  }

  return (
    <>
      <button ref={buttonRef} type="button" onClick={onOpen} className={className}>
        {icon}
        {label}
      </button>
      {open &&
        portalTargetRef.current &&
        createPortal(
          <TableReservationModal
            listingType={listingType}
            listingId={listingId}
            businessName={businessName}
            locale={locale}
            variant={variant}
            onClose={() => setOpen(false)}
          />,
          portalTargetRef.current
        )}
    </>
  );
}
