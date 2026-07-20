import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { getRestaurants } from "@/lib/data/restaurants";
import { AdminListTable } from "@/components/admin/admin-list-table";

export const metadata: Metadata = { title: "Manage Restaurants — Admin" };

export default async function AdminRestaurantsPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/restaurants`);
  const restaurants = await getRestaurants();

  return (
    <section className="container-px mx-auto py-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Manage Restaurants</h1>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{restaurants.length} restaurants published</p>
        </div>
        <Link
          href={`/${locale}/admin/restaurants/new`}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} /> Add Restaurant
        </Link>
      </div>

      <div className="mt-8">
        <AdminListTable
          table="restaurants"
          metaLabel="Cuisine"
          editHrefBase={`/${locale}/admin/restaurants`}
          emptyLabel="No restaurants yet — add your first one to get started."
          rows={restaurants.map((r) => ({
            id: r.id,
            image: r.coverImage,
            title: r.name,
            subtitle: r.address,
            meta: r.cuisine.join(", ") || "—",
          }))}
        />
      </div>
    </section>
  );
}
