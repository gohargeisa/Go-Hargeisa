import type { RoomType } from "@/types";

export const ROOM_TYPE_ORDER: RoomType[] = ["standard", "deluxe", "twin", "family", "executive_suite"];

export const ROOM_TYPE_LABELS: Record<RoomType, string> = {
  standard: "Standard Room",
  deluxe: "Deluxe Room",
  twin: "Twin Room",
  family: "Family Room",
  executive_suite: "Executive Suite",
};
