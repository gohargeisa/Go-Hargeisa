"use client";

import { useTranslations } from "next-intl";
import { Minus, Plus } from "lucide-react";
import type { Product, ProductOption } from "@/types";
import { localizedOptionLabel, localizedChoiceLabel, type ProductOptionValues } from "@/lib/cart/product-options";

/** "Free" for a genuinely $0 opt-in extra (multiselect / boolean / number),
 * never a bare "$0.00" — a shopper sees every ADD-ON has a definite cost,
 * free or not. NOT used for `select` choices: a required single-choice
 * select (pizza size, pasta protein, …) isn't an extra you add — it's
 * which version of the dish you get, already covered by the base price, so
 * a "$0" choice shows just its label (see the select branch below). */
function PriceBadge({ priceDelta, suffix, className }: { priceDelta: number; suffix?: string; className?: string }) {
  const t = useTranslations("productOrder");
  return (
    <span className={className ?? "text-ink/50 dark:text-sand/50"}>
      {priceDelta > 0 ? `+$${priceDelta.toFixed(2)}${suffix ?? ""}` : t("free")}
    </span>
  );
}

/**
 * Renders whatever options THIS product actually declares — one control per
 * `ProductOption.type`, nothing hardcoded per category. A flower bouquet's
 * "Gift Wrap" toggle, a cake's "Message" text field, and a latte's "Milk
 * Type" choices all come through this same generic renderer, driven purely
 * by data (see supabase/migrations/20260829000001_product_options.sql) —
 * this is the reusable mechanism behind every category's "own" ordering
 * experience, not a per-category component fork. Renders nothing for a
 * product with no options (every product before this system existed).
 */
export function ProductOptionsForm({
  options,
  locale,
  values,
  onChange,
}: {
  options: Product["options"];
  locale: string;
  values: ProductOptionValues;
  onChange: (key: string, value: ProductOptionValues[string]) => void;
}) {
  if (!options || options.length === 0) return null;
  const sorted = [...options].sort((a, b) => a.sortOrder - b.sortOrder);
  return (
    <div className="space-y-3.5">
      {sorted.map((opt) => (
        <ProductOptionField key={opt.id} option={opt} locale={locale} value={values[opt.key]} onChange={(v) => onChange(opt.key, v)} />
      ))}
    </div>
  );
}

function ProductOptionField({
  option,
  locale,
  value,
  onChange,
}: {
  option: ProductOption;
  locale: string;
  value: ProductOptionValues[string] | undefined;
  onChange: (value: ProductOptionValues[string]) => void;
}) {
  const label = localizedOptionLabel(option, locale);
  const requiredMark = option.required ? <span className="text-red-500"> *</span> : null;

  if (option.type === "select") {
    return (
      <div>
        <label className="mb-1.5 block text-sm font-semibold">
          {label}
          {requiredMark}
        </label>
        <div className="flex flex-wrap gap-2">
          {option.choices.map((c) => {
            const choiceLabel = localizedChoiceLabel(c, locale);
            const selected = value === c.value;
            const delta = c.priceDelta ?? 0;
            return (
              <button
                key={c.value}
                type="button"
                onClick={() => onChange(c.value)}
                aria-pressed={selected}
                className={`rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors ${
                  selected
                    ? "border-primary bg-primary/10 text-primary-700 dark:text-primary-300"
                    : "border-ink/15 text-ink/70 hover:border-primary dark:border-white/20 dark:text-sand/70"
                }`}
              >
                {choiceLabel}
                {/* Only surface a price when the choice actually changes the
                    price (e.g. a larger pizza). A $0 choice — Chicken / Meat /
                    Fish, "Small", a side that's included — shows nothing, so it
                    never reads as a "Free"/promotional label. */}
                {delta !== 0 && <PriceBadge priceDelta={delta} className="ms-1 text-xs opacity-75" />}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  if (option.type === "multiselect") {
    const arr = Array.isArray(value) ? value : [];
    return (
      <div>
        <label className="mb-1.5 block text-sm font-semibold">
          {label}
          {requiredMark}
        </label>
        <div className="space-y-2">
          {option.choices.map((c) => {
            const choiceLabel = localizedChoiceLabel(c, locale);
            const checked = arr.includes(c.value);
            return (
              <label
                key={c.value}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-ink/12 px-3.5 py-2.5 text-sm dark:border-white/15"
              >
                <span className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onChange(checked ? arr.filter((v) => v !== c.value) : [...arr, c.value])}
                    className="h-4 w-4 rounded border-ink/30 text-primary focus:ring-primary"
                  />
                  {choiceLabel}
                </span>
                <PriceBadge priceDelta={c.priceDelta ?? 0} />
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  if (option.type === "boolean") {
    const checked = value === true;
    return (
      <label className="flex cursor-pointer items-center justify-between gap-2 rounded-xl border border-ink/12 px-3.5 py-2.5 text-sm dark:border-white/15">
        <span className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            className="h-4 w-4 rounded border-ink/30 text-primary focus:ring-primary"
          />
          {label}
          {requiredMark}
        </span>
        <PriceBadge priceDelta={option.priceDelta} />
      </label>
    );
  }

  if (option.type === "number") {
    const num = typeof value === "number" ? value : 0;
    return (
      <div>
        <label className="mb-1.5 block text-sm font-semibold">
          {label}
          {requiredMark}
        </label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange(Math.max(0, num - 1))}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 transition-colors hover:border-primary hover:text-primary dark:border-white/20"
          >
            <Minus size={14} aria-hidden="true" />
          </button>
          <span className="w-8 text-center text-sm font-bold">{num}</span>
          <button
            type="button"
            onClick={() => onChange(Math.min(999, num + 1))}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/15 transition-colors hover:border-primary hover:text-primary dark:border-white/20"
          >
            <Plus size={14} aria-hidden="true" />
          </button>
          <PriceBadge priceDelta={option.priceDelta} suffix=" each" className="text-xs text-ink/50 dark:text-sand/50" />
        </div>
      </div>
    );
  }

  const text = typeof value === "string" ? value : "";
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold">
        {label}
        {requiredMark}
      </label>
      <textarea
        value={text}
        maxLength={option.maxLength}
        onChange={(e) => onChange(e.target.value)}
        rows={2}
        className="w-full rounded-xl border border-ink/15 bg-transparent px-3.5 py-2.5 text-sm outline-none focus:border-primary dark:border-white/20"
      />
    </div>
  );
}
