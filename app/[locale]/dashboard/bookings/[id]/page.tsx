import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireUser } from "@/lib/supabase/guards";
import { getMyBookingById } from "@/lib/data/business";
import { BookingConfirmationView } from "@/components/dashboard/booking-confirmation-view";

export const metadata: Metadata = { title: "Booking Confirmation — Go Hargeisa", robots: { index: false } };

export default async function BookingConfirmationPage({
  params: { locale, id },
}: {
  params: { locale: Locale; id: string };
}) {
  await requireUser(locale, `/${locale}/dashboard/bookings/${id}`);
  const t = await getTranslations({ locale, namespace: "dashboard" });

  const booking = await getMyBookingById(id);
  if (!booking) notFound();

  return <BookingConfirmationView locale={locale} booking={booking} labels={{ printButton: t("printConfirmation"), backToDashboard: t("backToDashboard") }} />;
}
