import { Hospital, Landmark, ShoppingCart, Pill } from "lucide-react";
import type { EssentialServiceCategory } from "@/types";

/** Single source of truth for City Services' 4 fixed categories — icon +
 * the `cityServices` translation key for its section title. Shared by the
 * page (section headers, filter pills) and CityServiceCard (per-card
 * category badge) so they never drift out of sync. */
export const CITY_SERVICE_CATEGORIES: {
  key: EssentialServiceCategory;
  icon: typeof Hospital;
  titleKey: "hospitalsTitle" | "banksTitle" | "supermarketsTitle" | "pharmaciesTitle";
}[] = [
  { key: "hospital", icon: Hospital, titleKey: "hospitalsTitle" },
  { key: "bank", icon: Landmark, titleKey: "banksTitle" },
  { key: "supermarket", icon: ShoppingCart, titleKey: "supermarketsTitle" },
  { key: "pharmacy", icon: Pill, titleKey: "pharmaciesTitle" },
];

export function cityServiceCategoryMeta(category: EssentialServiceCategory) {
  return CITY_SERVICE_CATEGORIES.find((c) => c.key === category)!;
}
