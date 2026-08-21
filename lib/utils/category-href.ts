import type { Category } from "@/types";
import type { Locale } from "@/lib/i18n/config";

/**
 * Where a category's listings actually live, per its `target_table`. The 5
 * core verticals + City Services each have their own dedicated route. The
 * generic `services` vertical (target_table='services') has been retired —
 * its categories are excluded from every public category list
 * (SERVICES_PUBLIC_ENABLED=false in lib/data/categories.ts), so this case
 * is unreachable from any current caller; it falls back to /city-services
 * rather than a deleted route, in case a future caller ever passes one of
 * these category rows through directly (they still exist in the database,
 * untouched — see lib/config/features.ts's SERVICES_PUBLIC_ENABLED comment).
 *
 * A real city_services sub-category (Hospitals, Pharmacies, ...) deep-links
 * straight to its own tab on /city-services via ?category=<slug> — see
 * CityServicesPageClient's initialCategorySlug prop. The single pinned
 * umbrella row (the "City Services" nav entry itself) keeps the plain,
 * unfiltered URL since it isn't a sub-category to filter by.
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
      // Only the single umbrella "City Services" row (slug === "city-services")
      // itself should resolve to the unfiltered page. Any other pinned
      // city_services row (e.g. Perfumes, promoted to its own top-level nav
      // entry via is_pinned=true) is still a real sub-category and must link
      // to its own filtered view, exactly like a non-pinned one does.
      return category.isPinned && category.slug === "city-services"
        ? `/${locale}/city-services`
        : `/${locale}/city-services?category=${category.slug}`;
    case "services":
      return `/${locale}/city-services`;
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
