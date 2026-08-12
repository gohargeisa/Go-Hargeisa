import { getTranslations } from "next-intl/server";
import { Check, X } from "lucide-react";
import type { Service } from "@/types";
import type { Locale } from "@/lib/i18n/config";
import { apartmentTypeLabel, petPolicyLabel, APARTMENT_FEATURE_ORDER, apartmentFeatureLabel } from "@/lib/config/apartment-attributes";
import {
  propertyTypeLabel,
  listingPurposeLabel,
  propertyConditionLabel,
  ownershipStatusLabel,
  priceCurrencyLabel,
  REAL_ESTATE_FEATURE_ORDER,
  realEstateFeatureLabel,
} from "@/lib/config/real-estate-attributes";
import { electronicsBusinessTypeLabel, ELECTRONICS_FEATURE_ORDER, electronicsFeatureLabel } from "@/lib/config/electronics-attributes";
import { transportationTypeLabel, TRANSPORTATION_FEATURE_ORDER, transportationFeatureLabel } from "@/lib/config/transportation-attributes";

type Row = { label: string; value: React.ReactNode };

function boolCell(value: boolean | undefined): React.ReactNode | null {
  if (value === undefined) return null;
  return value ? <Check size={15} className="text-emerald-600" aria-hidden="true" /> : <X size={15} className="text-ink/40" aria-hidden="true" />;
}

/** Turns a feature-code checklist (e.g. APARTMENT_FEATURE_ORDER) plus the
 * boolean values actually set on the service into display rows — reuses
 * each category's own label function so no new translation keys are needed. */
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
 * Read-only "Details" grid for Apartments/Real Estate/Electronics/
 * Transportation's typed columns (see 20260812000001) — these categories
 * don't use `customFieldsSchema`/`CustomFieldsDisplay` (Real Estate's old
 * schema was retired in that same migration), so this is their equivalent
 * display, gated by `categorySlug`. Renders nothing for any other category
 * or when the listing has no values set.
 */
export async function ServiceTypedFieldsDisplay({
  service,
  categorySlug,
  locale,
}: {
  service: Service;
  categorySlug: string;
  locale: Locale;
}) {
  const t = await getTranslations({ locale, namespace: "joinRequest" });
  let rows: Row[] = [];

  if (categorySlug === "apartments") {
    rows = [
      { label: t("apartmentTypeLabel"), value: apartmentTypeLabel(service.apartmentType, locale) },
      { label: t("bedroomsLabel"), value: service.bedrooms },
      { label: t("bathroomsLabel"), value: service.bathrooms },
      { label: t("unitsCountLabel"), value: service.unitsCount },
      { label: t("floorNumberLabel"), value: service.floorNumber },
      { label: t("buildingFloorsLabel"), value: service.buildingFloors },
      { label: t("furnishedLabel"), value: boolCell(service.furnished) },
      { label: t("monthlyRentLabel"), value: service.monthlyRent },
      { label: t("dailyRentLabel"), value: service.dailyRent },
      { label: t("securityDepositLabel"), value: service.securityDeposit },
      { label: t("minStayNightsLabel"), value: service.minStayNights },
      { label: t("maxStayNightsLabel"), value: service.maxStayNights },
      { label: t("petPolicyLabel"), value: petPolicyLabel(service.petPolicy, locale) },
      ...featureRows(
        APARTMENT_FEATURE_ORDER,
        apartmentFeatureLabel,
        (code) =>
          ({
            parking_available: service.parkingAvailable,
            wifi_available: service.wifiAvailable,
            air_conditioning: service.airConditioning,
            kitchen_available: service.kitchenAvailable,
            electricity_included: service.electricityIncluded,
            water_included: service.waterIncluded,
            generator_available: service.generatorAvailable,
            security_available: service.securityAvailable,
            elevator_available: service.elevatorAvailable,
            swimming_pool: service.swimmingPool,
            laundry_available: service.laundryAvailable,
            family_friendly: service.familyFriendly,
          })[code],
        locale
      ),
    ];
  } else if (categorySlug === "real-estate") {
    rows = [
      { label: t("propertyTypeLabel"), value: propertyTypeLabel(service.propertyType, locale) },
      { label: t("listingPurposeLabel"), value: listingPurposeLabel(service.listingPurpose, locale) },
      { label: t("priceLabel"), value: service.price != null ? `${service.price} ${priceCurrencyLabel(service.priceCurrency, locale) ?? ""}`.trim() : undefined },
      { label: t("bedroomsLabel"), value: service.realEstateBedrooms },
      { label: t("bathroomsLabel"), value: service.realEstateBathrooms },
      { label: t("floorsCountLabel"), value: service.floorsCount },
      { label: t("yearBuiltLabel"), value: service.yearBuilt },
      { label: t("areaSqmLabel"), value: service.areaSqm },
      { label: t("landAreaSqmLabel"), value: service.landAreaSqm },
      { label: t("buildingAreaSqmLabel"), value: service.buildingAreaSqm },
      { label: t("propertyConditionLabel"), value: propertyConditionLabel(service.propertyCondition, locale) },
      { label: t("ownershipStatusLabel"), value: ownershipStatusLabel(service.ownershipStatus, locale) },
      ...featureRows(
        REAL_ESTATE_FEATURE_ORDER,
        realEstateFeatureLabel,
        (code) =>
          ({
            parking_available: service.realEstateParkingAvailable,
            furnished: service.realEstateFurnished,
            documents_available: service.documentsAvailable,
            viewing_available: service.viewingAvailable,
          })[code],
        locale
      ),
    ];
  } else if (categorySlug === "electronics") {
    rows = [
      { label: t("electronicsBusinessTypeLabel"), value: electronicsBusinessTypeLabel(service.electronicsBusinessType, locale) },
      { label: t("brandsAvailableLabel"), value: service.brandsAvailable && service.brandsAvailable.length > 0 ? service.brandsAvailable.join(", ") : undefined },
      ...featureRows(
        ELECTRONICS_FEATURE_ORDER,
        electronicsFeatureLabel,
        (code) =>
          ({
            sells_new: service.sellsNew,
            sells_used: service.sellsUsed,
            warranty_available: service.warrantyAvailable,
            electronics_delivery_available: service.electronicsDeliveryAvailable,
            electronics_repair_available: service.electronicsRepairAvailable,
            installation_available: service.installationAvailable,
          })[code],
        locale
      ),
    ];
  } else if (categorySlug === "transportation") {
    rows = [
      { label: t("transportationTypeLabel"), value: transportationTypeLabel(service.transportationType, locale) },
      { label: t("vehicleCountLabel"), value: service.vehicleCount },
      { label: t("passengerCapacityLabel"), value: service.passengerCapacity },
      ...featureRows(
        TRANSPORTATION_FEATURE_ORDER,
        transportationFeatureLabel,
        (code) =>
          ({
            driver_available: service.driverAvailable,
            airport_transfer_available: service.airportTransferAvailable,
            city_transfers_available: service.cityTransfersAvailable,
            intercity_transport_available: service.intercityTransportAvailable,
            rental_available: service.rentalAvailable,
            daily_rental_available: service.dailyRentalAvailable,
            weekly_rental_available: service.weeklyRentalAvailable,
            monthly_rental_available: service.monthlyRentalAvailable,
            delivery_service_available: service.deliveryServiceAvailable,
            cargo_service_available: service.cargoServiceAvailable,
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
