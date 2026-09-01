import { Clock, Languages, type LucideIcon } from "lucide-react";
import { AMENITY_HIGHLIGHTS } from "@/lib/utils/hotel-amenity-highlights";

interface Highlight {
  icon: LucideIcon;
  label: string;
}

/**
 * Overview section — description plus a compact highlight strip. The
 * WiFi/Parking/Shuttle/Restaurant/Cafe/Family/Business badges are derived
 * from the existing hotel.amenities tags (same source the full Amenities
 * icon grid reads from) rather than new boolean columns, since amenities
 * already expresses this information.
 */
export function HotelOverview({
  description,
  checkInTime,
  checkOutTime,
  languages,
  amenities,
}: {
  description: string;
  checkInTime?: string;
  checkOutTime?: string;
  languages: string[];
  amenities: string[];
}) {
  const highlights: Highlight[] = [];

  if (checkInTime) highlights.push({ icon: Clock, label: `Check-in: ${checkInTime}` });
  if (checkOutTime) highlights.push({ icon: Clock, label: `Check-out: ${checkOutTime}` });
  if (languages.length > 0) highlights.push({ icon: Languages, label: languages.join(", ") });

  for (const { match, icon, label } of AMENITY_HIGHLIGHTS) {
    if (amenities.some((a) => match.test(a))) highlights.push({ icon, label });
  }

  return (
    <div>
      {/* `dir="auto"` so the paragraph follows its own content's direction —
          an Arabic description reads RTL even on the English page, and an
          English description (or a fallback) reads LTR even inside the
          Arabic RTL page, instead of inheriting a mismatched page direction. */}
      <p dir="auto" className="break-words leading-relaxed text-ink/75 dark:text-sand/75">{description}</p>

      {highlights.length > 0 && (
        <ul className="mt-5 flex flex-wrap gap-2.5">
          {highlights.map((h, i) => (
            <li
              key={`${h.label}-${i}`}
              className="inline-flex items-center gap-2 rounded-xl2 border border-ink/8 bg-white px-3.5 py-2.5 text-sm font-medium text-ink dark:border-white/10 dark:bg-white/[0.03] dark:text-sand"
            >
              <h.icon size={16} className="shrink-0 text-primary" aria-hidden="true" />
              {h.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
