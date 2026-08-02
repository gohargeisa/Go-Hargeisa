"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { accountVerifiedEmail } from "@/lib/email/templates";
import { logActivity } from "./activity";
import type { Locale } from "@/lib/i18n/config";
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

  const { data: before } = await supabase.from(table).select("partner_status, owner_id, name").eq("id", id).single();
  const previous = before as { partner_status: "trial" | "official"; owner_id: string | null; name: string } | null;

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

  // Email notification — best-effort, only on trial -> official ("account
  // verification"), gated by the owner's notify_activity preference.
  if (status === "official" && previous?.partner_status === "trial" && previous.owner_id) {
    const { data: ownerProfile } = await supabase.from("profiles").select("notify_activity").eq("id", previous.owner_id).single();
    if ((ownerProfile as { notify_activity: boolean } | null)?.notify_activity ?? true) {
      const { data: ownerUser } = await createAdminClient().auth.admin.getUserById(previous.owner_id);
      if (ownerUser?.user?.email) {
        const { subject, html } = accountVerifiedEmail(locale as Locale, previous.name);
        await sendEmail({ to: ownerUser.user.email, subject, html });
      }
    }
  }

  await logActivity("update", "partner_status", id, { table, status });
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

  await logActivity("update", "subscription", listingId, { table, planTier });
  revalidatePath(`/${locale}/admin/partners`);
  revalidatePath(`/${locale}/business/subscription`);
  return { ok: true };
}

/**
 * Owner-only lifecycle control (activate/pause/cancel). Same RLS story as
 * assignSubscriptionPlan above — only the owner role can UPDATE an existing
 * business_subscriptions row, so this is already database-enforced, not
 * just hidden from the UI.
 */
export async function setSubscriptionStatus(
  locale: string,
  table: PartnerTable,
  listingId: string,
  status: "active" | "paused" | "cancelled"
): Promise<{ ok: boolean; error?: string }> {
  if (!PARTNER_TABLES.includes(table)) return { ok: false, error: "Invalid table." };

  const supabase = await assertOwner();
  const listingType = table === "hotels" ? "hotel" : table === "restaurants" ? "restaurant" : "cafe";

  const { error } = await supabase
    .from("business_subscriptions")
    .upsert({ listing_type: listingType, listing_id: listingId, status } as never, {
      onConflict: "listing_type,listing_id",
    });

  if (error) return { ok: false, error: error.message };

  await logActivity("update", "subscription_status", listingId, { table, status });
  revalidatePath(`/${locale}/admin/partners`);
  revalidatePath(`/${locale}/business/subscription`);
  return { ok: true };
}

/** Owner-only. Sets renews_at directly to a new date ("extend manually" — no
 * payment gateway means there's no automatic renewal to extend). */
export async function extendSubscription(
  locale: string,
  table: PartnerTable,
  listingId: string,
  newRenewsAt: string
): Promise<{ ok: boolean; error?: string }> {
  if (!PARTNER_TABLES.includes(table)) return { ok: false, error: "Invalid table." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(newRenewsAt)) return { ok: false, error: "Invalid date." };

  const supabase = await assertOwner();
  const listingType = table === "hotels" ? "hotel" : table === "restaurants" ? "restaurant" : "cafe";

  const { error } = await supabase
    .from("business_subscriptions")
    .upsert(
      { listing_type: listingType, listing_id: listingId, renews_at: newRenewsAt } as never,
      { onConflict: "listing_type,listing_id" }
    );

  if (error) return { ok: false, error: error.message };

  await logActivity("update", "subscription_renewal", listingId, { table, newRenewsAt });
  revalidatePath(`/${locale}/admin/partners`);
  revalidatePath(`/${locale}/business/subscription`);
  return { ok: true };
}

/** Owner-only internal note, never exposed to the business owner — see
 * business_subscription_notes RLS in
 * supabase/migrations/20260730000005_subscription_lifecycle.sql. */
export async function addSubscriptionNote(
  locale: string,
  table: PartnerTable,
  listingId: string,
  note: string
): Promise<{ ok: boolean; error?: string }> {
  if (!PARTNER_TABLES.includes(table)) return { ok: false, error: "Invalid table." };
  const trimmed = note.trim();
  if (!trimmed) return { ok: false, error: "Note can't be empty." };

  const supabase = await assertOwner();
  const listingType = table === "hotels" ? "hotel" : table === "restaurants" ? "restaurant" : "cafe";

  const { data: sub, error: subError } = await supabase
    .from("business_subscriptions")
    .upsert(
      { listing_type: listingType, listing_id: listingId } as never,
      { onConflict: "listing_type,listing_id", ignoreDuplicates: false }
    )
    .select("id")
    .single();

  if (subError || !sub) return { ok: false, error: subError?.message ?? "Could not find subscription." };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("business_subscription_notes")
    .insert({ subscription_id: sub.id, note: trimmed, created_by: user?.id ?? null } as never);

  if (error) return { ok: false, error: error.message };

  await logActivity("create", "subscription_note", listingId, { table });
  revalidatePath(`/${locale}/admin/partners`);
  return { ok: true };
}

/** Owner-only. Sets/pushes a trial partner's expiry date forward. Only
 * meaningful while partner_status = 'trial' — this doesn't validate that,
 * since setting it on an official listing is harmless (simply unused). */
export async function extendTrial(
  locale: string,
  table: PartnerTable,
  id: string,
  newExpiresAt: string
): Promise<{ ok: boolean; error?: string }> {
  if (!PARTNER_TABLES.includes(table)) return { ok: false, error: "Invalid table." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(newExpiresAt)) return { ok: false, error: "Invalid date." };

  const supabase = await assertOwner();

  let error = null;
  switch (table) {
    case "hotels":
      ({ error } = await supabase.from("hotels").update({ trial_expires_at: newExpiresAt } as never).eq("id", id));
      break;
    case "restaurants":
      ({ error } = await supabase.from("restaurants").update({ trial_expires_at: newExpiresAt } as never).eq("id", id));
      break;
    case "cafes":
      ({ error } = await supabase.from("cafes").update({ trial_expires_at: newExpiresAt } as never).eq("id", id));
      break;
  }

  if (error) return { ok: false, error: error.message };

  await logActivity("update", "trial_extended", id, { table, newExpiresAt });
  revalidatePath(`/${locale}/admin/partners`);
  return { ok: true };
}

/** Owner-only. Marks a trial as expired effective immediately (sets
 * trial_expires_at to now). This only records that the trial period is
 * over — it does not automatically hide the listing; Hide is a separate,
 * explicit action so the owner decides what happens to an expired trial
 * rather than it disappearing from the site on its own. */
export async function expireTrialNow(
  locale: string,
  table: PartnerTable,
  id: string
): Promise<{ ok: boolean; error?: string }> {
  if (!PARTNER_TABLES.includes(table)) return { ok: false, error: "Invalid table." };

  const supabase = await assertOwner();
  const now = new Date().toISOString();

  let error = null;
  switch (table) {
    case "hotels":
      ({ error } = await supabase.from("hotels").update({ trial_expires_at: now } as never).eq("id", id));
      break;
    case "restaurants":
      ({ error } = await supabase.from("restaurants").update({ trial_expires_at: now } as never).eq("id", id));
      break;
    case "cafes":
      ({ error } = await supabase.from("cafes").update({ trial_expires_at: now } as never).eq("id", id));
      break;
  }

  if (error) return { ok: false, error: error.message };

  await logActivity("update", "trial_expired", id, { table });
  revalidatePath(`/${locale}/admin/partners`);
  return { ok: true };
}
