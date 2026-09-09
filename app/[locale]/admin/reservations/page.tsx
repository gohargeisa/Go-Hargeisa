import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { getAllReservationsForAdmin } from "@/lib/data/reservations";
import { AdminReservationsList } from "@/components/admin/admin-reservations-list";

export const metadata: Metadata = { title: "Reservations — Admin", robots: { index: false, follow: false } };

export default async function AdminReservationsPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/reservations`);
  const t = await getTranslations({ locale, namespace: "admin" });

  const reservations = await getAllReservationsForAdmin();

  return (
    <section className="container-px mx-auto py-14">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("reservationsAdminTitle")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
          {t("reservationsAdminSubtitle", { count: reservations.length })}
        </p>
      </div>

      <div className="mt-8">
        <AdminReservationsList reservations={reservations} />
      </div>
    </section>
  );
}
