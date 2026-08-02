"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, m } from "framer-motion";
import { Search, X, Loader2, Hotel, UtensilsCrossed, Coffee, Landmark } from "lucide-react";
import type { Locale } from "@/lib/i18n/config";
import { searchGlobal } from "@/lib/actions/search";
import type { SearchResultItem, SearchResults } from "@/lib/data/global-search";

const TYPE_ICON = { hotel: Hotel, restaurant: UtensilsCrossed, cafe: Coffee, attraction: Landmark } as const;

const EMPTY: SearchResults = { hotels: [], restaurants: [], cafes: [], attractions: [], total: 0 };

export function GlobalSearch({ locale, scrolled }: { locale: Locale; scrolled: boolean }) {
  const t = useTranslations("search");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(EMPTY);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!query.trim()) {
      setResults(EMPTY);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const next = await searchGlobal(query, locale);
      setResults(next);
      setIsLoading(false);
    }, 300);
    return () => clearTimeout(debounceRef.current);
  }, [query, locale]);

  function close() {
    setOpen(false);
    setQuery("");
    setResults(EMPTY);
  }

  function goToResults() {
    if (!query.trim()) return;
    router.push(`/${locale}/search?q=${encodeURIComponent(query.trim())}`);
    close();
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    goToResults();
  }

  const groups = (
    [
      { key: "hotel", label: t("groupHotels"), items: results.hotels },
      { key: "restaurant", label: t("groupRestaurants"), items: results.restaurants },
      { key: "cafe", label: t("groupCafes"), items: results.cafes },
      { key: "attraction", label: t("groupAttractions"), items: results.attractions },
    ] satisfies { key: SearchResultItem["type"]; label: string; items: SearchResultItem[] }[]
  ).filter((g) => g.items.length > 0);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={t("triggerAriaLabel")}
        className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
          scrolled ? "text-gray-800 hover:bg-primary/10 dark:text-white/90" : "text-white hover:bg-white/10"
        }`}
      >
        <Search size={19} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={close} aria-hidden="true" />
            <m.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="absolute end-0 top-12 z-50 w-[22rem] max-w-[92vw] overflow-hidden rounded-2xl border border-ink/8 bg-white shadow-premium dark:border-white/10 dark:bg-ink"
            >
              <form onSubmit={onSubmit} className="flex items-center gap-2 border-b border-ink/8 px-4 py-3 dark:border-white/10">
                <Search size={16} className="shrink-0 text-ink/40 dark:text-sand/40" aria-hidden="true" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("placeholder")}
                  className="w-full bg-transparent text-sm outline-none placeholder:text-ink/40 dark:placeholder:text-sand/40"
                />
                {isLoading && <Loader2 size={14} className="shrink-0 animate-spin text-ink/40" aria-hidden="true" />}
                <button type="button" onClick={close} aria-label={t("closeAriaLabel")} className="shrink-0 text-ink/40 hover:text-ink dark:text-sand/40">
                  <X size={14} />
                </button>
              </form>

              <div className="max-h-96 overflow-y-auto">
                {!query.trim() ? (
                  <p className="px-4 py-8 text-center text-sm text-ink/45 dark:text-sand/45">{t("prompt")}</p>
                ) : results.total === 0 && !isLoading ? (
                  <p className="px-4 py-8 text-center text-sm text-ink/45 dark:text-sand/45">{t("noResults", { query })}</p>
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
                            className="flex items-center gap-3 px-4 py-2 hover:bg-primary/5"
                          >
                            <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-ink/5 dark:bg-white/10">
                              {item.image ? (
                                <Image src={item.image} alt="" fill sizes="40px" className="object-cover" />
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
                  onClick={goToResults}
                  className="block w-full border-t border-ink/8 px-4 py-3 text-center text-xs font-semibold text-primary hover:bg-primary/5 dark:border-white/10"
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
