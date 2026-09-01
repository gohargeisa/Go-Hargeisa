"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { variantLocalizedName } from "@/lib/utils/product-i18n";
import type { ProductVariant } from "@/types";

/**
 * Reusable shade/finish/size picker — data-driven, not hardcoded to lipstick
 * or any single product type. Any product with 2+ `variants` (types/
 * index.ts) gets this automatically wherever ProductDetailModal renders it;
 * a product with none never mounts it.
 *
 * The grid is a clean row of CIRCULAR swatches only — one uniform shape,
 * never a mix of circles and text pills, never a photo thumbnail, never the
 * parent product name repeated beside every swatch. Each circle is a real
 * `hexColor`, an approximated colour (`resolveSwatchColor`, only where that
 * mapping already exists), or a neutral "colour unknown" dot. The shade's
 * own name is NOT printed in the grid — it shows once, near the header, for
 * the current selection, and is available per-swatch via native
 * hover/focus tooltip (`title`) + the accessible name (`aria-label`).
 *
 * Controlled: the parent owns which variant is selected so it can swap the
 * image/price/name/SKU together — this component never fakes that itself.
 * The grid has no fixed height, so a long shade list is never clipped and
 * every option stays reachable through the modal's own scroll. Logical
 * spacing / positioning throughout, so RTL is correct with no overrides.
 */
export function ProductVariantSelector({
  variants,
  selectedId,
  onSelect,
  locale,
  label,
  resolveSwatchColor,
  resolveFallbackLabel,
}: {
  variants: ProductVariant[];
  selectedId: string;
  onSelect: (variant: ProductVariant) => void;
  locale: string;
  /** Optional, opt-in only (every existing caller is unaffected): overrides
   * the generic "Choose an option" heading with a domain-appropriate noun
   * (e.g. "Shade"). Falls back to `t("selectOption")` when omitted. */
  label?: string;
  /** Optional, opt-in only: approximate a swatch colour for a variant with
   * no `hexColor` of its own — ONLY where an established mapping already
   * does this (Flormar's word-match, lib/utils/flormar-shade-colors.ts).
   * Return null to fall back to the neutral "unknown colour" dot. */
  resolveSwatchColor?: (variant: ProductVariant) => string | null;
  /** Optional, opt-in only: overrides the displayed label (default
   * `variantLocalizedName`). Flormar passes the code-prefixed shade name so
   * the shade number is always visible in the header + tooltip. */
  resolveFallbackLabel?: (variant: ProductVariant) => string;
}) {
  const t = useTranslations("products");
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];
  // Position of the selected shade in the product's own imported shade order
  // — recomputed every render, so it moves with every selection.
  const selectedIndex = Math.max(0, variants.findIndex((v) => v.id === selected.id));
  const heading = label ?? t("selectOption");
  const labelOf = (v: ProductVariant) =>
    resolveFallbackLabel ? resolveFallbackLabel(v) : variantLocalizedName(v, locale);

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-sand/50">
          {heading}
          <span className="ms-1.5 font-normal normal-case text-ink/40 dark:text-sand/40">
            {t("shadeIndexOfTotal", { index: selectedIndex + 1, total: variants.length })}
          </span>
        </span>
        {/* The one place a shade name is shown — the current selection,
            recomputed from `selected` every render so it never goes stale. */}
        <span className="truncate text-sm font-bold text-ink dark:text-white">{labelOf(selected)}</span>
      </div>

      <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label={heading}>
        {variants.map((variant) => {
          const active = variant.id === selected.id;
          const itemLabel = labelOf(variant);
          const swatchColor = variant.hexColor ?? resolveSwatchColor?.(variant) ?? null;
          return (
            <button
              key={variant.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={variant.isAvailable ? itemLabel : `${itemLabel} — ${t("outOfStock")}`}
              title={itemLabel}
              disabled={!variant.isAvailable}
              onClick={() => onSelect(variant)}
              className={`relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform duration-200 ease-premium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:cursor-not-allowed disabled:opacity-35 ${
                active
                  ? "ring-2 ring-primary ring-offset-2 ring-offset-white dark:ring-offset-ink"
                  : "ring-1 ring-inset ring-black/10 hover:scale-110 dark:ring-white/20"
              }`}
            >
              <span
                className="absolute inset-0 flex items-center justify-center rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/15"
                style={swatchColor ? { backgroundColor: swatchColor } : undefined}
                aria-hidden="true"
              >
                {!swatchColor && <span className="h-3 w-3 rounded-full bg-ink/20 dark:bg-white/25" />}
              </span>
              {active && (
                <span className="relative flex h-5 w-5 items-center justify-center rounded-full bg-black/45 text-white">
                  <Check size={12} strokeWidth={3} aria-hidden="true" />
                </span>
              )}
              {!variant.isAvailable && (
                <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full bg-white/65 dark:bg-ink/65" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
