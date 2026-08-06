import { Building2, type LucideIcon, icons } from "lucide-react";

/**
 * Resolves a lucide-react icon export name stored in the database (e.g. the
 * `categories.icon` column — "Hotel", "Flower2") to its component. Category
 * icons are admin-editable free text, not code, so there's no static import
 * list to keep in sync — an unrecognized or renamed icon name just falls
 * back to Building2 instead of crashing.
 */
export function resolveIcon(name: string | null | undefined): LucideIcon {
  if (!name) return Building2;
  return (icons as unknown as Record<string, LucideIcon>)[name] ?? Building2;
}

export function DynamicIcon({
  name,
  ...props
}: { name: string | null | undefined } & Omit<React.ComponentProps<LucideIcon>, "ref">) {
  const Icon = resolveIcon(name);
  return <Icon {...props} />;
}
