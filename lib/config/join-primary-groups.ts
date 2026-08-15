import type { Category } from "@/types";
import type { Locale } from "@/lib/i18n/config";
import { categoryDisplayName } from "@/lib/utils/category-href";
import { targetTableToJoinCategory } from "@/lib/utils/partner-categories";

/**
 * The /join "Business Type" primary-card area, expanded from 3 cards
 * (Hotels/Restaurants/Cafes) to 7. Deliberately a SEPARATE, small config
 * from lib/config/city-service-category-groups.ts (used by /city-services
 * and the site "More" nav menu) rather than a shared/modified one — the
 * membership here genuinely differs (this "Health" group includes Dental
 * Clinics and excludes nothing; "Car Services" adds Taxi Services; "Beauty
 * & Care" deliberately excludes Men's Barbershops, which stays a standalone
 * dropdown entry; "Hotels" spans two different target_tables entirely).
 * Reusing the other file's groups here would silently change what /city-
 * services and "More" show, which isn't what was asked. Every member is
 * still a real `categories` row — this is purely how /join's card area
 * chooses to present them; nothing here is a second data source.
 */
export interface JoinPrimaryGroupConfig {
  key: "education" | "health" | "car-services" | "beauty-care";
  icon: string;
  name: string;
  nameAr: string;
  nameSo: string;
  /** In display order; the first one present is preselected when the card
   * itself (not a specific subcategory pill) is clicked. */
  memberSlugs: string[];
}

export const JOIN_PRIMARY_GROUPS: JoinPrimaryGroupConfig[] = [
  {
    key: "education",
    icon: "GraduationCap",
    name: "Education",
    nameAr: "التعليم",
    nameSo: "Waxbarashada",
    memberSlugs: ["school", "university", "institute", "quran-memorization-center"],
  },
  {
    key: "health",
    icon: "HeartPulse",
    name: "Health",
    nameAr: "الصحة",
    nameSo: "Caafimaadka",
    memberSlugs: ["hospital", "clinic", "pharmacy", "dental-clinic"],
  },
  {
    key: "car-services",
    icon: "Car",
    name: "Car Services",
    nameAr: "خدمات السيارات",
    nameSo: "Adeegyada Baabuurta",
    memberSlugs: ["car-rental", "car-wash", "auto-repair", "taxi-service"],
  },
  {
    key: "beauty-care",
    icon: "Sparkles",
    name: "Beauty & Care",
    nameAr: "الجمال والعناية",
    nameSo: "Qurux iyo Daryeel",
    memberSlugs: ["beauty-salon", "cosmetics-beauty"],
  },
];

/** Hotels' second card member — a real `services`-vertical category, not a
 * city_services one, shown as a second option under the same Hotels card
 * rather than a 5th group of its own (per the exact spec: "Hotels →
 * Hotels, Apartments"). */
export const JOIN_APARTMENTS_SLUG = "apartments";

export const ALL_JOIN_PROMOTED_SLUGS = [...JOIN_PRIMARY_GROUPS.flatMap((g) => g.memberSlugs), JOIN_APARTMENTS_SLUG];

export function joinPrimaryGroupDisplayName(group: JoinPrimaryGroupConfig, locale: Locale): string {
  if (locale === "ar") return group.nameAr;
  if (locale === "so") return group.nameSo;
  return group.name;
}

/** One card in the unified Business Type grid. `members.length === 1` means
 * a plain direct-select card (Restaurants, Cafés — unchanged behavior);
 * `members.length > 1` means clicking the card selects the first member by
 * default and a sub-row of pills appears for the rest (Hotels, Education,
 * Health, Car Services, Beauty & Care). */
export interface JoinPrimaryCardMember {
  label: string;
  /** "core" members are hotel/restaurant/cafe (their own dedicated table);
   * "other" members are real `categories` rows submitted as
   * category="other" + categoryId, exactly like the dropdown already does. */
  kind: "core" | "other";
  coreCategory?: "hotel" | "restaurant" | "cafe";
  categoryId?: string;
}

export interface JoinPrimaryCard {
  key: string;
  icon: string;
  label: string;
  members: JoinPrimaryCardMember[];
}

/** Builds the 7-card list from real, live data only — coreCategories (the
 * existing Hotels/Restaurants/Cafes rows, unchanged source) and
 * serviceCategories (the existing flat list already fetched for the
 * dropdown). A group silently has fewer members (or is skipped entirely) if
 * one of its member categories doesn't currently exist/isn't active —
 * exactly like every other category-driven UI in this app; nothing is
 * hardcoded as always-present. */
export function buildJoinPrimaryCards(coreCategories: Category[], serviceCategories: Category[], locale: Locale): JoinPrimaryCard[] {
  const cards: JoinPrimaryCard[] = [];
  const bySlug = new Map(serviceCategories.map((c) => [c.slug, c]));

  for (const c of coreCategories) {
    const coreCat = targetTableToJoinCategory(c.targetTable);
    const members: JoinPrimaryCardMember[] = [{ label: categoryDisplayName(c, locale), kind: "core", coreCategory: coreCat }];
    if (coreCat === "hotel") {
      const apartments = bySlug.get(JOIN_APARTMENTS_SLUG);
      if (apartments) members.push({ label: categoryDisplayName(apartments, locale), kind: "other", categoryId: apartments.id });
    }
    cards.push({ key: coreCat, icon: c.icon, label: categoryDisplayName(c, locale), members });
  }

  for (const group of JOIN_PRIMARY_GROUPS) {
    const members: JoinPrimaryCardMember[] = group.memberSlugs
      .map((slug) => bySlug.get(slug))
      .filter((c): c is Category => Boolean(c))
      .map((c) => ({ label: categoryDisplayName(c, locale), kind: "other" as const, categoryId: c.id }));
    if (members.length === 0) continue;
    cards.push({ key: group.key, icon: group.icon, label: joinPrimaryGroupDisplayName(group, locale), members });
  }

  return cards;
}
