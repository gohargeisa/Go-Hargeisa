import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requirePlatformPermission } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { AnnouncementsManager } from "@/components/admin/announcements-manager";
import type { SiteAnnouncement } from "@/types";

export const metadata: Metadata = { title: "Announcements — Admin", robots: { index: false, follow: false } };

export default async function AdminAnnouncementsPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requirePlatformPermission(locale, `/${locale}/admin/announcements`, "content_view");
  const t = await getTranslations({ locale, namespace: "admin" });

  const supabase = await createClient();
  const { data } = await supabase.from("site_announcements").select("*").order("created_at", { ascending: false });

  const announcements: SiteAnnouncement[] = (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    message: row.message,
    linkUrl: row.link_url,
    linkLabel: row.link_label,
    status: row.status,
    createdAt: row.created_at,
  }));

  return (
    <section className="container-px mx-auto py-14">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("announcementsTitle")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("announcementsSubtitle")}</p>
      </div>

      <div className="mt-8">
        <AnnouncementsManager locale={locale} announcements={announcements} />
      </div>
    </section>
  );
}
