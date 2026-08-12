import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { requireAdmin } from "@/lib/supabase/guards";
import { getAllAppointmentsForAdmin } from "@/lib/data/business";
import { AdminAppointmentsList } from "@/components/admin/admin-appointments-list";

export const metadata: Metadata = { title: "Appointments — Admin", robots: { index: false, follow: false } };

export default async function AdminAppointmentsPage({ params: { locale } }: { params: { locale: Locale } }) {
  await requireAdmin(locale, `/${locale}/admin/appointments`);
  const t = await getTranslations({ locale, namespace: "admin" });

  const appointments = await getAllAppointmentsForAdmin();

  return (
    <section className="container-px mx-auto py-14">
      <div>
        <h1 className="font-display text-2xl font-semibold">{t("appointmentsAdminTitle")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">
          {t("appointmentsAdminSubtitle", { count: appointments.length })}
        </p>
      </div>

      <div className="mt-8">
        <AdminAppointmentsList appointments={appointments} />
      </div>
    </section>
  );
}
