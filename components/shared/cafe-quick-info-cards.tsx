import { getTranslations } from "next-intl/server";
import { Clock, Laptop, MapPin, Star, Tag, Wifi } from "lucide-react";
import { InfoCardsStrip, type InfoCard } from "@/components/shared/info-cards-strip";

/** Cafe counterpart of HotelQuickInfoCards, reusing the same InfoCardsStrip chrome. */
export async function CafeQuickInfoCards({
  rating,
  openingHours,
  wifi,
  workingSpace,
}: {
  rating: number;
  openingHours?: string;
  wifi?: boolean;
  workingSpace?: boolean;
}) {
  const t = await getTranslations("hotelDetail");
  const tc = await getTranslations("common");
  const td = await getTranslations("detail");

  const cards: InfoCard[] = [
    { icon: Star, label: tc("rating"), value: rating.toFixed(1) },
    { icon: Tag, label: t("category"), value: "Cafe" },
    { icon: MapPin, label: t("city"), value: "Hargeisa" },
  ];
  if (openingHours) cards.push({ icon: Clock, label: tc("openingHours"), value: openingHours });
  if (wifi) cards.push({ icon: Wifi, label: t("amenity"), value: td("freeWifi") });
  if (workingSpace) cards.push({ icon: Laptop, label: t("amenity"), value: td("workingSpace") });

  return <InfoCardsStrip cards={cards} />;
}
