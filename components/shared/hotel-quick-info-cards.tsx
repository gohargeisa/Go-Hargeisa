import { getTranslations } from "next-intl/server";
import { CalendarCheck, CalendarX, DollarSign, Languages, MapPin, Star, Tag } from "lucide-react";
import { InfoCardsStrip, type InfoCard } from "@/components/shared/info-cards-strip";
import { hasMeaningfulPrice } from "@/lib/utils/price-range";
import { listingCategoryLabel } from "@/lib/utils/hotel-category";
import { AMENITY_HIGHLIGHTS } from "@/lib/utils/hotel-amenity-highlights";

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
    { icon: Tag, label: t("category"), value: listingCategoryLabel(priceRange, "Hotel") },
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

  return <InfoCardsStrip cards={cards} />;
}
