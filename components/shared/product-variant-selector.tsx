"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Check } from "lucide-react";
import { variantLocalizedName } from "@/lib/utils/product-i18n";
import type { ProductVariant } from "@/types";

/**
 * Reusable shade/finish/size swatch picker — data-driven, not hardcoded to
 * lipstick or any other single product type. Any product with 2+
 * `variants` (types/index.ts) gets this automatically wherever
 * ProductDetailModal renders it; a product with none never mounts this at
 * all. Per-variant swatch, in priority order: a real photo (`variant.image`,
 * when the business has one — a genuine shade photo beats any color, real
 * or approximated) → a verified `hexColor` → an opt-in approximated color
 * (`resolveSwatchColor`) → a plain text pill (shade code, size, or name) as
 * the last resort. Controlled: the parent owns which variant is selected so
 * it can also swap the displayed image/price/name/SKU in lockstep — this
 * component never fakes that by itself.
 */
export function ProductVariantSelector({
  variants,
  selectedId,
  onSelect,
  locale,
  label,
  resolveSwatchColor,
  resolveFallbackLabel,
  preferVariantImage,
}: {
  variants: ProductVariant[];
  selectedId: string;
  onSelect: (variant: ProductVariant) => void;
  locale: string;
  /** Optional, opt-in only (every existing caller is unaffected): overrides
   * the generic "Choose an option" heading above the swatch row with a
   * domain-appropriate noun (e.g. "Shade" for cosmetics). Falls back to
   * `t("selectOption")` when omitted. */
  label?: string;
  /** Optional, opt-in only (every existing caller is unaffected): called
   * when a variant has no `hexColor` of its own, to approximate a real
   * swatch color from its shade name instead of falling through to the
   * text-pill fallback below. Added for Flormar, whose real catalog has a
   * `shadeCode`/`shadeName` on every variant but `hexColor` on none — see
   * lib/utils/flormar-shade-colors.ts. */
  resolveSwatchColor?: (variant: ProductVariant) => string | null;
  /** Optional, opt-in only: overrides the default fallback text
   * (`shadeCode ?? size ?? label`) shown when no swatch color is
   * available. Added for Flormar so a real shade name displays instead of
   * the raw numeric `shadeCode` a customer shouldn't see. */
  resolveFallbackLabel?: (variant: ProductVariant) => string;
  /** Optional, opt-in only (default false, every existing caller
   * unaffected): when true, a variant's own `image` (a real per-shade
   * photo) takes priority over `hexColor`/`resolveSwatchColor` for the
   * swatch appearance. Off by default so no existing partner's swatch
   * appearance changes just because a variant happens to have both a
   * color and a photo on file — enabled only where the platform owner
   * explicitly asked for real photos to win over any color, guessed or
   * verified (Flormar). */
  preferVariantImage?: boolean;
}) {
  const t = useTranslations("products");
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];
  const heading = label ?? t("selectOption");
  const availableCount = variants.filter((v) => v.isAvailable).length;

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-sand/50">
          {heading}
          {availableCount < variants.length && (
            <span className="ms-1.5 font-normal normal-case text-ink/40 dark:text-sand/40">
              {t("optionsAvailableOfTotal", { available: availableCount, total: variants.length })}
            </span>
          )}
        </label>
        <span className="truncate text-sm font-bold">{variantLocalizedName(selected, locale)}</span>
      </div>
      <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label={heading}>
        {variants.map((variant) => {
          const active = variant.id === selected.id;
          const label = variantLocalizedName(variant, locale);
          const swatchColor = variant.hexColor ?? resolveSwatchColor?.(variant) ?? null;
          const fallbackLabel = resolveFallbackLabel ? resolveFallbackLabel(variant) : (variant.shadeCode ?? variant.size ?? label);
          return (
            <button
              key={variant.id}
              type="button"
              role="radio"
              aria-checked={active}
              aria-label={variant.isAvailable ? label : `${label} — ${t("outOfStock")}`}
              title={label}
              disabled={!variant.isAvailable}
              onClick={() => onSelect(variant)}
              className={`group relative flex h-10 min-w-10 items-center justify-center rounded-full border-2 px-2 transition-all duration-200 ease-premium disabled:cursor-not-allowed disabled:opacity-35 ${
                active
                  ? "border-primary shadow-[0_4px_14px_rgba(0,0,0,0.15)]"
                  : "border-transparent hover:border-ink/20 dark:hover:border-white/25"
              }`}
            >
              {preferVariantImage && variant.image ? (
                <span className="relative h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/15" aria-hidden="true">
                  <Image src={variant.image} alt="" fill sizes="28px" className="object-cover" />
                </span>
              ) : swatchColor ? (
                <span
                  className="h-7 w-7 shrink-0 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/15"
                  style={{ backgroundColor: swatchColor }}
                  aria-hidden="true"
                />
              ) : (
                <span className="px-1 text-xs font-bold">{fallbackLabel}</span>
              )}
              {active && ((preferVariantImage && variant.image) || swatchColor) && (
                <Check
                  size={13}
                  strokeWidth={3}
                  aria-hidden="true"
                  className="absolute inset-0 m-auto text-white mix-blend-difference"
                />
              )}
              {!variant.isAvailable && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 rounded-full bg-white/70 dark:bg-ink/70"
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
