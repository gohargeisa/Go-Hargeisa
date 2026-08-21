"use client";

import Image from "next/image";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/lib/cart/cart-context";
import { lineTotal, type CartItem } from "@/lib/cart/types";
import type { Locale } from "@/lib/i18n/config";

function localizedItemName(item: CartItem, locale: string): string {
  return (locale === "ar" && item.nameAr) || (locale === "so" && item.nameSo) || item.name;
}

export function CartItemRow({ item, locale }: { item: CartItem; locale: Locale }) {
  const cart = useCart();
  const name = localizedItemName(item, locale);

  return (
    <div className="flex gap-3 py-3">
      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-ink/5 dark:bg-white/5">
        {item.image && <Image src={item.image} alt={name} fill sizes="64px" className="object-cover" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{name}</p>
        {item.variantName && <p className="truncate text-xs text-ink/60 dark:text-sand/60">{item.variantName}</p>}
        {item.addons.length > 0 && (
          <p className="truncate text-xs text-ink/50 dark:text-sand/50">{item.addons.map((a) => a.name).join(", ")}</p>
        )}
        <p className="mt-0.5 text-xs text-ink/50 dark:text-sand/50">${item.unitPrice.toFixed(2)}</p>
        <div className="mt-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => cart.setQuantity(item.key, item.quantity - 1)}
              aria-label="Decrease quantity"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 hover:border-primary hover:text-primary dark:border-white/20"
            >
              <Minus size={12} aria-hidden="true" />
            </button>
            <span className="w-5 text-center text-sm font-bold">{item.quantity}</span>
            <button
              type="button"
              onClick={() => cart.setQuantity(item.key, item.quantity + 1)}
              aria-label="Increase quantity"
              className="flex h-7 w-7 items-center justify-center rounded-full border border-ink/15 hover:border-primary hover:text-primary dark:border-white/20"
            >
              <Plus size={12} aria-hidden="true" />
            </button>
          </div>
          <p className="text-sm font-bold">${lineTotal(item).toFixed(2)}</p>
        </div>
      </div>
      <button
        type="button"
        onClick={() => cart.removeItem(item.key)}
        aria-label="Remove item"
        className="h-fit shrink-0 rounded-full p-1.5 text-ink/40 hover:bg-red-50 hover:text-red-500 dark:text-sand/40 dark:hover:bg-red-400/10"
      >
        <Trash2 size={15} aria-hidden="true" />
      </button>
    </div>
  );
}
