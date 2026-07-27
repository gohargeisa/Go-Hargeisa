import { getTranslations } from "next-intl/server";
import { CalendarCheck, CalendarX, DollarSign, Languages, MapPin, Star, Tag, type LucideIcon } from "lucide-react";
import { Reveal } from "@/components/home/reveal";
import { hasMeaningfulPrice } from "@/lib/utils/price-range";
import { hotelCategoryLabel } from "@/lib/utils/hotel-category";
import { AMENITY_HIGHLIGHTS } from "@/lib/utils/hotel-amenity-highlights";

interface InfoCard {
  icon: LucideIcon;
  label: string;
  value: string;
}

// Only these amenity highlights get their own quick-info card — Cafe/Family/Business
// Friendly stay in the Overview highlight strip only, to keep this row from sprawling.
const QUICK_INFO_AMENITIES = new Set(["Free WiFi", "Airport Shuttle", "Restaurant", "Parking"]);

/** Elegant at-a-glance facts strip below the action bar — each card only appears when its underlying data exists. */
export async function HotelQuickInfoCards({
  rating,
  priceRange,
  checkInTime,
  checkOutTime,
  languages,
  amenities,
}: {
  rating: number;
  priceRange?: string;
  checkInTime?: string;
  checkOutTime?: string;
  languages: string[];
  amenities: string[];
}) {
  const t = await getTranslations("hotelDetail");
  const tc = await getTranslations("common");

  const cards: InfoCard[] = [
    { icon: Star, label: tc("rating"), value: rating.toFixed(1) },
    { icon: Tag, label: t("category"), value: hotelCategoryLabel(priceRange) },
    { icon: MapPin, label: t("city"), value: "Hargeisa" },
  ];
  if (hasMeaningfulPrice(priceRange)) cards.push({ icon: DollarSign, label: tc("priceRange"), value: priceRange! });
  if (checkInTime) cards.push({ icon: CalendarCheck, label: t("checkIn"), value: checkInTime });
  if (checkOutTime) cards.push({ icon: CalendarX, label: t("checkOut"), value: checkOutTime });
  if (languages.length > 0) cards.push({ icon: Languages, label: t("languages"), value: languages.join(", ") });

  for (const highlight of AMENITY_HIGHLIGHTS) {
    if (!QUICK_INFO_AMENITIES.has(highlight.label)) continue;
    if (amenities.some((a) => highlight.match.test(a))) {
      cards.push({ icon: highlight.icon, label: t("amenity"), value: highlight.label });
    }
  }

  return (
    <Reveal delay={0.1}>
      <div className="container-px mx-auto mt-6">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-3.5 lg:grid-cols-6">
          {cards.map((c, i) => (
            <div
              key={`${c.label}-${i}`}
              className="flex h-full flex-col items-center gap-2 rounded-xl2 border border-ink/8 bg-white px-3.5 py-5 text-center shadow-[0_2px_8px_rgba(15,23,42,0.05),0_10px_28px_rgba(15,23,42,0.08)] transition-transform duration-200 hover:-translate-y-0.5 dark:border-white/10 dark:bg-white/[0.03]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <c.icon size={18} className="text-primary" aria-hidden="true" />
              </span>
              <p className="text-[11px] font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">
                {c.label}
              </p>
              <p className="truncate text-[15px] font-bold leading-tight text-ink dark:text-white">{c.value}</p>
            </div>
          ))}
        </div>
      </div>
    </Reveal>
  );
}
