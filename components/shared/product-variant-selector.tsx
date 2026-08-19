"use client";

import { useTranslations } from "next-intl";
import { Check } from "lucide-react";
import { variantLocalizedName } from "@/lib/utils/product-i18n";
import type { ProductVariant } from "@/types";

/**
 * Reusable shade/finish/size swatch picker — data-driven, not hardcoded to
 * lipstick or any other single product type. Any product with 2+
 * `variants` (types/index.ts) gets this automatically wherever
 * ProductDetailModal renders it; a product with none never mounts this at
 * all. A color swatch renders when `hexColor` is set (shades/colors); a
 * text pill (shade code, size, or name) renders otherwise (sizes, finishes)
 * — same component either way, just a different visual per variant shape.
 * Controlled: the parent owns which variant is selected so it can also
 * swap the displayed image/price/name/SKU in lockstep — this component
 * never fakes that by itself.
 */
export function ProductVariantSelector({
  variants,
  selectedId,
  onSelect,
  locale,
}: {
  variants: ProductVariant[];
  selectedId: string;
  onSelect: (variant: ProductVariant) => void;
  locale: string;
}) {
  const t = useTranslations("products");
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-ink/50 dark:text-sand/50">{t("selectOption")}</label>
        <span className="truncate text-sm font-bold">{variantLocalizedName(selected, locale)}</span>
      </div>
      <div className="flex flex-wrap gap-2.5" role="radiogroup" aria-label={t("selectOption")}>
        {variants.map((variant) => {
          const active = variant.id === selected.id;
          const label = variantLocalizedName(variant, locale);
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
              {variant.hexColor ? (
                <span
                  className="h-7 w-7 shrink-0 rounded-full ring-1 ring-inset ring-black/10 dark:ring-white/15"
                  style={{ backgroundColor: variant.hexColor }}
                  aria-hidden="true"
                />
              ) : (
                <span className="px-1 text-xs font-bold">{variant.shadeCode ?? variant.size ?? label}</span>
              )}
              {active && variant.hexColor && (
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
