import type { RoomType } from "@/types";

export const ROOM_TYPE_ORDER: RoomType[] = ["standard", "deluxe", "twin", "family", "executive_suite"];

export const ROOM_TYPE_LABELS: Record<RoomType, { en: string; ar: string; so: string }> = {
  standard: { en: "Standard Room", ar: "غرفة عادية", so: "Qol Caadi ah" },
  deluxe: { en: "Deluxe Room", ar: "غرفة ديلوكس", so: "Qol Deluxe ah" },
  twin: { en: "Twin Room", ar: "غرفة مزدوجة", so: "Qol Laba Sariiro leh" },
  family: { en: "Family Room", ar: "غرفة عائلية", so: "Qolka Qoyska" },
  executive_suite: { en: "Executive Suite", ar: "جناح تنفيذي", so: "Suite Sare" },
};

export function roomTypeLabel(type: RoomType | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = ROOM_TYPE_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}
