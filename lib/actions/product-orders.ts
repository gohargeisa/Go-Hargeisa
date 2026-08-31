"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { assertCanManageListing } from "@/lib/actions/business";
import type { OrderableListingType, ProductOrderStatus } from "@/types";

/** What the client actually sends for one selected product option — just
 * the key and the raw value. Everything else (label, valueLabel, price) is
 * always resolved server-side from product_options, exactly like variantId
 * is resolved into a name/price and addonIds are resolved into priced
 * add-ons — the client only ever names what it wants, never what it costs. */
export interface CartOrderOptionInput {
  key: string;
  value: string | string[] | boolean | number;
}

export interface CartOrderItemInput {
  productId: string;
  quantity: number;
  addonIds?: string[];
  /** Present only when the shopper picked a specific shade/finish/size —
   * see ProductVariant (types/index.ts). The RPC re-resolves this
   * server-side (price/name/sku), never trusting anything the client sends
   * beyond the id itself. */
  variantId?: string;
  /** The exact per-product configuration the shopper picked — see
   * ProductOption/SelectedProductOption (types/index.ts). Omit entirely for
   * a product with no configured options. */
  selectedOptions?: CartOrderOptionInput[];
}

export interface CartOrderInput {
  listingType: OrderableListingType;
  listingId: string;
  items: CartOrderItemInput[];
  customerName: string;
  customerPhone: string;
  fulfillmentType: "delivery" | "pickup";
  deliveryAddress?: string;
  /** Raw branch key (e.g. "hargeisa"/"mogadishu") for a multi-branch
   * business — see AddToCartBusiness.branches. Omit entirely for a
   * single-location business; the RPC parameter defaults to null. */
  fulfillmentCity?: string;
  preferredDate?: string;
  /** Free-form time/window (e.g. "14:00") — only ever collected/sent for
   * gift-oriented categories (checkout-form.tsx gates the field itself);
   * the RPC accepts it for any order regardless, same posture as every
   * other optional field here. See
   * 20260831000001_product_order_preferred_time.sql. */
  preferredTime?: string;
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
      p_items: input.items.map((i) => ({
        product_id: i.productId,
        quantity: i.quantity,
        addon_ids: i.addonIds ?? [],
        variant_id: i.variantId ?? null,
        selected_options: (i.selectedOptions ?? []).map((o) => ({ key: o.key, value: o.value })),
      })),
      p_idempotency_key: input.idempotencyKey ?? null,
      p_preferred_time: input.preferredTime?.trim() || null,
      p_fulfillment_city: input.fulfillmentCity?.trim() || null,
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
  const supabase = await assertCanManageListing(listingType, listingId, "orders_manage");

  const { error } = await supabase
    .from("product_orders")
    .update({ status, updated_at: new Date().toISOString() } as never)
    .eq("id", orderId)
    .eq("listing_id", listingId);

  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

/**
 * Owner-side bulk cleanup — deletes every COMPLETED or CANCELLED order for
 * this listing only. Deliberately narrow: the `.in("status", [...])` filter
 * means an active order (pending/confirmed/preparing/ready/
 * out_for_delivery) can never be swept up by this action, no matter what —
 * there is no "delete all" variant. `order_items.order_id` has
 * `on delete cascade` (verified live), so each deleted order's line items
 * are removed automatically; nothing extra to clean up here.
 *
 * Authorization is the same double gate every mutation in this file uses:
 * assertCanManageListing re-verifies ownership server-side, and the
 * existing "Business owners manage their listing product orders" RLS
 * policy (ALL commands, scoped to owner_id = auth.uid()) independently
 * enforces the same boundary at the database level — this required no new
 * migration, since that policy already covers DELETE.
 */
export async function deleteOldProductOrders(
  listingType: OrderableListingType,
  listingId: string,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string; deletedCount?: number }> {
  const supabase = await assertCanManageListing(listingType, listingId, "orders_manage");

  const { data, error } = await supabase
    .from("product_orders")
    .delete()
    .eq("listing_type", listingType)
    .eq("listing_id", listingId)
    .in("status", ["completed", "cancelled"])
    .select("id");

  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true, deletedCount: data?.length ?? 0 };
}

/**
 * Owner-side single-order delete — same authorization and
 * completed/cancelled-only gate as deleteOldProductOrders above, just for
 * one order at a time instead of every eligible one. An active order can
 * never be targeted, no matter what id is passed in.
 */
export async function deleteProductOrder(
  orderId: string,
  listingType: OrderableListingType,
  listingId: string,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageListing(listingType, listingId, "orders_manage");

  const { data, error } = await supabase
    .from("product_orders")
    .delete()
    .eq("id", orderId)
    .eq("listing_type", listingType)
    .eq("listing_id", listingId)
    .in("status", ["completed", "cancelled"])
    .select("id");

  if (error) return { ok: false, error: error.message };
  if (!data || data.length === 0) return { ok: false, error: "Only completed or cancelled orders can be deleted." };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}
