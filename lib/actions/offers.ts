"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { assertCanManageListing } from "./business";
import type { OfferDiscountType, OfferApprovalStatus } from "@/types";

async function assertAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as { role: string } | null)?.role !== "owner") throw new Error("Not authorized.");

  return supabase;
}

export interface OfferInput {
  title: string;
  description?: string;
  discountType: OfferDiscountType;
  discountValue?: number;
  couponCode?: string;
  coverImage?: string;
  startsAt?: string;
  endsAt?: string;
  isActive: boolean;
}

function offerPayload(input: OfferInput) {
  return {
    title: input.title.trim(),
    description: input.description?.trim() || null,
    discount_type: input.discountType,
    discount_value: input.discountValue ?? null,
    coupon_code: input.couponCode?.trim() || null,
    cover_image: input.coverImage || null,
    starts_at: input.startsAt || null,
    ends_at: input.endsAt || null,
    is_active: input.isActive,
  };
}

function validateOffer(input: OfferInput): string | null {
  if (!input.title.trim()) return "A title is required.";
  if (input.discountValue !== undefined) {
    if (!Number.isFinite(input.discountValue) || input.discountValue < 0) return "Enter a valid discount amount.";
    if (input.discountType === "percentage" && input.discountValue > 100) return "A percentage discount can't exceed 100.";
  }
  if (input.startsAt && input.endsAt && input.startsAt > input.endsAt) return "The end date must be after the start date.";
  return null;
}

/** New offers always start "pending" — every offer, new or edited, needs
 * admin approval before it can appear on the public site (see the RLS
 * policy in 20260801000004_offers_moderation.sql, which requires
 * approval_status = 'approved' in addition to is_active). */
export async function createOffer(
  listingType: "hotel" | "restaurant" | "cafe",
  listingId: string,
  input: OfferInput,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const validationError = validateOffer(input);
  if (validationError) return { ok: false, error: validationError };
  const supabase = await assertCanManageListing(listingType, listingId, "businesses_edit");

  const { error } = await supabase.from("business_offers").insert({
    listing_type: listingType,
    listing_id: listingId,
    approval_status: "pending",
    ...offerPayload(input),
  } as never);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

/** Editing an already-approved offer's content resets it to "pending" —
 * moderation covers what's actually live, not just what was first
 * submitted. Toggling is_active on its own (toggleOfferActive) doesn't
 * touch approval, since that's just pausing/resuming already-approved
 * content rather than changing it. */
export async function updateOffer(
  offerId: string,
  listingType: "hotel" | "restaurant" | "cafe",
  listingId: string,
  input: OfferInput,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const validationError = validateOffer(input);
  if (validationError) return { ok: false, error: validationError };
  const supabase = await assertCanManageListing(listingType, listingId, "businesses_edit");

  const { error } = await supabase
    .from("business_offers")
    .update({
      ...offerPayload(input),
      approval_status: "pending",
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", offerId)
    .eq("listing_type", listingType)
    .eq("listing_id", listingId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function toggleOfferActive(
  offerId: string,
  listingType: "hotel" | "restaurant" | "cafe",
  listingId: string,
  isActive: boolean,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageListing(listingType, listingId, "businesses_edit");

  const { error } = await supabase
    .from("business_offers")
    .update({ is_active: isActive, updated_at: new Date().toISOString() } as never)
    .eq("id", offerId)
    .eq("listing_type", listingType)
    .eq("listing_id", listingId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function deleteOffer(
  offerId: string,
  listingType: "hotel" | "restaurant" | "cafe",
  listingId: string,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageListing(listingType, listingId, "businesses_edit");

  const { error } = await supabase
    .from("business_offers")
    .delete()
    .eq("id", offerId)
    .eq("listing_type", listingType)
    .eq("listing_id", listingId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

/** Admin-only (role = 'owner', this codebase's platform-admin role) —
 * approve/reject an offer. Rejecting never deletes it: the owner keeps
 * their draft and can edit + resubmit (which flips it back to pending). */
export async function moderateOffer(
  offerId: string,
  decision: Extract<OfferApprovalStatus, "approved" | "rejected">,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertAdmin();

  const { error } = await supabase
    .from("business_offers")
    .update({ approval_status: decision, updated_at: new Date().toISOString() } as never)
    .eq("id", offerId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

/** Admin-only — feature an approved offer on the homepage. */
export async function toggleOfferFeatured(
  offerId: string,
  featured: boolean,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertAdmin();

  const { error } = await supabase
    .from("business_offers")
    .update({ featured, updated_at: new Date().toISOString() } as never)
    .eq("id", offerId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}
