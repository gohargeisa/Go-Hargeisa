"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Sparkles, MapPin, Search, ShoppingBag, Heart, User } from "lucide-react";
import { isPlaceholderImage } from "@/lib/utils/is-placeholder-image";
import { SHIMMER_BLUR_DATA_URL } from "@/lib/utils/shimmer";
import { ProductCard } from "@/components/shared/product-card";
import { ProductDetailModal } from "@/components/shared/product-detail-modal";
import { PartnerProductPlaceholder } from "@/components/shared/partner/partner-product-placeholder";
import { EmptyState } from "@/components/shared/empty-state";
import { SocialLinks } from "@/components/shared/social-links";
import { PartnerVideoShowcase } from "@/components/shared/partner/partner-video-showcase";
import { Reveal } from "@/components/home/reveal";
import { productLocalizedName } from "@/lib/utils/product-i18n";
import { productCategoryLabel } from "@/lib/config/product-categories";
import { getProductPricing } from "@/lib/utils/product-pricing";
import { useCart } from "@/lib/cart/cart-context";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import { FLORMAR_MOCK_PRODUCTS, FLORMAR_MOCK_CATEGORIES, FLORMAR_MOCK_LOOKS } from "@/lib/mock-data/flormar";
import type { PartnerTheme } from "@/lib/config/partner-themes";
import type { Locale } from "@/lib/i18n/config";
import type { AddToCartBusiness } from "@/lib/cart/cart-context";
import type { Product } from "@/types";

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
 * Demo-only sale pricing for a handful of real products, so the discount
 * system (badge, strikethrough, calculated percent) is genuinely visible
 * and verifiable on this preview page. NOT read from any real business
 * decision — Flormar Hargeisa hasn't set any real sale prices yet (no real
 * listing/admin row exists for this business at all, see this file's own
 * header comment) — so this is intentionally kept as a small, isolated,
 * clearly-labeled override applied at render time in this component only,
 * rather than hand-edited into lib/mock-data/flormar.ts (a generated file —
 * hand edits there are lost on the next regeneration, see its own header
 * comment). Delete this map the moment real sale pricing exists; nothing
 * else in the discount system depends on it.
 *
 * Deliberately mixes featured and non-featured products — Offers
 * (originalPrice > price) and Best Sellers (isFeatured, a separate,
 * independent curation flag on the real catalog) are genuinely different
 * concepts with different real data behind them; picking three from the
 * same isFeatured=true set would make every Offer *look* like it's simply
 * "the Best Sellers, discounted" by coincidence of this demo selection,
 * not because the two tabs are actually the same thing.
 */
const DEMO_SALE_PRICING: Record<string, number> = {
  "flormar-31000243": 3.2, // Baked Blush-On — was $2.00 (isFeatured: true)
  "flormar-33000021": 2.4, // Silk Matte Liquid Lipstick — was $1.65 (isFeatured: true)
  "flormar-32000018": 6.5, // Precious Curl Mascara — was $4.40 (isFeatured: false — proves Offers ≠ Best Sellers)
};

/**
 * Flormar Hargeisa — private preview storefront (client half). Structure
 * only this file owns (hero copy, section order, category tiles);
 * everything that actually renders a product (ProductCard,
 * ProductDetailModal, and inside it ProductVariantSelector) is the exact
 * same reusable component every other partner's shop tab already uses —
 * nothing product-related is duplicated or Flormar-specific.
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
 * Every product image is BrandedPlaceholder (an honest "photo coming
 * soon" placeholder), never a generated or downloaded photo — passed into
 * the real ProductCard via its `imageFallback` prop (product-image.tsx),
 * not a parallel card implementation, so featured/unavailable badges, the
 * shade-swatch indicator, and the variant-safe quick-add gate all still
 * apply here exactly as they do for every other partner. See
 * lib/mock-data/flormar.ts's header comment. This whole page is mock-data
 * powered (no real business row exists yet) and intentionally unreachable
 * except by direct URL (see page.tsx's robots/sitemap notes).
 */
type FlormarPreviewT = ReturnType<typeof useTranslations<"flormarPreview">>;
const CATEGORY_LABELS: Record<(typeof FLORMAR_MOCK_CATEGORIES)[number]["labelKey"], (t: FlormarPreviewT) => string> = {
  makeup: (t) => t("categoryMakeup"),
  skincare: (t) => t("categorySkincare"),
  nails: (t) => t("categoryNails"),
  accessories: (t) => t("categoryAccessories"),
};

