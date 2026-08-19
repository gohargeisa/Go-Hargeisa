import { ImageOff } from "lucide-react";
import type { PartnerTheme } from "@/lib/config/partner-themes";

/**
 * Minimal, on-brand "no photo yet" canvas for a single product tile —
 * deliberately smaller and quieter than BrandedPlaceholder (that one is
 * built for a full-width hero/gallery slot and reads correctly at that
 * scale; inside a compact product-grid tile its big icon + "Photos coming
 * soon" label would read as an error state repeated dozens of times down a
 * catalog page). Shows a neutral "no photo" icon plus the product's own
 * name/category — same information density as a photographed tile, just
 * without a photo, so a shopper scanning the grid sees "a product without
 * a photo yet" rather than "something broke".
 *
 * Deliberately does NOT render the partner's logo (an earlier revision
 * did, as a small badge) — a logo is brand identity, never a stand-in for
 * missing product/category photography; showing it in that slot reads as
 * "the logo is this product's photo", which is exactly the confusing
 * result this component exists to avoid. Only the theme's *colors* brand
 * this tile now, via the gradient background and icon/text tint — never
 * the logo image itself. Product-agnostic (any partner theme), not
 * Flormar-specific markup — the same "Partner Theme System" pattern every
 * other partner-scoped-but-generic component in this codebase follows.
 */
export function PartnerProductPlaceholder({ name, category, theme }: { name: string; category?: string; theme: PartnerTheme }) {
  return (
    <div
      className="relative flex h-full w-full flex-col items-center justify-center gap-2.5 px-4 text-center"
      style={{ background: `linear-gradient(160deg, rgba(${theme.primaryRgb}, 0.08) 0%, #FBF7F4 55%, rgba(${theme.accentRgb}, 0.12) 130%)` }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.12)`, color: theme.primaryStrong }}
      >
        <ImageOff size={16} aria-hidden="true" />
      </span>
      <p className="line-clamp-2 text-xs font-semibold leading-snug" style={{ color: theme.primaryStrong }}>
        {name}
      </p>
      {category && (
        <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: theme.accentStrong }}>
          {category}
        </p>
      )}
    </div>
  );
}
