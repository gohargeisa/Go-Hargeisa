"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, m } from "framer-motion";
import { Search, X, Loader2, Hotel, UtensilsCrossed, Coffee, Landmark, Clock, MapPin, TrendingUp } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { searchGlobal, getPopularListingsAction, getSuggestedNeighborhoods } from "@/lib/actions/search";
import type { SearchResultItem, SearchResults } from "@/lib/data/global-search";
import type { Destination } from "@/types";
import { getRecentSearches, addRecentSearch, clearRecentSearches } from "@/lib/mobile/recent-searches";
import { useSearchOverlay } from "@/components/shared/search-overlay-provider";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import { useScrollLock } from "@/lib/hooks/use-scroll-lock";
import { useAndroidBackHandler } from "@/lib/hooks/use-android-back-handler";

const TYPE_ICON = { hotel: Hotel, restaurant: UtensilsCrossed, cafe: Coffee, attraction: Landmark } as const;

const EMPTY: SearchResults = { hotels: [], restaurants: [], cafes: [], attractions: [], total: 0 };

export function GlobalSearch({ locale, scrolled }: { locale: Locale; scrolled: boolean }) {
  const t = useTranslations("search");
  const router = useRouter();
  const { isOpen: open, open: openOverlay, close: closeOverlay } = useSearchOverlay();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [isLoading, setIsLoading] = useState(false);
  const [recent, setRecent] = useState<string[]>([]);
  const [popular, setPopular] = useState<SearchResults>(EMPTY);
  const [neighborhoods, setNeighborhoods] = useState<Destination[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();
  useFocusTrap(dialogRef, open);
  useScrollLock(open);

  useEffect(() => {
    if (!open) return;
    let active = true;
    inputRef.current?.focus();
    getRecentSearches().then((v) => active && setRecent(v));
    // Server Actions reject outright when offline — caught here so opening
    // search offline doesn't throw an unhandled rejection; the overlay just
    // keeps its empty popular/neighborhoods state, which reads fine.
    getPopularListingsAction(locale)
      .then((v) => active && setPopular(v))
      .catch(() => {});
    getSuggestedNeighborhoods()
      .then((v) => active && setNeighborhoods(v))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [open, locale]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(EMPTY);
      setIsLoading(false);
      return;
    }
    let active = true;
    setIsLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      try {
        const next = await searchGlobal(query, locale);
        if (active) setResults(next);
      } catch {
        // Offline or a genuine server error — fall back to "no results"
        // rather than leaving the spinner running forever.
        if (active) setResults(EMPTY);
      } finally {
        if (active) setIsLoading(false);
      }
    }, 300);
    return () => {
      active = false;
      clearTimeout(debounceRef.current);
    };
  }, [query, locale]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Android hardware Back closes the full-screen search takeover.
  useAndroidBackHandler(open, () => close());

  function close() {
    closeOverlay();
    setQuery("");
    setResults(EMPTY);
  }

  function goToResults(q?: string) {
    const value = (q ?? query).trim();
    if (!value) return;
    addRecentSearch(value);
    router.push(`/${locale}/search?q=${encodeURIComponent(value)}`);
    close();
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    goToResults();
  }

  async function onClearRecent() {
    await clearRecentSearches();
    setRecent([]);
  }

  const groups = (
    [
      { key: "hotel", label: t("groupHotels"), items: results.hotels },
      { key: "restaurant", label: t("groupRestaurants"), items: results.restaurants },
      { key: "cafe", label: t("groupCafes"), items: results.cafes },
      { key: "attraction", label: t("groupAttractions"), items: results.attractions },
    ] satisfies { key: SearchResultItem["type"]; label: string; items: SearchResultItem[] }[]
  ).filter((g) => g.items.length > 0);

  const popularGroups = (
    [
      { key: "hotel", label: t("popularHotels"), items: popular.hotels },
      { key: "restaurant", label: t("popularRestaurants"), items: popular.restaurants },
      { key: "cafe", label: t("popularCafes"), items: popular.cafes },
      { key: "attraction", label: t("popularAttractions"), items: popular.attractions },
    ] satisfies { key: SearchResultItem["type"]; label: string; items: SearchResultItem[] }[]
  ).filter((g) => g.items.length > 0);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => (open ? close() : openOverlay())}
        aria-label={t("triggerAriaLabel")}
        className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors active:scale-90 ${
          scrolled ? "text-gray-800 hover:bg-primary/10 dark:text-white/90" : "text-white hover:bg-white/10"
        }`}
      >
        <Search size={19} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop: a plain click-catcher on desktop (matches the existing small
                anchored dropdown), a real dark blurred scrim full-viewport on mobile —
                "dark backdrop, blur background" from the spec. */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-overlay bg-black/55 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none"
              onClick={close}
              aria-hidden="true"
            />
            <m.div
              ref={dialogRef}
              role="dialog"
              aria-modal="true"
              aria-label={t("triggerAriaLabel")}
              initial={{ opacity: 0, y: -24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -24 }}
              transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-0 top-0 z-overlay flex max-h-[100dvh] flex-col overflow-hidden bg-white pt-[env(safe-area-inset-top)] shadow-premium dark:bg-ink lg:absolute lg:inset-x-auto lg:end-0 lg:top-12 lg:max-h-[32rem] lg:w-[24rem] lg:max-w-[92vw] lg:rounded-2xl lg:border lg:border-ink/8 lg:pt-0 lg:dark:border-white/10"
            >
              <form onSubmit={onSubmit} className="flex shrink-0 items-center gap-2 border-b border-ink/8 px-4 py-3.5 dark:border-white/10">
                <Search size={17} className="shrink-0 text-ink/40 dark:text-sand/40" aria-hidden="true" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("placeholder")}
                  className="w-full bg-transparent text-base outline-none placeholder:text-ink/40 dark:placeholder:text-sand/40 lg:text-sm"
                />
                {isLoading && <Loader2 size={14} className="shrink-0 animate-spin text-ink/40" aria-hidden="true" />}
                <button
                  type="button"
                  onClick={close}
                  aria-label={t("closeAriaLabel")}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/5 dark:text-sand/50 dark:hover:bg-white/10 lg:h-8 lg:w-8"
                >
                  <X size={16} aria-hidden="true" />
                </button>
              </form>

              {/* Below this point is the scrollable, keyboard-safe results area —
                  overflow-y-auto + the form above being shrink-0 is what keeps the
                  input reachable above the on-screen keyboard (Capacitor's Keyboard
                  plugin is already configured resize:'body', see capacitor.config.ts). */}
              <div
                className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
                style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
              >
                {!query.trim() ? (
                  <div className="divide-y divide-ink/5 dark:divide-white/5">
                    {recent.length > 0 && (
                      <div className="px-4 py-3">
                        <div className="mb-2 flex items-center justify-between">
                          <p className="text-[11px] font-bold uppercase tracking-wide text-ink/40 dark:text-sand/40">{t("recentSearches")}</p>
                          <button type="button" onClick={onClearRecent} className="text-[11px] font-semibold text-primary hover:underline">
                            {t("clearRecent")}
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {recent.map((q) => (
                            <button
                              key={q}
                              type="button"
                              onClick={() => goToResults(q)}
                              className="inline-flex items-center gap-1.5 rounded-full border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink/70 transition-colors hover:border-primary hover:text-primary active:bg-primary/10 dark:border-white/15 dark:text-sand/70"
                            >
                              <Clock size={12} aria-hidden="true" />
                              {q}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {popularGroups.map((group) => {
                      const Icon = TYPE_ICON[group.key];
                      return (
                        <div key={group.key} className="px-4 py-3">
                          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink/40 dark:text-sand/40">
                            <TrendingUp size={12} aria-hidden="true" />
                            {group.label}
                          </p>
                          <div className="-mx-1 flex gap-0.5 overflow-x-auto pb-1 scrollbar-none sm:mx-0 sm:flex-wrap">
                            {group.items.map((item) => (
                              <Link
                                key={`${item.type}-${item.id}`}
                                href={`/${locale}${item.href}`}
                                onClick={close}
                                className="flex min-w-[9.5rem] items-center gap-2.5 rounded-xl px-2 py-2 transition-colors hover:bg-primary/5 active:bg-primary/10 sm:min-w-0 sm:w-full"
                              >
                                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-ink/5 dark:bg-white/10">
                                  {item.image ? (
                                    <Image src={item.image} alt="" fill sizes="44px" className="object-cover" />
                                  ) : (
                                    <div className="flex h-full w-full items-center justify-center">
                                      <Icon size={16} className="text-ink/30" aria-hidden="true" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold">{item.name}</p>
                                  <p className="truncate text-xs text-ink/50 dark:text-sand/50">{item.subtitle}</p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {neighborhoods.length > 0 && (
                      <div className="px-4 py-3">
                        <p className="mb-2 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-ink/40 dark:text-sand/40">
                          <MapPin size={12} aria-hidden="true" />
                          {t("suggestedNeighborhoods")}
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {neighborhoods.map((d) => (
                            <Link
                              key={d.id}
                              href={`/${locale}/explore/${d.slug}`}
                              onClick={close}
                              className="rounded-full border border-ink/10 px-3 py-1.5 text-xs font-medium text-ink/70 transition-colors hover:border-primary hover:text-primary active:bg-primary/10 dark:border-white/15 dark:text-sand/70"
                            >
                              {d.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {recent.length === 0 && popularGroups.length === 0 && neighborhoods.length === 0 && (
                      <p className="px-4 py-8 text-center text-sm text-ink/45 dark:text-sand/45">{t("prompt")}</p>
                    )}
                  </div>
                ) : results.total === 0 && !isLoading ? (
                  <p className="px-4 py-8 text-center text-sm text-ink/45 dark:text-sand/45">{t("noResults", { query })}</p>
                ) : results.total === 0 && isLoading ? (
                  // Real gap this fills: while typing, isLoading is true and
                  // results.total is still 0 from the previous (or initial)
                  // state until the 300ms-debounced fetch resolves — without
                  // this, the panel showed nothing at all for that window.
                  <div className="animate-pulse space-y-1 px-4 py-3" aria-hidden="true">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-3 py-2">
                        <div className="skeleton h-11 w-11 shrink-0 rounded-lg" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="skeleton h-3 w-3/5 rounded-full" />
                          <div className="skeleton h-2.5 w-2/5 rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  groups.map((group) => {
                    const Icon = TYPE_ICON[group.key];
                    return (
                      <div key={group.key} className="border-b border-ink/5 py-2 last:border-0 dark:border-white/5">
                        <p className="px-4 py-1 text-[11px] font-bold uppercase tracking-wide text-ink/40 dark:text-sand/40">
                          {group.label}
                        </p>
                        {group.items.map((item) => (
                          <Link
                            key={`${item.type}-${item.id}`}
                            href={`/${locale}${item.href}`}
                            onClick={close}
                            className="flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-primary/5 active:bg-primary/10"
                          >
                            <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-ink/5 dark:bg-white/10">
                              {item.image ? (
                                <Image src={item.image} alt="" fill sizes="44px" className="object-cover" />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center">
                                  <Icon size={16} className="text-ink/30" aria-hidden="true" />
                                </div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold">{item.name}</p>
                              <p className="truncate text-xs text-ink/50 dark:text-sand/50">{item.subtitle}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    );
                  })
                )}
              </div>

              {query.trim() && results.total > 0 && (
                <button
                  type="button"
                  onClick={() => goToResults()}
                  className="shrink-0 border-t border-ink/8 px-4 py-3.5 text-center text-xs font-semibold text-primary transition-colors hover:bg-primary/5 active:bg-primary/10 dark:border-white/10"
                  style={{ paddingBottom: "max(0.875rem, env(safe-area-inset-bottom))" }}
                >
                  {t("viewAllResults", { query })}
                </button>
              )}
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
