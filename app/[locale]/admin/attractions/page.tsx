import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { getAttractions } from "@/lib/data/attractions";
import { AdminListTable } from "@/components/admin/admin-list-table";

export const metadata: Metadata = { title: "Manage Attractions — Admin" };

export default async function AdminAttractionsPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/attractions`);
  const t = await getTranslations({ locale, namespace: "admin" });

  // Authenticated query (not the public getAttractions(), which only ever
  // returns status='published' rows) so a hidden/archived attraction stays
  // visible here to be un-hidden — matches the hotels/restaurants/cafes
  // admin pages, which already query directly for the same reason.
  let attractions: { id: string; name: string; address: string; cover_image: string; category: string; status: "draft" | "published" | "archived"; featured: boolean; is_pinned: boolean }[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("attractions").select("id, name, address, cover_image, category, status, featured, is_pinned");
    attractions = data ?? [];
  } else {
    attractions = (await getAttractions()).map((a) => ({
      id: a.id,
      name: a.name,
      address: a.address,
      cover_image: a.coverImage,
      category: a.category,
      status: "published" as const,
      featured: a.featured ?? false,
      is_pinned: false,
    }));
  }

  return (
    <section className="container-px mx-auto py-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("manageAttractions")}</h1>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{attractions.length} {t("attractionsPublished")}</p>
        </div>
        <Link
          href={`/${locale}/admin/attractions/new`}
          className="inline-flex items-center gap-2 rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 transition-colors"
        >
          <Plus size={16} /> {t("addAttraction")}
        </Link>
      </div>

      <div className="mt-8">
        <AdminListTable
          table="attractions"
          metaLabel={t("categoryMetaLabel")}
          editHrefBase={`/${locale}/admin/attractions`}
          emptyLabel={t("noAttractionsYet")}
          allowFeature
          allowPin
          rows={attractions.map((a) => ({
            id: a.id,
            image: a.cover_image,
            title: a.name,
            subtitle: a.address,
            meta: a.category,
            status: a.status,
            featured: a.featured,
            isPinned: a.is_pinned,
          }))}
        />
      </div>
    </section>
  );
}
