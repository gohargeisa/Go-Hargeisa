import Link from "next/link";
import Image from "next/image";
import { Pencil } from "lucide-react";
import { DeleteListingButton } from "@/components/shared/delete-listing-button";

type AdminTable = "hotels" | "restaurants" | "cafes" | "attractions" | "events" | "articles";

export interface AdminRow {
  id: string;
  image: string;
  title: string;
  subtitle: string;
  meta: string; // e.g. price range, category, read time — shown in its own column
}

export function AdminListTable({
  table,
  rows,
  metaLabel,
  editHrefBase,
  emptyLabel,
}: {
  table: AdminTable;
  rows: AdminRow[];
  metaLabel: string;
  editHrefBase: string;
  emptyLabel: string;
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl2 border border-dashed border-ink/15 dark:border-white/15 p-10 text-center text-sm text-ink/50 dark:text-sand/50">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl2 border border-ink/8 dark:border-white/10">
      <table className="w-full text-sm">
        <thead className="bg-ink/[0.03] dark:bg-white/5">
          <tr>
            <th className="px-5 py-3 text-start font-semibold">Name</th>
            <th className="px-5 py-3 text-start font-semibold">{metaLabel}</th>
            <th className="px-5 py-3 text-start font-semibold">Status</th>
            <th className="px-5 py-3 text-end font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-ink/8 dark:divide-white/10">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="px-5 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg">
                    <Image src={row.image} alt="" fill className="object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium truncate">{row.title}</p>
                    <p className="text-xs text-ink/50 dark:text-sand/50 truncate">{row.subtitle}</p>
                  </div>
                </div>
              </td>
              <td className="px-5 py-3 whitespace-nowrap">{row.meta}</td>
              <td className="px-5 py-3">
                <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-xs font-semibold text-secondary-700">
                  Published
                </span>
              </td>
              <td className="px-5 py-3">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`${editHrefBase}/${row.id}/edit`}
                    aria-label={`Edit ${row.title}`}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-ink/10 dark:border-white/15 hover:border-primary hover:text-primary"
                  >
                    <Pencil size={13} />
                  </Link>
                  <DeleteListingButton table={table} id={row.id} name={row.title} />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
