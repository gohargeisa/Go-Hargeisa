"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { assertCanManageListing } from "@/lib/actions/business";

export interface ProductOrderInput {
  listingType: "city_service" | "service";
  listingId: string;
  productId?: string;
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
}

export type ProductOrderResult =
  | { ok: true; orderReference: string }
  | { ok: false; error: string };

/**
 * Public, anonymous-writable product order/request — Flower Shops, Perfume
 * Shops, and any other supports_products=true category. Generic over
 * listingType/listingId, same shape as submitTableReservation(): a request
 * the business owner reviews (product_orders defaults to 'pending'), never a
 * real-time order/payment system.
 *
 * Goes through the submit_product_order() RPC for the same RLS/RETURNING
 * reason submitTableReservation() does — product_orders' SELECT policy only
 * grants read access to the business owner or `user_id = auth.uid()`, which
 * a signed-out requester never satisfies.
 */
export async function submitProductOrder(input: ProductOrderInput): Promise<ProductOrderResult> {
  const t = await getTranslations({ locale: input.locale ?? "en", namespace: "productOrder" });

  if (!input.customerName.trim() || !input.customerPhone.trim()) {
    return { ok: false, error: t("errorRequired") };
  }
  if (input.fulfillmentType === "delivery" && !input.deliveryAddress?.trim()) {
    return { ok: false, error: t("errorDeliveryAddressRequired") };
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc("submit_product_order", {
      p_listing_type: input.listingType,
      p_listing_id: input.listingId,
      p_product_id: input.productId || null,
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
    });

    if (error) return { ok: false, error: error.message };
    return { ok: true, orderReference: data ?? "" };
  } catch {
    return { ok: false, error: t("errorGeneric") };
  }
}

/**
 * Owner-side status change (pending -> confirmed/cancelled/completed) — same
 * generic ownership guard every other business-dashboard mutation uses.
 */
export async function updateProductOrderStatus(
  orderId: string,
  listingType: "city_service" | "service",
  listingId: string,
  status: "pending" | "confirmed" | "cancelled" | "completed",
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
