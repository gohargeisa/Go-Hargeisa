import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { requireListingsAccess } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { getHotels } from "@/lib/data/hotels";
import { AdminListTable } from "@/components/admin/admin-list-table";

export const metadata: Metadata = { title: "Manage Hotels — Admin" };

export default async function AdminHotelsPage({ params: { locale } }: { params: { locale: Locale } }) {
  const access = await requireListingsAccess(locale, `/${locale}/admin/hotels`);
  const t = await getTranslations({ locale, namespace: "admin" });

  // Owners see every hotel; business owners only see hotels they own —
  // uses the authenticated client (not lib/data/hotels.ts's public one)
  // so the owner_id-scoped query actually runs as the signed-in user.
  let hotels: { id: string; name: string; address: string; cover_image: string; price_range: string; status: "draft" | "published" | "archived"; featured: boolean; is_pinned: boolean }[] = [];
  if (access && isSupabaseConfigured()) {
    const supabase = await createClient();
    let query = supabase.from("hotels").select("id, name, address, cover_image, price_range, status, featured, is_pinned");
    if (access.role === "business_owner") query = query.eq("owner_id", access.userId);
    const { data } = await query;
    hotels = data ?? [];
  } else if (!access) {
    // Supabase not configured — fall back to the public/mock data path
    // used everywhere else so the admin section still previews locally.
    hotels = (await getHotels()).map((h) => ({
      id: h.id,
      name: h.name,
      address: h.address,
      cover_image: h.coverImage,
      price_range: h.priceRange,
      status: "published" as const,
      featured: h.featured ?? false,
      is_pinned: false,
    }));
  }

  const canCreate = !access || access.role === "owner";

  return (
    <section className="container-px mx-auto py-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("manageHotels")}</h1>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
            {hotels.length} {access?.role === "business_owner" ? t("ofYourHotels") : t("hotelsPublished")}
          </p>
        </div>
        {canCreate && (
          <Link
            href={`/${locale}/admin/hotels/new`}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
          >
            <Plus size={16} /> {t("addHotel")}
          </Link>
        )}
      </div>

      <div className="mt-8">
        <AdminListTable
          table="hotels"
          metaLabel={t("priceMetaLabel")}
          editHrefBase={`/${locale}/admin/hotels`}
          emptyLabel={
            access?.role === "business_owner"
              ? t("noHotelsAssigned")
              : t("noHotelsYet")
          }
          allowDelete={canCreate}
          allowHide={canCreate}
          allowFeature={canCreate}
          allowPin={canCreate}
          rows={hotels.map((h) => ({
            id: h.id,
            image: h.cover_image,
            title: h.name,
            subtitle: h.address,
            meta: h.price_range,
            status: h.status,
            featured: h.featured,
            isPinned: h.is_pinned,
          }))}
        />
      </div>
    </section>
  );
}
