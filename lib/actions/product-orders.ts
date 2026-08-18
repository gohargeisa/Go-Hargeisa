"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { assertCanManageListing } from "@/lib/actions/business";
import type { OrderableListingType, ProductOrderStatus } from "@/types";

export interface CartOrderItemInput {
  productId: string;
  quantity: number;
  addonIds?: string[];
}

export interface CartOrderInput {
  listingType: OrderableListingType;
  listingId: string;
  items: CartOrderItemInput[];
  customerName: string;
  customerPhone: string;
  fulfillmentType: "delivery" | "pickup";
  deliveryAddress?: string;
  preferredDate?: string;
  recipientName?: string;
  recipientPhone?: string;
  occasion?: string;
  messageNote?: string;
  notes?: string;
  locale?: string;
  /** Idempotency key for this checkout attempt — see CartContext.
   * getOrderAttemptId(). Optional and additive: omitted entirely, the RPC
   * behaves exactly as it does today (no dedup applied to that call). */
  idempotencyKey?: string;
}

export type CartOrderResult =
  | { ok: true; orderReference: string }
  | { ok: false; error: string };

/**
 * Public, anonymous-writable universal order submission — one whole cart (N
 * products from one business) in a single call. Works identically for every
 * OrderableListingType (Restaurant, Cafe, Flower Shop, Perfume Shop, and any
 * future product-selling vertical); the business decides eligibility via
 * ordering_enabled/categories.supports_products, never hardcoded here.
 *
 * Goes through the submit_cart_order() RPC for the same RLS/RETURNING reason
 * submitTableReservation() does — product_orders' SELECT policy only grants
 * read access to the business owner or `user_id = auth.uid()`, which a
 * signed-out shopper never satisfies. Server-side pricing: the RPC looks up
 * each product's current price itself and snapshots it into order_items —
 * the client's cart prices are for display only, never trusted.
 */
export async function submitCartOrder(input: CartOrderInput): Promise<CartOrderResult> {
  const t = await getTranslations({ locale: input.locale ?? "en", namespace: "productOrder" });

  if (!input.customerName.trim() || !input.customerPhone.trim()) {
    return { ok: false, error: t("errorRequired") };
  }
  if (input.fulfillmentType === "delivery" && !input.deliveryAddress?.trim()) {
    return { ok: false, error: t("errorDeliveryAddressRequired") };
  }
  if (input.items.length === 0) {
    return { ok: false, error: t("errorCartEmpty") };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("submit_cart_order", {
      p_listing_type: input.listingType,
      p_listing_id: input.listingId,
      p_customer_name: input.customerName.trim(),
      p_customer_phone: input.customerPhone.trim(),
      p_fulfillment_type: input.fulfillmentType,
      p_delivery_address: input.deliveryAddress?.trim() || null,
      p_preferred_date: input.preferredDate || null,
      p_recipient_name: input.recipientName?.trim() || null,
      p_recipient_phone: input.recipientPhone?.trim() || null,
      p_occasion: input.occasion?.trim() || null,
      p_message_note: input.messageNote?.trim() || null,
      p_notes: input.notes?.trim() || null,
      p_items: input.items.map((i) => ({ product_id: i.productId, quantity: i.quantity, addon_ids: i.addonIds ?? [] })),
      p_idempotency_key: input.idempotencyKey ?? null,
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, orderReference: data ?? "" };
  } catch {
    return { ok: false, error: t("errorGeneric") };
  }
}

/**
 * Owner-side status change (pending -> confirmed -> preparing -> ready ->
 * out_for_delivery -> completed, or cancelled at any point) — same generic
 * ownership guard every other business-dashboard mutation uses.
 * assertCanManageListing already grants the platform admin (role='owner')
 * access regardless of the listing's owner_id, including listings that were
 * never claimed by a business (owner_id null) — an order never becomes
 * invisible just because nobody has claimed the business yet.
 */
export async function updateProductOrderStatus(
  orderId: string,
  listingType: OrderableListingType,
  listingId: string,
  status: ProductOrderStatus,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageListing(listingType, listingId);

  const { error } = await supabase
    .from("product_orders")
    .update({ status, updated_at: new Date().toISOString() } as never)
    .eq("id", orderId)
    .eq("listing_id", listingId);

  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}
