import type { Product } from "@/types";

/** Same locale-resolution shape already used by mapCityService/mapEvent for
 * name/description — kept here since Product ships all three languages
 * separately (like every other listing) rather than pre-resolved. */
export function productLocalizedName(product: Product, locale: string): string {
  return (locale === "ar" && product.nameAr) || (locale === "so" && product.nameSo) || product.name;
}

export function productLocalizedDescription(product: Product, locale: string): string | undefined {
  return (locale === "ar" && product.descriptionAr) || (locale === "so" && product.descriptionSo) || product.description;
}
