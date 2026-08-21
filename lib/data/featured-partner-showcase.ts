import { getTranslations } from "next-intl/server";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { getHotels } from "@/lib/data/hotels";
import { getRestaurants } from "@/lib/data/restaurants";
import { getCafes } from "@/lib/data/cafes";
import { getCategories } from "@/lib/data/categories";
import { mapCityService } from "@/lib/data/mappers";
import { RESTAURANTS_PUBLIC_ENABLED, CAFES_PUBLIC_ENABLED } from "@/lib/config/features";
import { categoryDisplayName } from "@/lib/utils/category-href";
import {
  getFeaturedPartnerCtaForHotel,
  getFeaturedPartnerCtaForRestaurant,
  getFeaturedPartnerCtaForCafe,
  getFeaturedPartnerTemplateForCategory,
  getFeaturedPartnerTemplateForType,
  type FeaturedPartnerCtaKind,
  type FeaturedPartnerTemplateKey,
} from "@/lib/utils/featured-partner-cta";
import type { Locale } from "@/lib/i18n/config";
import type { Category, CityService, PolymorphicListingType } from "@/types";

export interface FeaturedPartnerShowcaseItem {
  id: string;
  listingType: PolymorphicListingType;
  name: string;
  /** Business logo when set; falls back to the cover/hero image so the
   * card never has to render a blank identity area. */
  logo: string | null;
  image: string;
  href: string;
  categoryLabel: string;
  promoText: string;
  ctaLabel: string;
  ctaHref: string;
}

interface FeaturedPartnerContentOverrideRow {
  listing_type: string;
  listing_id: string;
  promo_text: string | null;
  promo_text_ar: string | null;
  promo_text_so: string | null;
  cta_label: string | null;
  cta_label_ar: string | null;
  cta_label_so: string | null;
  cta_href: string | null;
}

function localizedOverrideText(
  locale: Locale,
  en: string | null,
  ar: string | null,
  so: string | null
): string | null {
  if (locale === "ar") return ar || en || null;
  if (locale === "so") return so || en || null;
  return en || null;
}

/** Optional per-partner custom promo content (see
 * supabase/migrations/20260902000001_featured_partner_content.sql — NOT YET
 * APPLIED to production). Queried defensively: an error (table doesn't
 * exist yet, or genuinely nothing saved) just means every partner falls
 * back to its automatic category template below — never a broken homepage. */
async function getOverridesByListing(): Promise<Map<string, FeaturedPartnerContentOverrideRow>> {
  const map = new Map<string, FeaturedPartnerContentOverrideRow>();
  if (!isSupabaseConfigured()) return map;

  const supabase = createPublicClient();
  const { data, error } = await supabase.from("featured_partner_content" as any).select("*");
  if (error || !data) return map;

  for (const row of data as FeaturedPartnerContentOverrideRow[]) {
    map.set(`${row.listing_type}:${row.listing_id}`, row);
  }
  return map;
}

/** Featured (is_partner=true, status='published') city_services — no
 * existing flat list function to reuse (getCityServicesGroupedByCategory
 * returns a grouped shape this doesn't need), so this is a small, direct,
 * server-filtered query scoped to exactly what this section needs. */
async function getFeaturedCityServices(): Promise<CityService[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("city_services")
    .select("*")
    .eq("status", "published")
    .eq("is_partner", true);

  if (error || !data) return [];
  return data.map((row) => mapCityService(row as any));
}

/**
 * Homepage "Smart Featured Partners" — every published listing (hotel/
 * restaurant/cafe/service/city_service) an admin has manually flagged
 * `is_partner` (the existing, already-live "GO HARGEISA PARTNER" status
 * from 20260815000001_add_is_partner_flag.sql — no new "is featured"
 * column), each resolved to a category-appropriate promotional card:
 * automatic promo text + CTA when no custom override is saved, the saved
 * override otherwise. Every CTA links to the partner's own real detail
 * page, where the promised action (booking/reservation/ordering/
 * appointment) already exists and works — this never invents a new entry
 * point.
 */
