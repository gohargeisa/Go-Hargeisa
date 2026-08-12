"use client";

import { useTranslations } from "next-intl";
import { Sparkles } from "lucide-react";
import { SERVICE_TAGS_BY_CATEGORY_SLUG, SERVICE_TAG_ICON } from "@/lib/config/service-tags";
import { COSMETICS_SPECIALTY_CATEGORIES, PERFUME_SPECIALTY_CATEGORIES, productCategoryLabel } from "@/lib/config/product-categories";
import type { ProductCategory } from "@/types";
import type { Locale } from "@/lib/i18n/config";

/**
 * Admin/owner checkbox grid for a category's subcategory vocabulary — the
 * picker counterpart to components/shared/service-tags-section.tsx, and the
 * service-tags equivalent of components/admin/amenities-picker.tsx. Renders
 * nothing when the given category slug has no vocabulary at all (every
 * category except Beauty Salons, Men's Barbershops, Auto Repair & Services,
 * and Cosmetics & Women's Beauty).
 *
 * Cosmetics & Women's Beauty and Perfume shops are a special case: their
 * real subcategories are product categories (see
 * lib/config/product-categories.ts and the Products Engine), not a
 * services-performed vocabulary, so they reuse COSMETICS_SPECIALTY_CATEGORIES/
 * PERFUME_SPECIALTY_CATEGORIES + productCategoryLabel for codes/labels
 * instead of SERVICE_TAGS_BY_CATEGORY_SLUG/the "serviceTags" i18n namespace —
 * no new labels are introduced either way. The selection is still stored in
 * the same `service_tags` column as every other category here; at this
 * intake stage (join request / city_services editing) it's a lightweight
 * "declared specialties" signal, distinct from the Products Engine's own
 * per-product `category` field that governs the real, filterable catalog
 * once the business has actual products.
 */
export function ServiceTagsPicker({
  categorySlug,
  locale,
  values,
  onChange,
  label,
}: {
  categorySlug: string | undefined;
  locale: Locale;
  values: string[];
  onChange: (values: string[]) => void;
  label: string;
}) {
  const t = useTranslations("serviceTags");
  const isCosmetics = categorySlug === "cosmetics-beauty";
  const isPerfume = categorySlug === "perfume-shop";
  const isProductSpecialty = isCosmetics || isPerfume;
  const codes: readonly string[] | undefined = isCosmetics
    ? COSMETICS_SPECIALTY_CATEGORIES
    : isPerfume
      ? PERFUME_SPECIALTY_CATEGORIES
      : categorySlug
        ? SERVICE_TAGS_BY_CATEGORY_SLUG[categorySlug]
        : undefined;

  if (!codes || codes.length === 0) return null;

  function toggle(code: string) {
    onChange(values.includes(code) ? values.filter((v) => v !== code) : [...values, code]);
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {codes.map((code) => {
          const Icon = isProductSpecialty ? Sparkles : SERVICE_TAG_ICON[code as keyof typeof SERVICE_TAG_ICON];
          const codeLabel = isProductSpecialty ? productCategoryLabel(code as ProductCategory, locale) ?? code : t(code);
          return (
            <label key={code} className="flex min-w-0 items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={values.includes(code)} onChange={() => toggle(code)} className="shrink-0" />
              <Icon size={14} className="shrink-0 text-ink/50 dark:text-sand/50" aria-hidden="true" />
              <span className="min-w-0 break-words">{codeLabel}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
