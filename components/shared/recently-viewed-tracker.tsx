"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { recordVisit, type RecentlyViewedType } from "@/lib/offline/recently-viewed";

/** Mirrors BottomNav's own HIDE_ON route-regex-gating convention. Trailing
 * `$` deliberately excludes sub-routes like /hotels/[slug]/book. */
const DETAIL_PATH_RE = /^\/([a-z]{2})\/(hotels|restaurants|cafes|attractions|city-services)\/([^/]+)$/;

/**
 * Silent (no visual output), mounted once in app/[locale]/layout.tsx.
 * Records a visit to lib/offline/recently-viewed.ts whenever the current
 * route matches a business detail page, by reading the title/og:image the
 * page itself already rendered for social sharing (every detail page sets
 * these via generateMetadata) — no new API or DOM contract needed.
 */
export function RecentlyViewedTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const match = DETAIL_PATH_RE.exec(pathname);
    if (!match) return;
    const [, locale, type, slug] = match;

    const image = document.querySelector('meta[property="og:image"]')?.getAttribute("content") ?? undefined;

    recordVisit({
      path: pathname,
      type: type as RecentlyViewedType,
      slug,
      locale,
      title: document.title,
      image,
    });
  }, [pathname]);

  return null;
}
