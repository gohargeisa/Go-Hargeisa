"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toggleListingVisibility, type AllowedTable } from "@/lib/actions/admin";

/** Owner-only — explicit 3-way status control (Draft/Published/Archived),
 * replacing the old binary published/archived icon toggle so "draft" is
 * actually reachable from the list view, not just a value the type allowed. */
export function ListingStatusMenu({
  table,
  id,
  status,
}: {
  table: AllowedTable;
  id: string;
  status: "draft" | "published" | "archived";
}) {
  const t = useTranslations("admin");
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function onChange(next: "draft" | "published" | "archived") {
    if (next === status) return;
    startTransition(async () => {
      const result = await toggleListingVisibility(table, id, next, window.location.pathname);
      if (result.ok) router.refresh();
      else alert(result.error ?? t("visibilityUpdateError"));
    });
  }

  const statusClass = {
    draft: "border-ink/15 text-ink/60 dark:border-white/20 dark:text-sand/60",
    published: "border-accent/40 text-accent-700",
    archived: "border-ink/15 text-ink/45 dark:border-white/20 dark:text-sand/45",
  };

  return (
    <div className="relative inline-flex items-center">
      {isPending && <Loader2 size={12} className="absolute -start-4 animate-spin" />}
      <select
        value={status}
        onChange={(e) => onChange(e.target.value as "draft" | "published" | "archived")}
        disabled={isPending}
        aria-label={t("colStatus")}
        className={`h-8 rounded-lg border bg-transparent px-2 text-xs font-semibold outline-none focus:border-primary disabled:opacity-60 ${statusClass[status]}`}
      >
        <option value="draft">{t("statusDraft")}</option>
        <option value="published">{t("statusPublished")}</option>
        <option value="archived">{t("statusArchived")}</option>
      </select>
    </div>
  );
}
