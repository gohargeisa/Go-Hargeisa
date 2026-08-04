import type { Database } from "@/types/database";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { EventForm } from "@/components/admin/event-form";
import type { GalleryImage, MediaVideo, OpeningHoursGroup } from "@/types";

export const metadata: Metadata = { title: "Edit Event — Admin" };

export default async function EditEventPage({
  params: { locale, id },
}: {
  params: { locale: Locale; id: string };
}) {
  await requireAdmin(locale, `/${locale}/admin/events/${id}/edit`);
  const t = await getTranslations({ locale, namespace: "admin" });

  if (!isSupabaseConfigured()) {
    return (
      <section className="container-px mx-auto py-14">
        <p className="rounded-xl2 border border-ink/8 dark:border-white/10 p-6 text-sm text-ink/60 dark:text-sand/60">
          {t("editingRequiresSupabaseShort")}
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
      <h1 className="font-display text-2xl font-semibold mb-8">{t("editEventTitle")}</h1>
      <EventForm
        locale={locale}
        mode="edit"
        eventId={event.id}
        initial={{
          slug: event.slug,
          title: event.title,
          description: event.description,
          coverImage: event.cover_image,
          gallery: Array.isArray(event.gallery) ? (event.gallery as unknown as GalleryImage[]) : [],
          videos: Array.isArray(event.videos) ? (event.videos as unknown as MediaVideo[]) : [],
          category: event.category,
          startDate: event.start_date?.slice(0, 10) ?? "",
          endDate: event.end_date?.slice(0, 10) ?? "",
          location: event.location,
          lat: event.lat,
          lng: event.lng,
          googleMapsUrl: event.google_maps_url ?? "",
          ticketInfo: event.ticket_info ?? "",
          amenitiesV2: event.amenities_v2 ?? [],
          openingHoursStructured: Array.isArray(event.opening_hours_structured)
            ? (event.opening_hours_structured as unknown as OpeningHoursGroup[])
            : [],
          is24Hours: event.is_24_hours,
          temporarilyClosed: event.temporarily_closed,
          permanentlyClosed: event.permanently_closed,
          phone: event.phone ?? "",
          whatsapp: event.whatsapp ?? "",
          email: event.email ?? "",
          website: event.website ?? "",
          socialInstagram: event.social_instagram ?? "",
          socialFacebook: event.social_facebook ?? "",
          socialTiktok: event.social_tiktok ?? "",
          socialSnapchat: event.social_snapchat ?? "",
          socialX: event.social_x ?? "",
          socialYoutube: event.social_youtube ?? "",
          socialTelegram: event.social_telegram ?? "",
        }}
      />
    </section>
  );
}
