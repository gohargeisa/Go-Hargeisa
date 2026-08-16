"use client";

import { useState } from "react";
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
}: {
  src?: string;
  alt: string;
  sizes: string;
  className?: string;
}) {
  const t = useTranslations("products");
  const [errored, setErrored] = useState(false);

  if (!src || errored) {
    return (
      <div className="flex h-full w-full items-center justify-center" role="img" aria-label={t("noImage")}>
        <ImageOff size={28} className="text-ink/25 dark:text-sand/25" aria-hidden="true" />
      </div>
    );
  }

  return <Image src={src} alt={alt} fill sizes={sizes} className={className} onError={() => setErrored(true)} />;
}
