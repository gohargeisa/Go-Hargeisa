import type { LucideIcon } from "lucide-react";

/**
 * Shared empty-state block (icon + title + description) — extracted from
 * components/dashboard/dashboard-tabs.tsx, which had its own local copy.
 * Reused across every "no results yet" spot in the app so they all look
 * and read the same way.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  className = "",
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  className?: string;
}) {
  return (
    <div
      className={`flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed border-primary/25 bg-primary/[0.035] px-6 text-center dark:bg-primary/[0.08] ${className}`}
    >
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-primary shadow-sm dark:bg-ink">
        <Icon size={22} aria-hidden="true" />
      </span>
      <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-sm text-sm leading-6 text-ink/55 dark:text-sand/60">{description}</p>
    </div>
  );
}
