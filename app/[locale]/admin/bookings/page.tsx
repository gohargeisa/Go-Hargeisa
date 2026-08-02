import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { getAllBookingsForAdmin } from "@/lib/data/business";
import { AdminBookingsList } from "@/components/admin/admin-bookings-list";

export const metadata: Metadata = { title: "Bookings — Admin", robots: { index: false, follow: false } };

export default async function AdminBookingsPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/bookings`);
  const t = await getTranslations({ locale, namespace: "admin" });

  const bookings = await getAllBookingsForAdmin();

  return (
    <section className="container-px mx-auto py-14">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("bookingsAdminTitle")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
          {t("bookingsAdminSubtitle", { count: bookings.length })}
        </p>
      </div>

      <div className="mt-8">
        <AdminBookingsList bookings={bookings} />
      </div>
    </section>
  );
}
