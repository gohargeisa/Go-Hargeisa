import { cache } from "react";
import { createPublicClient } from "@/lib/supabase/public";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapTaxPolicy } from "./mappers";
import type { TaxPolicy } from "@/types";

/**
 * Every currently-effective, enabled tax policy — global, category,
 * business, and product scopes together, unfiltered by which listing is
 * asking (the caller resolves the applicable one via
 * lib/tax/calculate.ts's resolveTaxPolicy()). Small table by design (a
 * handful of rows per real-world market/category, not one per listing), so
 * fetching everything once and resolving client-side is simpler and cheaper
 * than a parameterized query per listing — and lets the checkout preview
 * resolve instantly for every item in a mixed cart without N round trips.
 *
 * Public RLS ("Public can read enabled tax policies") already filters to
 * is_enabled = true; the effective-date window (effective_from/until) is
 * still checked here since RLS can't easily express "< now()" without a
 * volatile function, and the exact same date-window rule must match
 * resolve_tax_policy()'s SQL-side check for the preview to ever agree with
 * the real order.
 */
async function _getEffectiveTaxPolicies(): Promise<TaxPolicy[]> {
  if (!isSupabaseConfigured()) return [];

  const supabase = createPublicClient();
  const { data, error } = await supabase.from("tax_policies").select("*").eq("is_enabled", true);

  if (error) {
    // Missing table (migration not yet applied in this environment)
    // degrades to "no tax configured" — the same safe 0%-and-never-invent-
    // a-rate behavior resolveTaxPolicy() falls back to with an empty list.
    if (process.env.NODE_ENV === "development") console.error("getEffectiveTaxPolicies:", error.message);
    return [];
  }

  const now = Date.now();
  return (data ?? [])
    .map(mapTaxPolicy)
    .filter((p) => new Date(p.effectiveFrom).getTime() <= now && (!p.effectiveUntil || new Date(p.effectiveUntil).getTime() > now));
}

export const getEffectiveTaxPolicies = cache(_getEffectiveTaxPolicies);
