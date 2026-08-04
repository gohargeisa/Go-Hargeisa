"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

/**
 * Shared open/close state for the offline "Saved for offline" sheet —
 * modeled directly on search-overlay-provider.tsx, for the same structural
 * reason: BottomNav's Saved button (a sibling, not a parent) needs to open
 * a sheet owned by offline-favorites-sheet.tsx, so plain prop-drilling
 * doesn't reach between them.
 */
const OfflineFavoritesContext = createContext<{ isOpen: boolean; open: () => void; close: () => void } | null>(null);

export function OfflineFavoritesProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const value = useMemo(() => ({ isOpen, open: () => setIsOpen(true), close: () => setIsOpen(false) }), [isOpen]);

  return <OfflineFavoritesContext.Provider value={value}>{children}</OfflineFavoritesContext.Provider>;
}

export function useOfflineFavoritesSheet() {
  const ctx = useContext(OfflineFavoritesContext);
  if (!ctx) throw new Error("useOfflineFavoritesSheet must be used within OfflineFavoritesProvider");
  return ctx;
}
