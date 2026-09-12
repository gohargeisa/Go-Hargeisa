"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { MapPin, Search, ShoppingBag, Heart, User, Menu, ImageOff } from "lucide-react";
import { ProductCard } from "@/components/shared/product-card";
import { ProductDetailModal } from "@/components/shared/product-detail-modal";
import { PartnerProductPlaceholder } from "@/components/shared/partner/partner-product-placeholder";
import { EmptyState } from "@/components/shared/empty-state";
import { SocialLinks } from "@/components/shared/social-links";
import { FlormarCampaignHero } from "@/components/flormar/flormar-campaign-hero";
import { BottomSheet } from "@/components/shared/bottom-sheet";
import { Reveal } from "@/components/home/reveal";
import { productLocalizedName } from "@/lib/utils/product-i18n";
import { enrichFlormarProduct } from "@/lib/utils/flormar-product-enrichment";
import { resolveFlormarSwatchColor } from "@/lib/utils/flormar-shade-colors";
import { FLORMAR_BRANCHES } from "@/lib/config/flormar-branches";
import { productCategoryLabel, productGenderLabel } from "@/lib/config/product-categories";
import { useCart } from "@/lib/cart/cart-context";
import { usePaginatedProducts } from "@/lib/hooks/use-paginated-products";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import { FLORMAR_PRIMARY_CATEGORY_GROUPS } from "@/lib/config/flormar-categories";
import { getActiveFlormarCampaigns, type FlormarCampaign } from "@/lib/config/flormar-campaigns";
import type { PartnerTheme } from "@/lib/config/partner-themes";
import type { Locale } from "@/lib/i18n/config";
import type { AddToCartBusiness } from "@/lib/cart/cart-context";
import type { CityService, Product, ProductGender } from "@/types";

const WISHLIST_STORAGE_KEY = "flormar-preview-wishlist";

/**
 * Minimal client-side wishlist, scoped entirely to this preview page and
 * persisted to localStorage — not a site-wide feature. No per-product
 * wishlist/favorites system exists anywhere else in the codebase (the only
 * "favorite" concept on the site favorites a whole business listing, see
 * FavoriteButton, not individual catalog items), so this is new, small,
 * self-contained, and honest about what it is: a real, working toggle
 * (persists across reloads, nothing fake or decorative about it), not a
 * duplicate of some larger system that doesn't exist yet.
 */
function useLocalWishlist() {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(WISHLIST_STORAGE_KEY);
      if (raw) setIds(new Set(JSON.parse(raw)));
    } catch {
      // Corrupt/blocked storage — start from an empty wishlist rather than crash.
    }
    setHydrated(true);
  }, []);

  function toggle(id: string) {
    setIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        window.localStorage.setItem(WISHLIST_STORAGE_KEY, JSON.stringify([...next]));
      } catch {
        // Ignore storage write failures (private browsing, quota) — the
        // in-memory toggle still works for the rest of this session.
      }
      return next;
    });
  }

  return { ids, toggle, hydrated };
}

/**
 * Flormar Hargeisa storefront (client half) — rebuilt to follow the
 * official flormar.com structural/UX hierarchy (brand header + full nav,
 * campaign-style hero, category navigation, featured products, a plain
 * shopping grid, Hargeisa store info, partnership footer) rather than a
 * Go-Hargeisa-editorial page with Flormar branding. Structure only this
 * file owns (hero copy, section order, category groups); everything that
 * actually renders a product (ProductCard, ProductDetailModal, and inside
 * it ProductVariantSelector) is the exact same reusable component every
 * other partner's shop tab already uses — nothing product-related is
 * duplicated or Flormar-specific.
 *
 * `PartnerThemeScope` (the `[data-partner-theme]` CSS-var scope that
 * retints those shared components to Flormar's placeholder palette) and
 * `PartnerPartnershipFooter` are both async Server Components, so — unlike
 * Lavender's page, which is a Server Component top to bottom — they're
 * rendered by the parent page.tsx (server) instead of here: an async
 * Server Component can't be a child of a "use client" component. This
 * component only needs "use client" for the product-detail-modal open/
 * close state; page.tsx wraps it (and the footer) in PartnerThemeScope.
 *
 * Every product image without a verified official photo is
 * BrandedPlaceholder (an honest "photo coming soon" placeholder), never a
 * generated or downloaded photo — passed into the real ProductCard via its
 * `imageFallback` prop (product-image.tsx), not a parallel card
 * implementation, so featured/unavailable badges, the shade-swatch
 * indicator, and the variant-safe quick-add gate all still apply here
 * exactly as they do for every other partner.
 *
 * `products` is real, database-driven data (see lib/data/flormar-preview.ts
 * and lib/data/products.ts) reconciled against the authoritative Excel
 * catalog — not a static mock import.
 */
type SortKey = "featured" | "newest" | "priceLow" | "priceHigh" | "name";

