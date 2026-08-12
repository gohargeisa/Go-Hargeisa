import { getTranslations } from "next-intl/server";
import { Check, X } from "lucide-react";
import type { CityService } from "@/types";
import type { Locale } from "@/lib/i18n/config";
import { hospitalTypeLabel, HOSPITAL_FACILITY_ORDER, hospitalFacilityLabel } from "@/lib/config/hospital-attributes";
import { pharmacyTypeLabel, PHARMACY_FEATURE_ORDER, pharmacyFeatureLabel } from "@/lib/config/pharmacy-attributes";

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

/**
 * Read-only "Details" grid for Hospital/Pharmacy's typed columns (see
 * 20260812000002_hospital_pharmacy_fields.sql), gated by `categorySlug`.
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
