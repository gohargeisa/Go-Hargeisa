import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowUpRight, Building2 } from "lucide-react";
import { AnimatedCard } from "./animated-card";

/**
 * Marketing-facing business showcase card (e.g. "our partners" / "featured
 * businesses" sections) — distinct from the dashboard-side business-*.tsx
 * components, which show a business owner their own operational data.
 */
export function BusinessCard({
  logo,
  name,
  category,
  description,
  href,
  icon: Icon = Building2,
}: {
  logo?: string;
  name: string;
  category: string;
  description: string;
  href?: string;
  icon?: LucideIcon;
}) {
  const content = (
    <AnimatedCard
      lift={6}
      className="group flex h-full flex-col gap-4 rounded-xl2 border border-ink/8 bg-white p-6 shadow-soft transition-shadow duration-300 ease-premium hover:border-primary/25 hover:shadow-card dark:border-white/10 dark:bg-white/[0.03]"
    >
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-xl2 bg-primary/10 text-primary">
          {logo ? (
            <Image src={logo} alt={name} width={48} height={48} className="h-full w-full object-cover" />
          ) : (
            <Icon size={22} aria-hidden="true" />
          )}
        </span>
        <div className="min-w-0">
          <p className="truncate font-display text-base font-bold text-ink dark:text-white">{name}</p>
          <p className="truncate text-xs font-semibold uppercase tracking-wide text-primary">{category}</p>
        </div>
      </div>
      <p className="flex-1 text-sm leading-relaxed text-ink/65 dark:text-sand/65">{description}</p>
      {href && (
        <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary transition-all group-hover:gap-2">
          View
          <ArrowUpRight size={15} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
        </span>
      )}
    </AnimatedCard>
  );

  return href ? <Link href={href}>{content}</Link> : content;
}