export async function getFeaturedPartnerShowcase(locale: Locale, limit = 10): Promise<FeaturedPartnerShowcaseItem[]> {
  const [t, tNav, overridesByListing, allCategories] = await Promise.all([
    getTranslations({ locale, namespace: "home" }),
    getTranslations({ locale, namespace: "nav" }),
    getOverridesByListing(),
    getCategories(),
  ]);

  const [hotels, restaurants, cafes, cityServices] = await Promise.all([
    getHotels(),
    RESTAURANTS_PUBLIC_ENABLED ? getRestaurants() : Promise.resolve([]),
    CAFES_PUBLIC_ENABLED ? getCafes({ locale }) : Promise.resolve([]),
    getFeaturedCityServices(),
  ]);

  // A category's own `target_table` (categories.target_table) reflects its
  // PRIMARY home page, but a real listing can reference one by id from a
  // different table too — e.g. "flower-shops" is nominally target_table=
  // 'services', yet the real city_services row (Lavender) links to it via
  // category_id. Resolving from the full unfiltered category list (not a
  // target_table-filtered fetch) is what makes that resolve correctly.
  const categoryById = new Map<string, Category>(allCategories.map((c) => [c.id, c]));

  const promoLabel = (template: FeaturedPartnerTemplateKey) => t(`featuredPartnerPromo_${template}`);
  const ctaLabel = (cta: FeaturedPartnerCtaKind) => t(`featuredPartnerCta_${cta}`);

  function applyOverride(
    listingType: PolymorphicListingType,
    listingId: string,
    fallback: { promoText: string; ctaLabel: string; ctaHref: string }
  ): { promoText: string; ctaLabel: string; ctaHref: string } {
    const override = overridesByListing.get(`${listingType}:${listingId}`);
    if (!override) return fallback;

    return {
      promoText: localizedOverrideText(locale, override.promo_text, override.promo_text_ar, override.promo_text_so) ?? fallback.promoText,
      ctaLabel: localizedOverrideText(locale, override.cta_label, override.cta_label_ar, override.cta_label_so) ?? fallback.ctaLabel,
      ctaHref: override.cta_href || fallback.ctaHref,
    };
  }

  const items: FeaturedPartnerShowcaseItem[] = [];

  for (const h of hotels) {
    if (!h.isPartner) continue;
    const href = `/${locale}/hotels/${h.slug}`;
    const cta = getFeaturedPartnerCtaForHotel();
    const template = getFeaturedPartnerTemplateForType("hotel")!;
    const resolved = applyOverride("hotel", h.id, { promoText: promoLabel(template), ctaLabel: ctaLabel(cta), ctaHref: href });
    items.push({
      id: h.id,
      listingType: "hotel",
      name: h.name,
      logo: h.logo ?? null,
      image: h.coverImage,
      href,
      categoryLabel: tNav("hotels"),
      ...resolved,
    });
  }

  for (const r of restaurants) {
    if (!r.isPartner) continue;
    const href = `/${locale}/restaurants/${r.slug}`;
    const cta = getFeaturedPartnerCtaForRestaurant(r);
    const template = getFeaturedPartnerTemplateForType("restaurant")!;
    const resolved = applyOverride("restaurant", r.id, { promoText: promoLabel(template), ctaLabel: ctaLabel(cta), ctaHref: href });
    items.push({
      id: r.id,
      listingType: "restaurant",
      name: r.name,
      logo: r.logo ?? null,
      image: r.coverImage,
      href,
      categoryLabel: tNav("restaurants"),
      ...resolved,
    });
  }

  for (const c of cafes) {
    if (!c.isPartner) continue;
    const href = `/${locale}/cafes/${c.slug}`;
    const cta = getFeaturedPartnerCtaForCafe(c);
    const template = getFeaturedPartnerTemplateForType("cafe")!;
    const resolved = applyOverride("cafe", c.id, { promoText: promoLabel(template), ctaLabel: ctaLabel(cta), ctaHref: href });
    items.push({
      id: c.id,
      listingType: "cafe",
      name: c.name,
      logo: c.logo ?? null,
      image: c.coverImage,
      href,
      categoryLabel: tNav("cafes"),
      ...resolved,
    });
  }

  for (const cs of cityServices) {
    const category = categoryById.get(cs.categoryId) ?? null;
    const { cta, template } = getFeaturedPartnerTemplateForCategory(category);
    const href = `/${locale}/city-services/${cs.slug}`;
    const resolved = applyOverride("city_service", cs.id, { promoText: promoLabel(template), ctaLabel: ctaLabel(cta), ctaHref: href });
    items.push({
      id: cs.id,
      listingType: "city_service",
      name: cs.name,
      logo: cs.logoUrl ?? null,
      image: cs.image ?? cs.logoUrl ?? "",
      href,
      categoryLabel: category ? categoryDisplayName(category, locale) : "",
      ...resolved,
    });
  }

  return items.slice(0, limit);
}
