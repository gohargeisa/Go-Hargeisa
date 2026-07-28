"use server";

import { createClient } from "@/lib/supabase/server";
import type { BusinessListingType } from "@/types";

export interface BusinessClaimInput {
  listingType: BusinessListingType;
  listingId: string;
  fullName: string;
  email: string;
  phone?: string;
  message?: string;
}

/**
 * Public, anonymous-writable submission — see business_claims' "Anyone can
 * submit a business claim" INSERT policy (supabase/migrations/
 * 20260728000010_add_business_claims.sql). Reviewed manually by the
 * platform owner; this never mutates the listing's owner_id itself.
 */
export async function submitBusinessClaim(
  input: BusinessClaimInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!input.fullName.trim() || !input.email.trim()) {
    return { ok: false, error: "Name and email are required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("business_claims").insert({
    listing_type: input.listingType,
    listing_id: input.listingId,
    full_name: input.fullName.trim(),
    email: input.email.trim(),
    phone: input.phone?.trim() || null,
    message: input.message?.trim() || null,
  } as never);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
