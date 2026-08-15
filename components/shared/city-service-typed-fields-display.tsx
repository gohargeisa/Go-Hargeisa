import { getTranslations } from "next-intl/server";
import { Check, X } from "lucide-react";
import type { CityService } from "@/types";
import type { Locale } from "@/lib/i18n/config";
import { hospitalTypeLabel, HOSPITAL_FACILITY_ORDER, hospitalFacilityLabel } from "@/lib/config/hospital-attributes";
import { pharmacyTypeLabel, PHARMACY_FEATURE_ORDER, pharmacyFeatureLabel } from "@/lib/config/pharmacy-attributes";
import { clinicTypeLabel } from "@/lib/config/clinic-attributes";
import { salonTypeLabel, shopTypeLabel } from "@/lib/config/salon-attributes";
import { storeTypeLabel } from "@/lib/config/retail-store-attributes";
import {
  schoolTypeLabel,
  curriculumLabel,
  educationLevelLabel,
  universityTypeLabel,
  degreeLevelLabel,
  facultyLabel,
  educationFacilityLabel,
  SCHOOL_FACILITY_CODES,
  UNIVERSITY_FACILITY_CODES,
  type EducationLevel,
  type DegreeLevel,
  type Faculty,
} from "@/lib/config/education-attributes";

type Row = { label: string; value: React.ReactNode };

function boolCell(value: boolean | undefined): React.ReactNode | null {
  if (value === undefined) return null;
  return value ? <Check size={15} className="text-emerald-600" aria-hidden="true" /> : <X size={15} className="text-ink/40" aria-hidden="true" />;
}

function featureRows<Code extends string>(
  order: readonly Code[],
  labelFn: (code: Code, locale: string) => string,
  isSet: (code: Code) => boolean | undefined,
  locale: string
): Row[] {
  return order
    .map((code) => ({ label: labelFn(code, locale), value: boolCell(isSet(code)) }))
    .filter((row): row is Row => row.value !== null);
}

function codedList<Code extends string>(codes: string[] | undefined, labelFn: (code: Code, locale: string) => string | undefined, locale: string): string | undefined {
  if (!codes || codes.length === 0) return undefined;
  const labels = codes.map((c) => labelFn(c as Code, locale)).filter((l): l is string => !!l);
  return labels.length > 0 ? labels.join(", ") : undefined;
}

function textList(values: string[] | undefined): string | undefined {
  return values && values.length > 0 ? values.join(", ") : undefined;
}

/**
 * Read-only "Details" grid for a category's typed columns (Hospital,
 * Pharmacy, Clinic, School, University, Beauty Salon, Men's Barbershop,
 * Perfume Shop, Cosmetics & Women's Beauty), gated by `categorySlug`.
 * Renders nothing for any other category or when the listing has no values
 * set. Doctors/Departments/Appointments are shown by DoctorsSection
 * elsewhere on this page and are intentionally not duplicated here.
 */
