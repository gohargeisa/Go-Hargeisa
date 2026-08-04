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

/** Current weekday + minutes-since-midnight in Hargeisa local time (Africa/Mogadishu, UTC+3, no DST) — independent of the visitor's own device timezone. Used server-side or wherever a fixed business-local reference is wanted (e.g. admin previews) rather than the visitor's own clock. */
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

/** Current weekday + minutes-since-midnight in the *visitor's own* local
 * time — plain `Date` getters already reflect the browser's local timezone,
 * so no explicit Intl timezone is needed. Client-only by nature (there is
 * no reliable "visitor timezone" on the server), matching how
 * OpenStatusBadge already only ever renders after mount. */
export function getVisitorNow(): { day: OpeningHoursGroup["days"][number]; minutes: number } {
  const now = new Date();
  return { day: WEEK_ORDER[now.getDay()], minutes: now.getHours() * 60 + now.getMinutes() };
}

function toMinutes(hhmm: string): number {
  const [h, m = "0"] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
}

function toHHMM(minutes: number): string {
  const wrapped = ((minutes % 1440) + 1440) % 1440;
  const h = Math.floor(wrapped / 60);
  const m = wrapped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Whether any group in `groups` covers the current day/time (`now` — pass
 * getVisitorNow() for the visitor's own clock or getHargeisaNow() for the
 * fixed business-local one). Handles hours that cross midnight (close <= open). */
export function isOpenNow(groups: OpeningHoursGroup[], now: { day: OpeningHoursGroup["days"][number]; minutes: number } = getVisitorNow()): boolean {
  if (!groups || groups.length === 0) return false;
  const { day, minutes } = now;
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

const CLOSING_SOON_THRESHOLD_MINUTES = 60;

export type OpenStatus =
  | { state: "open" }
  | { state: "closesSoon"; minutesLeft: number }
  | { state: "opensAt"; time: string; sameDay: boolean }
  | { state: "closed" }
  | { state: "temporarilyClosed" }
  | { state: "permanentlyClosed" };

/**
 * Full open/closed status including the closure overrides (permanently/
 * temporarily closed take priority over any configured hours) and the
 * "closes soon" / "opens at" nuance the badge needs. `groups` should be
 * empty when a listing hasn't configured structured hours at all — callers
 * should not render a badge in that case (see OpenStatusBadge), since
 * "closed" would be misleading for e.g. a 24-hour-by-default hotel that
 * simply never filled the field in.
 */
export function getOpenStatus(
  groups: OpeningHoursGroup[],
  options: { is24Hours?: boolean; temporarilyClosed?: boolean; permanentlyClosed?: boolean } = {},
  now: { day: OpeningHoursGroup["days"][number]; minutes: number } = getVisitorNow()
): OpenStatus {
  if (options.permanentlyClosed) return { state: "permanentlyClosed" };
  if (options.temporarilyClosed) return { state: "temporarilyClosed" };
  if (options.is24Hours) return { state: "open" };
  if (!groups || groups.length === 0) return { state: "closed" };

  const { day, minutes } = now;
  const dayIndex = WEEK_ORDER.indexOf(day);
  const prevDay = WEEK_ORDER[(dayIndex + 6) % 7];

  // Currently inside an interval? Find how many minutes remain until it closes.
  let minutesUntilClose: number | null = null;
  for (const group of groups) {
    const open = toMinutes(group.open);
    const close = toMinutes(group.close);
    const crossesMidnight = close <= open;

    if (group.days.includes(day)) {
      if (!crossesMidnight && minutes >= open && minutes < close) {
        minutesUntilClose = close - minutes;
      } else if (crossesMidnight && minutes >= open) {
        minutesUntilClose = 1440 - minutes + close;
      }
    } else if (crossesMidnight && group.days.includes(prevDay) && minutes < close) {
      minutesUntilClose = close - minutes;
    }
    if (minutesUntilClose !== null) break;
  }

  if (minutesUntilClose !== null) {
    if (minutesUntilClose <= CLOSING_SOON_THRESHOLD_MINUTES) return { state: "closesSoon", minutesLeft: minutesUntilClose };
    return { state: "open" };
  }

  // Not open — find the next upcoming opening time, searching forward up to 7 days.
  for (let offset = 0; offset < 7; offset++) {
    const candidateDay = WEEK_ORDER[(dayIndex + offset) % 7];
    const candidates = groups
      .filter((g) => g.days.includes(candidateDay))
      .map((g) => toMinutes(g.open))
      .filter((open) => offset > 0 || open > minutes)
      .sort((a, b) => a - b);
    if (candidates.length > 0) {
      return { state: "opensAt", time: toHHMM(candidates[0]), sameDay: offset === 0 };
    }
  }

  return { state: "closed" };
}
