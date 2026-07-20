import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { getCafes } from "@/lib/data/cafes";
import { AdminListTable } from "@/components/admin/admin-list-table";

export const metadata: Metadata = { title: "Manage Cafes — Admin" };

export default async function AdminCafesPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/cafes`);
  const cafes = await getCafes();

  return (
    <section className="container-px mx-auto py-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Manage Cafes</h1>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{cafes.length} cafes published</p>
        </div>
        <Link
          href={`/${locale}/admin/cafes/new`}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} /> Add Cafe
        </Link>
      </div>

      <div className="mt-8">
        <AdminListTable
          table="cafes"
          metaLabel="WiFi"
          editHrefBase={`/${locale}/admin/cafes`}
          emptyLabel="No cafes yet — add your first one to get started."
          rows={cafes.map((c) => ({
            id: c.id,
            image: c.coverImage,
            title: c.name,
            subtitle: c.address,
            meta: c.wifi ? "Yes" : "No",
          }))}
        />
      </div>
    </section>
  );
}
