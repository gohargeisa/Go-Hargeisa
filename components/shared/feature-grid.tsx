import type { LucideIcon } from "lucide-react";

export interface FeatureItem {
  icon: LucideIcon;
  title: string;
  body: string;
}

/**
 * Generic {icon,title,body} responsive grid — generalizes the icon-card
 * pattern used by the Travel Guide page (and the chrome from
 * info-cards-strip.tsx) into a reusable building block for any "N things at
 * a glance" section (features, categories, mission values, etc.).
 */
export function FeatureGrid({
  items,
  columns = 3,
  className = "",
}: {
  items: FeatureItem[];
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const colsClass = columns === 2 ? "sm:grid-cols-2" : columns === 4 ? "sm:grid-cols-2 lg:grid-cols-4" : "sm:grid-cols-2 lg:grid-cols-3";

  return (
    <div className={`grid gap-6 ${colsClass} ${className}`}>
      {items.map(({ icon: Icon, title, body }) => (
        <div
          key={title}
          className="rounded-xl2 border border-ink/8 bg-white p-6 shadow-soft transition-all duration-300 ease-premium hover:-translate-y-1 hover:shadow-card dark:border-white/10 dark:bg-white/[0.03]"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon size={20} aria-hidden="true" />
          </span>
          <h3 className="mt-4 font-display text-base font-semibold">{title}</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-ink/65 dark:text-sand/65">{body}</p>
        </div>
      ))}
    </div>
  );
}
