import {
  Flower2,
  Heart,
  PartyPopper,
  Gift,
  Sprout,
  Trees,
  Truck,
  CalendarClock,
  Globe,
  type LucideIcon,
} from "lucide-react";
import type { Service } from "@/types";

export type FlowerShopType = NonNullable<Service["flowerShopType"]>;

export const FLOWER_SHOP_TYPE_ORDER: FlowerShopType[] = [
  "fresh_flowers",
  "artificial_flowers",
  "wedding_flowers",
  "event_decoration",
  "gift_and_flower_shop",
  "floral_design",
  "other",
];

export const FLOWER_SHOP_TYPE_LABELS: Record<FlowerShopType, { en: string; ar: string; so: string }> = {
  fresh_flowers: { en: "Fresh Flowers", ar: "زهور طبيعية", so: "Ubax Cusub" },
  artificial_flowers: { en: "Artificial Flowers", ar: "زهور صناعية", so: "Ubax La-sameeyay" },
  wedding_flowers: { en: "Wedding Flowers", ar: "زهور الزفاف", so: "Ubaxa Aroosyada" },
  event_decoration: { en: "Event Decoration", ar: "تزيين المناسبات", so: "Qurxinta Munaasabadaha" },
  gift_and_flower_shop: { en: "Gift & Flower Shop", ar: "محل هدايا وزهور", so: "Dukaanka Hadyadaha iyo Ubaxa" },
  floral_design: { en: "Floral Design", ar: "تصميم الزهور", so: "Naqshadaynta Ubaxa" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function flowerShopTypeLabel(type: FlowerShopType | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = FLOWER_SHOP_TYPE_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

/** Each code below maps 1:1 to its own dedicated boolean column on
 * `services` — represented here as one checklist for a clean UI, converted
 * back to individual booleans only at submission time. */
export const FLOWER_SERVICE_ORDER = [
  "flower_delivery_available",
  "same_day_delivery",
  "custom_bouquets",
  "wedding_arrangements",
  "event_decoration_service",
  "gift_wrapping",
  "indoor_plants",
  "outdoor_plants",
  "online_ordering_available",
] as const;

export type FlowerServiceCode = (typeof FLOWER_SERVICE_ORDER)[number];

export const FLOWER_SERVICE_ICON: Record<FlowerServiceCode, LucideIcon> = {
  flower_delivery_available: Truck,
  same_day_delivery: CalendarClock,
  custom_bouquets: Flower2,
  wedding_arrangements: Heart,
  event_decoration_service: PartyPopper,
  gift_wrapping: Gift,
  indoor_plants: Sprout,
  outdoor_plants: Trees,
  online_ordering_available: Globe,
};

export const FLOWER_SERVICE_LABELS: Record<FlowerServiceCode, { en: string; ar: string; so: string }> = {
  flower_delivery_available: { en: "Flower Delivery Available", ar: "توصيل الزهور متوفر", so: "Gaarsiinta Ubaxa waa la Heli Karaa" },
  same_day_delivery: { en: "Same-Day Delivery", ar: "توصيل في نفس اليوم", so: "Gaarsiinta Maalintaas oo kale" },
  custom_bouquets: { en: "Custom Bouquets", ar: "باقات مخصصة", so: "Xirmooyin Gaar ah" },
  wedding_arrangements: { en: "Wedding Arrangements", ar: "تنسيقات الزفاف", so: "Diyaarinta Aroosyada" },
  event_decoration_service: { en: "Event Decoration", ar: "تزيين المناسبات", so: "Qurxinta Munaasabadaha" },
  gift_wrapping: { en: "Gift Wrapping", ar: "تغليف الهدايا", so: "Xirista Hadyadaha" },
  indoor_plants: { en: "Indoor Plants", ar: "نباتات داخلية", so: "Dhirta Gudaha" },
  outdoor_plants: { en: "Outdoor Plants", ar: "نباتات خارجية", so: "Dhirta Dibadda" },
  online_ordering_available: { en: "Online Ordering Available", ar: "الطلب عبر الإنترنت متوفر", so: "Dalabka Onlaynka waa la Heli Karaa" },
};

export function flowerServiceLabel(code: FlowerServiceCode, locale: string): string {
  const entry = FLOWER_SERVICE_LABELS[code];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}
