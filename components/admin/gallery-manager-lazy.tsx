"use client";

import dynamic from "next/dynamic";

/**
 * Code-split wrapper around GalleryManager — a large drag-to-reorder/upload
 * widget every listing admin form embeds, but nobody interacts with until
 * they scroll to the gallery section. Every admin form imports this instead
 * of the real component directly, so the split lives in one place.
 */
export const GalleryManager = dynamic(() => import("./gallery-manager").then((m) => m.GalleryManager), {
  ssr: false,
  loading: () => <div className="h-40 animate-pulse rounded-xl2 bg-ink/5 dark:bg-white/5" aria-hidden="true" />,
});
