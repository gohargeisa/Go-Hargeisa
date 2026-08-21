"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Store } from "lucide-react";
import { useTranslations } from "next-intl";
import { setActiveBusiness } from "@/lib/actions/business";
import { listingKey } from "@/lib/utils/listing-key";
import type { OwnedListing } from "@/lib/data/business";

/**
 * "My Businesses" — lets a business_owner who manages more than one listing
 * (e.g. one login for both Lavender Café and Lavender Flowers) switch which
 * one the whole /business/* dashboard is scoped to. Purely a UI selector:
 * setActiveBusiness re-derives the user's owned listings server-side and
 * only ever writes the cookie to one of them, so this component itself
 * carries no authorization logic — it just calls the action and refreshes.
 */
export function BusinessSwitcher({ businesses, activeListing }: { businesses: OwnedListing[]; activeListing: OwnedListing }) {
  const t = useTranslations("businessDashboard");
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const activeKey = listingKey(activeListing);

  function onSelect(listing: OwnedListing) {
    setIsOpen(false);
    if (listingKey(listing) === activeKey) return;
    startTransition(async () => {
      const result = await setActiveBusiness(listing.listingType, listing.id);
      if (result.ok) router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        disabled={isPending}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        className="flex items-center gap-1.5 truncate font-display text-lg font-bold disabled:opacity-60"
      >
        <Store size={16} className="shrink-0 text-ink/40 dark:text-sand/40" aria-hidden="true" />
        <span className="truncate">{activeListing.name}</span>
        <ChevronDown size={15} aria-hidden="true" className={`shrink-0 text-ink/40 transition-transform dark:text-sand/40 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} aria-hidden="true" />
          <div
            role="listbox"
            aria-label={t("myBusinesses")}
            className="absolute start-0 top-full z-20 mt-2 w-64 overflow-hidden rounded-2xl border border-ink/10 bg-white py-1.5 text-start shadow-2xl dark:border-white/15 dark:bg-ink"
          >
            <p className="px-3.5 pb-1 pt-1.5 text-[11px] font-bold uppercase tracking-wide text-ink/40 dark:text-sand/40">{t("myBusinesses")}</p>
            {businesses.map((b) => (
              <button
                key={listingKey(b)}
                type="button"
                role="option"
                aria-selected={listingKey(b) === activeKey}
                onClick={() => onSelect(b)}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-start text-sm font-medium transition-colors hover:bg-ink/5 dark:hover:bg-white/5 ${
                  listingKey(b) === activeKey ? "text-primary" : "text-ink dark:text-white"
                }`}
              >
                <span className="min-w-0 flex-1 truncate">{b.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
