"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Search, MessageCircle, X } from "lucide-react";
import { productLocalizedName } from "@/lib/utils/product-i18n";
import { toWhatsAppHref } from "@/lib/utils/whatsapp";
import { usePaginatedProducts } from "@/lib/hooks/use-paginated-products";
import type { PartnerTheme } from "@/lib/config/partner-themes";
import type { Locale } from "@/lib/i18n/config";
import type { OrderableListingType, Product, ProductGender } from "@/types";

const PAGE_SIZE = 48;

/**
 * Real server-side pagination/search/filter for Pinnacle's ~190-item real,
 * verified product catalog (`initialProducts`/`initialTotal` are page 1
 * only — see getProductsPageForListing/deriveInitialProductsPage). Split
 * out from PinnacleStorefront (a server component) because filtering/search
 * genuinely needs client interactivity — everything else on that page
 * stays server-rendered. `facets.brands`/`facets.genders` (the distinct
 * values across the WHOLE catalog) come from the server page so the
 * dropdowns still list every real value, not just whatever's on page 1.
 *
 * No price anywhere on this card, by explicit request: `product.price` is
 * still populated in the database (see the population migration) for
 * admin/future-commerce use, but deliberately never read here — the public
 * storefront routes every inquiry through WhatsApp instead of showing a
 * number. Every product's only CTA is `orderOnWhatsappCta`.
 */
export function PinnacleProductGrid({
  theme,
  listingId,
  listingType,
  initialProducts,
  initialTotal,
  facets,
  whatsappNumber,
  locale,
}: {
  theme: PartnerTheme;
  listingId: string;
  listingType: OrderableListingType;
  initialProducts: Product[];
  initialTotal: number;
  facets: { brands: string[]; genders: ProductGender[] };
  whatsappNumber?: string;
  locale: Locale;
}) {
  const t = useTranslations("pinnacleStorefront");
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [gender, setGender] = useState<ProductGender | "all">("all");
  const [brand, setBrand] = useState<string>("all");

  // Debounced — a fetch on every keystroke would be a real "repeated
  // Supabase requests" problem; 350ms after the visitor stops typing is
  // enough to feel instant without querying per character.
  useEffect(() => {
    const id = setTimeout(() => setQuery(queryInput.trim()), 350);
    return () => clearTimeout(id);
  }, [queryInput]);

  const { items: visible, total, loading, hasMore, loadMore } = usePaginatedProducts({
    listingId,
    listingType,
    initialItems: initialProducts,
    initialTotal,
    pageSize: PAGE_SIZE,
    filters: { gender, brandExact: brand, nameQuery: query },
  });

  const hasActiveFilters = queryInput.trim() !== "" || gender !== "all" || brand !== "all";

  function clearFilters() {
    setQueryInput("");
    setQuery("");
    setGender("all");
    setBrand("all");
  }

  const productWhatsappHref = (productName: string) =>
    whatsappNumber ? toWhatsAppHref(whatsappNumber, t("whatsappProductMessage", { product: productName })) : undefined;

  return (
    <div>
      {/* Search + filters */}
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search size={16} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ink/35 dark:text-sand/40" aria-hidden="true" />
          <input
            type="search"
            value={queryInput}
            onChange={(e) => setQueryInput(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="w-full rounded-full border border-ink/12 bg-transparent py-2.5 ps-10 pe-4 text-sm outline-none transition-colors focus:border-current dark:border-white/15"
            style={{ borderColor: queryInput ? theme.accentStrong : undefined }}
            aria-label={t("searchPlaceholder")}
          />
        </div>

        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as ProductGender | "all")}
          className="rounded-full border border-ink/12 bg-transparent px-4 py-2.5 text-sm font-semibold outline-none dark:border-white/15"
        >
          <option value="all">{t("filterAllGenders")}</option>
          {facets.genders.includes("men") && <option value="men">{t("categoryMenTitle")}</option>}
          {facets.genders.includes("women") && <option value="women">{t("categoryWomenTitle")}</option>}
          {facets.genders.includes("unisex") && <option value="unisex">{t("categoryUnisexTitle")}</option>}
        </select>

        <select
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
          className="rounded-full border border-ink/12 bg-transparent px-4 py-2.5 text-sm font-semibold outline-none dark:border-white/15"
        >
          <option value="all">{t("filterAllBrands")}</option>
          {facets.brands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>

        {hasActiveFilters && (
          <button
            type="button"
            onClick={clearFilters}
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/12 px-4 py-2.5 text-sm font-semibold text-ink/60 transition-colors hover:border-current dark:border-white/15 dark:text-sand/60"
          >
            <X size={14} aria-hidden="true" />
            {t("clearFilters")}
          </button>
        )}

        <p className="text-sm font-semibold text-ink/50 dark:text-sand/50 sm:ms-auto">{t("productsCount", { count: total })}</p>
      </div>

      {visible.length === 0 && !loading ? (
        <p className="py-16 text-center text-sm text-ink/50 dark:text-sand/50">{t("noProductsFound")}</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {visible.map((product) => {
              const name = productLocalizedName(product, locale);
              const href = productWhatsappHref(name);
              return (
                <div key={product.id} className="overflow-hidden rounded-xl3 border border-ink/8 shadow-soft dark:border-white/10">
                  <div className="relative aspect-square w-full bg-[#F7F5F2]">
                    {product.image && (
                      <Image
                        src={product.image}
                        alt={name}
                        fill
                        loading="lazy"
                        sizes="(max-width: 639px) 50vw, (max-width: 1023px) 33vw, 25vw"
                        className="object-contain p-4"
                      />
                    )}
                  </div>
                  <div className="p-3.5">
                    {product.brand && (
                      <p className="text-[11px] font-bold uppercase tracking-wide" style={{ color: theme.accentStrong }}>
                        {product.brand}
                      </p>
                    )}
                    <p className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug">{name}</p>
                    {(product.size || product.gender) && (
                      <p className="mt-1 text-xs text-ink/45 dark:text-sand/45">
                        {[product.size, product.gender ? t(`genderLabel_${product.gender}`) : null].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    {href && (
                      <a
                        href={href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-bold text-white transition-all duration-300 hover:-translate-y-0.5"
                        style={{ backgroundColor: "#25D366" }}
                      >
                        <MessageCircle size={13} aria-hidden="true" />
                        {t("orderOnWhatsappCta")}
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {hasMore && (
            <div className="mt-10 flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loading}
                className="rounded-full border px-7 py-3 text-sm font-bold transition-colors disabled:opacity-60"
                style={{ borderColor: `rgba(${theme.primaryRgb}, 0.2)`, color: theme.primaryStrong }}
              >
                {loading ? t("loadingMore") : t("loadMoreCta")}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
