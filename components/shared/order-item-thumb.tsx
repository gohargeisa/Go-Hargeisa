import Image from "next/image";
import { ImageOff } from "lucide-react";

/**
 * One order line's product thumbnail — reused by every order-detail surface
 * (business owner ProductOrdersTable, AdminProductOrdersList, and any future
 * one) so image thumbnail/fallback behavior stays identical everywhere
 * instead of being reimplemented per table. Renders nothing but a neutral
 * placeholder box when the order snapshot has no image (item.productImage),
 * matching CartItemRow's existing checkout-side convention — never breaks
 * the row layout when a product's image is missing or was later deleted.
 */
export function OrderItemThumb({ src, alt, size = 40 }: { src?: string; alt: string; size?: number }) {
  return (
    <div
      className="relative shrink-0 overflow-hidden rounded-lg bg-ink/5 dark:bg-white/5"
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt={alt} fill sizes={`${size}px`} className="object-cover" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-ink/25 dark:text-sand/25">
          <ImageOff size={Math.round(size * 0.4)} aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
