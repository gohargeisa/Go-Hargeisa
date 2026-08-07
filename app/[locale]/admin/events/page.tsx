import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Plus } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { getEvents } from "@/lib/data/events";
import { AdminListTable } from "@/components/admin/admin-list-table";

export const metadata: Metadata = { title: "Manage Events — Admin" };

export default async function AdminEventsPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/events`);
  const t = await getTranslations({ locale, namespace: "admin" });

  let events: { id: string; title: string; location: string; cover_image: string; start_date: string; status: "draft" | "published" | "archived" }[] = [];
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const { data } = await supabase.from("events").select("id, title, location, cover_image, start_date, status");
    events = data ?? [];
  } else {
    events = (await getEvents()).map((e) => ({
      id: e.id,
      title: e.title,
      location: e.location,
      cover_image: e.coverImage,
      start_date: e.startDate,
      status: "published" as const,
    }));
  }

  return (
    <section className="container-px mx-auto py-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">{t("manageEvents")}</h1>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{events.length} {t("eventsPublished")}</p>
        </div>
        <Link
          href={`/${locale}/admin/events/new`}
          className="inline-flex items-center gap-2 rounded-full bg-primary-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-800 transition-colors"
        >
          <Plus size={16} /> {t("addEvent")}
        </Link>
      </div>

      <div className="mt-8">
        <AdminListTable
          table="events"
          metaLabel={t("dateMetaLabel")}
          editHrefBase={`/${locale}/admin/events`}
          emptyLabel={t("noEventsYet")}
          rows={events.map((e) => ({
            id: e.id,
            image: e.cover_image,
            title: e.title,
            subtitle: e.location,
            meta: new Date(e.start_date).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
            status: e.status,
          }))}
        />
      </div>
    </section>
  );
}
