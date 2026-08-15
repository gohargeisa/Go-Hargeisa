import type { Category, CategoryTargetTable } from "@/types";
import type { Locale } from "@/lib/i18n/config";

/** Neither "Education" nor "Health" nor "Automotive" nor "Perfumes &
 * Cosmetics" is a `categories` row — every member slug stays its own real
 * category/business in the database exactly as before, and every existing
 * business keeps the specific category it was created with. This purely
 * groups members for display/selection (one parent group instead of several
 * flat siblings), so a member category (e.g. "English Language Institutes")
 * never leaks as its own flat entry anywhere in the site's navigation OR
 * business-registration UI. Single source of truth reused by /city-services
 * (components/pages/city-services-page-client.tsx), the site "More" nav menu
 * (via applyCityServiceCategoryGroups below), the public /join registration
 * form, and the admin city-service create/edit forms (both via
 * buildCategoryGroupOptions + components/shared/grouped-category-select.tsx)
 * — no separate, divergent grouping system anywhere. Add another entry here
 * if a future grouping is needed; no other code needs to change. */
export type MergedCategoryKey = "health" | "education" | "beauty" | "perfumes-cosmetics" | "automotive";

export interface MergedCategoryConfig {
  key: MergedCategoryKey;
  memberSlugs: string[];
  icon: string;
  color: string;
  name: string;
  nameAr: string;
  nameSo: string;
}

export const MERGED_CATEGORIES: MergedCategoryConfig[] = [
  {
    key: "health",
    memberSlugs: ["hospital", "clinic", "pharmacy"],
    icon: "HeartPulse",
    color: "#DC2626",
    name: "Health",
    nameAr: "الصحة",
    nameSo: "Caafimaadka",
  },
  {
    key: "education",
    memberSlugs: ["school", "university", "institute", "language-institute"],
    icon: "GraduationCap",
    color: "#16A34A",
    name: "Education",
    nameAr: "التعليم",
    nameSo: "Waxbarashada",
  },
  {
    key: "beauty",
    memberSlugs: ["beauty-salon", "men-barbershop"],
    icon: "Scissors",
    color: "#9333EA",
    name: "Beauty & Care",
    nameAr: "الجمال والعناية",
    nameSo: "Qurux iyo Daryeel",
  },
  {
    key: "perfumes-cosmetics",
    memberSlugs: ["perfume-shop", "cosmetics-beauty"],
    icon: "Sparkles",
    color: "#DB2777",
    name: "Perfumes & Cosmetics",
    nameAr: "العطور ومستحضرات التجميل",
    nameSo: "Cadarka iyo Alaabta Qurxinta",
  },
  {
    key: "automotive",
    memberSlugs: ["car-rental", "car-wash", "auto-repair"],
    icon: "Car",
    color: "#EA580C",
    name: "Automotive",
    nameAr: "السيارات",
    nameSo: "Baabuurta",
  },
];

export const ALL_MERGED_MEMBER_SLUGS = MERGED_CATEGORIES.flatMap((m) => m.memberSlugs);

export function mergedCategoryOf(key: string): MergedCategoryConfig | undefined {
  return MERGED_CATEGORIES.find((m) => m.key === key);
}

export function mergedCategoryDisplayName(merged: MergedCategoryConfig, locale: Locale): string {
  if (locale === "ar") return merged.nameAr;
  if (locale === "so") return merged.nameSo;
  return merged.name;
}

/** Collapses city_services member categories (Hospitals+Clinics+Pharmacies,
 * Schools+Universities+Institutes+English Language Institutes, ...) into
 * one synthetic merged Category entry each, mirroring exactly what
 * /city-services already shows — so a caller like the "More" nav menu never
 * has to special-case individual member slugs itself. A merged entry only
 * appears when at least one of its members has a real published listing
 * (businessCount > 0); its own businessCount is the sum of its members'. */
