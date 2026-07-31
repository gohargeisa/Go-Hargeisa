import { Building2, Landmark, Sparkles, ShoppingBag, TreePine, type LucideIcon } from "lucide-react";

/**
 * Display metadata for the real `attractions.category` enum
 * ("landmark" | "museum" | "market" | "nature" | "religious" — see
 * types/database.ts AttractionRow). Kept as a lookup rather than trusting
 * free-text `category` values from mock data / older rows, so an unknown
 * category still renders (via the "landmark" fallback) instead of crashing.
 */
export interface AttractionCategoryMeta {
  value: string;
  labelKey: string;
  icon: LucideIcon;
}

export const ATTRACTION_CATEGORIES: AttractionCategoryMeta[] = [
  { value: "landmark", labelKey: "categoryLandmark", icon: Landmark },
  { value: "museum", labelKey: "categoryMuseum", icon: Building2 },
  { value: "market", labelKey: "categoryMarket", icon: ShoppingBag },
  { value: "nature", labelKey: "categoryNature", icon: TreePine },
  { value: "religious", labelKey: "categoryReligious", icon: Sparkles },
];

export function getCategoryMeta(category: string): AttractionCategoryMeta {
  return ATTRACTION_CATEGORIES.find((c) => c.value === category) ?? ATTRACTION_CATEGORIES[0];
}

/** First comma-separated segment of a free-text address, used as a lightweight "region" filter. */
export function regionFromAddress(address: string): string {
  return address.split(",")[0]?.trim() || address;
}
