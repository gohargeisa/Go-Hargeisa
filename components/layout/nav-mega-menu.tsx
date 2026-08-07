"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { ChevronDown, Search, ArrowRight, LayoutGrid } from "lucide-react";
import { m, AnimatePresence, useReducedMotion } from "framer-motion";
import { DynamicIcon } from "@/lib/utils/dynamic-icon";
import { categoryHref, categoryDisplayName } from "@/lib/utils/category-href";
import { useFocusTrap } from "@/lib/hooks/use-focus-trap";
import type { Locale } from "@/lib/i18n/config";
import type { Category } from "@/types";

const ITEM_SELECTOR = "[data-mega-item]";

/**
 * Search + multi-column grid of every non-pinned active category — shared
 * between the desktop dropdown (NavMegaMenu below) and the mobile nav
 * sheet, so filtering/keyboard-nav logic lives in exactly one place.
 */
export function MegaMenuGrid({
  locale,
  categories,
  onNavigate,
  autoFocusSearch = false,
}: {
  locale: Locale;
  categories: Category[];
  onNavigate?: () => void;
  autoFocusSearch?: boolean;
}) {
  const t = useTranslations("nav");
  const [query, setQuery] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return categories;
    return categories.filter((c) => categoryDisplayName(c, locale).toLowerCase().includes(needle));
  }, [categories, query, locale]);

  function onGridKeyDown(e: React.KeyboardEvent) {
    const items = Array.from(gridRef.current?.querySelectorAll<HTMLElement>(ITEM_SELECTOR) ?? []);
    if (items.length === 0) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);

    let nextIndex: number | null = null;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft")
      nextIndex = currentIndex < 0 ? items.length - 1 : (currentIndex - 1 + items.length) % items.length;
    else if (e.key === "Home") nextIndex = 0;
    else if (e.key === "End") nextIndex = items.length - 1;

    if (nextIndex !== null) {
      e.preventDefault();
      items[nextIndex]?.focus();
    }
  }

  return (
    <div>
      <label className="relative block">
        <Search size={15} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-ink/40 dark:text-sand/40" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchCategoriesPlaceholder")}
          autoFocus={autoFocusSearch}
          className="w-full rounded-full border border-ink/12 bg-transparent py-2.5 ps-9 pe-4 text-sm outline-none focus:border-primary dark:border-white/15"
        />
      </label>

      {filtered.length === 0 ? (
        <p className="mt-4 px-1 text-sm text-ink/50 dark:text-sand/50">{t("noCategoriesFound")}</p>
      ) : (
        <div
          ref={gridRef}
          onKeyDown={onGridKeyDown}
          role="group"
          aria-label={t("moreCategoriesLabel")}
          className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-3"
        >
          {filtered.map((category) => (
            <Link
              key={category.id}
              href={categoryHref(locale, category)}
              data-mega-item
              onClick={onNavigate}
              className="group flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-primary/8 hover:text-primary dark:text-white dark:hover:bg-white/10"
            >
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-ink/5 text-ink/60 transition-colors group-hover:bg-primary/15 group-hover:text-primary dark:bg-white/10 dark:text-sand/60"
                aria-hidden="true"
              >
                <DynamicIcon name={category.icon} size={15} />
              </span>
              <span className="truncate">{categoryDisplayName(category, locale)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

/** Desktop-only "More" trigger + dropdown panel. Rendered only when there's
 * at least one non-pinned active category to show. */
export function NavMegaMenu({
  locale,
  categories,
  scrolled,
}: {
  locale: Locale;
  categories: Category[];
  scrolled: boolean;
}) {
  const t = useTranslations("nav");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const reduceMotion = useReducedMotion();
  useFocusTrap(panelRef, open);

  function close() {
    setOpen(false);
    triggerRef.current?.focus();
  }

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlur={(e) => {
        if (!containerRef.current?.contains(e.relatedTarget as Node)) setOpen(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) close();
      }}
    >
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={`relative flex items-center gap-1 rounded-full px-4 py-2 text-[15px] font-medium transition-all duration-300 ease-premium ${
          scrolled
            ? open
              ? "bg-primary/10 text-primary-800"
              : "text-gray-800 hover:text-primary hover:bg-primary/10 dark:text-white/90"
            : open
              ? "bg-white/10 text-white"
              : "text-white hover:text-primary hover:bg-white/10"
        }`}
      >
        <LayoutGrid size={14} aria-hidden="true" />
        {t("more")}
        <ChevronDown size={13} className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <button
              type="button"
              aria-hidden="true"
              tabIndex={-1}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-overlay cursor-default"
            />
            <m.div
              ref={panelRef}
              role="menu"
              aria-label={t("more")}
              initial={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
              animate={reduceMotion ? undefined : { opacity: 1, y: 0, scale: 1 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="glass absolute start-0 top-full z-overlay mt-2 w-[min(90vw,26rem)] rounded-xl3 border border-ink/8 bg-white p-4 shadow-premium-lg dark:border-white/10 dark:bg-ink sm:w-[30rem]"
            >
              <MegaMenuGrid locale={locale} categories={categories} onNavigate={close} autoFocusSearch />

              <Link
                href={`/${locale}/services`}
                onClick={close}
                className="mt-3 flex items-center justify-between rounded-xl border-t border-ink/8 px-3 pt-3 text-sm font-semibold text-primary dark:border-white/10"
              >
                {t("browseAllCategories")}
                <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </m.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
