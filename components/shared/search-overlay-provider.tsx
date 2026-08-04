"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Shared open/close state for the full-screen mobile search takeover
 * (see global-search.tsx, which renders the actual overlay). Needed
 * because two independent triggers open the same overlay — the header's
 * search icon and the bottom nav's Explore tab (components/layout/
 * bottom-nav.tsx) — and they're siblings, not parent/child, so plain
 * prop-drilling doesn't reach between them. Deliberately just state, no
 * UI: the overlay itself stays owned by global-search.tsx rather than
 * living here, so this provider doesn't need to know anything about
 * search result rendering.
 */
const SearchOverlayContext = createContext<{ isOpen: boolean; open: () => void; close: () => void } | null>(null);

export function SearchOverlayProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const value = useMemo(() => ({ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }), [isOpen]);

  return <SearchOverlayContext.Provider value={value}>{children}</SearchOverlayContext.Provider>;
}

export function useSearchOverlay() {
  const ctx = useContext(SearchOverlayContext);
  if (!ctx) throw new Error("useSearchOverlay must be used within SearchOverlayProvider");
  return ctx;
}
