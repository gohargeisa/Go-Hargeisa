import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { getServices } from "@/lib/data/services";
import { AdminListTable } from "@/components/admin/admin-list-table";
import { SERVICE_CATEGORY_SINGULAR_LABELS } from "@/lib/utils/service-categories";
import type { ServiceCategory } from "@/types";

export const metadata: Metadata = { title: "Manage Services — Admin" };

export default async function AdminServicesPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/services`);
  const t = await getTranslations({ locale, namespace: "admin" });

  // Authenticated query (not the public getServices(), which only ever
  // returns status='published' rows) so a hidden/archived service stays
  // visible here to be un-hidden — matches the hotels/restaurants/cafes/
  // attractions admin pages, which already query directly for the same reason.
  let services: { id: string; name: string; address: string; cover_image: string; category: ServiceCategory; status: "draft" | "published" | "archived"; featured: boolean; is_pinned: boolean }[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("services").select("id, name, address, cover_image, category, status, featured, is_pinned");
    services = (data ?? []) as typeof services;
  } else {
    services = (await getServices()).map((s) => ({
      id: s.id,
      name: s.name,
      address: s.address,
      cover_image: s.coverImage,
      category: s.category,
      status: "published" as const,
      featured: s.featured ?? false,
      is_pinned: false,
    }));
  }

  return (
    <section className="container-px mx-auto py-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("manageServices")}</h1>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{services.length} {t("servicesPublished")}</p>
        </div>
        <Link
          href={`/${locale}/admin/services/new`}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} /> {t("addService")}
        </Link>
      </div>

      <div className="mt-8">
        <AdminListTable
          table="services"
          metaLabel={t("categoryMetaLabel")}
          editHrefBase={`/${locale}/admin/services`}
          emptyLabel={t("noServicesYetAdmin")}
          allowFeature
          allowPin
          rows={services.map((s) => ({
            id: s.id,
            image: s.cover_image,
            title: s.name,
            subtitle: s.address,
            meta: SERVICE_CATEGORY_SINGULAR_LABELS[s.category] ?? s.category,
            status: s.status,
            featured: s.featured,
            isPinned: s.is_pinned,
          }))}
        />
      </div>
    </section>
  );
}
