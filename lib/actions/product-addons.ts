"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ProductListingType } from "@/lib/actions/products";

const LISTING_TABLE: Record<ProductListingType, "city_services" | "services" | "cafes" | "restaurants"> = {
  city_service: "city_services",
  service: "services",
  cafe: "cafes",
  restaurant: "restaurants",
};

/** Same ownership chain as assertCanManageProductOption, checked directly
 * against a group's own listing_type/listing_id (a group isn't attached to
 * one product, so there's no product to hop through) — RLS on addon_groups/
 * product_addons/product_addon_groups enforces the identical chain
 * server-side as the authoritative gate (see supabase/migrations/
 * 20260907000017_addon_groups_and_village_side_dishes.sql). */
async function assertCanManageListing(listingType: ProductListingType, listingId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role;

  if (role === "owner") return supabase;

  if (role === "business_owner") {
    const table = LISTING_TABLE[listingType];
    const { data: listing } = await supabase.from(table).select("owner_id").eq("id", listingId).single();
    if ((listing as { owner_id: string | null } | null)?.owner_id === user.id) return supabase;
  }

  throw new Error("Not authorized.");
}

/** Add-ons owned directly by one product_id (no group) authorize the same
 * way ProductOptionsManager's options do — one hop through the product to
 * its listing. Reused for the create/update/delete of a single, ungrouped
 * add-on. */
async function assertCanManageProductAddon(productId: string) {
  const supabase = await createClient();
  const { data: product } = await supabase.from("products").select("listing_type, listing_id").eq("id", productId).single();
  const listingType = (product as { listing_type: ProductListingType; listing_id: string } | null)?.listing_type;
  const listingId = (product as { listing_type: ProductListingType; listing_id: string } | null)?.listing_id;
  if (!listingType || !listingId) throw new Error("Product not found.");
  return assertCanManageListing(listingType, listingId);
}

export interface AddonGroupInput {
  name: string;
  nameAr?: string;
  nameSo?: string;
  sortOrder: number;
}

export interface ProductAddonInput {
  name: string;
  nameAr?: string;
  nameSo?: string;
  price: number;
  isTaxable: boolean;
  isActive: boolean;
  sortOrder: number;
}

export async function createAddonGroup(
  listingType: ProductListingType,
  listingId: string,
  input: AddonGroupInput,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string; id?: string }> {
  const supabase = await assertCanManageListing(listingType, listingId);

  const { data, error } = await supabase
    .from("addon_groups")
    .insert({
      listing_type: listingType,
      listing_id: listingId,
      name: input.name.trim(),
      name_ar: input.nameAr?.trim() || null,
      name_so: input.nameSo?.trim() || null,
      sort_order: input.sortOrder ?? 0,
    } as never)
    .select("id")
    .single();
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true, id: (data as { id: string }).id };
}

export async function updateAddonGroup(
  groupId: string,
  listingType: ProductListingType,
  listingId: string,
  input: AddonGroupInput,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageListing(listingType, listingId);

  const { error } = await supabase
    .from("addon_groups")
    .update({
      name: input.name.trim(),
      name_ar: input.nameAr?.trim() || null,
      name_so: input.nameSo?.trim() || null,
      sort_order: input.sortOrder ?? 0,
    } as never)
    .eq("id", groupId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

/** Deletes the group and (via `on delete cascade`) every add-on owned by it
 * and every product assignment referencing it. Does not touch any order —
 * order_items.addons is a snapshot taken at order time, never a live
 * reference to this table. */
export async function deleteAddonGroup(
  groupId: string,
  listingType: ProductListingType,
  listingId: string,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageListing(listingType, listingId);

  const { error } = await supabase.from("addon_groups").delete().eq("id", groupId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function createGroupAddon(
  groupId: string,
  listingType: ProductListingType,
  listingId: string,
  input: ProductAddonInput,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageListing(listingType, listingId);

  const { error } = await supabase.from("product_addons").insert({
    group_id: groupId,
    name: input.name.trim(),
    name_ar: input.nameAr?.trim() || null,
    name_so: input.nameSo?.trim() || null,
    price: input.price || 0,
    is_taxable: input.isTaxable,
    is_active: input.isActive,
    sort_order: input.sortOrder ?? 0,
  } as never);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function updateGroupAddon(
  addonId: string,
  listingType: ProductListingType,
  listingId: string,
  input: ProductAddonInput,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageListing(listingType, listingId);

  const { error } = await supabase
    .from("product_addons")
    .update({
      name: input.name.trim(),
      name_ar: input.nameAr?.trim() || null,
      name_so: input.nameSo?.trim() || null,
      price: input.price || 0,
      is_taxable: input.isTaxable,
      is_active: input.isActive,
      sort_order: input.sortOrder ?? 0,
    } as never)
    .eq("id", addonId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function deleteGroupAddon(
  addonId: string,
  listingType: ProductListingType,
  listingId: string,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageListing(listingType, listingId);

  const { error } = await supabase.from("product_addons").delete().eq("id", addonId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

/** Toggles whether `group` applies to `productId` — the only write this
 * file does that authorizes via a product_id instead of a listing directly,
 * since the assignment row itself only makes sense in the context of one
 * product. */
export async function setGroupAssignedToProduct(
  productId: string,
  groupId: string,
  assigned: boolean,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageProductAddon(productId);

  if (assigned) {
    const { error } = await supabase.from("product_addon_groups").insert({ product_id: productId, group_id: groupId } as never);
    if (error && !error.message.includes("duplicate key")) return { ok: false, error: error.message };
  } else {
    const { error } = await supabase.from("product_addon_groups").delete().eq("product_id", productId).eq("group_id", groupId);
    if (error) return { ok: false, error: error.message };
  }

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function createProductAddon(
  productId: string,
  input: ProductAddonInput,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageProductAddon(productId);

  const { error } = await supabase.from("product_addons").insert({
    product_id: productId,
    name: input.name.trim(),
    name_ar: input.nameAr?.trim() || null,
    name_so: input.nameSo?.trim() || null,
    price: input.price || 0,
    is_taxable: input.isTaxable,
    is_active: input.isActive,
    sort_order: input.sortOrder ?? 0,
  } as never);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}
