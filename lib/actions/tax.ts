"use server";

import { getEffectiveTaxPolicies } from "@/lib/data/tax-policies";
import { resolveTaxPolicy, calculateTax } from "@/lib/tax/calculate";
import type { OrderableListingType } from "@/types";

export interface CartTaxLineInput {
  productId: string;
  category?: string;
  /** Base price × quantity + this line's own taxable add-ons only — the
   * caller (CheckoutForm) computes this from cart state; see
   * lib/cart/types.ts. */
  taxableLineAmount: number;
}

export interface CartTaxPreview {
  taxableSubtotal: number;
  taxAmount: number;
  /** What taxAmount adds to the grand total — 0 when every applicable
   * policy is inclusive (already inside the displayed prices). */
  totalAdjustment: number;
  /** Blended effective rate across all lines, for display only (e.g.
   * "Tax (5%)") — a mixed cart with differing per-product rates still
   * gets one correct taxAmount, this is just a representative label. */
  effectiveRate: number;
  isExempt: boolean;
  isInclusive: boolean;
  label?: string;
}

/**
 * Public, anonymous-callable checkout preview — mirrors exactly what
 * submit_cart_order() will compute server-side in Postgres (see
 * supabase/migrations/20260906000001_tax_system_and_product_addons.sql),
 * so the number a shopper sees before submitting matches the number the
 * order actually gets charged. This is a PREVIEW ONLY: the RPC
 * independently re-resolves and re-calculates tax at order time from the
 * same tax_policies table — nothing this action returns is trusted or
 * reused by submit_cart_order, so a manipulated client response here
 * cannot change what an order is actually charged.
 */
export async function getCartTaxPreview(listingType: OrderableListingType, listingId: string, lines: CartTaxLineInput[]): Promise<CartTaxPreview> {
  const policies = await getEffectiveTaxPolicies();

  let taxableSubtotal = 0;
  let taxAmount = 0;
  let totalAdjustment = 0;
  let anyInclusive = false;
  let anyExempt = false;
  let label: string | undefined;

  for (const line of lines) {
    const policy = resolveTaxPolicy(policies, { listingType, listingId, category: line.category, productId: line.productId });
    const base = policy.isExempt ? 0 : line.taxableLineAmount;
    const { taxAmount: lineTax, totalAdjustment: lineAdjustment } = calculateTax({ taxableAmount: base, policy });

    taxableSubtotal += base;
    taxAmount += lineTax;
    totalAdjustment += lineAdjustment;
    if (policy.isInclusive) anyInclusive = true;
    if (policy.isExempt) anyExempt = true;
    if (!label && policy.label) label = policy.label;
  }

  return {
    taxableSubtotal,
    taxAmount,
    totalAdjustment,
    effectiveRate: taxableSubtotal > 0 ? taxAmount / taxableSubtotal : 0,
    // "Exempt" is only meaningful to show as the headline state for a
    // single-line/single-policy cart — a mixed cart with one exempt and
    // one taxable line still shows a real tax amount, so this flag is
    // true only when the WHOLE cart resolved exempt (taxAmount stayed 0
    // and at least one line was explicitly exempt).
    isExempt: anyExempt && taxAmount === 0,
    isInclusive: anyInclusive,
    label,
  };
}
