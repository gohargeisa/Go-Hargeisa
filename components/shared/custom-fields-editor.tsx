"use client";

import type { CategoryCustomField } from "@/types";

export type CustomFieldValues = Record<string, string | number | boolean>;

/**
 * Renders one input per admin-defined custom field for a category (see
 * Category.customFieldsSchema) — shared by the admin service form and the
 * /join business submission form so the two never drift out of sync.
 * Renders nothing when the category has no schema.
 */
export function CustomFieldsEditor({
  schema,
  values,
  onChange,
  inputClass,
}: {
  schema: CategoryCustomField[];
  values: CustomFieldValues;
  onChange: (next: CustomFieldValues) => void;
  inputClass: string;
}) {
  if (schema.length === 0) return null;

  function setValue(key: string, value: string | number | boolean) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {schema.map((field) => {
        const value = values[field.key];
        return (
          <div key={field.key} className={field.type === "textarea" ? "sm:col-span-2" : undefined}>
            <label className="mb-1.5 block text-sm font-semibold">
              {field.label}
              {field.required && <span className="text-red-500"> *</span>}
            </label>
            {field.type === "boolean" ? (
              <label className="flex items-center gap-2 text-sm font-medium">
                <input
                  type="checkbox"
                  checked={Boolean(value)}
                  onChange={(e) => setValue(field.key, e.target.checked)}
                />
                Yes
              </label>
            ) : field.type === "select" ? (
              <select
                required={field.required}
                value={typeof value === "string" ? value : ""}
                onChange={(e) => setValue(field.key, e.target.value)}
                className={inputClass}
              >
                <option value="" disabled>
                  Select…
                </option>
                {(field.options ?? []).map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : field.type === "textarea" ? (
              <textarea
                required={field.required}
                rows={3}
                value={typeof value === "string" ? value : ""}
                onChange={(e) => setValue(field.key, e.target.value)}
                className={inputClass}
              />
            ) : field.type === "number" ? (
              <input
                type="number"
                required={field.required}
                value={typeof value === "number" ? value : ""}
                onChange={(e) => setValue(field.key, e.target.value === "" ? "" : Number(e.target.value))}
                className={inputClass}
              />
            ) : (
              <input
                type="text"
                required={field.required}
                value={typeof value === "string" ? value : ""}
                onChange={(e) => setValue(field.key, e.target.value)}
                className={inputClass}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
