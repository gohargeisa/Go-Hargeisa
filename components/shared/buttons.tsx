import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

type Size = "sm" | "md" | "lg";

const SIZE_CLASS: Record<Size, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-sm",
  lg: "h-12 px-8 text-[15px]",
};

const COMPACT_SIZE_CLASS: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-3 text-sm",
  lg: "h-12 px-4 text-[15px]",
};

interface BaseButtonProps {
  children: ReactNode;
  size?: Size;
  /** Tighter horizontal padding — for buttons sitting in a 2-up row (e.g. card CTAs). */
  compact?: boolean;
  fullWidth?: boolean;
  className?: string;
  /** Renders an <a> (external, opens in a new tab) instead of a same-origin <Link>. */
  external?: boolean;
}

type LinkButtonProps = BaseButtonProps & { href: string } & Omit<
    AnchorHTMLAttributes<HTMLAnchorElement>,
    "href" | "className"
  >;

type ActionButtonProps = BaseButtonProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, "className"> & { href?: undefined };

type ButtonProps = LinkButtonProps | ActionButtonProps;

function sizeClass(size: Size, compact: boolean) {
  return compact ? COMPACT_SIZE_CLASS[size] : SIZE_CLASS[size];
}

/**
 * Filled pill CTA — the single source of truth for the "primary" button
 * treatment that used to be hand-typed (with slightly drifting hover/shadow
 * behavior) in hotel-card.tsx, contact-form.tsx, view-all-button.tsx,
 * coming-soon-section.tsx and section-header.tsx.
 */
export function PrimaryButton({ children, size = "md", compact = false, fullWidth = false, className = "", external, ...rest }: ButtonProps) {
  const classes = `group inline-flex items-center justify-center gap-2 rounded-full bg-primary font-semibold text-white shadow-soft transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-primary-700 hover:shadow-card active:scale-95 disabled:opacity-70 disabled:pointer-events-none ${sizeClass(size, compact)} ${fullWidth ? "w-full" : ""} ${className}`;

  if ("href" in rest && rest.href) {
    const { href, ...anchorRest } = rest as LinkButtonProps;
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...anchorRest}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...anchorRest}>
        {children}
      </Link>
    );
  }

  const { type = "button", ...buttonRest } = rest as ActionButtonProps;
  return (
    <button type={type} className={classes} {...buttonRest}>
      {children}
    </button>
  );
}

/**
 * Outline pill CTA — the "secondary"/"view all" counterpart, consolidating
 * the equivalent hand-typed strings in hotel-card.tsx and section-header.tsx.
 */
export function SecondaryButton({ children, size = "md", compact = false, fullWidth = false, className = "", external, ...rest }: ButtonProps) {
  const classes = `group inline-flex items-center justify-center gap-2 rounded-full border border-ink/15 bg-transparent font-semibold text-ink transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:border-primary hover:text-primary active:scale-95 disabled:opacity-60 disabled:pointer-events-none dark:border-white/20 dark:text-white dark:hover:border-primary ${sizeClass(size, compact)} ${fullWidth ? "w-full" : ""} ${className}`;

  if ("href" in rest && rest.href) {
    const { href, ...anchorRest } = rest as LinkButtonProps;
    if (external) {
      return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...anchorRest}>
          {children}
        </a>
      );
    }
    return (
      <Link href={href} className={classes} {...anchorRest}>
        {children}
      </Link>
    );
  }

  const { type = "button", ...buttonRest } = rest as ActionButtonProps;
  return (
    <button type={type} className={classes} {...buttonRest}>
      {children}
    </button>
  );
}
