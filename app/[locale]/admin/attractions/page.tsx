import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { getAttractions } from "@/lib/data/attractions";
import { AdminListTable } from "@/components/admin/admin-list-table";

export const metadata: Metadata = { title: "Manage Attractions — Admin" };

export default async function AdminAttractionsPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/attractions`);
  const attractions = await getAttractions();

  return (
    <section className="container-px mx-auto py-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Manage Attractions</h1>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{attractions.length} attractions published</p>
        </div>
        <Link
          href={`/${locale}/admin/attractions/new`}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} /> Add Attraction
        </Link>
      </div>

      <div className="mt-8">
        <AdminListTable
          table="attractions"
          metaLabel="Category"
          editHrefBase={`/${locale}/admin/attractions`}
          emptyLabel="No attractions yet — add your first one to get started."
          rows={attractions.map((a) => ({
            id: a.id,
            image: a.coverImage,
            title: a.name,
            subtitle: a.address,
            meta: a.category,
          }))}
        />
      </div>
    </section>
  );
}