export async function CityServiceTypedFieldsDisplay({
  service,
  categorySlug,
  locale,
}: {
  service: CityService;
  categorySlug: string;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: "joinRequest" });
  let rows: Row[] = [];

  if (categorySlug === "hospital") {
    rows = [
      { label: t("hospitalTypeLabel"), value: hospitalTypeLabel(service.hospitalType, locale) },
      { label: t("bedsCountLabel"), value: service.bedsCount },
      { label: t("doctorsCountLabel"), value: service.doctorsCount },
      { label: t("nursesCountLabel"), value: service.nursesCount },
      { label: t("departmentsCountLabel"), value: service.departmentsCount },
      { label: t("operatingRoomsCountLabel"), value: service.operatingRoomsCount },
      { label: t("visitingHoursLabel"), value: service.visitingHours },
      { label: t("insuranceAcceptedLabel"), value: service.insuranceAccepted && service.insuranceAccepted.length > 0 ? service.insuranceAccepted.join(", ") : undefined },
      { label: t("languagesSpokenLabel"), value: service.languages && service.languages.length > 0 ? service.languages.join(", ") : undefined },
      ...featureRows(
        HOSPITAL_FACILITY_ORDER,
        hospitalFacilityLabel,
        (code) =>
          ({
            emergency_department: service.emergencyDepartment,
            icu_available: service.icuAvailable,
            pharmacy_onsite: service.pharmacyOnsite,
            laboratory_onsite: service.laboratoryOnsite,
            radiology_onsite: service.radiologyOnsite,
            ambulance_available: service.ambulanceAvailable,
            maternity_department: service.maternityDepartment,
            pediatric_department: service.pediatricDepartment,
          })[code],
        locale
      ),
    ];
  } else if (categorySlug === "pharmacy") {
    rows = [
      { label: t("pharmacyTypeLabel"), value: pharmacyTypeLabel(service.pharmacyType, locale) },
      { label: t("emergencyContactLabel"), value: service.pharmacyEmergencyContact },
      { label: t("insuranceAcceptedLabel"), value: service.insuranceAccepted && service.insuranceAccepted.length > 0 ? service.insuranceAccepted.join(", ") : undefined },
      { label: t("is24HoursLabel"), value: boolCell(service.is24Hours) },
      ...featureRows(
        PHARMACY_FEATURE_ORDER,
        pharmacyFeatureLabel,
        (code) =>
          ({
            pharmacy_delivery_available: service.pharmacyDeliveryAvailable,
            prescription_required: service.prescriptionRequired,
            home_delivery: service.homeDelivery,
          })[code],
        locale
      ),
    ];
  } else if (categorySlug === "clinic") {
    rows = [
      { label: t("clinicTypeLabel"), value: clinicTypeLabel(service.clinicType, locale) },
      { label: t("numberOfTreatmentRoomsLabel"), value: service.numberOfTreatmentRooms },
      { label: t("insuranceAcceptedLabel"), value: textList(service.insuranceAccepted) },
      { label: t("languagesSpokenLabel"), value: textList(service.languages) },
    ];
  } else if (categorySlug === "school") {
    rows = [
      { label: t("schoolTypeLabel"), value: schoolTypeLabel(service.schoolType, locale) },
      { label: t("curriculumLabel"), value: curriculumLabel(service.curriculum, locale) },
      { label: t("educationLevelsLabel"), value: codedList<EducationLevel>(service.educationLevels, educationLevelLabel, locale) },
      { label: t("ageRangeGradesLabel"), value: service.ageRangeGrades },
      { label: t("numberOfClassroomsLabel"), value: service.numberOfClassrooms },
      { label: t("numberOfStudentsLabel"), value: service.numberOfStudents },
      { label: t("numberOfTeachersLabel"), value: service.numberOfTeachers },
      { label: t("languagesOfInstructionLabel"), value: textList(service.languages) },
      { label: t("admissionsOpenLabel"), value: boolCell(service.admissionsOpen) },
      ...featureRows(SCHOOL_FACILITY_CODES, educationFacilityLabel, (code) => service.educationFacilities?.includes(code), locale),
    ];
  } else if (categorySlug === "university") {
    rows = [
      { label: t("universityTypeLabel"), value: universityTypeLabel(service.universityType, locale) },
      { label: t("degreeLevelsLabel"), value: codedList<DegreeLevel>(service.degreeLevels, degreeLevelLabel, locale) },
      { label: t("facultiesOfferedLabel"), value: codedList<Faculty>(service.facultiesOffered, facultyLabel, locale) },
      { label: t("numberOfBuildingsLabel"), value: service.numberOfBuildings },
      { label: t("numberOfStudentsLabel"), value: service.numberOfStudents },
      { label: t("numberOfFacultyLabel"), value: service.numberOfTeachers },
      { label: t("languagesOfInstructionLabel"), value: textList(service.languages) },
      { label: t("admissionsOpenLabel"), value: boolCell(service.admissionsOpen) },
      ...featureRows(UNIVERSITY_FACILITY_CODES, educationFacilityLabel, (code) => service.educationFacilities?.includes(code), locale),
    ];
  } else if (categorySlug === "beauty-salon") {
    rows = [
      { label: t("salonTypeLabel"), value: salonTypeLabel(service.salonType, locale) },
      { label: t("numberOfStylistsLabel"), value: service.staffCount },
      { label: t("walkInsAcceptedLabel"), value: boolCell(service.walkInsAccepted) },
      { label: t("homeServiceAvailableLabel"), value: boolCell(service.homeServiceAvailable) },
    ];
  } else if (categorySlug === "men-barbershop") {
    rows = [
      { label: t("shopTypeLabel"), value: shopTypeLabel(service.shopType, locale) },
      { label: t("numberOfBarbersLabel"), value: service.staffCount },
      { label: t("walkInsAcceptedLabel"), value: boolCell(service.walkInsAccepted) },
      { label: t("homeServiceAvailableLabel"), value: boolCell(service.homeServiceAvailable) },
    ];
  } else if (categorySlug === "perfume-shop" || categorySlug === "cosmetics-beauty") {
    rows = [
      { label: t("storeTypeLabel"), value: storeTypeLabel(service.storeType, locale) },
      { label: t("brandsCarriedLabel"), value: textList(service.brands) },
    ];
  }

  const filtered = rows.filter((r) => r.value !== undefined && r.value !== null && r.value !== "");
  if (filtered.length === 0) return null;

  return (
    <dl className="grid gap-4 rounded-xl3 border border-ink/8 bg-white p-5 dark:border-white/10 dark:bg-white/[0.03] sm:grid-cols-2">
      {filtered.map((row, i) => (
        <div key={`${row.label}-${i}`}>
          <dt className="text-xs font-semibold uppercase tracking-wide text-ink/45 dark:text-sand/45">{row.label}</dt>
          <dd className="mt-1 text-sm text-ink dark:text-white">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}
