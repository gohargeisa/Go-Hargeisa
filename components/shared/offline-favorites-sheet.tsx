"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslations, useLocale } from "next-intl";
import { Building2, Heart, History } from "lucide-react";
import { BottomSheet } from "@/components/shared/bottom-sheet";
import { EmptyState } from "@/components/shared/empty-state";
import { useOfflineFavoritesSheet } from "@/components/shared/offline-favorites-provider";
import { getOfflineFavorites, type OfflineFavorite } from "@/lib/offline/favorites-store";
import { getRecentlyViewed, type RecentlyViewedEntry } from "@/lib/offline/recently-viewed";
import { favoriteHref } from "@/components/dashboard/dashboard-tabs";
import type { Locale } from "@/lib/i18n/config";

type Section = "favorites" | "recentlyViewed";

/** A previously-cached listing photo is very likely a different `/_next/
 * image?...w=` variant than this thumbnail's own size requests (see
 * lib/offline/db.ts / the SW's per-variant image caching — normalizing
 * cache keys across sizes isn't safe), so this can genuinely be offline and
 * uncached. Falls back to a plain icon rather than a broken-image glyph. */
function OfflineThumbnail({ src, alt }: { src?: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  return (
    <span className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-ink/5 dark:bg-white/10">
      {src && !failed ? (
        <Image src={src} alt={alt} fill sizes="56px" className="object-cover" onError={() => setFailed(true)} />
      ) : (
        <Building2 size={20} className="text-ink/30 dark:text-sand/30" aria-hidden="true" />
      )}
    </span>
  );
}

function FavoriteRow({ favorite, locale, onNavigate }: { favorite: OfflineFavorite; locale: Locale; onNavigate: () => void }) {
  return (
    <Link
      href={favoriteHref(locale, favorite.kind, { slug: favorite.slug, category: favorite.category })}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-2xl border border-ink/8 p-2.5 transition-colors hover:border-primary/30 dark:border-white/10"
    >
      <OfflineThumbnail src={favorite.image} alt={favorite.name} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-semibold text-ink dark:text-white">{favorite.name}</span>
        <span className="block truncate text-sm text-ink/55 dark:text-sand/55">{favorite.address}</span>
      </span>
    </Link>
  );
}

function RecentlyViewedRow({ entry, onNavigate }: { entry: RecentlyViewedEntry; onNavigate: () => void }) {
  return (
    <Link
      href={entry.path}
      onClick={onNavigate}
      className="flex items-center gap-3 rounded-2xl border border-ink/8 p-2.5 transition-colors hover:border-primary/30 dark:border-white/10"
    >
      <OfflineThumbnail src={entry.image} alt={entry.title} />
      <span className="min-w-0 flex-1 truncate font-semibold text-ink dark:text-white">{entry.title}</span>
    </Link>
  );
}

/**
 * "Saved for offline" bottom sheet — the offline-reachable substitute for
 * /dashboard?tab=favorites, which is intentionally excluded from the
 * service worker's cache (shared-device privacy, see public/sw.js) and so
 * hard-fails when offline. Reads straight from IndexedDB via
 * lib/offline/favorites-store.ts and lib/offline/recently-viewed.ts — works
 * identically online or offline. Opened from BottomNav's Saved button only
 * while offline (see components/layout/bottom-nav.tsx); the online case
 * still links straight to /dashboard as before.
 */
export function OfflineFavoritesSheet() {
  const t = useTranslations("offline");
  const locale = useLocale() as Locale;
  const { isOpen, close } = useOfflineFavoritesSheet();
  const [section, setSection] = useState<Section>("favorites");
  const [favorites, setFavorites] = useState<OfflineFavorite[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<RecentlyViewedEntry[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    let active = true;
    getOfflineFavorites().then((v) => active && setFavorites(v));
    getRecentlyViewed().then((v) => active && setRecentlyViewed(v));
    return () => {
      active = false;
    };
  }, [isOpen]);

  const tabClass = (active: boolean) =>
    `flex-1 rounded-full py-2 text-sm font-semibold transition-colors ${
      active ? "bg-white text-ink shadow-sm dark:bg-ink dark:text-white" : "text-ink/60 dark:text-sand/60"
    }`;

  return (
    <BottomSheet open={isOpen} onClose={close} title={t("savedSheetTitle")}>
      <div className="mb-4 flex gap-1.5 rounded-full bg-ink/5 p-1 dark:bg-white/10">
        <button type="button" onClick={() => setSection("favorites")} className={tabClass(section === "favorites")}>
          {t("favoritesTabLabel")}
        </button>
        <button type="button" onClick={() => setSection("recentlyViewed")} className={tabClass(section === "recentlyViewed")}>
          {t("recentlyViewedTabLabel")}
        </button>
      </div>

      {section === "favorites" ? (
        favorites.length === 0 ? (
          <EmptyState icon={Heart} title={t("favoritesTabLabel")} description={t("favoritesEmpty")} />
        ) : (
          <ul className="space-y-2.5">
            {favorites.map((favorite) => (
              <li key={favorite.id}>
                <FavoriteRow favorite={favorite} locale={locale} onNavigate={close} />
              </li>
            ))}
          </ul>
        )
      ) : recentlyViewed.length === 0 ? (
        <EmptyState icon={History} title={t("recentlyViewedTabLabel")} description={t("recentlyViewedEmpty")} />
      ) : (
        <ul className="space-y-2.5">
          {recentlyViewed.map((entry) => (
            <li key={entry.path}>
              <RecentlyViewedRow entry={entry} onNavigate={close} />
            </li>
          ))}
        </ul>
      )}
    </BottomSheet>
  );
}
