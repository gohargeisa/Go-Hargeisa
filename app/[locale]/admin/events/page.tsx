import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { getEvents } from "@/lib/data/events";
import { AdminListTable } from "@/components/admin/admin-list-table";

export const metadata: Metadata = { title: "Manage Events — Admin" };

export default async function AdminEventsPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/events`);
  const events = await getEvents();

  return (
    <section className="container-px mx-auto py-14">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold">Manage Events</h1>
          <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{events.length} events published</p>
        </div>
        <Link
          href={`/${locale}/admin/events/new`}
          className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-700 transition-colors"
        >
          <Plus size={16} /> Add Event
        </Link>
      </div>

      <div className="mt-8">
        <AdminListTable
          table="events"
          metaLabel="Date"
          editHrefBase={`/${locale}/admin/events`}
          emptyLabel="No events yet — add your first one to get started."
          rows={events.map((e) => ({
            id: e.id,
            image: e.coverImage,
            title: e.title,
            subtitle: e.location,
            meta: new Date(e.startDate).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" }),
          }))}
        />
      </div>
    </section>
  );
}
