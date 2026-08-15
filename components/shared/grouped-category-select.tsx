"use client";

import { useMemo } from "react";
import { buildCategoryGroupOptions, mergedCategoryDisplayName } from "@/lib/config/city-service-category-groups";
import { categoryDisplayName } from "@/lib/utils/category-href";
import type { Category } from "@/types";
import type { Locale } from "@/lib/i18n/config";

/**
 * Two-step "pick a group, then pick the specific category" selector —
 * reused by the public /join registration form and the admin city-service
 * create/edit form, so both surfaces group Schools/Universities/English
 * Language Institutes under one "Education" step (etc.) instead of showing
 * every category as one long flat list. Built entirely from
 * buildCategoryGroupOptions (lib/config/city-service-category-groups.ts) —
 * no hardcoded categories here, and a group with only one real member
 * (or a standalone, ungrouped category like Flowers & Gifts) skips the
 * second step automatically since there's nothing to disambiguate.
 *
 * The value/onChange contract is unchanged from a plain flat `<select>`:
 * `value` is the real category row's id, and `onChange` always receives a
 * real category row's id — so callers (and whatever they submit to the
 * server) don't need to know grouping exists at all.
 */
export function GroupedCategorySelect({
  categories,
  value,
  onChange,
  locale,
  groupLabel,
  subcategoryLabel,
  groupPlaceholder,
  subcategoryPlaceholder,
  inputClassName,
  labelClassName,
  idPrefix = "grouped-category",
}: {
  categories: Category[];
  value: string;
  onChange: (categoryId: string) => void;
  locale: Locale;
  groupLabel: string;
  subcategoryLabel: string;
  groupPlaceholder: string;
  subcategoryPlaceholder: string;
  inputClassName: string;
  labelClassName: string;
  idPrefix?: string;
}) {
  const options = useMemo(() => buildCategoryGroupOptions(categories), [categories]);
  const activeOption = options.find((o) => o.members.some((m) => m.id === value));

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor={`${idPrefix}-group`} className={labelClassName}>
          {groupLabel}
        </label>
        <select
          id={`${idPrefix}-group`}
          className={inputClassName}
          value={activeOption?.key ?? ""}
          onChange={(e) => {
            const next = options.find((o) => o.key === e.target.value);
            if (next) onChange(next.members[0].id);
          }}
        >
          <option value="" disabled>
            {groupPlaceholder}
          </option>
          {options.map((o) => (
            <option key={o.key} value={o.key}>
              {o.isMerged ? mergedCategoryDisplayName(o.merged!, locale) : categoryDisplayName(o.members[0], locale)}
            </option>
          ))}
        </select>
      </div>

      {activeOption && activeOption.isMerged && activeOption.members.length > 1 && (
        <div>
          <label htmlFor={`${idPrefix}-subcategory`} className={labelClassName}>
            {subcategoryLabel}
          </label>
          <select
            id={`${idPrefix}-subcategory`}
            className={inputClassName}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="" disabled>
              {subcategoryPlaceholder}
            </option>
            {activeOption.members.map((m) => (
              <option key={m.id} value={m.id}>
                {categoryDisplayName(m, locale)}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
