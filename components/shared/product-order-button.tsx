"use client";

import { useState } from "react";
import { ProductOrderModal } from "@/components/shared/product-order-modal";
import type { Product } from "@/types";

/** Self-contained "Order Now"/"Request Order" trigger — same own-modal-state
 * pattern as TableReservationButton, generic over listingType/listingId. */
export function ProductOrderButton({
  listingType,
  listingId,
  businessName,
  products,
  preselectedProductId,
  locale,
  label,
  className,
  icon,
}: {
  listingType: "city_service" | "service";
  listingId: string;
  businessName: string;
  products?: Product[];
  preselectedProductId?: string;
  locale: string;
  label: string;
  className: string;
  icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={className}>
        {icon}
        {label}
      </button>
      {open && (
        <ProductOrderModal
          listingType={listingType}
          listingId={listingId}
          businessName={businessName}
          products={products}
          preselectedProductId={preselectedProductId}
          locale={locale}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
