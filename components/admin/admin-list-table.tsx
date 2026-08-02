import Link from "next/link";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Pencil } from "lucide-react";
import { DeleteListingButton } from "@/components/shared/delete-listing-button";
import { ListingStatusMenu } from "@/components/shared/listing-status-menu";
import { FeatureListingButton } from "@/components/shared/feature-listing-button";
import { PinListingButton } from "@/components/shared/pin-listing-button";
import type { FeaturableTable } from "@/lib/actions/admin";

type AdminTable = "hotels" | "restaurants" | "cafes" | "attractions" | "events" | "articles" | "services";

export interface AdminRow {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  meta: string; // e.g. price range, category, read time — shown in its own column
  status: "draft" | "published" | "archived";
  featured?: boolean;
  isPinned?: boolean;
}

/**
 * Renders as a real table from `sm` up, and as a stack of cards below that
 * — a horizontally-scrolling table is workable on a phone but every tap
 * target (edit/hide/delete) ends up too small and too close together to
 * hit reliably, which is exactly what "owner can manage everything from
 * mobile" needs to not be true.
 */
export function AdminListTable({
  table,
  rows,
  metaLabel,
  editHrefBase,
  emptyLabel,
  allowDelete = true,
  allowHide = true,
  allowFeature = false,
  allowPin = false,
}: {
  table: AdminTable;
  rows: AdminRow[];
  metaLabel: string;
  editHrefBase: string;
  emptyLabel: string;
  /** Business owners can edit their own listings but not delete them (no RLS delete policy for them). */
  allowDelete?: boolean;
  /** Hiding is owner-only — business owners never see the control. */
  allowHide?: boolean;
  /** Feature/Pin only apply to tables that carry those columns (hotels/restaurants/cafes/attractions) — events/articles don't, so callers must opt in explicitly. */
  allowFeature?: boolean;
  allowPin?: boolean;
}) {
  const t = useTranslations("admin");
  const featurableTable = table as FeaturableTable;

  if (rows.length === 0) {
    return (
      <p className="rounded-xl2 border border-dashed border-ink/15 dark:border-white/15 p-10 text-center text-sm text-ink/50 dark:text-sand/50">
        {emptyLabel}
      </p>
    );
  }

  const statusLabel = { draft: t("statusDraft"), published: t("statusPublished"), archived: t("statusArchived") };
  const statusClass = {
    draft: "bg-secondary/10 text-secondary-700 dark:text-sand/70",
    published: "bg-accent/10 text-accent-700",
    archived: "bg-ink/10 text-ink/60 dark:bg-white/10 dark:text-sand/60",
  };

  const StatusControl = ({ row }: { row: AdminRow }) =>
    allowHide ? (
      <ListingStatusMenu table={table} id={row.id} status={row.status} />
    ) : (
      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusClass[row.status]}`}>{statusLabel[row.status]}</span>
    );

  const Actions = ({ row }: { row: AdminRow }) => (
    <>
      <Link
        href={`${editHrefBase}/${row.id}/edit`}
        aria-label={t("editAriaLabel", { name: row.title })}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 dark:border-white/15 hover:border-primary hover:text-primary"
      >
        <Pencil size={13} />
      </Link>
      {allowFeature && <FeatureListingButton table={featurableTable} id={row.id} featured={row.featured ?? false} />}
      {allowPin && <PinListingButton table={featurableTable} id={row.id} pinned={row.isPinned ?? false} />}
      {allowDelete && <DeleteListingButton table={table} id={row.id} name={row.title} />}
    </>
  );

  return (
    <>
      {/* Mobile: card stack (< sm) */}
      <div className="flex flex-col gap-3 sm:hidden">
        {rows.map((row) => (
          <div key={row.id} className="rounded-xl2 border border-ink/8 bg-white p-4 dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex items-center gap-3">
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                <Image src={row.image} alt={row.title} fill sizes="56px" className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{row.title}</p>
                <p className="truncate text-xs text-ink/50 dark:text-sand/50">{row.subtitle}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <StatusControl row={row} />
                  {row.meta && <span className="text-[11px] text-ink/45 dark:text-sand/45">{row.meta}</span>}
                </div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center justify-end gap-2 border-t border-ink/8 pt-3 dark:border-white/10">
              <Actions row={row} />
            </div>
          </div>
        ))}
      </div>

      {/* Desktop/tablet: table (>= sm) */}
      <div className="hidden overflow-x-auto rounded-xl2 border border-ink/8 dark:border-white/10 sm:block">
        <table className="w-full text-sm">
          <thead className="bg-ink/[0.03] dark:bg-white/5">
            <tr>
              <th className="px-5 py-3 text-start font-semibold">{t("colName")}</th>
              <th className="px-5 py-3 text-start font-semibold">{metaLabel}</th>
              <th className="px-5 py-3 text-start font-semibold">{t("colStatus")}</th>
              <th className="px-5 py-3 text-end font-semibold">{t("colActions")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ink/8 dark:divide-white/10">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                      <Image src={row.image} alt={row.title} fill sizes="40px" className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium truncate">{row.title}</p>
                      <p className="text-xs text-ink/50 dark:text-sand/50 truncate">{row.subtitle}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-3 whitespace-nowrap">{row.meta}</td>
                <td className="px-5 py-3">
                  <StatusControl row={row} />
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
