"use client";

import { useTranslations } from "next-intl";
import { useAndroidBackHandler } from "@/lib/hooks/use-android-back-handler";

/** "Your cart has items from another business" confirmation — ONE CART = ONE
 * BUSINESS is enforced in lib/cart/cart-context.tsx's addItem(); this is the
 * UI half, shown whenever addItem() returns "conflict". */
export function CartConflictDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  const t = useTranslations("cart");
  // Android hardware Back dismisses the prompt without clearing the cart.
  useAndroidBackHandler(true, onCancel);

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onCancel} aria-hidden="true" />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-label={t("crossBusinessTitle")}
        className="relative w-full max-w-sm rounded-3xl bg-white p-6 shadow-2xl dark:bg-ink"
      >
        <p className="font-display text-lg font-bold">{t("crossBusinessTitle")}</p>
        <p className="mt-2 text-sm text-ink/70 dark:text-sand/70">{t("crossBusinessBody")}</p>
        <div className="mt-5 flex gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-ink/15 py-2.5 text-sm font-semibold dark:border-white/20"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="flex-1 rounded-full bg-primary-700 py-2.5 text-sm font-semibold text-white hover:bg-primary-800"
          >
            {t("clearAndContinue")}
          </button>
        </div>
      </div>
    </div>
  );
}
