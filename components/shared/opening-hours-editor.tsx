"use client";

import { Plus, X } from "lucide-react";
import type { OpeningHoursGroup } from "@/types";

const WEEKDAYS: OpeningHoursGroup["days"][number][] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
];

/**
 * Day-group opening-hours editor (multi-select days + open/close time per
 * group) — the same shape/UI cafes already use (components/admin/cafe-form.tsx),
 * pulled out here so restaurants' owner-dashboard and admin forms can share
 * it instead of re-implementing the same day-toggle grid a third time.
 * Deliberately takes labels as props rather than calling useTranslations
 * itself, since callers live in different translation namespaces
 * ("admin" for admin forms, "businessDashboard" for the owner dashboard).
 */
export function OpeningHoursEditor({
  value,
  onChange,
  dayLabel,
  title,
  addLabel,
  openLabel,
  closeLabel,
  removeAriaLabel,
}: {
  value: OpeningHoursGroup[];
  onChange: (value: OpeningHoursGroup[]) => void;
  dayLabel: (day: OpeningHoursGroup["days"][number]) => string;
  title: string;
  addLabel: string;
  openLabel: string;
  closeLabel: string;
  removeAriaLabel: string;
}) {
  function addGroup() {
    onChange([...value, { days: [], open: "09:00", close: "18:00" }]);
  }
  function updateGroup(i: number, patch: Partial<OpeningHoursGroup>) {
    onChange(value.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));
  }
  function removeGroup(i: number) {
    onChange(value.filter((_, idx) => idx !== i));
  }
  function toggleDay(i: number, day: OpeningHoursGroup["days"][number]) {
    const group = value[i];
    const days = group.days.includes(day) ? group.days.filter((d) => d !== day) : [...group.days, day];
    updateGroup(i, { days });
  }

  const inputClass =
    "rounded-xl border border-ink/12 bg-transparent px-3 py-2 text-sm outline-none focus:border-primary dark:border-white/15";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-semibold">{title}</label>
        <button type="button" onClick={addGroup} className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
          <Plus size={13} /> {addLabel}
        </button>
      </div>
      <div className="space-y-3">
        {value.map((group, i) => (
          <div key={i} className="rounded-xl border border-ink/12 p-3 space-y-2.5 dark:border-white/15">
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAYS.map((day) => (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(i, day)}
                  className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                    group.days.includes(day)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-ink/12 text-ink/50 dark:border-white/15 dark:text-sand/50"
                  }`}
                >
                  {dayLabel(day)}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={group.open}
                onChange={(e) => updateGroup(i, { open: e.target.value })}
                aria-label={openLabel}
                className={inputClass}
              />
              <span className="text-ink/40 dark:text-sand/40">–</span>
              <input
                type="time"
                value={group.close}
                onChange={(e) => updateGroup(i, { close: e.target.value })}
                aria-label={closeLabel}
                className={inputClass}
              />
              <button
                type="button"
                onClick={() => removeGroup(i)}
                aria-label={removeAriaLabel}
                className="ms-auto shrink-0 text-ink/40 hover:text-red-500"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
