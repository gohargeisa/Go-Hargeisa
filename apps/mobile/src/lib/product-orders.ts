/**
 * Product order submission — direct supabase-js RPC, same architecture as
 * lib/reservations.ts and lib/hotel-booking.ts. `submit_cart_order` is
 * "Public, anonymous-writable" and prices everything server-side; the
 * client's numbers (cart.subtotal etc.) are display-only, never trusted
 * (see lib/actions/product-orders.ts on the website).
 */
import { useMutation } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import type { CartItem, CartListingType } from "@/lib/cart";

export interface SubmitOrderInput {
  listingType: CartListingType;
  listingId: string;
  items: CartItem[];
  customerName: string;
  customerPhone: string;
  fulfillmentType: "delivery" | "pickup";
  deliveryAddress?: string;
  preferredDate?: string;
  preferredTime?: string;
  recipientName?: string;
  recipientPhone?: string;
  occasion?: string;
  messageNote?: string;
  notes?: string;
  idempotencyKey?: string;
}

export class OrderError extends Error {}

export function useSubmitCartOrder() {
  return useMutation({
    mutationFn: async (input: SubmitOrderInput): Promise<string> => {
      if (!input.customerName.trim() || !input.customerPhone.trim()) {
        throw new OrderError("Full name and phone number are required.");
      }
      if (input.fulfillmentType === "delivery" && !input.deliveryAddress?.trim()) {
        throw new OrderError("A delivery address is required for delivery orders.");
      }
      if (input.items.length === 0) {
        throw new OrderError("Your cart is empty.");
      }

      // `submit_cart_order` isn't in the generated Database Functions map —
      // same known type-generation gap as the other write RPCs (see
      // lib/reservations.ts's identical comment).
      const { data, error } = await (supabase.rpc as any)("submit_cart_order", {
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
          addon_ids: i.addons.map((a) => a.id),
          variant_id: i.variantId ?? null,
          selected_options: (i.selectedOptions ?? []).map((o) => ({ key: o.key, value: o.value })),
        })),
        p_idempotency_key: input.idempotencyKey ?? null,
        p_preferred_time: input.preferredTime?.trim() || null,
        p_fulfillment_city: null,
      });

      if (error) throw new OrderError(error.message);
      return (data as string | null) ?? "";
    },
  });
}
