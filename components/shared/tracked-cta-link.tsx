"use client";

import { trackMetricEvent } from "@/lib/actions/business";
import type { BusinessListingType } from "@/types";

/**
 * Plain `<a>` that also fires a real (best-effort, non-blocking) click
 * metric event — used for the Call/WhatsApp/Website buttons a business
 * owner's dashboard KPI cards read from. Doesn't call preventDefault, so
 * the browser's normal navigation (new tab, tel:, wa.me) proceeds exactly
 * as before; the tracking call just rides along on the same click.
 */
export function TrackedCtaLink({
  listingType,
  listingId,
  eventType,
  href,
  target,
  rel,
  className,
  children,
}: {
  listingType: BusinessListingType;
  listingId: string;
  eventType: "website_click" | "call_click" | "whatsapp_click";
  href: string;
  target?: string;
  rel?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={className}
      onClick={() => {
        void trackMetricEvent(listingType, listingId, eventType);
      }}
    >
      {children}
    </a>
  );
}
