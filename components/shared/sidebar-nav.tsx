"use client";

import Link from "next/link";
import type { LucideIcon } from "lucide-react";

/**
 * One shared sidebar nav item shape for both the user Dashboard (client-side
 * tab switching via onClick) and the Admin panel (real route navigation via
 * href) — same visual language, same responsive behavior (vertical sidebar
 * on desktop, horizontal scroll strip on mobile), one place to change either.
 */
export interface SidebarNavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  badge?: number;
  href?: string;
  onClick?: () => void;
  /** Renders as a small indented sub-item instead of a top-level row — used
   * by the admin "Businesses" group's per-vertical links. */
  indent?: boolean;
  /** Renders as a plain non-interactive heading instead of a link/button —
   * groups indented items underneath it (e.g. admin's "Businesses"). */
  isGroupLabel?: boolean;
}

export function SidebarNav({
  items,
  ariaLabel,
  footer,
}: {
  items: SidebarNavItem[];
  ariaLabel: string;
  footer?: React.ReactNode;
}) {
  return (
    <nav
      className="flex gap-1.5 overflow-x-auto rounded-xl2 border border-ink/8 bg-white p-2 shadow-soft dark:border-white/10 dark:bg-white/[0.03] lg:flex-col lg:self-start"
      aria-label={ariaLabel}
    >
      {items.map((item) => (
        <SidebarNavRow key={item.key} item={item} />
      ))}
      {footer}
    </nav>
  );
}

function SidebarNavRow({ item }: { item: SidebarNavItem }) {
  const Icon = item.icon;

  if (item.isGroupLabel) {
    return (
      <div className="flex shrink-0 items-center gap-2 px-3.5 pb-1 pt-3 text-xs font-bold uppercase tracking-[0.1em] text-ink/40 dark:text-sand/40 first:pt-1">
        <Icon size={13} />
        {item.label}
      </div>
    );
  }

  const className = `flex shrink-0 items-center gap-3 rounded-xl text-start text-sm font-semibold transition-all duration-300 ease-premium ${
    item.indent ? "px-3.5 py-2 text-[13px] ms-2" : "px-3.5 py-3"
  } ${
    item.isActive
      ? "bg-primary text-white shadow-soft"
      : "text-ink/65 hover:bg-primary/5 hover:text-primary dark:text-sand/65 dark:hover:bg-white/5"
  }`;

  const content = (
    <>
      <Icon size={item.indent ? 15 : 17} />
      {item.label}
      {!!item.badge && (
        <span
          className={`ms-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold ${
            item.isActive ? "bg-white/25 text-white" : "bg-primary text-white"
          }`}
        >
          {item.badge > 9 ? "9+" : item.badge}
        </span>
      )}
    </>
  );

  if (item.href) {
    return (
      <Link key={item.key} href={item.href} aria-current={item.isActive ? "page" : undefined} className={className}>
        {content}
      </Link>
    );
  }

  return (
    <button key={item.key} type="button" onClick={item.onClick} aria-current={item.isActive ? "page" : undefined} className={className}>
      {content}
    </button>
  );
}

/** The two-column app-shell layout — sidebar + content pane. Stacks on mobile. */
export function SidebarShell({ nav, children }: { nav: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[250px_minmax(0,1fr)]">
      {nav}
      <section className="min-h-[360px] overflow-hidden rounded-xl2 border border-ink/8 bg-white p-5 shadow-soft dark:border-white/10 dark:bg-white/[0.03] md:p-7">
        {children}
      </section>
    </div>
  );
}
