import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { requireListingsAccess } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { CityServicesList } from "@/components/admin/city-services-list";
import { getCategoriesForAdmin } from "@/lib/data/categories";
import { categoryDisplayName } from "@/lib/utils/category-href";

export const metadata: Metadata = { title: "Manage City Services — Admin" };

export default async function AdminCityServicesPage({ params: { locale } }: { params: { locale: Locale } }) {
  const access = await requireListingsAccess(locale, `/${locale}/admin/city-services`);
  const t = await getTranslations({ locale, namespace: "admin" });

  const supabase = await createClient();
  // Owners see every city service; business owners only see the ones
  // assigned to them — same owner_id-scoped-query pattern as
  // app/[locale]/admin/hotels/page.tsx.
  let query = supabase
    .from("city_services")
    .select("id, name, image, category_id, owner_id, status, featured, created_at")
    .order("category_id")
    .order("sort_order");
  if (access?.role === "business_owner") query = query.eq("owner_id", access.userId);

  const [{ data }, allCategories] = await Promise.all([query, getCategoriesForAdmin()]);
  const categoryById = new Map(allCategories.map((c) => [c.id, c]));

  // Owner names, admin view only — a business_owner already knows every row
  // here is theirs, so there's no need to resolve/display it for them.
  const ownerIds = access?.role === "owner" ? Array.from(new Set((data ?? []).map((r) => r.owner_id).filter((v): v is string => Boolean(v)))) : [];
  const ownerNameById = new Map<string, string | null>();
  if (ownerIds.length > 0) {
    const { data: owners } = await supabase.from("profiles").select("id, full_name").in("id", ownerIds);
    for (const o of owners ?? []) ownerNameById.set(o.id, o.full_name);
  }

  const rows = (data ?? []).map((row) => {
    const category = categoryById.get(row.category_id);
    return {
      id: row.id,
      name: row.name,
      image: row.image,
      categoryId: row.category_id,
      categoryName: category ? categoryDisplayName(category, locale) : "—",
      status: row.status,
      featured: row.featured,
      createdAt: row.created_at,
      ownerName: row.owner_id ? ownerNameById.get(row.owner_id) ?? t("unnamedOwnerLabel") : null,
    };
  });

  // Every real City Services sub-category (Hospitals, Pharmacies, ...) —
  // same target_table='city_services', is_pinned=false shape
  // getCityServiceCategories() uses, except this admin filter dropdown
  // also needs currently-inactive categories (e.g. Mosques, deactivated
  // but still owning existing listings an admin may need to find/manage).
  const filterCategories = allCategories.filter((c) => c.targetTable === "city_services" && !c.isPinned);

  // Business owners may edit their own listings but never create/delete/
  // feature/hide new ones — same restriction as the hotels admin list
  // (RLS grants business_owner UPDATE only, never INSERT/DELETE).
  const canCreate = !access || access.role === "owner";

  return (
    <section className="container-px mx-auto py-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("manageCityServices")}</h1>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
            {rows.length} {access?.role === "business_owner" ? t("ofYourCityServices") : ""}
          </p>
        </div>
        {canCreate && (
          <Link
            href={`/${locale}/admin/city-services/new`}
            className="inline-flex items-center gap-2 rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 transition-colors"
          >
            <Plus size={16} /> {t("addCityService")}
          </Link>
        )}
      </div>

      <div className="mt-8">
        <CityServicesList
          locale={locale}
          rows={rows}
          categories={filterCategories}
          canManage={canCreate}
          emptyLabel={access?.role === "business_owner" ? t("noCityServicesAssigned") : undefined}
        />
      </div>
    </section>
  );
}
