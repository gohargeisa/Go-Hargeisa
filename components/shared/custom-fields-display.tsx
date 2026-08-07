import { Check, X } from "lucide-react";
import type { Category, CategoryCustomField } from "@/types";

function formatValue(field: CategoryCustomField, value: string | number | boolean | undefined): React.ReactNode {
  if (value === undefined || value === "") return null;
  if (field.type === "boolean") {
    return value ? <Check size={15} className="text-emerald-600" aria-hidden="true" /> : <X size={15} className="text-ink/40" aria-hidden="true" />;
  }
  return String(value);
}

/** Read-only "Details" grid for a category's admin-defined custom fields —
 * the display counterpart to CustomFieldsEditor. Renders nothing when the
 * category has no schema or the listing has no values set for it. */
export function CustomFieldsDisplay({
  category,
  values,
}: {
  category: Category;
  values: Record<string, string | number | boolean>;
}) {
  const rows = category.customFieldsSchema
    .map((field) => ({ field, display: formatValue(field, values[field.key]) }))
    .filter((row) => row.display !== null);

  if (rows.length === 0) return null;

  return (
    <dl className="grid gap-4 rounded-xl3 border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03] sm:grid-cols-2">
      {rows.map(({ field, display }) => (
        <div key={field.key}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">{field.label}</dt>
          <dd className="mt-1 text-sm text-ink dark:text-white">{display}</dd>
        </div>
      ))}
    </dl>
  );
}
