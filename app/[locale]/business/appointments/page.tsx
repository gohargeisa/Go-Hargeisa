import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getActiveListing } from "@/lib/data/business";
import { createClient } from "@/lib/supabase/server";
import { mapAppointment } from "@/lib/data/mappers";
import { AppointmentsTable, type AppointmentManagerRow } from "@/components/business/appointments-table";
import { isMedicalAppointmentCategory } from "@/lib/utils/appointment-domain";

export const metadata: Metadata = { title: "Appointments — Dashboard", robots: { index: false } };

export default async function AppointmentsPage({ params: { locale } }: { params: { locale: Locale } }) {
  const currentPath = `/${locale}/business/appointments`;
  const listing = await getActiveListing(locale, currentPath);
  if (!listing) return null;
  // redirect() rather than notFound() — see the comment in
  // app/[locale]/city-services/[slug]/book/page.tsx for why.
  if (!listing.supportsAppointments) redirect(`/${locale}/business`);

  const t = await getTranslations({ locale, namespace: "appointments" });
  const supabase = await createClient();

  const { data: doctorRows } = await supabase.from("doctors").select("id, name").eq("city_service_id", listing.id);
  const doctors = (doctorRows ?? []) as { id: string; name: string }[];
  const doctorIds = doctors.map((d) => d.id);
  const doctorNameById = new Map(doctors.map((d) => [d.id, d.name]));

  let rows: AppointmentManagerRow[] = [];
  if (doctorIds.length > 0) {
    const { data } = await supabase
      .from("appointments")
      .select("*")
      .in("doctor_id", doctorIds)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });
    rows = (data ?? []).map((row) => {
      const a = mapAppointment(row);
      return { ...a, doctorName: doctorNameById.get(a.doctorId) ?? "—" };
    });
  }

  return (
    <div className="max-w-4xl space-y-2">
      <div>
        <h1 className="font-display text-2xl font-bold">{t("navAppointments")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t("appointmentsPageSubtitle")}</p>
      </div>
      <div className="pt-4">
        <AppointmentsTable appointments={rows} revalidatePath={currentPath} isMedical={isMedicalAppointmentCategory(listing.categorySlug)} />
      </div>
    </div>
  );
}
