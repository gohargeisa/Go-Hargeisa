"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertCanManageListing } from "@/lib/actions/business";
import type { PurchaseRequestStatus } from "@/types";

export interface CreatePurchaseRequestInput {
  listingId: string;
  customerName: string;
  customerPhone: string;
  productName: string;
  productUrl?: string;
  platform: "shein" | "amazon" | "noon" | "iherb" | "alibaba" | "other";
  quantity: number;
  size?: string;
  color?: string;
  variant?: string;
  deliveryLocation: string;
  notes?: string;
  imageUrl?: string;
}

export type CreatePurchaseRequestResult = { ok: true; requestId: string } | { ok: false; error: string };

/**
 * Customer-facing — creates a purchase (buy-for-me) request. Unlike
 * submitTableReservation, this doesn't need the RPC-around-a-RETURNING-select
 * workaround: the customer is always signed in here (requests are tracked
 * in their own dashboard, never anonymous), so the SELECT policy
 * ("Customers view their own purchase requests", user_id = auth.uid())
 * is already satisfied by the same request that just inserted the row.
 */
export async function createPurchaseRequest(input: CreatePurchaseRequestInput): Promise<CreatePurchaseRequestResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  if (!input.customerName.trim() || !input.customerPhone.trim()) {
    return { ok: false, error: "Name and phone are required." };
  }
  if (!input.productName.trim()) {
    return { ok: false, error: "Product name is required." };
  }
  if (!input.deliveryLocation.trim()) {
    return { ok: false, error: "Delivery location is required." };
  }
  if (!input.productUrl?.trim() && !input.imageUrl?.trim()) {
    return { ok: false, error: "Provide a product link, a screenshot, or both." };
  }
  if (input.productUrl?.trim()) {
    try {
      new URL(input.productUrl.trim());
    } catch {
      return { ok: false, error: "That product link doesn't look like a valid URL." };
    }
  }
  if (input.quantity < 1 || input.quantity > 50) {
    return { ok: false, error: "Quantity must be between 1 and 50." };
  }

  // The target listing must be a published city_service whose category has
  // opted into purchase requests (categories.supports_purchase_requests) —
  // same capability-flag gate business-sidebar.tsx already reads to decide
  // whether to show the "Requests" nav item, enforced here server-side so a
  // request can't be created against an arbitrary/ineligible listing just
  // because its id is known. Mirrors the same eligibility check already
  // used by product_orders' RLS insert policy (categories.supports_products).
  const { data: listing } = await supabase
    .from("city_services")
    .select("status, categories(supports_purchase_requests)")
    .eq("id", input.listingId)
    .single();
  const eligible = listing as { status: string; categories: { supports_purchase_requests: boolean } | null } | null;
  if (!eligible || eligible.status !== "published" || !eligible.categories?.supports_purchase_requests) {
    return { ok: false, error: "This listing is not accepting purchase requests." };
  }

  const { data, error } = await supabase
    .from("purchase_requests")
    .insert({
      listing_type: "city_service",
      listing_id: input.listingId,
      user_id: user.id,
      customer_name: input.customerName.trim(),
      customer_phone: input.customerPhone.trim(),
      product_name: input.productName.trim(),
      product_url: input.productUrl?.trim() || null,
      platform: input.platform,
      quantity: input.quantity,
      size: input.size?.trim() || null,
      color: input.color?.trim() || null,
      variant: input.variant?.trim() || null,
      delivery_location: input.deliveryLocation.trim(),
      notes: input.notes?.trim() || null,
      image_url: input.imageUrl || null,
    } as never)
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message ?? "Could not submit your request." };
  return { ok: true, requestId: (data as { id: string }).id };
}

/**
 * Customer explicitly approves or declines a ready quote. The narrow RLS
 * update policy (only rows they own, only while status = 'quote_ready')
 * plus the enforce_purchase_request_customer_update() trigger (which
 * silently reverts any column other than status/updated_at and rejects any
 * transition except quote_ready -> approved/declined) do the real
 * enforcement — this action only needs to attempt the update as the
 * signed-in customer and surface whatever the database allows or rejects.
 */
