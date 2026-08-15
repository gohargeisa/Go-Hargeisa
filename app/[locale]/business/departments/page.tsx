import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getActiveListing } from "@/lib/data/business";
import { createClient } from "@/lib/supabase/server";
import { mapDepartment } from "@/lib/data/mappers";
import { DepartmentsManager, type DepartmentManagerRow } from "@/components/business/departments-manager";
import { isMedicalAppointmentCategory } from "@/lib/utils/appointment-domain";

export const metadata: Metadata = { title: "Departments — Dashboard", robots: { index: false } };

export default async function DepartmentsPage({ params: { locale } }: { params: { locale: Locale } }) {
  const currentPath = `/${locale}/business/departments`;
  const listing = await getActiveListing(locale, currentPath);
  if (!listing) return null;
  // redirect() rather than notFound() — see the comment in
  // app/[locale]/city-services/[slug]/book/page.tsx for why.
  if (!listing.supportsAppointments) redirect(`/${locale}/business`);
  const isMedical = isMedicalAppointmentCategory(listing.categorySlug);

  const t = await getTranslations({ locale, namespace: "appointments" });
  const supabase = await createClient();
  const { data } = await supabase.from("departments").select("*").eq("city_service_id", listing.id).order("sort_order", { ascending: true });

  const rows: DepartmentManagerRow[] = (data ?? []).map((row) => {
    const d = mapDepartment(row);
    return { id: d.id, name: d.name, nameAr: d.nameAr, nameSo: d.nameSo, sortOrder: d.sortOrder };
  });

  return (
    <div className="max-w-2xl space-y-2">
      <div>
        <h1 className="font-display text-2xl font-bold">{t("navDepartments")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t(isMedical ? "departmentsPageSubtitle" : "staffDepartmentsPageSubtitle")}</p>
      </div>
      <div className="pt-4">
        <DepartmentsManager cityServiceId={listing.id} initialDepartments={rows} revalidatePaths={[currentPath]} />
      </div>
    </div>
  );
}
