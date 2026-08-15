import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getActiveListing } from "@/lib/data/business";
import { createClient } from "@/lib/supabase/server";
import { mapDoctor, mapDepartment } from "@/lib/data/mappers";
import { DoctorsManager, type DoctorManagerRow } from "@/components/business/doctors-manager";
import type { DepartmentManagerRow } from "@/components/business/departments-manager";
import { isMedicalAppointmentCategory } from "@/lib/utils/appointment-domain";

export const metadata: Metadata = { title: "Doctors — Dashboard", robots: { index: false } };

export default async function DoctorsPage({ params: { locale } }: { params: { locale: Locale } }) {
  const currentPath = `/${locale}/business/doctors`;
  const listing = await getActiveListing(locale, currentPath);
  if (!listing) return null;
  // redirect() rather than notFound() — see the comment in
  // app/[locale]/city-services/[slug]/book/page.tsx for why.
  if (!listing.supportsAppointments) redirect(`/${locale}/business`);
  const isMedical = isMedicalAppointmentCategory(listing.categorySlug);

  const t = await getTranslations({ locale, namespace: "appointments" });
  const supabase = await createClient();
  const [{ data: doctorData }, { data: departmentData }] = await Promise.all([
    supabase.from("doctors").select("*").eq("city_service_id", listing.id).order("sort_order", { ascending: true }),
    supabase.from("departments").select("*").eq("city_service_id", listing.id).order("sort_order", { ascending: true }),
  ]);

  const departments: DepartmentManagerRow[] = (departmentData ?? []).map((row) => {
    const d = mapDepartment(row);
    return { id: d.id, name: d.name, nameAr: d.nameAr, nameSo: d.nameSo, sortOrder: d.sortOrder };
  });

  const doctors: DoctorManagerRow[] = (doctorData ?? []).map((row) => {
    const doc = mapDoctor(row);
    return {
      id: doc.id,
      name: doc.name,
      photo: doc.photo,
      specialty: doc.specialty,
      specialtyAr: doc.specialtyAr,
      specialtySo: doc.specialtySo,
      bio: doc.bio,
      bioAr: doc.bioAr,
      bioSo: doc.bioSo,
      languages: doc.languages,
      workingHours: doc.workingHours,
      appointmentDurationMinutes: doc.appointmentDurationMinutes,
      isActive: doc.isActive,
      departmentId: doc.departmentId,
      sortOrder: doc.sortOrder,
    };
  });

  return (
    <div className="max-w-2xl space-y-2">
      <div>
        <h1 className="font-display text-2xl font-bold">{t(isMedical ? "navDoctors" : "staffLabel")}</h1>
        <p className="mt-1 text-sm text-ink/60 dark:text-sand/60">{t(isMedical ? "doctorsPageSubtitle" : "staffPageSubtitle")}</p>
      </div>
      <div className="pt-4">
        <DoctorsManager
          cityServiceId={listing.id}
          initialDoctors={doctors}
          departments={departments}
          revalidatePaths={[currentPath]}
          isMedical={isMedical}
        />
      </div>
    </div>
  );
}
