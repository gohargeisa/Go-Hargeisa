"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { SubscriptionPlanId } from "@/lib/config/subscription-plans";

const PARTNER_TABLES = ["hotels", "restaurants", "cafes"] as const;
type PartnerTable = (typeof PARTNER_TABLES)[number];

async function assertOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "owner") throw new Error("Not authorized.");

  return supabase;
}

/**
 * Owner-only. Also enforced at the database level (see
 * enforce_partner_status_owner_only in
 * supabase/migrations/20260730000002_partner_status.sql) — this
 * application-level check is just the door; the trigger is what actually
 * stops a business_owner from setting their own status via a direct API call.
 */
export async function setPartnerStatus(
  locale: string,
  table: PartnerTable,
  id: string,
  status: "trial" | "official"
): Promise<{ ok: boolean; error?: string }> {
  if (!PARTNER_TABLES.includes(table)) return { ok: false, error: "Invalid table." };

  const supabase = await assertOwner();

  let error = null;
  switch (table) {
    case "hotels":
      ({ error } = await supabase.from("hotels").update({ partner_status: status }).eq("id", id));
      break;
    case "restaurants":
      ({ error } = await supabase.from("restaurants").update({ partner_status: status }).eq("id", id));
      break;
    case "cafes":
      ({ error } = await supabase.from("cafes").update({ partner_status: status }).eq("id", id));
      break;
  }

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/${locale}/admin/partners`);
  revalidatePath(`/${locale}/business`);
  return { ok: true };
}

/**
 * Owner-only manual plan assignment — there is no payment gateway in this
 * phase, this just sets the plan_tier label the business dashboard reads.
 * RLS backs this up (see 20260730000001_subscription_tiers.sql): only the
 * owner role can UPDATE an existing business_subscriptions row.
 */
export async function assignSubscriptionPlan(
  locale: string,
  table: PartnerTable,
  listingId: string,
  planTier: SubscriptionPlanId
): Promise<{ ok: boolean; error?: string }> {
  if (!PARTNER_TABLES.includes(table)) return { ok: false, error: "Invalid table." };

  const supabase = await assertOwner();
  const listingType = table === "hotels" ? "hotel" : table === "restaurants" ? "restaurant" : "cafe";

  const { error } = await supabase
    .from("business_subscriptions")
    .upsert(
      { listing_type: listingType, listing_id: listingId, plan_tier: planTier } as never,
      { onConflict: "listing_type,listing_id" }
    );

  if (error) return { ok: false, error: error.message };

  revalidatePath(`/${locale}/admin/partners`);
  revalidatePath(`/${locale}/business/subscription`);
  return { ok: true };
}
