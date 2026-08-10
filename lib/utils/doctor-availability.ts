import type { OpeningHoursGroup } from "@/types";

const WEEK_ORDER: OpeningHoursGroup["days"][number][] = [
  "sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday",
];

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Available slots computed on read (working hours minus already-booked
 * times), never pre-generated/stored — same "derive, don't duplicate"
 * approach as getOpenStatus's handling of opening_hours_structured. One
 * fixed-duration slot per appointmentDurationMinutes across every
 * OpeningHoursGroup that includes the requested date's weekday (so a
 * doctor's morning + evening shift both contribute slots).
 */
export function getAvailableSlots(
  workingHours: OpeningHoursGroup[],
  date: string,
  durationMinutes: number,
  bookedTimes: string[]
): string[] {
  const dayIndex = new Date(`${date}T00:00:00`).getDay();
  const day = WEEK_ORDER[dayIndex];
  const groups = (workingHours ?? []).filter((g) => g.days?.includes(day));
  const booked = new Set(bookedTimes.map((t) => t.slice(0, 5)));

  const slots: string[] = [];
  for (const group of groups) {
    let start = toMinutes(group.open);
    const end = toMinutes(group.close);
    while (start + durationMinutes <= end) {
      const slot = toHHMM(start);
      if (!booked.has(slot)) slots.push(slot);
      start += durationMinutes;
    }
  }
  return slots;
}