export async function respondToQuote(requestId: string, response: "approved" | "declined"): Promise<{ ok: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  const { error } = await supabase
    .from("purchase_requests")
    .update({ status: response } as never)
    .eq("id", requestId)
    .eq("user_id", user.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/dashboard/requests/" + requestId);
  return { ok: true };
}

export interface QuoteInput {
  quotedProductCost?: number;
  quotedShippingCost?: number;
  quotedCustomsFee?: number;
  quotedServiceFee?: number;
  quoteExpiresAt?: string;
  partnerNotesCustomer?: string;
}

/**
 * Business owner submits/updates a quote — flips status to 'quote_ready'.
 * Total is computed server-side from whichever fee fields were actually
 * filled in, never trusted from the client, and never guessed when a
 * partner hasn't reviewed the request yet (see purchase-request-form's own
 * "never auto-calculate" rule from the project brief).
 */
export async function submitQuote(
  requestId: string,
  listingId: string,
  quote: QuoteInput,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageListing("city_service", listingId, "orders_manage");

  const total =
    (quote.quotedProductCost ?? 0) + (quote.quotedShippingCost ?? 0) + (quote.quotedCustomsFee ?? 0) + (quote.quotedServiceFee ?? 0);

  const { data: existing } = await supabase.from("purchase_requests").select("status").eq("id", requestId).single();
  const previousStatus = (existing as { status: PurchaseRequestStatus } | null)?.status;

  const { error } = await supabase
    .from("purchase_requests")
    .update({
      status: "quote_ready",
      quoted_product_cost: quote.quotedProductCost ?? null,
      quoted_shipping_cost: quote.quotedShippingCost ?? null,
      quoted_customs_fee: quote.quotedCustomsFee ?? null,
      quoted_service_fee: quote.quotedServiceFee ?? null,
      quoted_total: total,
      quote_expires_at: quote.quoteExpiresAt || null,
      partner_notes_customer: quote.partnerNotesCustomer?.trim() || null,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", requestId)
    .eq("listing_id", listingId);

  if (error) return { ok: false, error: error.message };

  if (previousStatus && previousStatus !== "quote_ready") {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("purchase_request_status_history").insert({
      request_id: requestId,
      old_status: previousStatus,
      new_status: "quote_ready",
      changed_by: user?.id ?? null,
    } as never);
  }

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

const MANAGEABLE_STATUSES: PurchaseRequestStatus[] = [
  "reviewing", "ordered", "shipped", "in_transit", "ready_for_delivery", "completed", "cancelled", "rejected",
];

/** Owner/admin status change for everything except the quote step itself
 * (submitQuote above) and the customer's own approve/decline (respondToQuote). */
export async function updatePurchaseRequestStatus(
  requestId: string,
  listingId: string,
  status: PurchaseRequestStatus,
  revalidatePaths: string[],
  internalNote?: string
): Promise<{ ok: boolean; error?: string }> {
  if (!MANAGEABLE_STATUSES.includes(status)) return { ok: false, error: "Invalid status." };

  const supabase = await assertCanManageListing("city_service", listingId, "orders_manage");

  const { data: existing } = await supabase.from("purchase_requests").select("status").eq("id", requestId).single();
  const previousStatus = (existing as { status: PurchaseRequestStatus } | null)?.status;

  const { error } = await supabase
    .from("purchase_requests")
    .update({
      status,
      ...(internalNote?.trim() ? { partner_notes_internal: internalNote.trim() } : {}),
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", requestId)
    .eq("listing_id", listingId);

  if (error) return { ok: false, error: error.message };

  if (previousStatus && previousStatus !== status) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    await supabase.from("purchase_request_status_history").insert({
      request_id: requestId,
      old_status: previousStatus,
      new_status: status,
      changed_by: user?.id ?? null,
    } as never);
  }

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}
