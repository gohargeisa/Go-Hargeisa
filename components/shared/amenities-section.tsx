import { getTranslations } from "next-intl/server";
import { AMENITY_ICON, toAmenityCodes } from "@/lib/config/amenities";

/**
 * Reusable "Amenities" section for every listing detail page — replaces
 * components/shared/hotel-amenities.tsx (free-text+regex) and cafes' own
 * inline fixed-enum block. Renders nothing when there are no known codes,
 * satisfying the "hide the section entirely when data doesn't exist" rule —
 * callers should not render this section's heading/wrapper at all unless
 * they've already checked for a non-empty result themselves (see detail
 * page usage), matching how every other optional section on these pages
 * is gated.
 */
export async function AmenitiesSection({ amenities }: { amenities: string[] | null | undefined }) {
  const codes = toAmenityCodes(amenities);
  if (codes.length === 0) return null;

  const t = await getTranslations("amenities");

  return (
    <ul className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4">
      {codes.map((code) => {
        const Icon = AMENITY_ICON[code];
        return (
          <li
            key={code}
            className="flex min-w-0 items-center gap-2.5 rounded-xl2 border border-ink/8 bg-white px-3.5 py-3 text-[13px] font-medium text-ink transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-soft dark:border-white/10 dark:bg-white/[0.03] dark:text-sand sm:gap-3 sm:px-4 sm:py-3.5 sm:text-sm"
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 sm:h-9 sm:w-9">
              <Icon size={16} className="text-primary" aria-hidden="true" />
            </span>
            <span className="min-w-0 truncate">{t(code)}</span>
          </li>
        );
      })}
    </ul>
  );
}

/** Cheap sync check for callers that need to decide whether to render the
 * section heading/wrapper before this (async) component resolves. */
export function hasAmenities(amenities: string[] | null | undefined): boolean {
  return toAmenityCodes(amenities).length > 0;
}
