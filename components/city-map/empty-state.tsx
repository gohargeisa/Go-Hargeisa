import { MapPinOff } from "lucide-react";

export function CityMapEmptyState({
  title = "No places found",
  description = "Try a different category or clear your search.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink/5 text-ink/40 dark:bg-white/10 dark:text-sand/40">
        <MapPinOff size={22} aria-hidden="true" />
      </span>
      <div>
        <p className="font-display text-sm font-semibold text-ink dark:text-white">{title}</p>
        <p className="mt-1 max-w-[220px] text-xs text-ink/50 dark:text-sand/50">{description}</p>
      </div>
    </div>
  );
}
