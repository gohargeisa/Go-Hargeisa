import { getTranslations } from "next-intl/server";
import { CalendarCheck, Clock, DollarSign, MapPin, Star, Tag, UtensilsCrossed } from "lucide-react";
import { InfoCardsStrip, type InfoCard } from "@/components/shared/info-cards-strip";
import { hasMeaningfulPrice } from "@/lib/utils/price-range";
import { listingCategoryLabel } from "@/lib/utils/hotel-category";

/** Restaurant counterpart of HotelQuickInfoCards, reusing the same InfoCardsStrip chrome. */
export async function RestaurantQuickInfoCards({
  rating,
  reviewCount,
  priceRange,
  cuisine,
  openingHours,
  reservable,
}: {
  rating: number;
  reviewCount: number;
  priceRange?: string;
  cuisine: string[];
  openingHours?: string;
  reservable?: boolean;
}) {
  const t = await getTranslations("hotelDetail");
  const tc = await getTranslations("common");

  const cards: InfoCard[] = [
    ...(reviewCount > 0 ? [{ icon: Star, label: tc("rating"), value: rating.toFixed(1) }] : []),
    { icon: Tag, label: t("category"), value: listingCategoryLabel(priceRange, "Restaurant") },
    { icon: MapPin, label: t("city"), value: "Hargeisa" },
  ];
  if (hasMeaningfulPrice(priceRange)) cards.push({ icon: DollarSign, label: tc("priceRange"), value: priceRange! });
  if (cuisine.length > 0) cards.push({ icon: UtensilsCrossed, label: tc("cuisine"), value: cuisine.join(", ") });
  if (openingHours) cards.push({ icon: Clock, label: tc("openingHours"), value: openingHours });
  if (reservable) cards.push({ icon: CalendarCheck, label: t("category"), value: tc("reservable") });

  return <InfoCardsStrip cards={cards} />;
}
