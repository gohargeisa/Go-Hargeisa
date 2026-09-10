import type { Product } from "@/types";

/**
 * Single source of truth for "does this product have a usable photo?" — the
 * one predicate every product surface (grid card, detail modal, bespoke
 * partner menu) uses to choose between an image-led layout and a clean
 * text-first one.
 *
 * A product whose `image` is unset, empty, or whitespace-only counts as
 * having NO image: the caller must then render name / price / description /
 * variants / add-ons / actions on their own, with no empty image container,
 * no placeholder, and no reserved blank space. This never inspects the URL
 * for reachability — a stored-but-broken link is a data problem for the
 * business to fix by re-uploading, and `ProductImage` still degrades that
 * case to a clean icon rather than the browser's broken-image glyph.
 *
 * Business logos, cover images, hero/banner art and gallery photography are
 * deliberately out of scope here — this is only for per-product catalog
 * imagery.
 */
export function productHasImage(product: Pick<Product, "image">): boolean {
  return typeof product.image === "string" && product.image.trim().length > 0;
}
