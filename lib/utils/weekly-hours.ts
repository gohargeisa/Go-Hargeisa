import type { OpeningHoursGroup, WeeklyHoursDay } from "@/types";

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

/** Converts the /join intake shape (one row per day) into the shape every
 * real listing table's `opening_hours_structured` column already uses
 * (consecutive days sharing the same open/close grouped together, closed
 * days omitted entirely). Used by convertJoinRequest so a weekly schedule
 * collected at intake survives conversion instead of being discarded —
 * previously business_join_requests.opening_hours was read at intake but
 * never written back onto the created hotel/restaurant/cafe/city_services
 * row. Pure function, no UI behavior changes. */
export function weeklyHoursToGroups(hours: WeeklyHoursDay[]): OpeningHoursGroup[] {
  const groups: OpeningHoursGroup[] = [];
  for (const day of WEEK_DAYS_SAT_FIRST) {
    const entry = hours.find((h) => h.day === day);
    if (!entry || entry.closed) continue;
    const last = groups[groups.length - 1];
    if (last && last.open === entry.open && last.close === entry.close) {
      last.days.push(day);
    } else {
      groups.push({ days: [day], open: entry.open, close: entry.close });
    }
  }
  return groups;
}
