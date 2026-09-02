import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import type { Locale } from "@/lib/i18n/config";
import { getCityServiceBySlug } from "@/lib/data/city-services";
import { getCategoryById } from "@/lib/data/categories";
import { getDoctorsForListing, getDepartmentsForListing } from "@/lib/data/doctors";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { AppointmentBookingForm } from "@/components/shared/appointment-booking-form";
import { isMedicalAppointmentCategory } from "@/lib/utils/appointment-domain";

export async function generateMetadata({
  params: { locale, slug },
}: {
  params: { locale: Locale; slug: string };
}): Promise<Metadata> {
  const service = await getCityServiceBySlug(slug, locale);
  if (!service) return {};
  return { title: `Book an Appointment — ${service.name} — Go Hargeisa`, robots: { index: false } };
}

export default async function CityServiceBookingPage({
  params: { locale, slug },
  searchParams,
}: {
  params: { locale: Locale; slug: string };
  searchParams: { doctor?: string };
}) {
  const service = await getCityServiceBySlug(slug, locale);
  if (!service) notFound();

  const category = await getCategoryById(service.categoryId);
  // Deliberately redirect rather than notFound() here: this project's
  // Next.js 14.2.35 App Router build was observed (via explicit server-side
  // logging during Phase 4H validation) to correctly invoke notFound() and
  // halt this function's execution, yet still stream back this page's own
  // later JSX instead of a real 404 for a small number of requests — a
  // rendering-pipeline quirk specific to calling notFound() a second time
  // after an additional awaited data fetch, not a logic bug in this guard.
  // redirect() has no such issue (proven by app/[locale]/hotels/[slug]/book/page.tsx's
  // identical `if (...) redirect(...)` pattern) and gives a strictly better
  // outcome anyway: a category-ineligible visitor lands on the listing's own
  // real page instead of a 404.
  if (!category || !category.supportsAppointments) redirect(`/${locale}/city-services/${service.slug}`);

  const tNav = await getTranslations("nav");
  const t = await getTranslations({ locale, namespace: "appointments" });

  const [doctors, departments] = await Promise.all([
    getDoctorsForListing(service.id),
    getDepartmentsForListing(service.id),
  ]);

  // "dental-clinic" was the old standalone category slug before Dental was
  // folded into Clinics as one clinicType value — real dental listings today
  // are category.slug === "clinic" with clinicType === "dental".
  const isDental = category.slug === "dental-clinic" || (category.slug === "clinic" && service.clinicType === "dental");
  // Hijama clinics use the generic "appointment / staff" vocabulary, not the
  // medical "doctor / patient" one — see the same guard in the detail page.
  const isHijamaClinic = category.slug === "clinic" && service.clinicType === "hijama";
  const isMedical = isMedicalAppointmentCategory(category.slug) && !isHijamaClinic;
  const bookLabel = isMedical ? (isDental ? t("bookADentist") : t("bookADoctor")) : t("bookAppointmentButton");

  return (
    <>
      <Breadcrumbs
        items={[
          { label: tNav("cityServices"), href: `/${locale}/city-services` },
          { label: service.name, href: `/${locale}/city-services/${service.slug}` },
          { label: bookLabel, href: `/${locale}/city-services/${service.slug}/book` },
        ]}
      />

      <section className="container-px mx-auto pb-16 pt-4 sm:pt-6">
        <div className="mx-auto max-w-2xl overflow-hidden rounded-3xl border border-ink/8 bg-white shadow-premium dark:border-white/10 dark:bg-ink">
          {doctors.length === 0 ? (
            <p className="p-10 text-center text-sm text-ink/50 dark:text-sand/50">{t(isMedical ? "noDoctorsYet" : "noStaffYetPublic")}</p>
          ) : (
            <AppointmentBookingForm
              cityServiceName={service.name}
              doctors={doctors}
              departments={departments}
              preselectedDoctorId={searchParams.doctor}
              locale={locale}
              isDental={isDental}
              isMedical={isMedical}
            />
          )}
        </div>
      </section>
    </>
  );
}