type SortKey = "featured" | "newest" | "priceLow" | "priceHigh";
type DiscoveryTab = "all" | "new" | "featured" | "offers";

const MOCK_BUSINESS: AddToCartBusiness = {
  listingType: "city_service",
  listingId: "mock-flormar",
  businessName: "Flormar Hargeisa",
  deliveryEnabled: false,
  addons: [],
};

export function FlormarStorefront({ theme, locale }: { theme: PartnerTheme; locale: Locale }) {
  const t = useTranslations("flormarPreview");
  const tp = useTranslations("products");
  const tc = useTranslations("cart");
  const tn = useTranslations("nav");
  const td = useTranslations("detail");
  const th = useTranslations("hotelDetail");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const cart = useCart();
  const wishlist = useLocalWishlist();
  // Category tiles and editorial cards below reuse real product photos
  // (external CDN URLs from the real catalog, not this project's own
  // assets) as their visual — unlike ProductImage/PartnerVideoShowcase,
  // a bare next/image here has no built-in error fallback, so one tracked
  // here: a source that fails to load (dead link, transient CDN issue)
  // falls back to PartnerProductPlaceholder instead of a permanent broken-
  // image icon, keyed by category/look key so only that one tile reacts.
  const [brokenImageKeys, setBrokenImageKeys] = useState<Set<string>>(new Set());
  function markImageBroken(key: string) {
    setBrokenImageKeys((prev) => (prev.has(key) ? prev : new Set(prev).add(key)));
  }

  // Single derived catalog every section below reads from (Featured, Shop
  // by Category, The Edit, Product Discovery, the detail modal) — applies
  // DEMO_SALE_PRICING once, in one place, instead of each section
  // re-deriving its own pricing. Every field except `originalPrice` is
  // untouched real catalog data.
  const productsWithPricing = useMemo(
    () => FLORMAR_MOCK_PRODUCTS.map((p) => (DEMO_SALE_PRICING[p.id] ? { ...p, originalPrice: DEMO_SALE_PRICING[p.id] } : p)),
    []
  );
  const featured = productsWithPricing.filter((p) => p.isFeatured);

  // FLORMAR_MOCK_CATEGORIES carries no `image` of its own (no dedicated
  // category-photography asset exists) — the tile previously fell straight
  // through to the placeholder for every category, every time, which is
  // exactly the "logo standing in for a missing photo" bug: the placeholder
  // used to show the partner logo, so every category tile effectively
  // displayed the logo instead of any real visual. Root-cause fix: a real,
  // already-photographed product from that category IS real category
  // imagery — reuse it, the same "representative product photo" pattern
  // real e-commerce category tiles use, rather than inventing a new asset.
  // Featured products preferred (closer to "representative"), falls back
  // to any product in the category with a real photo.
  const categoryImages = useMemo(() => {
    const map = new Map<string, string>();
    for (const cat of FLORMAR_MOCK_CATEGORIES) {
      const inCategory = productsWithPricing.filter((p) => p.category === cat.category && p.image);
      const pick = inCategory.find((p) => p.isFeatured) ?? inCategory[0];
      if (pick?.image) map.set(cat.key, pick.image);
    }
    return map;
  }, [productsWithPricing]);

  // Product Discovery — tab + category + search + sort, all computed
  // client-side over the same productsWithPricing every other section
  // already uses (no second product source).
  //
  // The four tabs read four genuinely independent real fields — none of
  // them derive from, or duplicate, another:
  //  - "all": no filter.
  //  - "new": sorted by createdAt, newest 4 — real catalog timestamps.
  //  - "featured" (labeled "Best Sellers" in the UI): the real, independent
  //    `isFeatured` curation flag — has nothing to do with price.
  //  - "offers": `getProductPricing(p).hasDiscount` — real, independent
  //    price comparison (originalPrice > price). Previously this tab was
  //    hardcoded to always render the empty state below regardless of
  //    `discoveryResults` — never actually checked pricing data at all,
  //    which is why products visibly showing -37%/-31%/-32% badges
  //    elsewhere on this same page still produced "No offers right now".
  //    Root-cause fix: "offers" is now a real filter inside
  //    `discoveryResults`, just like every other tab; the hardcoded
  //    always-empty branch is gone. A "Best Prices" tab is not currently
  //    implemented in this UI (no separate ranking data exists for it, and
  //    "cheapest first" already exists as a real, honest sort option
  //    below) — not adding a fourth tab backed by invented analytics.
  const [discoveryTab, setDiscoveryTab] = useState<DiscoveryTab>("all");
  const [discoveryCategory, setDiscoveryCategory] = useState<Product["category"] | null>(null);
  const [discoveryQuery, setDiscoveryQuery] = useState("");
  const [discoverySort, setDiscoverySort] = useState<SortKey>("featured");

  function goToCategory(category: Product["category"]) {
    setDiscoveryCategory(category);
    setDiscoveryTab("all");
    document.getElementById("product-discovery")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const discoveryResults = useMemo(() => {
    let list = productsWithPricing;
    if (discoveryCategory) list = list.filter((p) => p.category === discoveryCategory);
    if (discoveryTab === "new") list = [...list].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 4);
    if (discoveryTab === "featured") list = list.filter((p) => p.isFeatured);
    if (discoveryTab === "offers") list = list.filter((p) => getProductPricing(p).hasDiscount);

    const needle = discoveryQuery.trim().toLowerCase();
    if (needle) list = list.filter((p) => productLocalizedName(p, locale).toLowerCase().includes(needle));

    const sorted = [...list];
    if (discoverySort === "newest") sorted.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    else if (discoverySort === "priceLow") sorted.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    else if (discoverySort === "priceHigh") sorted.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    else sorted.sort((a, b) => Number(b.isFeatured) - Number(a.isFeatured) || a.sortOrder - b.sortOrder);
    return sorted;
  }, [productsWithPricing, discoveryCategory, discoveryTab, discoveryQuery, discoverySort, locale]);

  return (
    <>
      {/* 01 — Store header: a Flormar-specific e-commerce sub-header sitting
         below the global Go Hargeisa nav (untouched, still fixed above
         this) — logo left, category quick-nav, search, wishlist + cart on
         the right, matching a premium cosmetics storefront's header
         convention. Cart reuses the site's real `useCart()` (same hook
         CartButton uses in the global header — opens the same drawer);
         wishlist is the small local-only toggle above (see
         useLocalWishlist's doc comment). The old plain "PRIVATE PREVIEW"
         strip is kept as the header's own top hairline rather than removed
         — same real information, now inside a functioning store header
         instead of floating alone. */}
      <div
        className="sticky top-20 z-40 border-b border-black/5 bg-white/95 backdrop-blur-xl dark:border-white/10 dark:bg-ink/95"
      >
        <div
          className="flex items-center justify-center gap-2 py-1.5 text-center text-[11px] font-bold uppercase tracking-wide text-white"
          style={{ backgroundColor: theme.primaryDeep }}
        >
          <Sparkles size={12} aria-hidden="true" />
          {t("previewBadge")}
        </div>

        <div className="container-px mx-auto flex h-16 items-center gap-3 sm:gap-5">
          <button
            type="button"
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            aria-label={theme.partnerName}
            className="relative h-9 w-[84px] shrink-0 sm:h-10 sm:w-24"
          >
            {theme.partnerLogo && <Image src={theme.partnerLogo} alt={theme.partnerName} fill sizes="96px" className="object-contain" priority />}
          </button>

          <nav aria-label={t("categoryTitle")} className="hidden shrink-0 items-center gap-1 lg:flex">
            {FLORMAR_MOCK_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => goToCategory(cat.category)}
                aria-pressed={discoveryCategory === cat.category}
                className="rounded-full px-3 py-1.5 text-sm font-semibold transition-colors"
                style={
                  discoveryCategory === cat.category
                    ? { backgroundColor: `rgba(${theme.primaryRgb}, 0.1)`, color: theme.primaryStrong }
                    : { color: "inherit" }
                }
              >
                {CATEGORY_LABELS[cat.labelKey](t)}
              </button>
            ))}
          </nav>

          <div className="relative hidden max-w-xs flex-1 sm:block">
            <Search size={15} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ink/40" aria-hidden="true" />
            <input
              value={discoveryQuery}
              onChange={(e) => {
                setDiscoveryQuery(e.target.value);
                if (e.target.value.trim()) document.getElementById("product-discovery")?.scrollIntoView({ behavior: "smooth", block: "start" });
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
              onClick={() => document.getElementById("product-discovery")?.scrollIntoView({ behavior: "smooth", block: "start" })}
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
              value={discoveryQuery}
              onChange={(e) => {
                setDiscoveryQuery(e.target.value);
                if (e.target.value.trim()) document.getElementById("product-discovery")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchPlaceholder")}
              className="w-full rounded-full border border-ink/12 bg-transparent py-2 ps-9 pe-4 text-sm outline-none focus:border-primary dark:border-white/15"
            />
          </div>
        </div>
      </div>

      {/* 02 — Hero. Uses the business owner's real supplied composition
          (public/images/partners/flormar/hero.png, 1747×900) — dark
          Burgundy negative space on the left third, the product lineup lit
          on the right two-thirds. Two structurally different layouts, not
          one flexible one forced to cover both:
           - sm+ (≥640px): full-bleed cover-fit overlay hero, content
             anchored over the image's own left negative space, products
             left fully uncovered on the right. `dir="ltr"` locks that
             content column to the PHYSICAL left in every locale —
             Tailwind's logical start/end utilities flip with RTL, which
             would move the text (and its flex row of CTAs) onto the
             product photography in Arabic. Arabic glyphs still shape and
             read correctly RTL inside an ltr-marked container; only the
             block-level layout direction is pinned here.
           - <640px: stacked, not a shrunk version of the desktop overlay —
             the image renders at its own aspect ratio (full composition,
             no crop) as a top band, with the text/CTAs in a solid
             primaryDeep panel below. Avoids the two real mobile failure
             modes at this width: cropping the product photography to fill
             a fixed-height cover box, and overlaying text on top of a
             narrow crop where there's no room left for both the negative
             space and the products.
          `isPlaceholderImage` fallback preserved for defensive robustness
          if heroImage is ever cleared again — same left-anchored content,
          just a plain theme-color gradient behind it instead of the photo. */}
      <section className="relative overflow-hidden text-white">
        {theme.heroImageFit === "cover" && theme.heroImage && !isPlaceholderImage(theme.heroImage) ? (
          <>
            {/* Mobile: stacked, full composition, no overlay */}
            <div className="sm:hidden">
              <div className="relative w-full" style={{ aspectRatio: "1747 / 900" }}>
                <Image
                  src={theme.heroImage}
                  alt=""
                  fill
                  priority
                  quality={90}
                  sizes="100vw"
                  placeholder="blur"
                  blurDataURL={SHIMMER_BLUR_DATA_URL}
                  className="object-cover object-[62%_50%]"
                />
              </div>
              <div className="flex flex-col items-center px-6 py-10 text-center" style={{ backgroundColor: theme.primaryDeep }}>
                {theme.partnerLogo && (
                  <div className="relative mb-5 h-11 w-[124px]">
                    <Image src={theme.partnerLogo} alt={theme.partnerName} fill sizes="124px" quality={90} className="object-contain" />
                  </div>
                )}
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.2em]"
                  style={{ borderColor: `rgba(${theme.accentRgb}, 0.6)`, color: theme.accentSoft }}
                >
                  {t("heroEyebrow")}
                </span>
                <h1 className="mt-4 text-balance font-display text-3xl font-bold tracking-tight">{t("heroTitle")}</h1>
                <p className="mt-2.5 text-balance font-display text-base font-semibold text-white/90">{t("heroSubtitle")}</p>
                <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                  <a
                    href="#featured-collection"
                    className="rounded-full px-5 py-2.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                    style={{ backgroundColor: theme.accentStrong }}
                  >
                    {t("exploreCollection")}
                  </a>
                  <a
                    href="#featured-collection"
                    className="rounded-full border border-white/40 bg-white/10 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20"
                  >
                    {t("orderNow")}
                  </a>
                </div>
              </div>
            </div>

            {/* sm+: full-bleed overlay hero, content over the left negative
               space. `dir="ltr"` lives on THIS outer flex container, not
               just the text column inside it — a flex container's own
               `justify-content`/item placement resolves against ITS OWN
               direction, inherited from the ambient <html dir>, regardless
               of any dir set on a child. Marking only the inner text div
               ltr still left the whole column flex-placed at the RTL
               "start" edge (the right, in Arabic) directly on top of the
               product photography — confirmed via an Arabic screenshot
               before this fix. Pinning dir here fixes placement for the
               image + content together. */}
            <div dir="ltr" className="relative hidden min-h-[480px] items-center sm:flex md:min-h-[560px] lg:min-h-[620px]">
              <Image
                src={theme.heroImage}
                alt=""
                fill
                priority
                quality={90}
                sizes="100vw"
                placeholder="blur"
                blurDataURL={SHIMMER_BLUR_DATA_URL}
                className="object-cover object-[58%_42%] md:object-[55%_45%] lg:object-[52%_48%]"
              />
              {/* Left-biased scrim for text contrast — the photo's own dark
                 Burgundy region already carries most of the contrast; this
                 only reinforces it near the text column and fades to
                 nothing by mid-frame so the product colors on the right
                 stay true, not washed out. */}
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{ background: "linear-gradient(90deg, rgba(20, 8, 14, 0.55) 0%, rgba(20, 8, 14, 0.28) 32%, transparent 58%)" }}
              />
              <div dir="ltr" className="relative z-10 flex max-w-md flex-col items-start px-6 text-left sm:px-10 md:max-w-lg md:px-14 lg:px-20">
                {theme.partnerLogo && (
                  <div className="relative mb-6 h-12 w-[168px] drop-shadow-[0_2px_10px_rgba(0,0,0,0.45)] md:h-14 md:w-[196px]">
                    <Image src={theme.partnerLogo} alt={theme.partnerName} fill sizes="200px" quality={90} className="object-contain" />
                  </div>
                )}
                <span
                  className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em]"
                  style={{ borderColor: `rgba(${theme.accentRgb}, 0.6)`, color: theme.accentSoft }}
                >
                  {t("heroEyebrow")}
                </span>
                <h1 className="mt-5 text-balance font-display text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">{t("heroTitle")}</h1>
                <p className="mt-4 text-balance font-display text-lg font-semibold text-white/90 md:text-xl">{t("heroSubtitle")}</p>
                <div className="mt-8 flex flex-wrap items-center gap-3">
                  <a
                    href="#featured-collection"
                    className="rounded-full px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                    style={{ backgroundColor: theme.accentStrong }}
                  >
                    {t("exploreCollection")}
                  </a>
                  <a
                    href="#featured-collection"
                    className="rounded-full border border-white/40 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20"
                  >
                    {t("orderNow")}
                  </a>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="relative flex min-h-[560px] items-center justify-center overflow-hidden px-5 py-24 text-center">
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{ background: `linear-gradient(155deg, ${theme.primaryDeep} 0%, ${theme.primary} 55%, ${theme.primaryMid} 100%)` }}
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.07]"
              style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1.5px)", backgroundSize: "26px 26px" }}
            />
            <div className="relative flex max-w-2xl flex-col items-center">
              {theme.partnerLogo && (
                <div className="relative mb-6 h-14 w-[196px] sm:h-16 sm:w-[224px]">
                  <Image src={theme.partnerLogo} alt={theme.partnerName} fill sizes="240px" quality={90} className="object-contain" />
                </div>
              )}
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-bold uppercase tracking-[0.2em]"
                style={{ borderColor: `rgba(${theme.accentRgb}, 0.6)`, color: theme.accentSoft }}
              >
                {t("heroEyebrow")}
              </span>
              <h1 className="mt-6 text-balance font-display text-5xl font-bold tracking-tight sm:text-6xl md:text-7xl">{t("heroTitle")}</h1>
              <p className="mt-4 text-balance font-display text-xl font-semibold text-white/90 sm:text-2xl">{t("heroSubtitle")}</p>
              <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
                <a
                  href="#featured-collection"
                  className="rounded-full px-7 py-3.5 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                  style={{ backgroundColor: theme.accentStrong }}
                >
                  {t("exploreCollection")}
                </a>
                <a
                  href="#featured-collection"
                  className="rounded-full border border-white/40 bg-white/10 px-7 py-3.5 text-sm font-bold text-white backdrop-blur-md transition-all duration-300 hover:-translate-y-0.5 hover:bg-white/20"
                >
                  {t("orderNow")}
                </a>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 03 — Brand / editorial intro */}
      <section className="py-16 sm:py-24">
        <div className="container-px mx-auto max-w-2xl text-center">
          <Reveal>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]"
              style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.1)`, color: theme.primaryStrong }}
            >
              {t("introEyebrow")}
            </span>
            <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">{t("introTitle")}</h2>
            <p className="mt-4 leading-relaxed text-ink/70 dark:text-sand/70">{t("introBody")}</p>
          </Reveal>
        </div>
      </section>

      {/* 04 — Featured Collection — real reusable ProductCard/modal, real
          variant selector (the lipstick has 5 shades). */}
      <section id="featured-collection" className="bg-white py-16 dark:bg-white/[0.03] sm:py-24">
        <div className="container-px mx-auto">
          <Reveal>
            <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]"
                style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.1)`, color: theme.primaryStrong }}
              >
                {t("featuredEyebrow")}
              </span>
              <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">{t("featuredTitle")}</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {featured.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                business={MOCK_BUSINESS}
                locale={locale}
                onOpenDetails={() => setSelectedProduct(product)}
                imageFallback={<PartnerProductPlaceholder name={productLocalizedName(product, locale)} category={product.category ? productCategoryLabel(product.category, locale) : undefined} theme={theme} />}
                variant="premium"
                isWishlisted={wishlist.ids.has(product.id)}
                onToggleWishlist={() => wishlist.toggle(product.id)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 04b — Cinematic Product Showcase. Real footage
          (public/images/partners/flormar/video.mp4, source 9:16 vertical) —
          PartnerVideoShowcase's own responsive `aspect-[4/5] sm:aspect-[4/3]`
          + `object-cover` does the crop this needs: full width, never
          stretched, never letterboxed, and (after tuning that component's
          own aspect ratios for exactly this vertical-source case) not
          over-zoomed either — see its own doc comment for the math. */}
      <PartnerVideoShowcase
        theme={theme}
        videoUrl="/images/partners/flormar/video.mp4"
        alt={t("showcaseTitle")}
        eyebrow={t("showcaseEyebrow")}
        title={t("showcaseTitle")}
        description={t("showcaseDescription")}
      />

      {/* 05 — Shop by Category */}
      <section className="py-16 sm:py-24">
        <div className="container-px mx-auto">
          <Reveal>
            <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]"
                style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.1)`, color: theme.primaryStrong }}
              >
                {t("categoryEyebrow")}
              </span>
              <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">{t("categoryTitle")}</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {FLORMAR_MOCK_CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => {
                  const first = productsWithPricing.find((p) => p.category === cat.category);
                  if (first) setSelectedProduct(first);
                }}
                className="group relative aspect-square overflow-hidden rounded-xl3 text-start shadow-soft transition-transform duration-300 hover:-translate-y-1"
              >
                {categoryImages.get(cat.key) && !brokenImageKeys.has(`cat-${cat.key}`) ? (
                  <>
                    {/* `object-contain` on a light canvas, not `cover` — the
                       source is real catalog product photography (plain
                       background, product-only), not lifestyle imagery, so
                       cropping it to fill a square via `cover` would zoom
                       into a fragment of packaging rather than show the
                       product. Same contain+light-canvas treatment the
                       product cards themselves already use for this exact
                       photography, just reused here for consistency. */}
                    <div className="absolute inset-0 bg-[#FBF7F4]" aria-hidden="true" />
                    <Image
                      src={categoryImages.get(cat.key)!}
                      alt={CATEGORY_LABELS[cat.labelKey](t)}
                      fill
                      sizes="(max-width: 639px) 50vw, 25vw"
                      className="object-contain p-6 transition-transform duration-500 group-hover:scale-105"
                      onError={() => markImageBroken(`cat-${cat.key}`)}
                    />
                    <div
                      aria-hidden="true"
                      className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 pt-10"
                    >
                      <p className="font-display text-sm font-bold text-white">{CATEGORY_LABELS[cat.labelKey](t)}</p>
                    </div>
                  </>
                ) : (
                  <PartnerProductPlaceholder name={CATEGORY_LABELS[cat.labelKey](t)} theme={theme} />
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 06 — The Flormar Edit — editorial styling groupings, each linking
          only to real mock products already defined in
          lib/mock-data/flormar.ts (FLORMAR_MOCK_LOOKS). Titles/descriptions
          are generic styling concepts (translated, see editSubtitle),
          explicitly not presented as an official Flormar campaign. */}
      <section className="bg-white py-16 dark:bg-white/[0.03] sm:py-24">
        <div className="container-px mx-auto">
          <Reveal>
            <div className="mx-auto mb-3 max-w-2xl text-center">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]"
                style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.1)`, color: theme.primaryStrong }}
              >
                {t("editEyebrow")}
              </span>
              <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">{t("editTitle")}</h2>
            </div>
            <p className="mx-auto mb-10 max-w-md text-center text-xs text-ink/45 dark:text-sand/45 md:mb-14">{t("editSubtitle")}</p>
          </Reveal>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {FLORMAR_MOCK_LOOKS.map((look) => {
              const products = look.productIds.map((id) => productsWithPricing.find((p) => p.id === id)).filter((p): p is Product => !!p);
              // Real photography from one of this look's own real referenced
              // products — same "no dedicated editorial asset exists, so
              // reuse a real, already-photographed product from the
              // grouping" fix as the category tiles above. Prefers a
              // product that actually has an image (skips the rare
              // imageless one in the group) rather than blindly taking
              // products[0], which previously landed on the placeholder
              // (showing the logo) whenever that first product had no photo.
              const lookImage = products.find((p) => p.image)?.image;
              return (
                <div key={look.key} className="overflow-hidden rounded-xl3 border border-ink/8 shadow-soft dark:border-white/10">
                  <button
                    type="button"
                    onClick={() => products[0] && setSelectedProduct(products[0])}
                    className="relative block aspect-[4/3] w-full"
                  >
                    {lookImage && !brokenImageKeys.has(`look-${look.key}`) ? (
                      <>
                        <div className="absolute inset-0 bg-[#FBF7F4]" aria-hidden="true" />
                        <Image
                          src={lookImage}
                          alt={t(look.titleKey)}
                          fill
                          sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 25vw"
                          className="object-contain p-6"
                          onError={() => markImageBroken(`look-${look.key}`)}
                        />
                      </>
                    ) : (
                      <PartnerProductPlaceholder name={t(look.titleKey)} theme={theme} />
                    )}
                  </button>
                  <div className="p-4">
                    <p className="font-display text-base font-bold">{t(look.titleKey)}</p>
                    <p className="mt-1 text-xs leading-relaxed text-ink/60 dark:text-sand/60">{t(look.descriptionKey)}</p>
                    <button
                      type="button"
                      onClick={() => products[0] && setSelectedProduct(products[0])}
                      className="mt-3 text-xs font-bold uppercase tracking-wide"
                      style={{ color: theme.primaryStrong }}
                    >
                      {t("shopThisLook")} →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 07 — Product Discovery: search + tabs (All / New Arrivals / Best
          Sellers / Offers) + sort, all computed over the same real mock
          product list — reuses the same ProductCard/ProductDetailModal every
          other partner's shop tab uses, nothing product-related duplicated. */}
      <section id="product-discovery" className="py-16 sm:py-24">
        <div className="container-px mx-auto">
          <Reveal>
            <div className="mx-auto mb-10 max-w-2xl text-center md:mb-14">
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]"
                style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.1)`, color: theme.primaryStrong }}
              >
                {t("discoveryEyebrow")}
              </span>
              <h2 className="mt-3 text-balance font-display text-3xl font-extrabold tracking-tight md:text-4xl">{t("discoveryTitle")}</h2>
            </div>
          </Reveal>

          <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
            {(["all", "new", "featured", "offers"] as DiscoveryTab[]).map((tab) => {
              const active = discoveryTab === tab;
              const label = tab === "all" ? t("tabAll") : tab === "new" ? t("tabNew") : tab === "featured" ? t("tabFeatured") : t("tabOffers");
              return (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setDiscoveryTab(tab)}
                  aria-pressed={active}
                  className="rounded-full px-4 py-2 text-sm font-semibold transition-colors"
                  style={
                    active
                      ? { backgroundColor: theme.primaryStrong, color: "#fff" }
                      : { border: `1px solid rgba(${theme.primaryRgb}, 0.25)`, color: theme.primaryStrong }
                  }
                >
                  {label}
                </button>
              );
            })}
          </div>

          {discoveryCategory && (
            <div className="mb-6 flex justify-center">
              <button
                type="button"
                onClick={() => setDiscoveryCategory(null)}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold"
                style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.1)`, color: theme.primaryStrong }}
              >
                {CATEGORY_LABELS[FLORMAR_MOCK_CATEGORIES.find((c) => c.category === discoveryCategory)?.labelKey ?? "makeup"](t)}
                <span aria-hidden="true">×</span>
              </button>
            </div>
          )}

          {/* Search + sort now apply on every tab, including Offers —
             previously hidden whenever discoveryTab === "offers" because
             that tab was hardcoded to always be empty (see below), so
             showing search/sort controls over a permanently-empty state
             would have been pointless. Now that Offers is a real filter
             over real results, hiding them there would be the actual bug:
             Task 11 requires search and sort to keep working on every tab. */}
          <div className="mb-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 sm:max-w-xs">
              <Search size={15} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ink/40" aria-hidden="true" />
              <input
                value={discoveryQuery}
                onChange={(e) => setDiscoveryQuery(e.target.value)}
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
              </select>
            </label>
          </div>

          {/* Real empty state, reached only when discoveryResults is
             genuinely empty after filtering — not hardcoded to fire for
             the "offers" tab regardless of data, which was the actual bug
             (products showing real -37%/-31%/-32% badges elsewhere on this
             page still produced "No offers right now" every time). Offers
             specifically empty still gets its own honest copy; any other
             empty result (e.g. a search query with no matches) gets the
             generic one. */}
          {discoveryTab === "offers" && discoveryResults.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title={t("noOffersTitle")}
              description={t("noOffersBody")}
              action={
                <button
                  type="button"
                  onClick={() => setDiscoveryTab("all")}
                  className="rounded-full px-4 py-2 text-sm font-bold text-white transition-transform hover:-translate-y-0.5"
                  style={{ backgroundColor: theme.primaryStrong }}
                >
                  {t("viewAllProducts")}
                </button>
              }
            />
          ) : discoveryResults.length === 0 ? (
            <EmptyState
              icon={Search}
              title={t("noResultsTitle")}
              description={t("resultsCount", { count: 0 })}
              action={
                discoveryQuery.trim() ? (
                  <button
                    type="button"
                    onClick={() => setDiscoveryQuery("")}
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
              <p className="mb-4 text-sm text-ink/50 dark:text-sand/50">{t("resultsCount", { count: discoveryResults.length })}</p>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                {discoveryResults.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    business={MOCK_BUSINESS}
                    locale={locale}
                    onOpenDetails={() => setSelectedProduct(product)}
                    imageFallback={<PartnerProductPlaceholder name={productLocalizedName(product, locale)} category={product.category ? productCategoryLabel(product.category, locale) : undefined} theme={theme} />}
                    variant="premium"
                    isWishlisted={wishlist.ids.has(product.id)}
                    onToggleWishlist={() => wishlist.toggle(product.id)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      {/* 11 — Store information + Contact/Follow. Physical location is
          still genuinely unconfirmed (storeInfoLocation stays as-is), but
          phone/WhatsApp/Instagram/Facebook/TikTok now render as real,
          working links — sourced from theme.phone/whatsapp/instagram/
          facebook/tiktok (lib/config/partner-themes.ts), the same
          centralized per-partner config every other Flormar visual asset
          already lives in, via the exact same SocialLinks component every
          hotel/restaurant/cafe/city_service detail page already uses for
          this — no new/duplicate contact system. Those config values are
          explicitly placeholders pending the business's real details (see
          that file's own comment) — storeInfoPending stays visible right
          below the buttons as an honest label, not deleted just because
          the buttons now work. */}
      <section className="bg-white py-16 dark:bg-white/[0.03] sm:py-24">
        <div className="container-px mx-auto max-w-xl text-center">
          <Reveal>
            <span
              className="inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-[0.2em]"
              style={{ backgroundColor: `rgba(${theme.primaryRgb}, 0.1)`, color: theme.primaryStrong }}
            >
              {t("storeInfoEyebrow")}
            </span>
            <h2 className="mt-3 font-display text-2xl font-bold">{t("storeInfoTitle")}</h2>
            <p className="mt-1.5 flex items-center justify-center gap-1.5 text-sm text-ink/60 dark:text-sand/60">
              <MapPin size={14} aria-hidden="true" /> {t("storeInfoLocation")}
            </p>

            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              {theme.phone && (
                <a
                  href={`tel:${theme.phone}`}
                  className="rounded-full px-6 py-3 text-sm font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5"
                  style={{ backgroundColor: theme.accentStrong }}
                >
                  {th("call")}
                </a>
              )}
              {theme.whatsapp && (
                <a
                  href={toWhatsAppHref(theme.whatsapp)}
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
              instagram={theme.instagram}
              facebook={theme.facebook}
              tiktok={theme.tiktok}
              labels={{
                instagram: td("followInstagram"),
                facebook: td("followFacebook"),
                tiktok: td("followTiktok"),
              }}
              className="mt-5 justify-center"
            />

            <p className="mx-auto mt-6 max-w-sm text-sm leading-relaxed text-ink/50 dark:text-sand/50">{t("storeInfoPending")}</p>
          </Reveal>
        </div>
      </section>

      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          storeName={MOCK_BUSINESS.businessName}
          business={MOCK_BUSINESS}
          locale={locale}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </>
  );
}
