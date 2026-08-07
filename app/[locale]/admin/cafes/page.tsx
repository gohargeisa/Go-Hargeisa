import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { requireListingsAccess } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { getCafes } from "@/lib/data/cafes";
import { AdminListTable } from "@/components/admin/admin-list-table";

export const metadata: Metadata = { title: "Manage Cafes — Admin" };

export default async function AdminCafesPage({ params: { locale } }: { params: { locale: Locale } }) {
  const access = await requireListingsAccess(locale, `/${locale}/admin/cafes`);
  const t = await getTranslations({ locale, namespace: "admin" });

  let cafes: { id: string; name: string; address: string; cover_image: string; wifi: boolean; status: "draft" | "published" | "archived"; featured: boolean; is_pinned: boolean }[] = [];
  if (access && isSupabaseConfigured()) {
    const supabase = await createClient();
    let query = supabase.from("cafes").select("id, name, address, cover_image, wifi, status, featured, is_pinned");
    if (access.role === "business_owner") query = query.eq("owner_id", access.userId);
    const { data } = await query;
    cafes = data ?? [];
  } else if (!access) {
    cafes = (await getCafes()).map((c) => ({
      id: c.id,
      name: c.name,
      address: c.address,
      cover_image: c.coverImage,
      wifi: c.wifi,
      status: "published" as const,
      featured: c.featured ?? false,
      is_pinned: false,
    }));
  }

  const canCreate = !access || access.role === "owner";

  return (
    <section className="container-px mx-auto py-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("manageCafes")}</h1>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
            {cafes.length} {access?.role === "business_owner" ? t("ofYourCafes") : t("cafesPublished")}
          </p>
        </div>
        {canCreate && (
          <Link
            href={`/${locale}/admin/cafes/new`}
            className="inline-flex items-center gap-2 rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 transition-colors"
          >
            <Plus size={16} /> {t("addCafe")}
          </Link>
        )}
      </div>

      <div className="mt-8">
        <AdminListTable
          table="cafes"
          metaLabel={t("wifiMetaLabel")}
          editHrefBase={`/${locale}/admin/cafes`}
          emptyLabel={
            access?.role === "business_owner"
              ? t("noCafesAssigned")
              : t("noCafesYet")
          }
          allowDelete={canCreate}
          allowHide={canCreate}
          allowFeature={canCreate}
          allowPin={canCreate}
          rows={cafes.map((c) => ({
            id: c.id,
            image: c.cover_image,
            title: c.name,
            subtitle: c.address,
            meta: c.wifi ? t("yes") : t("no"),
            status: c.status,
            featured: c.featured,
            isPinned: c.is_pinned,
          }))}
        />
      </div>
    </section>
  );
}