export function applyCityServiceCategoryGroups(categories: Category[]): Category[] {
  const memberSlugs = new Set(ALL_MERGED_MEMBER_SLUGS);
  const kept = categories.filter((c) => !(c.targetTable === "city_services" && memberSlugs.has(c.slug)));

  const now = new Date().toISOString();
  for (const merged of MERGED_CATEGORIES) {
    const members = categories.filter((c) => c.targetTable === "city_services" && merged.memberSlugs.includes(c.slug));
    if (members.length === 0) continue;
    const businessCount = members.reduce((sum, m) => sum + (m.businessCount ?? 0), 0);
    if (businessCount === 0) continue;

    kept.push({
      id: `merged-${merged.key}`,
      slug: merged.key,
      name: merged.name,
      nameAr: merged.nameAr,
      nameSo: merged.nameSo,
      icon: merged.icon,
      color: merged.color,
      targetTable: "city_services" as CategoryTargetTable,
      isActive: true,
      isPinned: false,
      sortOrder: Math.min(...members.map((m) => m.sortOrder)),
      searchKeywords: [],
      customFieldsSchema: [],
      supportsGallery: false,
      supportsNewFeatures: false,
      supportsProducts: false,
      supportsAppointments: false,
      isStandaloneSection: false,
      businessCount,
      createdAt: now,
      updatedAt: now,
    });
  }

  return kept.sort((a, b) => a.sortOrder - b.sortOrder);
}

/** One "top-level pick" for a category selector: either a merged group
 * (Education, Health, Automotive, ...) with its real present member
 * categories, or a single standalone category (Flowers & Gifts, Kids &
 * Family, Real Estate, ...) treated as its own one-member "group" — so a
 * picker built from this never needs a special case for "categories that
 * aren't part of any group". Always built from the real `categories` list
 * passed in — nothing here is hardcoded or fabricated; a group simply
 * doesn't appear if none of its members are present in that list. */
export interface CategoryGroupOption {
  key: string;
  isMerged: boolean;
  merged?: MergedCategoryConfig;
  /** The real, selectable member categories — length 1 for a standalone
   * category, length ≥1 for a merged group. */
  members: Category[];
}

/** Reused by any category-selection UI that needs a two-step "pick a group,
 * then pick the specific category" flow (the /join business-registration
 * form, admin city-service create/edit forms, admin filters) — the single
 * source of truth for what "top level" means, so every surface groups the
 * exact same way. Only `target_table = 'city_services'` categories are ever
 * grouped; long-tail `services`-vertical categories (Real Estate,
 * Electronics, ...) and every other vertical always pass through as their
 * own standalone option, unaffected. */
export function buildCategoryGroupOptions(categories: Category[]): CategoryGroupOption[] {
  const memberSlugs = new Set(ALL_MERGED_MEMBER_SLUGS);
  const options: CategoryGroupOption[] = [];

  for (const merged of MERGED_CATEGORIES) {
    const members = categories
      .filter((c) => c.targetTable === "city_services" && merged.memberSlugs.includes(c.slug))
      .sort((a, b) => a.sortOrder - b.sortOrder);
    if (members.length === 0) continue;
    // A caller may pass a category list with some of this group's members
    // already filtered out (e.g. /join removes categories promoted to its
    // own primary cards). If only one member survives, showing it under the
    // merged group's label (e.g. "Beauty & Care") would misrepresent it and
    // collide with an unrelated group of the same name elsewhere in the UI —
    // so it falls through to a plain standalone option under its own name.
    if (members.length === 1) {
      options.push({ key: members[0].id, isMerged: false, members });
      continue;
    }
    options.push({ key: merged.key, isMerged: true, merged, members });
  }

  for (const c of categories) {
    if (c.targetTable === "city_services" && memberSlugs.has(c.slug)) continue;
    options.push({ key: c.id, isMerged: false, members: [c] });
  }

  function sortKey(o: CategoryGroupOption): number {
    return Math.min(...o.members.map((m) => m.sortOrder));
  }
  return options.sort((a, b) => sortKey(a) - sortKey(b));
}
