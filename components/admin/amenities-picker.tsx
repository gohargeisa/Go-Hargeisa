"use client";

import { useTranslations } from "next-intl";
import { AMENITIES_BY_LISTING_TYPE, AMENITY_ICON, type AmenitiesListingType } from "@/lib/config/amenities";

/**
 * Admin checkbox grid for the unified Amenities vocabulary — the picker
 * counterpart to components/shared/amenities-section.tsx. Restricted to the
 * subset of codes applicable to `listingType` (AMENITIES_BY_LISTING_TYPE),
 * so a cafe form never offers "Drive-Thru" and an attraction form never
 * offers "Private Rooms".
 */
export function AmenitiesPicker({
  listingType,
  values,
  onChange,
  label,
}: {
  listingType: AmenitiesListingType;
  values: string[];
  onChange: (values: string[]) => void;
  label: string;
}) {
  const t = useTranslations("amenities");
  const codes = AMENITIES_BY_LISTING_TYPE[listingType];

  function toggle(code: string) {
    onChange(values.includes(code) ? values.filter((v) => v !== code) : [...values, code]);
  }

  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {codes.map((code) => {
          const Icon = AMENITY_ICON[code];
          return (
            <label key={code} className="flex items-center gap-2 text-sm font-medium">
              <input type="checkbox" checked={values.includes(code)} onChange={() => toggle(code)} />
              <Icon size={14} className="shrink-0 text-ink/50 dark:text-sand/50" aria-hidden="true" />
              {t(code)}
            </label>
          );
        })}
      </div>
    </div>
  );
}
