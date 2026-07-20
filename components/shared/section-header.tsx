import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  viewAllHref,
  viewAllLabel,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  viewAllHref?: string;
  viewAllLabel?: string;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-8">
      <div>
        {eyebrow && (
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary">
            {eyebrow}
          </span>
        )}
        <h2 className="mt-2 font-display text-2xl md:text-3xl font-semibold text-balance">
          {title}
        </h2>
        {subtitle && <p className="mt-2 text-ink/60 dark:text-sand/60 max-w-xl">{subtitle}</p>}
      </div>
      {viewAllHref && (
        <Link
          href={viewAllHref}
          className="inline-flex items-center gap-1 self-start rounded-full border border-ink/15 dark:border-white/20 px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary transition-colors"
        >
          {viewAllLabel ?? "View all"}
          <ArrowUpRight size={15} />
        </Link>
      )}
    </div>
  );
}
