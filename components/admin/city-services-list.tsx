"use client";

import Link from "next/link";
import Image from "next/image";
import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Pencil, Trash2, Eye, EyeOff, Star, Loader2, Search } from "lucide-react";
import { deleteCityService, toggleCityServiceVisibility, toggleCityServiceFeatured } from "@/lib/actions/city-services";
import { buildCategoryGroupOptions, mergedCategoryDisplayName } from "@/lib/config/city-service-category-groups";
import { categoryDisplayName } from "@/lib/utils/category-href";
import type { Locale } from "@/lib/i18n/config";
import type { Category } from "@/types";

export interface CityServiceListRow {
  id: string;
  name: string;
  image: string | null;
  categoryId: string;
  /** Already-resolved localized display name of the joined `categories` row. */
  categoryName: string;
  status: "draft" | "published" | "archived";
  featured: boolean;
  createdAt: string;
  /** Assigned owner's display name — admin view only (null for a
   * business_owner's own rows, which the page never bothers resolving since
   * they already know it's them) or when unassigned. */
  ownerName?: string | null;
}

const STATUS_FILTERS = ["all", "draft", "published", "archived"] as const;

/** Same mobile-card / desktop-table split as AdminListTable — city_services
 * has its own small list component rather than being forced into the generic
 * one built for the six other slug-based content types (different owner-only
 * auth model, extra featured/category-group affordances). Filters are
 * client-side (same pattern as admin-bookings-list.tsx) —
 * the page already fetches every row in one query, so there's no separate
 * server round-trip to add. */
