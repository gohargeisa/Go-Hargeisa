import type { Product, ProductOption, ProductOptionChoice, SelectedProductOption } from "@/types";

/** What the option-selection UI keeps in local state: one entry per
 * option's `key`, shaped by that option's `type` (string for select/text,
 * string[] for multiselect, boolean for boolean, number for number).
 * Absent keys mean "not yet touched" — treated as empty/false/0. */
export type ProductOptionValues = Record<string, string | string[] | boolean | number>;

function localizedLabel(base: string, ar: string | undefined, so: string | undefined, locale: string): string {
  if (locale === "ar" && ar) return ar;
  if (locale === "so" && so) return so;
  return base;
}

/** True while at least one `required` option has no value yet — gates the
 * Add to Cart button the same way `hasVariants`/`!activeVariant.isAvailable`
 * already do, so a shopper can't add a cake with no writing text when the
 * owner marked that field required. */
export function hasMissingRequiredOptions(options: Product["options"], values: ProductOptionValues): boolean {
  for (const opt of options ?? []) {
    if (!opt.required) continue;
    const v = values[opt.key];
    if (opt.type === "multiselect") {
      if (!Array.isArray(v) || v.length === 0) return true;
    } else if (opt.type === "boolean") {
      if (v !== true) return true;
    } else if (opt.type === "number") {
      if (typeof v !== "number" || v <= 0) return true;
    } else {
      if (typeof v !== "string" || v.trim() === "") return true;
    }
  }
  return false;
}

/** Turns raw UI state into the frozen, priced, labeled shape the cart and
 * checkout summary display — a CLIENT-SIDE preview only. The server always
 * re-resolves the real label/price from product_options at submit time
 * (see submit_cart_order in 20260829000001_product_options.sql); nothing
 * computed here is ever trusted as-is. */
export function resolveSelectedOptions(
  options: Product["options"],
  values: ProductOptionValues,
  locale: string
): SelectedProductOption[] {
  const result: SelectedProductOption[] = [];
  for (const opt of options ?? []) {
    const v = values[opt.key];
    const label = localizedLabel(opt.label, opt.labelAr, opt.labelSo, locale);

    if (opt.type === "select") {
      if (typeof v !== "string" || v === "") continue;
      const choice = opt.choices.find((c) => c.value === v);
      if (!choice) continue;
      result.push({
        key: opt.key,
        label,
        type: opt.type,
        value: v,
        valueLabel: localizedLabel(choice.label, choice.labelAr, choice.labelSo, locale),
        priceDelta: choice.priceDelta ?? 0,
      });
    } else if (opt.type === "multiselect") {
      const arr = Array.isArray(v) ? v : [];
      const chosen = arr
        .map((val) => opt.choices.find((c) => c.value === val))
        .filter((c): c is ProductOptionChoice => Boolean(c));
      if (chosen.length === 0) continue;
      result.push({
        key: opt.key,
        label,
        type: opt.type,
        value: chosen.map((c) => c.value),
        valueLabel: chosen.map((c) => localizedLabel(c.label, c.labelAr, c.labelSo, locale)).join(", "),
        priceDelta: chosen.reduce((sum, c) => sum + (c.priceDelta ?? 0), 0),
      });
    } else if (opt.type === "boolean") {
      if (v !== true) continue;
      result.push({ key: opt.key, label, type: opt.type, value: true, valueLabel: label, priceDelta: opt.priceDelta });
    } else if (opt.type === "text") {
      const text = typeof v === "string" ? v.trim() : "";
      if (!text) continue;
      const truncated = opt.maxLength ? text.slice(0, opt.maxLength) : text;
      result.push({ key: opt.key, label, type: opt.type, value: truncated, valueLabel: truncated, priceDelta: 0 });
    } else if (opt.type === "number") {
      const num = typeof v === "number" ? v : 0;
      if (num <= 0) continue;
      result.push({ key: opt.key, label, type: opt.type, value: num, valueLabel: String(num), priceDelta: opt.priceDelta * num });
    }
  }
  return result;
}

export function localizedOptionLabel(option: ProductOption, locale: string): string {
  return localizedLabel(option.label, option.labelAr, option.labelSo, locale);
}

export function localizedChoiceLabel(choice: ProductOptionChoice, locale: string): string {
  return localizedLabel(choice.label, choice.labelAr, choice.labelSo, locale);
}
