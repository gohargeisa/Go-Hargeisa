"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Pin, Loader2 } from "lucide-react";
import { toggleListingPinned, type FeaturableTable } from "@/lib/actions/admin";

/** Owner-only one-click Pin toggle. Pinned listings sort ahead of merely
 * featured ones on their public listing page. */
export function PinListingButton({ table, id, pinned }: { table: FeaturableTable; id: string; pinned: boolean }) {
  const t = useTranslations("admin");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onToggle() {
    startTransition(async () => {
      const result = await toggleListingPinned(table, id, !pinned, window.location.pathname);
      if (result.ok) router.refresh();
      else alert(result.error ?? t("somethingWentWrong"));
    });
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={isPending}
      aria-label={pinned ? t("unpinAriaLabel") : t("pinAriaLabel")}
      aria-pressed={pinned}
      className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-60 ${
        pinned ? "border-primary bg-primary/10 text-primary-800" : "border-ink/10 dark:border-white/15 hover:border-primary hover:text-primary"
      }`}
    >
      {isPending ? <Loader2 size={13} className="animate-spin" /> : <Pin size={13} fill={pinned ? "currentColor" : "none"} />}
    </button>
  );
}
