"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { mapTaxPolicy } from "@/lib/data/mappers";
import type { TaxPolicy } from "@/types";

/** Owner-only door — same shape as assertOwner() in lib/actions/access-
 * control.ts and admin.ts. RLS ("Owners manage tax policies" in
 * supabase/migrations/20260906000001_tax_system_and_product_addons.sql)
 * independently enforces the identical rule, so this check is belt-and-
 * suspenders, not the only gate. Platform-wide tax policy is deliberately
 * NOT extended to business_owner — see this migration's own header and the
 * spec it ships against ("Do not expose sensitive tax configuration
 * controls to ordinary business owners"). */
async function assertOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as { role: string } | null)?.role !== "owner") throw new Error("Not authorized.");

  return { supabase, ownerId: user.id };
}

export async function getAllTaxPolicies(): Promise<TaxPolicy[]> {
  const { supabase } = await assertOwner();
  const { data, error } = await supabase.from("tax_policies").select("*").order("scope", { ascending: true }).order("created_at", { ascending: false });
  if (error) return [];
  return (data ?? []).map(mapTaxPolicy);
}

export interface TaxPolicyInput {
  scope: "global" | "category" | "business" | "product";
  category?: string;
  listingType?: string;
  listingId?: string;
  productId?: string;
  rate: number;
  isExempt: boolean;
  isInclusive: boolean;
  isEnabled: boolean;
  label?: string;
  effectiveFrom: string;
  effectiveUntil?: string;
}

function toRow(input: TaxPolicyInput) {
  return {
    scope: input.scope,
    category: input.scope === "category" ? input.category : null,
    listing_type: input.scope === "business" ? input.listingType : null,
    listing_id: input.scope === "business" ? input.listingId : null,
    product_id: input.scope === "product" ? input.productId : null,
    rate: input.isExempt ? 0 : input.rate,
    is_exempt: input.isExempt,
    is_inclusive: input.isInclusive,
    is_enabled: input.isEnabled,
    label: input.label?.trim() || null,
    effective_from: input.effectiveFrom,
    effective_until: input.effectiveUntil || null,
    updated_at: new Date().toISOString(),
  };
}

export async function createTaxPolicy(input: TaxPolicyInput): Promise<{ ok: boolean; error?: string }> {
  const { supabase, ownerId } = await assertOwner();
  const { error } = await supabase.from("tax_policies").insert({ ...toRow(input), created_by: ownerId } as never);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/[locale]/admin/tax-policy", "page");
  return { ok: true };
}

export async function updateTaxPolicy(id: string, input: TaxPolicyInput): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await assertOwner();
  const { error } = await supabase.from("tax_policies").update(toRow(input) as never).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/[locale]/admin/tax-policy", "page");
  return { ok: true };
}

export async function setTaxPolicyEnabled(id: string, isEnabled: boolean): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await assertOwner();
  const { error } = await supabase.from("tax_policies").update({ is_enabled: isEnabled, updated_at: new Date().toISOString() } as never).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/[locale]/admin/tax-policy", "page");
  return { ok: true };
}

export async function deleteTaxPolicy(id: string): Promise<{ ok: boolean; error?: string }> {
  const { supabase } = await assertOwner();
  const { error } = await supabase.from("tax_policies").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/[locale]/admin/tax-policy", "page");
  return { ok: true };
}