export function FlormarStorefront({
  theme,
  service,
  locale,
  featuredProducts,
  discoverPicksProducts,
  categoryImageByGroup,
  availableGenders,
  campaignProductsByCampaignId,
  initialDiscoveryProducts,
  discoveryTotal,
  loyaltySlot,
}: {
  theme: PartnerTheme;
  service: CityService;
  locale: Locale;
  /** Every whole-catalog-derived view below (see
   * lib/utils/flormar-discovery.ts's computeFlormarBoundedViews, called by
   * the server page from the SAME full fetch it already does) — small,
   * bounded, and already enriched (enrichFlormarProduct). Only the
   * "Shopping"/discovery grid ever needs more than this, and it fetches its
   * own subsequent pages via usePaginatedProducts + /api/products. */
  featuredProducts: Product[];
  discoverPicksProducts: Product[];
  categoryImageByGroup: Record<string, string>;
  availableGenders: ProductGender[];
  campaignProductsByCampaignId: Record<string, Product[]>;
  initialDiscoveryProducts: Product[];
  discoveryTotal: number;
  /** Optional Flormar Rewards entry card, rendered by the server page only
   * when this partner's loyalty program is enabled. Nothing about the
   * storefront changes when it's absent. */
  loyaltySlot?: React.ReactNode;
}) {
  const t = useTranslations("flormarPreview");
  const tp = useTranslations("products");
  const tc = useTranslations("cart");
  const tn = useTranslations("nav");
  const td = useTranslations("detail");
  const th = useTranslations("hotelDetail");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [categoryMenuOpen, setCategoryMenuOpen] = useState(false);
  const cart = useCart();
  const wishlist = useLocalWishlist();
  // Campaign hero — real business-owner photos, each wired to the exact
  // product shown (see lib/config/flormar-campaigns.ts). `activeCampaign`
  // tracks the visible slide so the "From this campaign" strip below can
  // follow it.
  const activeCampaigns = useMemo(() => getActiveFlormarCampaigns(), []);
  const [activeCampaign, setActiveCampaign] = useState<FlormarCampaign | null>(activeCampaigns[0] ?? null);
  // Category tiles below reuse real product photos (external CDN URLs from
  // the real catalog, not this project's own assets) as their visual —
  // unlike ProductImage, a bare next/image here has no built-in error
  // fallback, so one tracked
  // here: a source that fails to load (dead link, transient CDN issue)
  // falls back to PartnerProductPlaceholder instead of a permanent broken-
  // image icon, keyed by category/look key so only that one tile reacts.
  const [brokenImageKeys, setBrokenImageKeys] = useState<Set<string>>(new Set());
  function markImageBroken(key: string) {
    setBrokenImageKeys((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }

  // Real city_services.id — every product on this listing shares it.
  const business: AddToCartBusiness = {
    listingType: "city_service",
    listingId: service.id,
    businessName: "Flormar Hargeisa",
    deliveryEnabled: false,
    addons: [],
    // Real branches — Flormar operates in both Hargeisa and Mogadishu.
    // Populating this is what makes CheckoutForm show the required
    // city/branch step at all; every other business's checkout is
    // unaffected since none of them set this. See flormar-branches.ts.
    branches: FLORMAR_BRANCHES,
  };

  const featured = featuredProducts;
  const discoverPicks = discoverPicksProducts;

  // Shopping grid — category group + search + sort. Unlike every section
  // above (all precomputed server-side from the full catalog the page
  // already fetched), this is the one place that genuinely needs to see
  // "the rest" of a 200+ product catalog — so it's the one section backed
  // by real server-side pagination (usePaginatedProducts → /api/products),
  // not an in-memory filter over everything. No tab bar: Featured Products
  // already has its own dedicated section above, and a "New Arrivals" tab
  // was removed because the real data doesn't support it — the catalog's
  // `created_at` only has 2 distinct values across all 225 rows (one or two
  // import batches), so "newest first" would just reflect which import
  // batch a row happened to land in, not genuine product recency. Per the
  // brief's own "if the data does not support this accurately, do not
  // fabricate it" rule, that's not real "new arrivals" data — sorting by
  // `createdAt` is still offered as an honest, real (if coarse) sort option
  // below, just not framed as a curated "New" section.
  const [discoveryCategory, setDiscoveryCategory] = useState<string | null>(null);
  const [discoveryQueryInput, setDiscoveryQueryInput] = useState("");
  const [discoveryQuery, setDiscoveryQuery] = useState("");
  const [discoverySort, setDiscoverySort] = useState<SortKey>("featured");
  // Collection/gender filter — "All Products" plus one pill per gender value
  // actually present in the real catalog (see availableGenders' own doc
  // comment, server-side in lib/utils/flormar-discovery.ts) — never a fake/
  // empty pill for a gender nothing in the catalog carries.
  const [discoveryGender, setDiscoveryGender] = useState<ProductGender | "all">("all");

  // Debounced — a fetch on every keystroke would be a real "repeated
  // Supabase requests" problem; 350ms after the visitor stops typing is
  // enough to feel instant without querying per character.
  useEffect(() => {
    const id = setTimeout(() => setDiscoveryQuery(discoveryQueryInput.trim()), 350);
    return () => clearTimeout(id);
  }, [discoveryQueryInput]);

  function goToCategory(groupKey: string) {
    setDiscoveryCategory(groupKey);
    document.getElementById("shop-all")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const DISCOVERY_PAGE_SIZE = 48;
  const activeCategoryGroup = discoveryCategory ? FLORMAR_PRIMARY_CATEGORY_GROUPS.find((g) => g.key === discoveryCategory) : undefined;

  const {
    items: discoveryItemsRaw,
    total: discoveryResultsTotal,
    loading: discoveryLoading,
    hasMore: discoveryHasMore,
    loadMore: loadMoreDiscovery,
  } = usePaginatedProducts({
    listingId: service.id,
    listingType: "city_service",
    initialItems: initialDiscoveryProducts,
    initialTotal: discoveryTotal,
    pageSize: DISCOVERY_PAGE_SIZE,
    filters: {
      category: activeCategoryGroup?.categories.filter((c): c is string => !!c),
      gender: discoveryGender,
      nameQuery: discoveryQuery,
      sort: discoverySort,
    },
  });
  // /api/products returns raw rows — the same display-time enrichment every
  // other section already received server-side (see
  // computeFlormarBoundedViews) applies here too, just per-page instead of
  // once for the whole catalog.
  const discoveryResults = useMemo(() => discoveryItemsRaw.map((p) => enrichFlormarProduct(p, locale)), [discoveryItemsRaw, locale]);

  // Products the currently visible campaign slide promotes — precomputed
  // server-side for every active campaign (see
  // campaignProductsByCampaignId's own doc comment). Empty for a
  // category-only slide (e.g. the mascara photo, deliberately not tied to
  // one product) or if none of the campaign's SKUs are in stock right now.
  const campaignProducts = activeCampaign ? campaignProductsByCampaignId[activeCampaign.id] ?? [] : [];

  // Hero CTA: open the exact product's detail modal (→ shade selector → add
  // to cart) when the campaign resolves one; otherwise fall back to its
  // category — never a guessed product link.
  function handleShopCampaign(campaign: FlormarCampaign) {
    const [first] = campaignProductsByCampaignId[campaign.id] ?? [];
    if (first) setSelectedProduct(first);
    else goToCategory(campaign.categoryFallback);
  }

  return (
    <>
      {/* 01 — Store header: a Flormar-specific e-commerce sub-header sitting
         below the global Go Hargeisa nav (untouched, still fixed above
         this) — logo left, category quick-nav, search, wishlist + cart on
         the right, matching a premium cosmetics storefront's header
         convention. Cart reuses the site's real `useCart()` (same hook
         CartButton uses in the global header — opens the same drawer);
         wishlist is the small local-only toggle above (see
         useLocalWishlist's doc comment). */}
      <div
        // Mobile only (desktop unchanged): this bar is the very FIRST thing
        // in the page (no Breadcrumbs above it, unlike Pinnacle/Emaankoo/
        // Al-Hikma), so its static/natural position is document-y:0 — always
        // less than its own `top` offset below. Because of that, `sticky`
        // clamps it to render already-"stuck" at that offset from the very
        // first paint, not just once actually scrolled. The layout box
        // (which subsequent siblings, i.e. the campaign hero, are positioned
        // against) never accounted for that clamp — it reserved space as if
        // this bar sat at y:0 — so the hero's own top ~80px rendered right
        // where this bar was ACTUALLY painted, hidden underneath it (real
        // mobile screenshot: hero "positioned too high", cropped behind the
        // Flormar header). `mt-[...]` gives the box the same real offset it
        // was already being pushed down to visually, so the reserved layout
        // space matches — the hero then starts exactly where the bar's
        // visible bottom edge is, not underneath it. Every other
        // sticky-right-under-the-fixed-header bar sitewide (e.g.
        // components/attractions/attractions-toolbar.tsx) sits below a hero/
        // title first, so its natural position is already past this same
        // threshold before it would ever need to stick — this one is the
        // sole "nothing above it" case.
        className="mt-[calc(5rem+env(safe-area-inset-top))] sm:mt-0 sticky z-40 border-b border-black/5 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-ink/95"
        /* Sits directly under the global fixed site header, whose real height
           is h-20 (5rem) PLUS env(safe-area-inset-top) on notched devices
           (it carries `pt-[env(safe-area-inset-top)]`). A bare `top-20`
           ignored that inset, so on a notched phone this bar — and the
           Flormar logo in it — slid up underneath the site header and was
           clipped along the status-bar edge. */
        style={{ top: "calc(5rem + env(safe-area-inset-top))" }}
      >
        <div className="container-px mx-auto flex h-16 items-center gap-3 sm:gap-5">
          {/* Mobile/tablet category menu — the quick-nav <nav> below this is
              `hidden` until `lg:`, which left every screen narrower than
              that with NO way to jump to a category from the header at all
              (only by scrolling down to the Shop by Category section).
              Opens the same real 6 category groups the desktop quick-nav
              and Shop by Category grid already use — no second category
              list to keep in sync. */}
          <button
            type="button"
            onClick={() => setCategoryMenuOpen(true)}
            aria-label={t("categoriesMenuLabel")}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/5 dark:text-sand/70 dark:hover:bg-white/10 lg:hidden"
          >
            <Menu size={19} aria-hidden="true" />
          </button>

          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label={theme.partnerName}
            className="relative h-9 w-[84px] shrink-0 sm:h-10 sm:w-24"
          >
            {theme.partnerLogo && <Image src={theme.partnerLogo} alt={theme.partnerName} fill sizes="96px" className="object-contain" priority />}
          </button>

          {/* Main Flormar navigation: the same official-site category
              philosophy (Face/Eyes/Lips/Nails/Skin Care/Accessories) as the
              Category Navigation and Shopping sections below, plus a link
              to the Hargeisa store-information section — one nav, reused
              everywhere, not a separate list to keep in sync. */}
          <nav aria-label={t("categoryTitle")} className="hidden shrink-0 items-center gap-1 lg:flex">
            {FLORMAR_PRIMARY_CATEGORY_GROUPS.map((group) => (
              <button
                key={group.key}
                type="button"
                onClick={() => goToCategory(group.key)}
                aria-pressed={discoveryCategory === group.key}
                className="rounded-full px-3 py-1.5 text-sm font-semibold transition-colors"
                style={
                  discoveryCategory === group.key
                    ? { backgroundColor: `rgba(${theme.primaryRgb}, 0.1)`, color: theme.primaryStrong }
                    : { color: "inherit" }
                }
              >
                {t(group.titleKey)}
              </button>
            ))}
            <a
              href="#hargeisa-store"
              className="rounded-full px-3 py-1.5 text-sm font-semibold transition-colors hover:bg-ink/5 dark:hover:bg-white/10"
            >
              {t("hargeisaStoreNavLabel")}
            </a>
          </nav>

          <div className="relative hidden max-w-xs flex-1 sm:block">
            <Search size={15} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ink/40" aria-hidden="true" />
            <input
              value={discoveryQueryInput}
              onChange={(e) => {
                setDiscoveryQueryInput(e.target.value);
                if (e.target.value.trim()) document.getElementById("shop-all")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="w-full rounded-full border border-ink/12 bg-transparent py-2 ps-9 pe-4 text-sm outline-none focus:border-primary dark:border-white/15"
            />
          </div>

          <div className="ms-auto flex shrink-0 items-center gap-1">
            <a
              href={`/${locale}/auth/login`}
              aria-label={tn("signIn")}
              className="hidden h-9 w-9 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/5 dark:text-sand/70 dark:hover:bg-white/10 sm:flex"
            >
              <User size={18} aria-hidden="true" />
            </a>
            <button
              type="button"
              onClick={() => document.getElementById("shop-all")?.scrollIntoView({ behavior: "smooth", block: "start" })}
              aria-label={tp("wishlistLabel")}
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/5 dark:text-sand/70 dark:hover:bg-white/10"
            >
              <Heart size={18} aria-hidden="true" fill={wishlist.ids.size > 0 ? "currentColor" : "none"} className={wishlist.ids.size > 0 ? "text-primary-700" : undefined} />
              {wishlist.ids.size > 0 && (
                <span className="absolute -end-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-primary-700 px-1 text-[10px] font-bold text-white">
                  {wishlist.ids.size}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={cart.openCart}
              aria-label={tc("title")}
              className="relative flex h-9 w-9 items-center justify-center rounded-full text-ink/70 transition-colors hover:bg-ink/5 dark:text-sand/70 dark:hover:bg-white/10"
            >
              <ShoppingBag size={18} aria-hidden="true" />
              {cart.itemCount > 0 && (
                <span className="absolute -end-0.5 -top-0.5 flex h-[17px] min-w-[17px] items-center justify-center rounded-full bg-primary-700 px-1 text-[10px] font-bold text-white">
                  {cart.itemCount > 99 ? "99+" : cart.itemCount}
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="container-px mx-auto pb-3 sm:hidden">
          <div className="relative">
            <Search size={15} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ink/40" aria-hidden="true" />
            <input
              value={discoveryQueryInput}
              onChange={(e) => {
                setDiscoveryQueryInput(e.target.value);
                if (e.target.value.trim()) document.getElementById("shop-all")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="w-full rounded-full border border-ink/12 bg-transparent py-2 ps-9 pe-4 text-sm outline-none focus:border-primary dark:border-white/15"
            />
          </div>
        </div>
      </div>

      {/* 02 — Full-bleed Flormar campaign hero. Each slide is one real
          business-owner campaign photo tied to the exact product the model
          holds; the primary CTA opens that product's detail modal (shade
          selector → add to cart) via handleShopCampaign, which falls back to
          the campaign's category when no product resolves. See
          FlormarCampaignHero + lib/config/flormar-campaigns.ts. */}
      {activeCampaigns.length > 0 && (
        <FlormarCampaignHero
          campaigns={activeCampaigns}
          theme={theme}
          onShopCampaign={handleShopCampaign}
          onActiveCampaignChange={setActiveCampaign}
        />
      )}

      {/* Flormar Rewards entry — only rendered when the server page passes it
          (i.e. this partner's loyalty program is enabled). Placed right below
          the hero so members/prospects see it immediately, without displacing
          any existing shopping section. */}
      {loyaltySlot && (
        <section className="container-px mx-auto -mb-4 mt-2 max-w-3xl sm:mt-4">{loyaltySlot}</section>
      )}

      {/* 03 — Category Navigation / Product Discovery, following the
          official-site category philosophy (Face/Eyes/Lips/Nails/Skin
          Care/Accessories) mapped onto the real, verified product
          categories — see FLORMAR_PRIMARY_CATEGORY_GROUPS's own doc
          comment. No eyebrow badge — plain heading, matching a real brand
          site's category rail rather than a Go-Hargeisa-editorial tag. */}
      <section id="category-nav" className="py-10 sm:py-14">
        <div className="container-px mx-auto">
          {/* Circular-thumbnail quick-shop row (style reference only — same
              6 groups, names, images and onClick as before; only the
              presentation changed from large square tiles to small round
              avatars + a caption underneath, matching a real cosmetics
              storefront's category rail). No heading here (the large square
              version had a "Shop by Category" title above it) — this compact
              row reads as navigation, not a titled content section. */}
          <div className="flex snap-x snap-proximity justify-start gap-5 overflow-x-auto pb-1 scrollbar-none sm:justify-center sm:gap-8 sm:overflow-visible">
            {FLORMAR_PRIMARY_CATEGORY_GROUPS.map((group) => (
              <button
                key={group.key}
                type="button"
                onClick={() => goToCategory(group.key)}
                className="group flex shrink-0 snap-start flex-col items-center gap-2 text-center"
              >
                <span className="relative h-16 w-16 shrink-0 overflow-hidden rounded-full shadow-soft ring-1 ring-black/5 transition-transform duration-300 group-hover:-translate-y-1 sm:h-20 sm:w-20 dark:ring-white/10">
                  {categoryImageByGroup[group.key] && !brokenImageKeys.has(`cat-${group.key}`) ? (
                    <>
                      <span className="absolute inset-0 bg-[#FBF7F4]" aria-hidden="true" />
                      <Image
                        src={categoryImageByGroup[group.key]}
                        alt=""
                        fill
                        sizes="80px"
                        className="object-contain p-2"
                        onError={() => markImageBroken(`cat-${group.key}`)}
                      />
                    </>
                  ) : (
                    <span
                      className="flex h-full w-full items-center justify-center"
                      style={{ background: `linear-gradient(160deg, rgba(${theme.primaryRgb}, 0.1) 0%, #FBF7F4 60%, rgba(${theme.accentRgb}, 0.14) 130%)` }}
                    >
                      <ImageOff size={18} style={{ color: theme.primaryStrong }} aria-hidden="true" />
                    </span>
                  )}
                </span>
                <p className="max-w-[5.5rem] text-xs font-semibold leading-tight sm:text-sm">{t(group.titleKey)}</p>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 04 — "From this campaign": the exact product(s) featured in the
          hero slide currently on screen, so SEE MODEL + PRODUCT flows
          straight into SHOP THIS PRODUCT. Follows the hero via
          onActiveCampaignChange. Hidden for a category-only slide or when
          none of the campaign's SKUs are in stock (campaignProducts is []),
          so it never shows a mismatched or empty grid. Reuses the exact same
          ProductCard/modal as every other section. */}
      {activeCampaign && campaignProducts.length > 0 && (
        <section id="campaign-collection" className="bg-white py-10 dark:bg-white/[0.03] sm:py-24">
          <div className="container-px mx-auto">
            <Reveal>
              <h2 className="mx-auto mb-3 max-w-2xl text-balance text-center font-display text-3xl font-extrabold tracking-tight md:text-4xl">
                {t("campaignStripTitle")}
              </h2>
              <p className="mx-auto mb-10 max-w-xl text-balance text-center text-sm text-ink/60 dark:text-sand/60 md:mb-14">
                {t(activeCampaign.subtitleKey)}
              </p>
            </Reveal>
            <div
              className={`mx-auto grid gap-4 ${
                campaignProducts.length === 1
                  ? "max-w-xs grid-cols-1"
                  : campaignProducts.length === 2
                    ? "max-w-xl grid-cols-2"
                    : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
              }`}
            >
              {campaignProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  business={business}
                  locale={locale}
                  onOpenDetails={() => setSelectedProduct(product)}
                  imageFallback={<PartnerProductPlaceholder name={productLocalizedName(product, locale)} category={product.category ? productCategoryLabel(product.category, locale) : undefined} theme={theme} />}
                  variant="premium"
                  isWishlisted={wishlist.ids.has(product.id)}
                  onToggleWishlist={() => wishlist.toggle(product.id)}
                  resolveSwatchColor={(v) => resolveFlormarSwatchColor(v.shadeName ?? v.name)}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 05 — Featured Products — real reusable ProductCard/modal, real
          variant selector (the lipstick has 5 shades). No eyebrow badge,
          matching the plain "Featured" headings real brand storefronts use. */}
      <section id="featured-collection" className="bg-white py-16 dark:bg-white/[0.03] sm:py-24">
        <div className="container-px mx-auto">
          <Reveal>
            <h2 className="mx-auto mb-10 max-w-2xl text-balance text-center font-display text-3xl font-extrabold tracking-tight md:mb-14 md:text-4xl">
              {t("featuredTitle")}
            </h2>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                business={business}
                locale={locale}
                onOpenDetails={() => setSelectedProduct(product)}
                imageFallback={<PartnerProductPlaceholder name={productLocalizedName(product, locale)} category={product.category ? productCategoryLabel(product.category, locale) : undefined} theme={theme} />}
                variant="premium"
                isWishlisted={wishlist.ids.has(product.id)}
                onToggleWishlist={() => wishlist.toggle(product.id)}
                    resolveSwatchColor={(v) => resolveFlormarSwatchColor(v.shadeName ?? v.name)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 06 — Discover Your Favorites: one real product per category group,
          horizontally scrollable (native swipe on mobile, scrollbar/drag on
          desktop) rather than a second full grid — see discoverPicks' own
          doc comment for the selection rule. Only rendered when there's
          something real to show. */}
      {discoverPicks.length > 0 && (
        <section className="py-16 sm:py-24">
          <div className="container-px mx-auto">
            <Reveal>
              <h2 className="mx-auto mb-10 max-w-2xl text-balance text-center font-display text-3xl font-extrabold tracking-tight md:mb-14 md:text-4xl">
                {t("discoverTitle")}
              </h2>
            </Reveal>
            <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
              {discoverPicks.map((product) => (
                <div key={product.id} className="w-[46%] shrink-0 snap-start sm:w-[26%] lg:w-[19%]">
                  <ProductCard
                    product={product}
                    business={business}
                    locale={locale}
                    onOpenDetails={() => setSelectedProduct(product)}
                    imageFallback={<PartnerProductPlaceholder name={productLocalizedName(product, locale)} category={product.category ? productCategoryLabel(product.category, locale) : undefined} theme={theme} />}
                    variant="premium"
                    isWishlisted={wishlist.ids.has(product.id)}
                    onToggleWishlist={() => wishlist.toggle(product.id)}
                    resolveSwatchColor={(v) => resolveFlormarSwatchColor(v.shadeName ?? v.name)}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 07 — Shopping Experience: search + category chip + sort, all
          computed over the same real database-driven product list —
          reuses the same ProductCard/ProductDetailModal every other
          partner's shop tab uses, nothing product-related duplicated. */}
      <section id="shop-all" className="py-16 sm:py-24">
        <div className="container-px mx-auto">
          <Reveal>
            <h2 className="mx-auto mb-10 max-w-2xl text-balance text-center font-display text-3xl font-extrabold tracking-tight md:mb-14 md:text-4xl">
              {t("discoveryTitle")}
            </h2>
          </Reveal>

          {/* Collection filter — "All Products" plus one pill per gender the
              real catalog actually carries (see availableGenders above).
              Visually distinct (outline pill row, own label) from the
              tab/sort row below it so it reads as "which collection" rather
              than another sort tab. Never renders a pill for a gender with
              zero matching products. */}
          {availableGenders.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
              <span className="me-1 text-xs font-bold uppercase tracking-wide text-ink/40 dark:text-sand/40">{t("collectionLabel")}</span>
              <button
                type="button"
                onClick={() => setDiscoveryGender("all")}
                aria-pressed={discoveryGender === "all"}
                className="rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors"
                style={
                  discoveryGender === "all"
                    ? { backgroundColor: theme.accentStrong, borderColor: theme.accentStrong, color: "#fff" }
                    : { borderColor: `rgba(${theme.primaryRgb}, 0.25)`, color: theme.primaryStrong }
                }
              >
                {t("tabAll")}
              </button>
              {availableGenders.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setDiscoveryGender(g)}
                  aria-pressed={discoveryGender === g}
                  className="rounded-full border px-3.5 py-1.5 text-xs font-bold transition-colors"
                  style={
                    discoveryGender === g
                      ? { backgroundColor: theme.accentStrong, borderColor: theme.accentStrong, color: "#fff" }
                      : { borderColor: `rgba(${theme.primaryRgb}, 0.25)`, color: theme.primaryStrong }
                  }
                >
                  {productGenderLabel(g, locale)}
                </button>
              ))}
            </div>
          )}

          {discoveryCategory && (
            <div className="mb-6 flex justify-center">
              <button
                type="button"
                onClick={() => setDiscoveryCategory(null)}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold"
                style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.1)`, color: theme.primaryStrong }}
              >
                {(() => {
                  const group = FLORMAR_PRIMARY_CATEGORY_GROUPS.find((g) => g.key === discoveryCategory);
                  return group ? t(group.titleKey) : "";
                })()}
                <span aria-hidden="true">×</span>
              </button>
            </div>
          )}

          <div className="mb-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search size={15} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ink/40" aria-hidden="true" />
              <input
                value={discoveryQueryInput}
                onChange={(e) => setDiscoveryQueryInput(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-full border border-ink/12 bg-transparent py-2.5 ps-9 pe-4 text-sm outline-none focus:border-primary dark:border-white/15"
              />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <span className="shrink-0 font-semibold text-ink/60 dark:text-sand/60">{t("sortLabel")}</span>
              <select
                value={discoverySort}
                onChange={(e) => setDiscoverySort(e.target.value as SortKey)}
                className="rounded-full border border-ink/12 bg-transparent px-3.5 py-2 text-sm outline-none focus:border-primary dark:border-white/15"
              >
                <option value="featured">{t("sortFeatured")}</option>
                <option value="newest">{t("sortNewest")}</option>
                <option value="priceLow">{t("sortPriceLow")}</option>
                <option value="priceHigh">{t("sortPriceHigh")}</option>
                <option value="name">{t("sortName")}</option>
              </select>
            </label>
          </div>

          {/* Real empty state, reached only when discoveryResults is
             genuinely empty after filtering (e.g. a search query with no
             matches). */}
          {discoveryResults.length === 0 && !discoveryLoading ? (
            <EmptyState
              icon={Search}
              title={t("noResultsTitle")}
              description={t("resultsCount", { count: 0 })}
              action={
                discoveryQueryInput.trim() ? (
                  <button
                    type="button"
                    onClick={() => {
                      setDiscoveryQueryInput("");
                      setDiscoveryQuery("");
                    }}
                    className="rounded-full border px-4 py-2 text-sm font-bold transition-colors"
                    style={{ borderColor: `rgba(${theme.primaryRgb}, 0.3)`, color: theme.primaryStrong }}
                  >
                    {t("clearSearch")}
                  </button>
                ) : undefined
              }
            />
          ) : (
            <>
              <p className="mb-4 text-sm text-ink/50 dark:text-sand/50">{t("resultsCount", { count: discoveryResultsTotal })}</p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {discoveryResults.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    business={business}
                    locale={locale}
                    onOpenDetails={() => setSelectedProduct(product)}
                    imageFallback={<PartnerProductPlaceholder name={productLocalizedName(product, locale)} category={product.category ? productCategoryLabel(product.category, locale) : undefined} theme={theme} />}
                    variant="premium"
                    isWishlisted={wishlist.ids.has(product.id)}
                    onToggleWishlist={() => wishlist.toggle(product.id)}
                    resolveSwatchColor={(v) => resolveFlormarSwatchColor(v.shadeName ?? v.name)}
                  />
                ))}
              </div>
              {discoveryHasMore && (
                <div className="mt-8 flex flex-col items-center gap-2">
                  <p className="text-xs text-ink/45 dark:text-sand/45">
                    {t("loadMoreCount", { shown: discoveryResults.length, total: discoveryResultsTotal })}
                  </p>
                  <button
                    type="button"
                    onClick={loadMoreDiscovery}
                    disabled={discoveryLoading}
                    className="rounded-full px-6 py-2.5 text-sm font-bold text-white transition-all duration-300 ease-premium hover:-translate-y-0.5 disabled:opacity-60"
                    style={{ backgroundColor: theme.primaryStrong }}
                  >
                    {discoveryLoading ? t("loadingMore") : t("loadMore")}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>

      {/* 11 — Store information + Contact/Follow. Physical location is
          still genuinely unconfirmed (storeInfoLocation stays as-is).
          Phone/WhatsApp/Instagram/Facebook/TikTok read straight off this
          listing's own `city_services` row (service.phone/.whatsapp/
          .socialInstagram/.socialFacebook/.socialTiktok) via the exact same
          SocialLinks component every hotel/restaurant/cafe/city_service
          detail page already uses — no new/duplicate contact system, and no
          hardcoded per-partner config to drift out of sync. None of those
          fields are filled in on the row yet, so every button below simply
          doesn't render — storeInfoPending stays visible as an honest label
          for that, not deleted just because the buttons could work. */}
      <section id="hargeisa-store" className="bg-white py-16 dark:bg-white/[0.03] sm:py-24">
        <div className="container-px mx-auto max-w-xl text-center">
          <Reveal>
            <h2 className="font-display text-2xl font-bold">{t("storeInfoTitle")}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink/70 dark:text-sand/70">{t("storeInfoTagline")}</p>
            <p className="mt-3 flex items-center justify-center gap-1.5 text-sm text-ink/60 dark:text-sand/60">
              <MapPin size={14} aria-hidden="true" /> {t("storeInfoLocation")}
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {service.phone && (
                <a
                  href={`tel:${service.phone}`}
                  className="rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                  style={{ backgroundColor: theme.accentStrong }}
                >
                  {th("call")}
                </a>
              )}
              {service.whatsapp && (
                <a
                  href={toWhatsAppHref(service.whatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-full border px-6 py-3 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5"
                  style={{ borderColor: `rgba(${theme.primaryRgb}, 0.3)`, color: theme.primaryStrong }}
                >
                  {th("whatsapp")}
                </a>
              )}
            </div>

            <SocialLinks
              instagram={service.socialInstagram}
              facebook={service.socialFacebook}
              tiktok={service.socialTiktok}
              labels={{
                instagram: td("followInstagram"),
                facebook: td("followFacebook"),
                tiktok: td("followTiktok"),
              }}
              className="mt-5 justify-center"
            />

            {/* "Confirmed details coming soon" only when EVERY contact
             * channel is still genuinely empty — the row now has a real
             * phone/WhatsApp/Instagram/TikTok, so showing this
             * unconditionally (the previous behavior) told visitors real,
             * working contact buttons above were still placeholders. Each
             * individual button already hides itself when its own field is
             * empty (unchanged); this line only covers the case where none
             * of them do. */}
            {!service.phone && !service.whatsapp && !service.socialInstagram && !service.socialFacebook && !service.socialTiktok && (
              <p className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-ink/50 dark:text-sand/50">{t("storeInfoPending")}</p>
            )}
          </Reveal>
        </div>
      </section>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          storeName={business.businessName}
          business={business}
          locale={locale}
          onClose={() => setSelectedProduct(null)}
          hideSku
          variantLabel={tp("shadeSelectorLabel")}
          resolveSwatchColor={(v) => resolveFlormarSwatchColor(v.shadeName ?? v.name)}
          resolveFallbackLabel={(v) => v.name}
          layout="spacious"
          isWishlisted={wishlist.ids.has(selectedProduct.id)}
          onToggleWishlist={() => wishlist.toggle(selectedProduct.id)}
        />
      )}

      {/* Mobile/tablet menu — same BottomSheet every other mobile drawer on
          the site already uses (booking bars, favorites), not a new sheet
          implementation. Lists the same 6 category groups (plus "All
          Products" and a Hargeisa Store link) as the desktop nav — one
          category list, reused everywhere. */}
      <BottomSheet open={categoryMenuOpen} onClose={() => setCategoryMenuOpen(false)} title={t("categoryTitle")}>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setDiscoveryCategory(null);
              setCategoryMenuOpen(false);
              document.getElementById("shop-all")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="rounded-xl2 border border-ink/10 px-4 py-3 text-start text-sm font-semibold transition-colors dark:border-white/10"
            style={!discoveryCategory ? { borderColor: theme.primaryStrong, color: theme.primaryStrong, backgroundColor: `rgba(${theme.primaryRgb}, 0.06)` } : undefined}
          >
            {t("tabAll")}
          </button>
          {FLORMAR_PRIMARY_CATEGORY_GROUPS.map((group) => (
            <button
              key={group.key}
              type="button"
              onClick={() => {
                goToCategory(group.key);
                setCategoryMenuOpen(false);
              }}
              aria-pressed={discoveryCategory === group.key}
              className="rounded-xl2 border border-ink/10 px-4 py-3 text-start text-sm font-semibold transition-colors dark:border-white/10"
              style={
                discoveryCategory === group.key
                  ? { borderColor: theme.primaryStrong, color: theme.primaryStrong, backgroundColor: `rgba(${theme.primaryRgb}, 0.06)` }
                  : undefined
              }
            >
              {t(group.titleKey)}
            </button>
          ))}
        </div>
        <a
          href="#hargeisa-store"
          onClick={() => setCategoryMenuOpen(false)}
          className="mt-3 block rounded-xl2 border border-ink/10 px-4 py-3 text-center text-sm font-semibold transition-colors dark:border-white/10"
        >
          {t("hargeisaStoreNavLabel")}
        </a>
      </BottomSheet>
    </>
  );
}
