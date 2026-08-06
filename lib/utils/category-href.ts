import type { Category } from "@/types";
import type { Locale } from "@/lib/i18n/config";

/**
 * Where a category's listings actually live, per its `target_table`. The 5
 * core verticals + City Services each have their own dedicated route;
 * every `services`-vertical (long-tail) category nests under /services/[slug]
 * — see lib/utils/service-categories.ts serviceHref for why.
 */
export function categoryHref(locale: string, category: Category): string {
  switch (category.targetTable) {
    case "hotels":
      return `/${locale}/hotels`;
    case "restaurants":
      return `/${locale}/restaurants`;
    case "cafes":
      return `/${locale}/cafes`;
    case "attractions":
      return `/${locale}/attractions`;
    case "events":
      return `/${locale}/events`;
    case "city_services":
      return `/${locale}/city-services`;
    case "services":
      return `/${locale}/services/${category.slug}`;
  }
}

/** A category's display name in the request locale, falling back to the
 * default (English) name when no translation was entered for it in admin —
 * never a next-intl key, since admin-created categories have none. */
export function categoryDisplayName(category: Category, locale: Locale): string {
  if (locale === "ar") return category.nameAr || category.name;
  if (locale === "so") return category.nameSo || category.name;
  return category.name;
}
