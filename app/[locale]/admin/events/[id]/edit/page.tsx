import type { Database } from "@/types/database";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { EventForm } from "@/components/admin/event-form";

export const metadata: Metadata = { title: "Edit Event — Admin" };

export default async function EditEventPage({
  params: { locale, id },
}: {
  params: { locale: Locale; id: string };
}) {
  await requireAdmin(locale, `/${locale}/admin/events/${id}/edit`);

  if (!isSupabaseConfigured()) {
    return (
      <section className="container-px mx-auto py-14">
        <p className="rounded-xl2 border border-ink/8 dark:border-white/10 p-6 text-sm text-ink/60 dark:text-sand/60">
          Editing requires a connected Supabase project. See the README to connect one.
        </p>
      </section>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !data) {
    notFound();
  }

  const event = data as unknown as Database["public"]["Tables"]["events"]["Row"];

  return (
    <section className="container-px mx-auto py-14">
      <h1 className="font-display text-2xl font-semibold mb-8">Edit Event</h1>
      <EventForm
        locale={locale}
        mode="edit"
        eventId={event.id}
        initial={{
          slug: event.slug,
          title: event.title,
          description: event.description,
          coverImage: event.cover_image,
          category: event.category,
          startDate: event.start_date?.slice(0, 10) ?? "",
          endDate: event.end_date?.slice(0, 10) ?? "",
          location: event.location,
          ticketInfo: event.ticket_info ?? "",
        }}
      />
    </section>
  );
}
