import { PackagePlus, PackageCheck, ShieldCheck, Truck, Wrench, HardHat, type LucideIcon } from "lucide-react";
import type { Service } from "@/types";

export type ElectronicsBusinessType = NonNullable<Service["electronicsBusinessType"]>;

export const ELECTRONICS_BUSINESS_TYPE_ORDER: ElectronicsBusinessType[] = [
  "electronics_store",
  "mobile_phone_store",
  "computer_store",
  "appliance_store",
  "accessories_store",
  "repair_center",
  "camera_store",
  "gaming_store",
  "home_electronics",
  "other",
];

export const ELECTRONICS_BUSINESS_TYPE_LABELS: Record<ElectronicsBusinessType, { en: string; ar: string; so: string }> = {
  electronics_store: { en: "Electronics Store", ar: "متجر إلكترونيات", so: "Dukaanka Elektaroonigga" },
  mobile_phone_store: { en: "Mobile Phone Store", ar: "متجر هواتف محمولة", so: "Dukaanka Telefoonada Gacanta" },
  computer_store: { en: "Computer Store", ar: "متجر حواسيب", so: "Dukaanka Kombiyuutarada" },
  appliance_store: { en: "Appliance Store", ar: "متجر أجهزة منزلية", so: "Dukaanka Qalabka Guriga" },
  accessories_store: { en: "Accessories Store", ar: "متجر إكسسوارات", so: "Dukaanka Alaabta Dheeriga ah" },
  repair_center: { en: "Repair Center", ar: "مركز صيانة", so: "Xarunta Dayactirka" },
  camera_store: { en: "Camera Store", ar: "متجر كاميرات", so: "Dukaanka Kaameradaha" },
  gaming_store: { en: "Gaming Store", ar: "متجر ألعاب", so: "Dukaanka Ciyaaraha" },
  home_electronics: { en: "Home Electronics", ar: "إلكترونيات منزلية", so: "Elektaroonigga Guriga" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function electronicsBusinessTypeLabel(type: ElectronicsBusinessType | undefined, locale: string): string | undefined {
  if (!type) return undefined;
  const entry = ELECTRONICS_BUSINESS_TYPE_LABELS[type];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

/** Each code maps 1:1 to its own dedicated boolean column on `services`
 * (sells_new, sells_used, warranty_available, ...). */
export const ELECTRONICS_FEATURE_ORDER = [
  "sells_new",
  "sells_used",
  "warranty_available",
  "electronics_delivery_available",
  "electronics_repair_available",
  "installation_available",
] as const;

export type ElectronicsFeatureCode = (typeof ELECTRONICS_FEATURE_ORDER)[number];

export const ELECTRONICS_FEATURE_ICON: Record<ElectronicsFeatureCode, LucideIcon> = {
  sells_new: PackagePlus,
  sells_used: PackageCheck,
  warranty_available: ShieldCheck,
  electronics_delivery_available: Truck,
  electronics_repair_available: Wrench,
  installation_available: HardHat,
};

export const ELECTRONICS_FEATURE_LABELS: Record<ElectronicsFeatureCode, { en: string; ar: string; so: string }> = {
  sells_new: { en: "New Products", ar: "منتجات جديدة", so: "Alaabo Cusub" },
  sells_used: { en: "Used Products", ar: "منتجات مستعملة", so: "Alaabo la Isticmaalay" },
  warranty_available: { en: "Warranty Available", ar: "ضمان متاح", so: "Dammaanad ayaa la heli karaa" },
  electronics_delivery_available: { en: "Delivery Available", ar: "التوصيل متاح", so: "Gaarsiin ayaa la heli karaa" },
  electronics_repair_available: { en: "Repair Available", ar: "الإصلاح متاح", so: "Dayactir ayaa la heli karaa" },
  installation_available: { en: "Installation Available", ar: "التركيب متاح", so: "Rakibid ayaa la heli karaa" },
};

export function electronicsFeatureLabel(code: ElectronicsFeatureCode, locale: string): string {
  const entry = ELECTRONICS_FEATURE_LABELS[code];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}

/** Suggested "services" chips for the shared `services` text[] column. */
export const ELECTRONICS_SERVICE_SUGGESTIONS: { en: string; ar: string; so: string }[] = [
  { en: "New Electronics", ar: "إلكترونيات جديدة", so: "Elektarooniga Cusub" },
  { en: "Used Electronics", ar: "إلكترونيات مستعملة", so: "Elektarooniga la Isticmaalay" },
  { en: "Mobile Phones", ar: "هواتف محمولة", so: "Telefoonada Gacanta" },
  { en: "Laptops", ar: "أجهزة كمبيوتر محمولة", so: "Laptopyada" },
  { en: "Computers", ar: "أجهزة كمبيوتر", so: "Kombiyuutarada" },
  { en: "TVs", ar: "أجهزة تلفزيون", so: "Telefishinada" },
  { en: "Cameras", ar: "كاميرات", so: "Kaameradaha" },
  { en: "Gaming Consoles", ar: "أجهزة ألعاب", so: "Qalabka Ciyaaraha" },
  { en: "Accessories", ar: "إكسسوارات", so: "Alaabta Dheeriga ah" },
  { en: "Home Appliances", ar: "أجهزة منزلية", so: "Qalabka Guriga" },
  { en: "Electronics Repair", ar: "إصلاح الإلكترونيات", so: "Dayactirka Elektaroonigga" },
  { en: "Phone Repair", ar: "إصلاح الهواتف", so: "Dayactirka Telefoonada" },
  { en: "Computer Repair", ar: "إصلاح الحواسيب", so: "Dayactirka Kombiyuutarada" },
  { en: "Delivery", ar: "توصيل", so: "Gaarsiin" },
  { en: "Installation", ar: "تركيب", so: "Rakibid" },
  { en: "Maintenance", ar: "صيانة", so: "Dayactir" },
];

/** Fixed-vocabulary "Payment Options" multi-select, stored in the
 * `payment_options` text[] column. */
export const PAYMENT_OPTION_ORDER = ["cash", "card", "mobile_money", "installment", "other"] as const;

export type PaymentOption = (typeof PAYMENT_OPTION_ORDER)[number];

export const PAYMENT_OPTION_LABELS: Record<PaymentOption, { en: string; ar: string; so: string }> = {
  cash: { en: "Cash", ar: "نقدًا", so: "Cash" },
  card: { en: "Card Payment", ar: "الدفع بالبطاقة", so: "Kaadhka" },
  mobile_money: { en: "Mobile Money (e.g. ZAAD/eDahab)", ar: "الدفع عبر الهاتف (مثل زاد/إي ظهب)", so: "Lacagta Mobilka (sida ZAAD/eDahab)" },
  installment: { en: "Installment Plans", ar: "خطط تقسيط", so: "Qeyb-qeybin (Bixin kala qaybsan)" },
  other: { en: "Other", ar: "أخرى", so: "Kale" },
};

export function paymentOptionLabel(code: PaymentOption, locale: string): string {
  const entry = PAYMENT_OPTION_LABELS[code];
  return (locale === "ar" && entry.ar) || (locale === "so" && entry.so) || entry.en;
}
