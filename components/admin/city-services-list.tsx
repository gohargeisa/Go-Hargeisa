"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Pencil, Trash2, Eye, EyeOff, Star, Loader2 } from "lucide-react";
import { deleteCityService, toggleCityServiceVisibility, toggleCityServiceFeatured } from "@/lib/actions/city-services";
import type { Locale } from "@/lib/i18n/config";

export interface CityServiceListRow {
  id: string;
  name: string;
  image: string | null;
  /** Already-resolved localized display name of the joined `categories` row. */
  categoryName: string;
  status: "draft" | "published" | "archived";
  featured: boolean;
}

/** Same mobile-card / desktop-table split as AdminListTable — city_services
 * has its own small list component rather than being forced into the generic
 * one built for the six other slug-based content types (different owner-only
 * auth model, extra featured/category-group affordances). */
export function CityServicesList({ locale, rows }: { locale: Locale; rows: CityServiceListRow[] }) {
  const t = useTranslations("admin");
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const statusLabel = { draft: t("statusDraft"), published: t("statusPublished"), archived: t("statusArchived") };
  const statusClass = {
    draft: "bg-secondary/10 text-secondary-700 dark:text-sand/70",
    published: "bg-accent/10 text-accent-700",
    archived: "bg-ink/10 text-ink/60 dark:bg-white/10 dark:text-sand/60",
  };

  function onToggle(row: CityServiceListRow) {
    setPendingId(row.id);
    startTransition(async () => {
      const nextStatus = row.status === "published" ? "archived" : "published";
      const result = await toggleCityServiceVisibility(locale, row.id, nextStatus);
      if (result.ok) router.refresh();
      else alert(result.error ?? t("visibilityUpdateError"));
      setPendingId(null);
    });
  }

  function onToggleFeatured(row: CityServiceListRow) {
    setPendingId(row.id);
    startTransition(async () => {
      const result = await toggleCityServiceFeatured(locale, row.id, !row.featured);
      if (result.ok) router.refresh();
      else alert(result.error ?? t("somethingWentWrong"));
      setPendingId(null);
    });
  }

  function onDelete(row: CityServiceListRow) {
    if (confirmDeleteId !== row.id) {
      setConfirmDeleteId(row.id);
      return;
    }
    setPendingId(row.id);
    startTransition(async () => {
      const result = await deleteCityService(locale, row.id);
      if (result.ok) router.refresh();
      else alert(result.error ?? t("somethingWentWrong"));
      setPendingId(null);
      setConfirmDeleteId(null);
    });
  }

  if (rows.length === 0) {
    return (
      <p className="rounded-xl2 border border-dashed border-ink/15 dark:border-white/15 p-10 text-center text-sm text-ink/50 dark:text-sand/50">
        {t("noCityServicesYet")}
      </p>
    );
  }

  const Actions = ({ row }: { row: CityServiceListRow }) => (
    <>
      <Link
        href={`/${locale}/admin/city-services/${row.id}/edit`}
        aria-label={t("editAriaLabel", { name: row.name })}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 dark:border-white/15 hover:border-primary hover:text-primary"
      >
        <Pencil size={13} />
      </Link>
      <button
        type="button"
        onClick={() => onToggleFeatured(row)}
        disabled={isPending && pendingId === row.id}
        aria-label={row.featured ? t("unfeatureAriaLabel") : t("featureAriaLabel")}
        aria-pressed={row.featured}
        className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-60 ${
          row.featured
            ? "border-amber-400 bg-amber-400/10 text-amber-500"
            : "border-ink/10 dark:border-white/15 hover:border-amber-400 hover:text-amber-500"
        }`}
      >
        <Star size={13} fill={row.featured ? "currentColor" : "none"} />
      </button>
      <button
        type="button"
        onClick={() => onToggle(row)}
        disabled={isPending && pendingId === row.id}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 dark:border-white/15 hover:border-amber-500 hover:text-amber-600 disabled:opacity-60"
      >
        {isPending && pendingId === row.id ? (
          <Loader2 size={13} className="animate-spin" />
        ) : row.status === "published" ? (
          <Eye size={13} />
        ) : (
          <EyeOff size={13} />
        )}
      </button>
      <button
        type="button"
        onClick={() => onDelete(row)}
        onBlur={() => setConfirmDeleteId(null)}
        disabled={isPending && pendingId === row.id}
        className={`flex h-8 items-center gap-1.5 rounded-lg border px-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
          confirmDeleteId === row.id
            ? "border-red-500 bg-red-500 text-white"
            : "border-ink/10 dark:border-white/15 hover:border-red-500 hover:text-red-500"
        }`}
      >
        <Trash2 size={13} />
      </button>
    </>
  );

  return (
    <>
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl2 border border-ink/8 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ink/5 dark:bg-white/10">
                {row.image && <Image src={row.image} alt={row.name} fill sizes="56px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{row.name}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${statusClass[row.status]}`}>
                    {statusLabel[row.status]}
                  </span>
                  {row.featured && (
                    <span className="rounded-full bg-amber-400/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                      {t("featuredBadge")}
                    </span>
                  )}
                  <span className="text-[11px] text-ink/45 dark:text-sand/45">{row.categoryName}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center justify-end gap-2 border-t border-ink/8 pt-3 dark:border-white/10">
              <Actions row={row} />
            </div>
          </div>
        ))}
      </div>

      <div className="hidden overflow-x-auto rounded-xl2 border border-ink/8 dark:border-white/10 sm:block">
        <table className="w-full text-sm">
          <thead className="bg-ink/[0.03] dark:bg-white/5">
            <tr>
              <th className="px-5 py-3 text-start font-semibold">{t("colName")}</th>
              <th className="px-5 py-3 text-start font-semibold">{t("cityServiceCategoryLabel")}</th>
              <th className="px-5 py-3 text-start font-semibold">{t("colStatus")}</th>
              <th className="px-5 py-3 text-end font-semibold">{t("colActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8 dark:divide-white/10">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-ink/5 dark:bg-white/10">
                      {row.image && <Image src={row.image} alt={row.name} fill sizes="40px" className="object-cover" />}
                    </div>
                    <p className="font-medium">{row.name}</p>
                  </div>
                </td>
                <td className="px-5 py-3">{row.categoryName}</td>
                <td className="px-5 py-3">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[row.status]}`}>
                      {statusLabel[row.status]}
                    </span>
                    {row.featured && (
                      <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        {t("featuredBadge")}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-5 py-3">
                  <div className="flex justify-end gap-2">
                    <Actions row={row} />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
