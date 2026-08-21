"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ProductOption, ProductOptionChoice } from "@/types";
import type { ProductListingType } from "@/lib/actions/products";

export interface ProductOptionInput {
  key: string;
  label: string;
  labelAr?: string;
  labelSo?: string;
  type: ProductOption["type"];
  required: boolean;
  priceDelta: number;
  choices: ProductOptionChoice[];
  placeholder?: string;
  maxLength?: number;
  sortOrder: number;
}

const LISTING_TABLE: Record<ProductListingType, "city_services" | "services" | "cafes" | "restaurants"> = {
  city_service: "city_services",
  service: "services",
  cafe: "cafes",
  restaurant: "restaurants",
};

/**
 * Options authorize via their grandparent listing's owner_id — one hop
 * further than assertCanManageProduct in lib/actions/products.ts (which
 * this mirrors), since an option only ever has a product_id, never its own
 * listing reference. RLS on `product_options` enforces the identical chain
 * server-side as the authoritative gate (see
 * 20260829000001_product_options.sql).
 */
async function assertCanManageProductOption(productId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: product } = await supabase.from("products").select("listing_type, listing_id").eq("id", productId).single();
  const listingType = (product as { listing_type: ProductListingType; listing_id: string } | null)?.listing_type;
  const listingId = (product as { listing_type: ProductListingType; listing_id: string } | null)?.listing_id;
  if (!listingType || !listingId) throw new Error("Product not found.");

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

function toPayload(productId: string, input: ProductOptionInput) {
  return {
    product_id: productId,
    key: input.key.trim(),
    label: input.label.trim(),
    label_ar: input.labelAr?.trim() || null,
    label_so: input.labelSo?.trim() || null,
    type: input.type,
    required: input.required,
    price_delta: input.priceDelta || 0,
    choices: input.choices,
    placeholder: input.placeholder?.trim() || null,
    max_length: input.maxLength ?? null,
    sort_order: input.sortOrder ?? 0,
  };
}

export async function createProductOption(
  productId: string,
  input: ProductOptionInput,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageProductOption(productId);

  const { error } = await supabase.from("product_options").insert(toPayload(productId, input) as never);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function updateProductOption(
  optionId: string,
  productId: string,
  input: ProductOptionInput,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageProductOption(productId);

  const { error } = await supabase.from("product_options").update(toPayload(productId, input) as never).eq("id", optionId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function deleteProductOption(
  optionId: string,
  productId: string,
  revalidatePaths: string[]
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageProductOption(productId);

  const { error } = await supabase.from("product_options").delete().eq("id", optionId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}
