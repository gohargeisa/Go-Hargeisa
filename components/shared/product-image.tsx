"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { ImageOff } from "lucide-react";

/**
 * Renders a product photo when a valid URL exists; otherwise — or if a
 * stored URL fails to load (broken/inaccessible link) — renders a clean,
 * intentional "no photo" placeholder instead of an empty box or a browser
 * broken-image icon. Most Lavender café-menu products have no `image` at
 * all (the source menu PDF is text/prices only, no photography — nothing
 * to invent here), while every flower product has a real one; this is the
 * one place both cases are resolved, so every product surface (grid card,
 * detail modal) renders them identically.
 *
 * Fills its parent, which must be `position: relative` with a defined size
 * — the same contract next/image's `fill` mode already requires. Adding a
 * real photo later via the business dashboard (ProductsManager, already
 * wired to this same `products.image` column) displays automatically, no
 * code change needed.
 */
export function ProductImage({
  src,
  alt,
  sizes,
  className,
  fallback,
  fit = "cover",
}: {
  src?: string;
  alt: string;
  sizes: string;
  className?: string;
  /** Overrides the plain "no photo" icon below with something richer (e.g.
   * BrandedPlaceholder's name + "photos coming soon" card) — used by
   * partners whose whole catalog is still awaiting photography, where the
   * generic icon alone would read as sparse rather than intentional. Omit
   * for the default icon; every existing caller keeps that unchanged. */
  fallback?: ReactNode;
  /** "cover" (default, unchanged for every existing caller) crops the photo
   * to fill the frame — right for editorial/lifestyle photography. "contain"
   * is opt-in: pads the photo onto a light canvas so nothing is ever
   * cropped, right for catalog/product-only photography (a lipstick, a
   * mascara wand) shot against plain backgrounds, where a "contain" fit is
   * a Flormar-only e-commerce affordance, not a redesign of every product
   * grid on the site. */
  fit?: "cover" | "contain";
}) {
  const t = useTranslations("products");
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    if (fallback) return <>{fallback}</>;
    return (
      <div className="flex h-full w-full items-center justify-center" role="img" aria-label={t("noImage")}>
        <ImageOff size={28} className="text-ink/25 dark:text-sand/25" aria-hidden="true" />
      </div>
    );
  }

  if (fit === "contain") {
    return (
      <div className="relative h-full w-full bg-[#FBF7F4] dark:bg-white/[0.04]">
        <div className="absolute inset-4 sm:inset-5">
          <Image src={src} alt={alt} fill sizes={sizes} className={className ?? "object-contain"} onError={() => setErrored(true)} />
        </div>
      </div>
    );
  }

  return <Image src={src} alt={alt} fill sizes={sizes} className={className} onError={() => setErrored(true)} />;
}