export function CityServicesList({
  locale,
  rows,
  categories,
  canManage = true,
  emptyLabel,
}: {
  locale: Locale;
  rows: CityServiceListRow[];
  /** Every city_services sub-category, active or not — an admin managing
   * existing listings needs to find one even under a category they've since
   * deactivated (e.g. Mosques). */
  categories: Category[];
  /** False for a business_owner viewing only their own assigned listings —
   * hides delete/feature/hide (RLS only grants them UPDATE, never
   * INSERT/DELETE, same restriction as the hotels admin list). Editing via
   * the pencil icon stays available either way. */
  canManage?: boolean;
  /** Overrides the "no rows" message — e.g. "No city services assigned to
   * you yet" for a business_owner instead of the admin-wide empty state. */
  emptyLabel?: string;
}) {
  const t = useTranslations("admin");
  const tListings = useTranslations("listings");
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_FILTERS)[number]>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const statusLabel = { draft: t("statusDraft"), published: t("statusPublished"), archived: t("statusArchived") };
  const statusClass = {
    draft: "bg-secondary/10 text-secondary-700 dark:text-sand/70",
    published: "bg-accent/10 text-accent-700",
    archived: "bg-ink/10 text-ink/60 dark:bg-white/10 dark:text-sand/60",
  };

  // Same grouping as /join and the city-service create/edit form (Education,
  // Health, Automotive, ...) — a filter dropdown, so each group just becomes
  // an <optgroup> of its real member categories rather than a two-step
  // picker; a standalone (ungrouped) category renders as a plain top-level
  // option, same as before.
  const categoryGroups = useMemo(() => buildCategoryGroupOptions(categories), [categories]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return rows.filter((row) => {
      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (categoryFilter !== "all" && row.categoryId !== categoryFilter) return false;
      if (needle && !row.name.toLowerCase().includes(needle)) return false;
      return true;
    });
  }, [rows, query, statusFilter, categoryFilter]);

  function onToggle(row: CityServiceListRow) {
    setPendingId(row.id);
    startTransition(async () => {
      // Cycles published <-> archived; a draft row also moves to published
      // on click, same single-action affordance as every other admin list
      // here. Archived -> published is how a restore happens — no separate
      // "restore" action needed, the toggle already covers it both ways.
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

  const Actions = ({ row }: { row: CityServiceListRow }) => (
    <>
      <Link
        href={`/${locale}/admin/city-services/${row.id}/edit`}
        aria-label={t("editAriaLabel", { name: row.name })}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 dark:border-white/15 hover:border-primary hover:text-primary"
      >
        <Pencil size={13} />
      </Link>
      {canManage && (
        <>
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
            aria-label={confirmDeleteId === row.id ? tListings("deleteConfirmTooltip", { name: row.name }) : tListings("deleteLabel")}
            className={`flex h-8 items-center gap-1.5 rounded-lg border px-2 text-xs font-semibold transition-colors disabled:opacity-60 ${
              confirmDeleteId === row.id
                ? "border-red-500 bg-red-500 text-white"
                : "border-ink/10 dark:border-white/15 hover:border-red-500 hover:text-red-500"
            }`}
          >
            <Trash2 size={13} />
          </button>
        </>
      )}
    </>
  );

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 rounded-full border border-ink/12 bg-white px-4 py-2.5 dark:border-white/15 dark:bg-white/5 sm:max-w-sm">
          <Search size={16} className="shrink-0 text-ink/40 dark:text-sand/40" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("cityServicesSearchPlaceholder")}
            className="w-full bg-transparent text-sm outline-none placeholder:text-ink/40 dark:placeholder:text-sand/40"
          />
        </div>
        {categories.length > 0 && (
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-10 rounded-full border border-ink/12 bg-white px-3.5 text-sm dark:border-white/15 dark:bg-white/5"
          >
            <option value="all">{t("allCategoriesFilter")}</option>
            {categoryGroups.map((g) =>
              g.isMerged ? (
                <optgroup key={g.key} label={mergedCategoryDisplayName(g.merged!, locale)}>
                  {g.members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {categoryDisplayName(m, locale)}
                    </option>
                  ))}
                </optgroup>
              ) : (
                <option key={g.key} value={g.members[0].id}>
                  {categoryDisplayName(g.members[0], locale)}
                </option>
              )
            )}
          </select>
        )}
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStatusFilter(s)}
            className={`inline-flex items-center rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              statusFilter === s
                ? "border-transparent bg-primary text-white"
                : "border-ink/10 text-ink/60 hover:border-primary/40 dark:border-white/15 dark:text-sand/60"
            }`}
          >
            {s === "all" ? t("allStatuses") : statusLabel[s]}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl2 border border-dashed border-ink/15 dark:border-white/15 p-10 text-center text-sm text-ink/50 dark:text-sand/50">
          {rows.length === 0 ? emptyLabel ?? t("noCityServicesYet") : tListings("noServicesMatch")}
        </p>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:hidden">
            {filtered.map((row) => (
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
                    {canManage && (
                      <p className="mt-1 text-[11px] text-ink/40 dark:text-sand/40">
                        {t("assignedOwnerLabel")}: {row.ownerName ?? t("noOwnerAssignedLabel")}
                      </p>
                    )}
                    <p className="mt-1 text-[11px] text-ink/40 dark:text-sand/40">
                      {t("colCreated")}: {new Date(row.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                </div>
                {confirmDeleteId === row.id && (
                  <p className="mt-2 text-xs font-medium text-red-600">{tListings("deleteConfirmTooltip", { name: row.name })}</p>
                )}
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
                  {canManage && <th className="px-5 py-3 text-start font-semibold">{t("assignedOwnerLabel")}</th>}
                  <th className="px-5 py-3 text-start font-semibold">{t("colStatus")}</th>
                  <th className="px-5 py-3 text-start font-semibold">{t("colCreated")}</th>
                  <th className="px-5 py-3 text-end font-semibold">{t("colActions")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8 dark:divide-white/10">
                {filtered.map((row) => (
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
                    {canManage && (
                      <td className="px-5 py-3 text-ink/60 dark:text-sand/60">{row.ownerName ?? t("noOwnerAssignedLabel")}</td>
                    )}
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
                    <td className="px-5 py-3 whitespace-nowrap text-ink/60 dark:text-sand/60">
                      {new Date(row.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex justify-end gap-2">
                          <Actions row={row} />
                        </div>
                        {confirmDeleteId === row.id && (
                          <p className="text-xs font-medium text-red-600">{tListings("deleteConfirmTooltip", { name: row.name })}</p>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
