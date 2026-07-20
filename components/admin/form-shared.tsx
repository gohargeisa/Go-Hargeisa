"use client";

import { useState } from "react";
import { X } from "lucide-react";

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-ink/45 dark:text-sand/45">{hint}</p>}
    </div>
  );
}

/** Shared Tailwind classes for every text/select/textarea input across admin forms. */
export const inputClass =
  "w-full rounded-xl border border-ink/12 dark:border-white/15 bg-transparent px-4 py-2.5 text-sm outline-none focus:border-primary";

/**
 * Chip-style editor for string[] fields (amenities, cuisine, special drinks,
 * visitor tips…) — type a value, press Enter or comma to add it.
 */
export function TagInput({
  label,
  values,
  onChange,
  placeholder,
  suggestions,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}) {
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    const value = raw.trim();
    if (value && !values.includes(value)) onChange([...values, value]);
    setDraft("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && !draft && values.length) {
      onChange(values.slice(0, -1));
    }
  }

  return (
    <Field label={label}>
      <div className={`${inputClass} flex flex-wrap items-center gap-1.5 py-2`}>
        {values.map((v) => (
          <span
            key={v}
            className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
          >
            {v}
            <button type="button" onClick={() => onChange(values.filter((x) => x !== v))} aria-label={`Remove ${v}`}>
              <X size={11} />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKeyDown}
          onBlur={() => commit(draft)}
          placeholder={values.length ? "" : placeholder}
          className="min-w-[8ch] flex-1 bg-transparent text-sm outline-none"
        />
      </div>
      {suggestions && suggestions.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {suggestions
            .filter((s) => !values.includes(s))
            .map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange([...values, s])}
                className="rounded-full border border-ink/10 dark:border-white/15 px-2.5 py-1 text-xs text-ink/55 dark:text-sand/55 hover:border-primary hover:text-primary"
              >
                + {s}
              </button>
            ))}
        </div>
      )}
    </Field>
  );
}
