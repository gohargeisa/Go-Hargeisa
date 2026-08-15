import Image from "next/image";
import Link from "next/link";
import { Stethoscope, UserCog, Languages } from "lucide-react";
import type { Doctor, Department } from "@/types";

function doctorLocalizedField(value: string | undefined, valueAr: string | undefined, valueSo: string | undefined, locale: string): string | undefined {
  return (locale === "ar" && valueAr) || (locale === "so" && valueSo) || value;
}

/**
 * Public doctor roster for a Hospital/Clinic/Dental Clinic listing, grouped
 * by department when the listing has any (per the spec's "select
 * department/specialty -> view available doctors" flow) — flat list
 * otherwise. Each card links straight into the booking flow with the doctor
 * preselected, avoiding a redundant re-selection step.
 */
export function DoctorsSection({
  doctors,
  departments,
  locale,
  bookHref,
  bookLabel,
  isMedical = true,
}: {
  doctors: Doctor[];
  departments: Department[];
  locale: string;
  bookHref: (doctorId: string) => string;
  bookLabel: string;
  isMedical?: boolean;
}) {
  if (doctors.length === 0) return null;

  const groups =
    departments.length > 0
      ? departments
          .map((d) => ({ department: d, items: doctors.filter((doc) => doc.departmentId === d.id) }))
          .filter((g) => g.items.length > 0)
      : [{ department: null, items: doctors }];
  const ungrouped = departments.length > 0 ? doctors.filter((doc) => !doc.departmentId) : [];

  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <div key={group.department?.id ?? "all"}>
          {group.department && (
            <h3 className="mb-3 font-display text-lg font-semibold">
              {doctorLocalizedField(group.department.name, group.department.nameAr, group.department.nameSo, locale)}
            </h3>
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            {group.items.map((doctor) => (
              <DoctorCard key={doctor.id} doctor={doctor} locale={locale} bookHref={bookHref(doctor.id)} bookLabel={bookLabel} isMedical={isMedical} />
            ))}
          </div>
        </div>
      ))}

      {ungrouped.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {ungrouped.map((doctor) => (
            <DoctorCard key={doctor.id} doctor={doctor} locale={locale} bookHref={bookHref(doctor.id)} bookLabel={bookLabel} isMedical={isMedical} />
          ))}
        </div>
      )}
    </div>
  );
}

function DoctorCard({
  doctor,
  locale,
  bookHref,
  bookLabel,
  isMedical = true,
}: {
  doctor: Doctor;
  locale: string;
  bookHref: string;
  bookLabel: string;
  isMedical?: boolean;
}) {
  const specialty = doctorLocalizedField(doctor.specialty, doctor.specialtyAr, doctor.specialtySo, locale);
  const bio = doctorLocalizedField(doctor.bio, doctor.bioAr, doctor.bioSo, locale);
  const FallbackIcon = isMedical ? Stethoscope : UserCog;

  return (
    <div className="flex gap-4 rounded-xl2 border border-ink/8 p-4 dark:border-white/10">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full bg-ink/5 dark:bg-white/5">
        {doctor.photo ? (
          <Image src={doctor.photo} alt={doctor.name} fill sizes="64px" className="object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <FallbackIcon size={22} className="text-ink/25" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate font-semibold">{doctor.name}</p>
        {specialty && <p className="text-sm text-primary-700 dark:text-primary-400">{specialty}</p>}
        {bio && <p className="mt-1 line-clamp-2 text-xs text-ink/60 dark:text-sand/60">{bio}</p>}
        {doctor.languages.length > 0 && (
          <p className="mt-1 flex items-center gap-1 text-xs text-ink/45 dark:text-sand/45">
            <Languages size={12} aria-hidden="true" /> {doctor.languages.join(", ")}
          </p>
        )}
        <Link
          href={bookHref}
          className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-primary-700"
        >
          {bookLabel}
        </Link>
      </div>
    </div>
  );
}
