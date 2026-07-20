import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { EventForm } from "@/components/admin/event-form";

export const metadata: Metadata = { title: "Add Event — Admin" };

export default async function NewEventPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/events/new`);

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-8">Add Event</h1>
      <EventForm locale={locale} mode="create" />
    </section>
  );
}
