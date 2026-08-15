"use client";

import { useState } from "react";
import { cityServiceCategoryImagePath } from "@/lib/config/city-service-category-images";
import type { Category } from "@/types";

/**
 * Single source of truth for which photo a category card should attempt,
 * with runtime fallback — every category-card component uses this instead
 * of reading category.imageUrl (or a hardcoded per-slug path) directly, so
 * an admin's upload/replace/remove in the Admin Dashboard is reflected
 * everywhere automatically, with zero broken-image icons.
 *
 * Three tiers, each only advanced-past on a real <img> load failure (never
 * assumed in advance, since there's no way to know which legacy prepared
 * files exist without trying):
 *  1. The admin-uploaded image (categories.image_url) — the real,
 *     database-driven source this system adds.
 *  2. `legacyPath` if the caller passes one (its own existing hardcoded-by-
 *     convention fallback, e.g. `/images/categories/<slug>.jpg`), else the
 *     shared city-services prepared-photo convention (see
 *     lib/config/city-service-category-images.ts) — kept so a category that
 *     already has a real prepared photo doesn't regress to a plain
 *     icon+gradient the moment this ships, before an admin uploads a
 *     replacement. Never a new hardcoded image, only reuses what already
 *     existed.
 *  3. undefined — caller renders its existing icon+gradient treatment.
 *
 * Each tier's failure is tracked independently (not one shared "last
 * failed" value), so a legacy-tier failure can never make an already-failed
 * custom image get retried, and replacing the admin image naturally retries
 * tier 1 instead of staying stuck on a stale failure.
 */
export function useCategoryImage(category: Pick<Category, "slug" | "imageUrl">, legacyPath?: string) {
  const [failedCustomSrc, setFailedCustomSrc] = useState<string | null>(null);
  const [failedLegacySrc, setFailedLegacySrc] = useState<string | null>(null);
  const legacy = legacyPath ?? cityServiceCategoryImagePath(category.slug);

  const customOk = !!category.imageUrl && category.imageUrl !== failedCustomSrc;
  const legacyOk = !!legacy && legacy !== failedLegacySrc;
  const tier: "custom" | "legacy" | "fallback" = customOk ? "custom" : legacyOk ? "legacy" : "fallback";

  const src = tier === "custom" ? category.imageUrl : tier === "legacy" ? legacy : undefined;
  const showFallback = tier === "fallback";

  function onError() {
    if (tier === "custom") setFailedCustomSrc(category.imageUrl ?? null);
    else if (tier === "legacy") setFailedLegacySrc(legacy ?? null);
  }

  return { src, onError, showFallback };
}
