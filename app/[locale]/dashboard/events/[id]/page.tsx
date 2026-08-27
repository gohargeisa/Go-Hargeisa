import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { Locale } from "@/lib/i18n/config";
import { requireUser } from "@/lib/supabase/guards";
import { getMyEventRequestById } from "@/lib/data/event-requests";
import { EventRequestTrackingView } from "@/components/dashboard/event-request-tracking-view";

export const metadata: Metadata = { title: "Event Request — Go Hargeisa", robots: { index: false } };

export default async function EventRequestTrackingPage({ params: { locale, id } }: { params: { locale: Locale; id: string } }) {
  await requireUser(locale, `/${locale}/dashboard/events/${id}`);

  const request = await getMyEventRequestById(id);
  if (!request) notFound();

  return <EventRequestTrackingView locale={locale} request={request} />;
}
