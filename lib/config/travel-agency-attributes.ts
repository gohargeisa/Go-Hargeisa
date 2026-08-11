import {
  Plane,
  Hotel,
  Stamp,
  Package,
  Car,
  CarFront,
  Landmark,
  MapPin,
  Globe,
  Users,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import type { Service } from "@/types";

export type TravelAgencyType = NonNullable<Service["travelAgencyType"]>;

export const TRAVEL_AGENCY_TYPE_ORDER: TravelAgencyType[] = [
  "travel_agency",
  "tour_operator",
  "ticketing_office",
  "visa_services",
  "hajj_umrah_services",
  "local_tours",
  "international_tours",
  "other",
];

export const TRAVEL_AGENCY_TYPE_LABELS: Record<TravelAgencyType, { en: string; ar: string; so: string }> = {
  travel_agency: { en: "Travel Agency", ar: "وكالة سفر", so: "Wakaaladda Dalxiiska" },
  tour_operator: { en: "Tour Operator", ar: "منظم رحلات سياحية", so: "Habeeyaha Dalxiiska" },
  ticketing_office: { en: "Ticketing Office", ar: "مكتب تذاكر", so: "Xafiiska Tikidhada" },
  visa_services: { en: "Visa Services", ar: "خدمات التأشيرات", so: "Adeegyada Fiisaha" },
  hajj_umrah_services: { en: "Hajj & Umrah Services", ar: "خدمات الحج والعمرة", so: "Adeegyada Xajka iyo Cumrada" },
  local_tours: { en: "Local Tours", ar: "رحلات محلية", so: "Dalxiis Gudaha ah" },
  international_tours: { en: "International Tours", ar: "رحلات دولية", so: "Dalxiis Dibadda ah" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function travelAgencyTypeLabel(type: TravelAgencyType | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = TRAVEL_AGENCY_TYPE_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

/** Each code below maps 1:1 to its own dedicated boolean column on
 * `services` (flight_ticketing, hotel_booking, ...) — represented here as
 * one checklist for a clean UI, converted back to individual booleans only
 * at submission time. */
export const TRAVEL_SERVICE_ORDER = [
  "flight_ticketing",
  "hotel_booking",
  "visa_assistance",
  "tour_packages",
  "airport_transfers",
  "car_rental_assistance",
  "hajj_umrah_services",
  "local_tours",
  "international_tours",
  "group_tours",
  "travel_insurance_assistance",
] as const;

export type TravelServiceCode = (typeof TRAVEL_SERVICE_ORDER)[number];

export const TRAVEL_SERVICE_ICON: Record<TravelServiceCode, LucideIcon> = {
  flight_ticketing: Plane,
  hotel_booking: Hotel,
  visa_assistance: Stamp,
  tour_packages: Package,
  airport_transfers: CarFront,
  car_rental_assistance: Car,
  hajj_umrah_services: Landmark,
  local_tours: MapPin,
  international_tours: Globe,
  group_tours: Users,
  travel_insurance_assistance: ShieldCheck,
};

export const TRAVEL_SERVICE_LABELS: Record<TravelServiceCode, { en: string; ar: string; so: string }> = {
  flight_ticketing: { en: "Flight Ticketing", ar: "حجز تذاكر الطيران", so: "Tikidhada Diyaaradda" },
  hotel_booking: { en: "Hotel Booking", ar: "حجز الفنادق", so: "Boos-dhigashada Hudheelka" },
  visa_assistance: { en: "Visa Assistance", ar: "مساعدة في التأشيرة", so: "Kaalmada Fiisaha" },
  tour_packages: { en: "Tour Packages", ar: "باقات سياحية", so: "Xirmooyinka Dalxiiska" },
  airport_transfers: { en: "Airport Transfers", ar: "خدمة النقل من وإلى المطار", so: "Gaadiidka Garoonka Diyaaradaha" },
  car_rental_assistance: { en: "Car Rental Assistance", ar: "مساعدة في تأجير السيارات", so: "Kaalmada Kirada Baabuurta" },
  hajj_umrah_services: { en: "Hajj & Umrah Services", ar: "خدمات الحج والعمرة", so: "Adeegyada Xajka iyo Cumrada" },
  local_tours: { en: "Local Tours", ar: "رحلات محلية", so: "Dalxiis Gudaha ah" },
  international_tours: { en: "International Tours", ar: "رحلات دولية", so: "Dalxiis Dibadda ah" },
  group_tours: { en: "Group Tours", ar: "رحلات جماعية", so: "Dalxiis Kooxeed" },
  travel_insurance_assistance: { en: "Travel Insurance Assistance", ar: "مساعدة في تأمين السفر", so: "Kaalmada Caymiska Safarka" },
};

export function travelServiceLabel(code: TravelServiceCode, locale: string): string {
  const entry = TRAVEL_SERVICE_LABELS[code];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}
