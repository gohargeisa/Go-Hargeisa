import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { getHotels } from "@/lib/data/hotels";
import { AdminListTable } from "@/components/admin/admin-list-table";

export const metadata: Metadata = { title: "Manage Hotels — Admin" };

export default async function AdminHotelsPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/hotels`);
  const hotels = await getHotels();

  return (
    <section className="container-px mx-auto py-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Manage Hotels</h1>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{hotels.length} hotels published</p>
        </div>
        <Link
          href={`/${locale}/admin/hotels/new`}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} /> Add Hotel
        </Link>
      </div>

      <div className="mt-8">
        <AdminListTable
          table="hotels"
          metaLabel="Price"
          editHrefBase={`/${locale}/admin/hotels`}
          emptyLabel="No hotels yet — add your first one to get started."
          rows={hotels.map((h) => ({
            id: h.id,
            image: h.coverImage,
            title: h.name,
            subtitle: h.address,
            meta: h.priceRange,
          }))}
        />
      </div>
    </section>
  );
}
