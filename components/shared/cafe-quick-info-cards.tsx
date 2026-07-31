import { getTranslations } from "next-intl/server";
import { Banknote, Laptop, MapPin, Star, Tag, Wifi } from "lucide-react";
import { InfoCardsStrip, type InfoCard } from "@/components/shared/info-cards-strip";

/**
 * Cafe counterpart of HotelQuickInfoCards, reusing the same InfoCardsStrip
 * chrome. Deliberately has no Opening Hours card — a single long hours
 * string never fit this strip's fixed-width cells without overlapping/
 * clipping, so hours got their own dedicated section on the detail page
 * instead (id="hours", rendered from opening_hours_structured).
 */
export async function CafeQuickInfoCards({
  rating,
  wifi,
  workingSpace,
  priceRange,
}: {
  rating: number;
  wifi?: boolean;
  workingSpace?: boolean;
  priceRange?: string;
}) {
  const t = await getTranslations("hotelDetail");
  const tc = await getTranslations("common");
  const td = await getTranslations("detail");

  const cards: InfoCard[] = [
    { icon: Star, label: tc("rating"), value: rating.toFixed(1) },
    { icon: Tag, label: t("category"), value: "Cafe" },
    { icon: MapPin, label: t("city"), value: "Hargeisa" },
  ];
  if (priceRange) cards.push({ icon: Banknote, label: tc("priceRange"), value: priceRange });
  if (wifi) cards.push({ icon: Wifi, label: t("amenity"), value: td("freeWifi") });
  if (workingSpace) cards.push({ icon: Laptop, label: t("amenity"), value: td("workingSpace") });

  return <InfoCardsStrip cards={cards} />;
}
