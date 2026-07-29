"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { toggleListingVisibility } from "@/lib/actions/admin";

const ALLOWED = ["hotels", "restaurants", "cafes", "attractions", "events", "articles"] as const;
type Table = (typeof ALLOWED)[number];

/** Owner-only — flips a listing between published (visible) and archived
 * (hidden) directly from the list view. See toggleListingVisibility in
 * lib/actions/admin.ts for why "archived" is what "hidden" means here. */
export function HideListingButton({
  table,
  id,
  status,
}: {
  table: Table;
  id: string;
  status: "draft" | "published" | "archived";
}) {
  const t = useTranslations("admin");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const isPublished = status === "published";

  function onToggle() {
    startTransition(async () => {
      const nextStatus = isPublished ? "archived" : "published";
      const result = await toggleListingVisibility(table, id, nextStatus, window.location.pathname);
      if (result.ok) {
        router.refresh();
      } else {
        alert(result.error ?? t("visibilityUpdateError"));
      }
    });
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isPending}
      aria-label={isPublished ? t("hideLabel") : t("showLabel")}
      className={`flex h-8 items-center gap-1.5 rounded-lg border px-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
        isPublished
          ? "border-ink/10 dark:border-white/15 hover:border-amber-500 hover:text-amber-600"
          : "border-ink/10 dark:border-white/15 hover:border-primary hover:text-primary"
      }`}
    >
      {isPending ? (
        <Loader2 size={13} className="animate-spin" />
      ) : isPublished ? (
        <Eye size={13} />
      ) : (
        <EyeOff size={13} />
      )}
    </button>
  );
}
