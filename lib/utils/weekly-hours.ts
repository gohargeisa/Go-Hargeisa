import type { WeeklyHoursDay } from "@/types";

/** Somaliland business week starts Saturday — matches how the /join form
 * and every other weekly-hours surface in the app orders days. */
export const WEEK_DAYS_SAT_FIRST: WeeklyHoursDay["day"][] = [
  "saturday",
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
];

export function defaultWeeklyHours(): WeeklyHoursDay[] {
  return WEEK_DAYS_SAT_FIRST.map((day) => ({ day, open: "09:00", close: "18:00", closed: false }));
}
