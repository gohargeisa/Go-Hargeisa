import type { ReactNode } from "react";
import { partnerThemeStyle, type PartnerTheme } from "@/lib/config/partner-themes";

/**
 * Wraps a listing detail page's whole render tree so the scoped CSS override
 * rules in app/globals.css ("Partner Theme System") can pick up this
 * partner's brand colors. Renders a plain fragment (zero DOM/CSS change)
 * when `theme` is null — every listing other than an explicitly themed
 * partner is completely unaffected, byte-for-byte identical to before this
 * system existed.
 *
 * Deliberately sets only CSS custom properties (no transform/filter), so it
 * never creates a new containing block — fixed-position descendants
 * (MobileBookingBar, modals, the lightbox) keep positioning against the
 * viewport exactly as before.
 */
export function PartnerThemeScope({ theme, children }: { theme: PartnerTheme | null; children: ReactNode }) {
  if (!theme) return <>{children}</>;

  return (
    <div data-partner-theme={theme.slug} style={partnerThemeStyle(theme)}>
      {children}
    </div>
  );
}
