import { enrichFlormarProduct } from "./flormar-product-enrichment";
import { FLORMAR_PRIMARY_CATEGORY_GROUPS } from "@/lib/config/flormar-categories";
import { getActiveFlormarCampaigns, resolveCampaignProducts } from "@/lib/config/flormar-campaigns";
import type { Locale } from "@/lib/i18n/config";
import type { Product, ProductGender } from "@/types";

export interface FlormarBoundedViews {
  /** Every product with isFeatured=true — a small, bounded subset. */
  featuredProducts: Product[];
  /** One product per FLORMAR_PRIMARY_CATEGORY_GROUPS group — see the
   * original discoverPicks selection rule this preserves exactly. */
  discoverPicksProducts: Product[];
  /** One representative photo URL per category group, keyed by group.key. */
  categoryImageByGroup: Record<string, string>;
  availableGenders: ProductGender[];
  /** Every currently-active campaign's resolved product(s), keyed by
   * campaign id — the client only ever needs whichever one is the active
   * hero slide, but there are only ever a handful of active campaigns. */
  campaignProductsByCampaignId: Record<string, Product[]>;
  /** First page of the "Shopping" discovery grid, already enriched, in the
   * catalog's real default order. */
  initialDiscoveryProducts: Product[];
  discoveryTotal: number;
}

/**
 * Computes every whole-catalog-derived view FlormarStorefront needs, from
 * the full product array city-services/[slug]/page.tsx already fetched
 * (getProductsForListing) — no new Supabase query. Moving this server-side
 * means the CLIENT only ever receives these small, bounded results (plus
 * one page of the discovery grid) instead of the full ~225-product catalog
 * every one of these views used to be independently re-derived from in the
 * browser — the actual measured cause of this page's ~1.2MB payload.
 * Subsequent discovery-grid pages ("Load More", or a filter change) go
 * through the real paginated query instead (getProductsPageForListing via
 * /api/products, see FlormarStorefront's own usePaginatedProducts call),
 * enriched client-side with the same enrichFlormarProduct — never another
 * full-catalog fetch.
 */
export function computeFlormarBoundedViews(allProducts: Product[], locale: Locale, discoveryPageSize = 48): FlormarBoundedViews {
  const enriched = allProducts.map((p) => enrichFlormarProduct(p, locale));

  const featuredProducts = enriched.filter((p) => p.isFeatured);

  const categoryImageByGroup: Record<string, string> = {};
  const discoverPicksProducts: Product[] = [];
  for (const group of FLORMAR_PRIMARY_CATEGORY_GROUPS) {
    const withImage = enriched.filter((p) => p.category && group.categories.includes(p.category) && p.image);
    const imagePick = withImage.find((p) => p.isFeatured) ?? withImage[0];
    if (imagePick?.image) categoryImageByGroup[group.key] = imagePick.image;

    const discoverable = enriched.filter((p) => p.category && group.categories.includes(p.category) && p.image && p.isAvailable);
    const discoverPick = discoverable.find((p) => p.isFeatured) ?? discoverable[0];
    if (discoverPick) discoverPicksProducts.push(discoverPick);
  }

  const availableGenders: ProductGender[] = [];
  const seenGenders = new Set<ProductGender>();
  for (const p of enriched) {
    if (p.gender && !seenGenders.has(p.gender)) {
      seenGenders.add(p.gender);
      availableGenders.push(p.gender);
    }
  }

  const campaignProductsByCampaignId: Record<string, Product[]> = {};
  for (const campaign of getActiveFlormarCampaigns()) {
    campaignProductsByCampaignId[campaign.id] = resolveCampaignProducts(campaign, enriched);
  }

  return {
    featuredProducts,
    discoverPicksProducts,
    categoryImageByGroup,
    availableGenders,
    campaignProductsByCampaignId,
    initialDiscoveryProducts: enriched.slice(0, discoveryPageSize),
    discoveryTotal: enriched.length,
  };
}
