import type { OpeningHoursGroup } from "@/types";

/** Canonical week order used to detect contiguous day-ranges (Sun → Sat, wrapping). */
const WEEK_ORDER: OpeningHoursGroup["days"][number][] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/**
 * Collapses a group's days into a "Start – End" range when they're
 * consecutive on the week (allowing wraparound, e.g. Sat→Wed), matching how
 * Booking.com/Google Business Profile display weekly hours. Falls back to a
 * comma-separated list for non-contiguous selections (e.g. Mon, Wed, Fri).
 */
export function formatDayRange(
  days: OpeningHoursGroup["days"],
  label: (day: OpeningHoursGroup["days"][number]) => string
): string {
  if (days.length === 0) return "";
  if (days.length === 1) return label(days[0]);

  const indices = [...new Set(days.map((d) => WEEK_ORDER.indexOf(d)))].sort((a, b) => a - b);
  if (indices.length !== days.length) return days.map(label).join(", ");

  // Find the single gap in the circular sequence — the range starts right after it.
  let gapAt = -1;
  for (let i = 0; i < indices.length; i++) {
    const next = indices[(i + 1) % indices.length];
    const expected = (indices[i] + 1) % 7;
    if (next !== expected) {
      if (gapAt !== -1) return days.map(label).join(", "); // more than one gap: not contiguous
      gapAt = i;
    }
  }

  const startIdx = gapAt === -1 ? indices[0] : indices[(gapAt + 1) % indices.length];
  const endIdx = gapAt === -1 ? indices[indices.length - 1] : indices[gapAt];
  return `${label(WEEK_ORDER[startIdx])} – ${label(WEEK_ORDER[endIdx])}`;
}

/** "07:00" → "7:00 AM", "00:00" → "12:00 AM", "13:30" → "1:30 PM". */
export function formatTime12h(hhmm: string): string {
  const [hStr, mStr = "00"] = hhmm.split(":");
  const h = Number(hStr);
  if (!Number.isFinite(h)) return hhmm;
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${mStr.padStart(2, "0")} ${period}`;
}

/** Current weekday + minutes-since-midnight in Hargeisa local time (Africa/Mogadishu, UTC+3, no DST) — independent of the visitor's own device timezone. */
export function getHargeisaNow(): { day: OpeningHoursGroup["days"][number]; minutes: number } {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Africa/Mogadishu",
    weekday: "long",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(now);

  const day = (parts.find((p) => p.type === "weekday")?.value ?? "").toLowerCase() as OpeningHoursGroup["days"][number];
  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return { day, minutes: hour * 60 + minute };
}

function toMinutes(hhmm: string): number {
  const [h, m = "0"] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
}

/** Whether any group in `groups` covers the current Hargeisa day/time. Handles hours that cross midnight (close <= open). */
export function isOpenNow(groups: OpeningHoursGroup[]): boolean {
  if (!groups || groups.length === 0) return false;
  const { day, minutes } = getHargeisaNow();
  const dayIndex = WEEK_ORDER.indexOf(day);
  const prevDay = WEEK_ORDER[(dayIndex + 6) % 7];

  return groups.some((group) => {
    const open = toMinutes(group.open);
    const close = toMinutes(group.close);
    const crossesMidnight = close <= open;

    if (group.days.includes(day)) {
      if (!crossesMidnight) return minutes >= open && minutes < close;
      // Open today from `open` onward, into tomorrow.
      return minutes >= open;
    }
    // If yesterday's group crosses midnight, "now" (early hours) may still fall in its tail.
    if (crossesMidnight && group.days.includes(prevDay)) {
      return minutes < close;
    }
    return false;
  });
}
