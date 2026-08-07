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
      className={`flex min-h-56 flex-col items-center justify-center rounded-xl3 border border-dashed border-primary/20 bg-gradient-to-b from-primary/[0.05] to-transparent px-6 text-center dark:border-primary/25 dark:from-primary/[0.08] ${className}`}
    >
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-primary shadow-soft ring-1 ring-primary/10 dark:bg-ink dark:ring-white/10">
        <Icon size={24} aria-hidden="true" />
      </span>
      {/* Not a heading — this component is reused across 20+ places
          (dashboard panels, listing pages, search, admin) each with a
          different heading outline, so a fixed level here would always
          risk skipping levels somewhere (axe heading-order). */}
      <p className="mt-5 font-display text-xl font-semibold">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-ink/55 dark:text-sand/60">{description}</p>
    </div>
  );
}
