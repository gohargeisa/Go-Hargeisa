import type { EffectiveTaxPolicy, TaxPolicy } from "@/types";

/**
 * Platform tax engine — pure functions only, no DB access (see
 * lib/data/tax-policies.ts for fetching, lib/actions/tax.ts for the
 * client-facing preview action). Mirrors resolve_tax_policy() /
 * submit_cart_order()'s tax math in
 * supabase/migrations/20260906000001_tax_system_and_product_addons.sql
 * exactly — that SQL function is the actual authority for a placed order;
 * this module exists so the checkout UI can show the same number *before*
 * submitting, without waiting on a round trip for every keystroke. If you
 * change the resolution/math here, change the SQL function the same way,
 * or the preview and the real order total will silently disagree.
 *
 * No tax rate is ever hardcoded here — every number this module produces
 * comes from a TaxPolicy row the caller passed in. An empty/no-match input
 * always resolves to 0% (see resolveTaxPolicy's final fallback), never an
 * invented rate.
 */

export interface TaxResolutionContext {
  listingType: string;
  listingId: string;
  /** A product's own `category`, or undefined for a business-level/no-
   * product resolution (e.g. a generic preview before any item is added). */
  category?: string;
  productId?: string;
}

/**
 * Same hierarchy as resolve_tax_policy() in SQL, most specific first:
 *   1. Explicit exemption at any scope, most-specific-first (product >
 *      business > category > global) — an exemption always wins over any
 *      less specific rate.
 *   2. Product-level rate.
 *   3. Business-level rate.
 *   4. Category-level rate.
 *   5. Global/platform default.
 *   6. Nothing enabled/matching → 0%, not exempt, not inclusive, no label.
 *
 * `policies` should already be filtered to `isEnabled` rows whose
 * effective window covers "now" — see lib/data/tax-policies.ts. This
 * function only does scope/specificity resolution, not date filtering, so
 * it stays trivially unit-testable with a fixed clock.
 */
export function resolveTaxPolicy(policies: TaxPolicy[], ctx: TaxResolutionContext): EffectiveTaxPolicy {
  const candidates = policies
    .filter((p) => {
      if (p.scope === "product") return p.productId === ctx.productId;
      if (p.scope === "business") return p.listingType === ctx.listingType && p.listingId === ctx.listingId;
      if (p.scope === "category") return ctx.category != null && p.category === ctx.category;
      return p.scope === "global";
    })
    .map((p) => ({ ...p, specificity: p.scope === "product" ? 1 : p.scope === "business" ? 2 : p.scope === "category" ? 3 : 4 }))
    .sort((a, b) => a.specificity - b.specificity || +new Date(b.effectiveFrom) - +new Date(a.effectiveFrom));

  const exempt = candidates.find((p) => p.isExempt);
  if (exempt) return { rate: exempt.rate, isExempt: true, isInclusive: exempt.isInclusive, label: exempt.label };

  const match = candidates[0];
  if (match) return { rate: match.rate, isExempt: false, isInclusive: match.isInclusive, label: match.label };

  return { rate: 0, isExempt: false, isInclusive: false };
}

export interface TaxCalculationInput {
  /** Base item price × quantity, summed across taxable lines only —
   * exempt lines and non-taxable add-ons are never part of this. */
  taxableAmount: number;
  policy: EffectiveTaxPolicy;
}

export interface TaxCalculationResult {
  taxAmount: number;
  /** How much `taxAmount` adds to whatever total it's combined with — 0
   * for an inclusive policy (the amount is already inside the price), the
   * same as taxAmount for exclusive. Use this, not taxAmount directly,
   * when building a grand total, to avoid double-counting inclusive tax. */
  totalAdjustment: number;
}

/** Rounds to cents, same as the SQL function's `round(x, 2)`. */
function roundCents(n: number): number {
  return Math.round(n * 100) / 100;
}

export function calculateTax({ taxableAmount, policy }: TaxCalculationInput): TaxCalculationResult {
  if (policy.isExempt || policy.rate === 0 || taxableAmount <= 0) {
    return { taxAmount: 0, totalAdjustment: 0 };
  }
  if (policy.isInclusive) {
    // The rate describes tax already folded into `taxableAmount` — the
    // portion is taxableAmount * rate / (1 + rate), never added again.
    const taxAmount = roundCents((taxableAmount * policy.rate) / (1 + policy.rate));
    return { taxAmount, totalAdjustment: 0 };
  }
  const taxAmount = roundCents(taxableAmount * policy.rate);
  return { taxAmount, totalAdjustment: taxAmount };
}
