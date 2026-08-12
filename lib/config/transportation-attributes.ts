import { UserCheck, Plane, Building2, MapPinned, CalendarRange, CalendarDays, CalendarClock, Calendar, Truck, Package, type LucideIcon } from "lucide-react";
import type { Service } from "@/types";

export type TransportationType = NonNullable<Service["transportationType"]>;

export const TRANSPORTATION_TYPE_ORDER: TransportationType[] = [
  "taxi",
  "car_rental",
  "bus_service",
  "minibus",
  "private_driver",
  "airport_transfer",
  "transport_company",
  "truck_cargo",
  "motorcycle_transport",
  "delivery_transport",
  "other",
];

export const TRANSPORTATION_TYPE_LABELS: Record<TransportationType, { en: string; ar: string; so: string }> = {
  taxi: { en: "Taxi", ar: "سيارة أجرة", so: "Taksi" },
  car_rental: { en: "Car Rental", ar: "تأجير سيارات", so: "Kirada Baabuurta" },
  bus_service: { en: "Bus Service", ar: "خدمة الحافلات", so: "Adeegga Baska" },
  minibus: { en: "Minibus", ar: "حافلة صغيرة", so: "Bas Yar" },
  private_driver: { en: "Private Driver", ar: "سائق خاص", so: "Darawal Gaar ah" },
  airport_transfer: { en: "Airport Transfer", ar: "نقل من وإلى المطار", so: "Gaarsiinta Garoonka Diyaaradaha" },
  transport_company: { en: "Transport Company", ar: "شركة نقل", so: "Shirkad Gaadiid" },
  truck_cargo: { en: "Truck / Cargo Transport", ar: "شاحنة / نقل بضائع", so: "Gaadiidka Xamuulka" },
  motorcycle_transport: { en: "Motorcycle Transport", ar: "نقل بالدراجة النارية", so: "Gaadiidka Mooto" },
  delivery_transport: { en: "Delivery Transport", ar: "نقل التوصيل", so: "Gaadiidka Gaarsiinta" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function transportationTypeLabel(type: TransportationType | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = TRANSPORTATION_TYPE_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

/** Each code maps 1:1 to its own dedicated boolean column on `services`
 * (driver_available, airport_transfer_available, ...). */
export const TRANSPORTATION_FEATURE_ORDER = [
  "driver_available",
  "airport_transfer_available",
  "city_transfers_available",
  "intercity_transport_available",
  "rental_available",
  "daily_rental_available",
  "weekly_rental_available",
  "monthly_rental_available",
  "delivery_service_available",
  "cargo_service_available",
] as const;

export type TransportationFeatureCode = (typeof TRANSPORTATION_FEATURE_ORDER)[number];

export const TRANSPORTATION_FEATURE_ICON: Record<TransportationFeatureCode, LucideIcon> = {
  driver_available: UserCheck,
  airport_transfer_available: Plane,
  city_transfers_available: Building2,
  intercity_transport_available: MapPinned,
  rental_available: CalendarRange,
  daily_rental_available: CalendarDays,
  weekly_rental_available: CalendarClock,
  monthly_rental_available: Calendar,
  delivery_service_available: Truck,
  cargo_service_available: Package,
};

export const TRANSPORTATION_FEATURE_LABELS: Record<TransportationFeatureCode, { en: string; ar: string; so: string }> = {
  driver_available: { en: "Driver Available", ar: "سائق متاح", so: "Darawal ayaa la heli karaa" },
  airport_transfer_available: { en: "Airport Transfer", ar: "نقل من وإلى المطار", so: "Gaarsiinta Garoonka" },
  city_transfers_available: { en: "City Transfers", ar: "نقل داخل المدينة", so: "Gaadiidka Magaalada" },
  intercity_transport_available: { en: "Intercity Transport", ar: "نقل بين المدن", so: "Gaadiidka Magaalooyinka Dhexdooda" },
  rental_available: { en: "Rental Available", ar: "التأجير متاح", so: "Kiro ayaa la heli karaa" },
  daily_rental_available: { en: "Daily Rental", ar: "إيجار يومي", so: "Kiro Maalinle ah" },
  weekly_rental_available: { en: "Weekly Rental", ar: "إيجار أسبوعي", so: "Kiro Todobaadle ah" },
  monthly_rental_available: { en: "Monthly Rental", ar: "إيجار شهري", so: "Kiro Bille ah" },
  delivery_service_available: { en: "Delivery Service", ar: "خدمة التوصيل", so: "Adeegga Gaarsiinta" },
  cargo_service_available: { en: "Cargo Service", ar: "خدمة الشحن", so: "Adeegga Xamuulka" },
};

export function transportationFeatureLabel(code: TransportationFeatureCode, locale: string): string {
  const entry = TRANSPORTATION_FEATURE_LABELS[code];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

/** Suggested "services" chips for the shared `services` text[] column. */
export const TRANSPORTATION_SERVICE_SUGGESTIONS: { en: string; ar: string; so: string }[] = [
  { en: "Airport Pickup", ar: "استقبال من المطار", so: "Ka soo qaadista Garoonka" },
  { en: "Airport Drop-off", ar: "توصيل إلى المطار", so: "Geynta Garoonka" },
  { en: "City Transfer", ar: "نقل داخل المدينة", so: "Gaadiidka Magaalada" },
  { en: "Intercity Transfer", ar: "نقل بين المدن", so: "Gaadiidka Magaalooyinka Dhexdooda" },
  { en: "Car Rental", ar: "تأجير سيارات", so: "Kirada Baabuurta" },
  { en: "Driver Hire", ar: "استئجار سائق", so: "Kirada Darawal" },
  { en: "Cargo Transport", ar: "نقل البضائع", so: "Gaadiidka Xamuulka" },
  { en: "Delivery", ar: "توصيل", so: "Gaarsiin" },
  { en: "Private Transport", ar: "نقل خاص", so: "Gaadiid Gaar ah" },
];
