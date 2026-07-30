import type { ElementType, HTMLAttributes, ReactNode } from "react";

/**
 * Thin wrapper for the `container-px mx-auto` idiom repeated raw across
 * ~80 files. New pages/sections can reach for this instead of retyping the
 * two classes; existing call sites are left as-is (no value in mass-editing
 * working files just to use a wrapper).
 */
export function PageContainer({
  as: Component = "div",
  children,
  className = "",
  ...rest
}: {
  as?: ElementType;
  children: ReactNode;
  className?: string;
} & HTMLAttributes<HTMLElement>) {
  return (
    <Component className={`container-px mx-auto ${className}`} {...rest}>
      {children}
    </Component>
  );
}
