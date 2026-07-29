import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { requireListingsAccess } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { getRestaurants } from "@/lib/data/restaurants";
import { AdminListTable } from "@/components/admin/admin-list-table";

export const metadata: Metadata = { title: "Manage Restaurants — Admin" };

export default async function AdminRestaurantsPage({ params: { locale } }: { params: { locale: Locale } }) {
  const access = await requireListingsAccess(locale, `/${locale}/admin/restaurants`);
  const t = await getTranslations({ locale, namespace: "admin" });

  let restaurants: { id: string; name: string; address: string; cover_image: string; cuisine: string[] | null; status: "draft" | "published" | "archived" }[] = [];
  if (access && isSupabaseConfigured()) {
    const supabase = await createClient();
    let query = supabase.from("restaurants").select("id, name, address, cover_image, cuisine, status");
    if (access.role === "business_owner") query = query.eq("owner_id", access.userId);
    const { data } = await query;
    restaurants = data ?? [];
  } else if (!access) {
    restaurants = (await getRestaurants()).map((r) => ({
      id: r.id,
      name: r.name,
      address: r.address,
      cover_image: r.coverImage,
      cuisine: r.cuisine,
      status: "published" as const,
    }));
  }

  const canCreate = !access || access.role === "owner";

  return (
    <section className="container-px mx-auto py-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("manageRestaurants")}</h1>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
            {restaurants.length} {access?.role === "business_owner" ? t("ofYourRestaurants") : t("restaurantsPublished")}
          </p>
        </div>
        {canCreate && (
          <Link
            href={`/${locale}/admin/restaurants/new`}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
          >
            <Plus size={16} /> {t("addRestaurant")}
          </Link>
        )}
      </div>

      <div className="mt-8">
        <AdminListTable
          table="restaurants"
          metaLabel={t("cuisineMetaLabel")}
          editHrefBase={`/${locale}/admin/restaurants`}
          emptyLabel={
            access?.role === "business_owner"
              ? t("noRestaurantsAssigned")
              : t("noRestaurantsYet")
          }
          allowDelete={canCreate}
          allowHide={canCreate}
          rows={restaurants.map((r) => ({
            id: r.id,
            image: r.cover_image,
            title: r.name,
            subtitle: r.address,
            meta: r.cuisine?.join(", ") || "—",
            status: r.status,
          }))}
        />
      </div>
    </section>
  );
}
