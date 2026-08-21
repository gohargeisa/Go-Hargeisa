"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { hasBusinessGrantPermission } from "@/lib/data/access-control";
import type { ProductCategory, ProductGender, GalleryImage, OrderableListingType } from "@/types";

export interface ProductInput {
  name: string;
  nameAr?: string;
  nameSo?: string;
  description?: string;
  descriptionAr?: string;
  descriptionSo?: string;
  brand?: string;
  category?: ProductCategory;
  gender?: ProductGender;
  price?: number;
  currency: string;
  image?: string;
  gallery: GalleryImage[];
  isAvailable: boolean;
  isFeatured: boolean;
  isHidden: boolean;
  sortOrder?: number;
  /** Free-text size/variant descriptor (e.g. "50ml", "Large", "Set of 3") — optional, most products won't need it. */
  size?: string;
}

export type ProductListingType = OrderableListingType;

const LISTING_TABLE: Record<ProductListingType, "city_services" | "services" | "cafes" | "restaurants"> = {
  city_service: "city_services",
  service: "services",
  cafe: "cafes",
  restaurant: "restaurants",
};

/**
 * Products authorize via their PARENT listing's owner_id, not a column of
 * their own — same shape as lib/actions/hotel-rooms.ts's
 * assertCanManageRoom (hotels.owner_id) and lib/actions/city-services.ts's
 * assertCanEditCityService. RLS on `products` mirrors this same check
 * server-side as the authoritative gate. `listingType` picks which parent
 * table owns the listing — any OrderableListingType.
 */
async function assertCanManageProduct(listingId: string, listingType: ProductListingType) {
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

  if (await hasBusinessGrantPermission(user.id, listingType, listingId, "businesses_edit")) return supabase;

  throw new Error("Not authorized.");
}

function toPayload(input: ProductInput, listingId: string, listingType: ProductListingType) {
  return {
    listing_type: listingType,
    listing_id: listingId,
    name: input.name.trim(),
    name_ar: input.nameAr?.trim() || null,
    name_so: input.nameSo?.trim() || null,
    description: input.description?.trim() || null,
    description_ar: input.descriptionAr?.trim() || null,
    description_so: input.descriptionSo?.trim() || null,
    brand: input.brand?.trim() || null,
    category: input.category ?? null,
    gender: input.gender ?? null,
    price: input.price ?? null,
    currency: input.currency || "USD",
    image: input.image || null,
    gallery: input.gallery,
    is_available: input.isAvailable,
    is_featured: input.isFeatured,
    is_hidden: input.isHidden,
    sort_order: input.sortOrder ?? 0,
    size: input.size?.trim() || null,
  };
}

export async function createProduct(
  listingId: string,
  input: ProductInput,
  revalidatePaths: string[],
  listingType: ProductListingType = "city_service"
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageProduct(listingId, listingType);

  const { error } = await supabase.from("products").insert(toPayload(input, listingId, listingType) as never);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function updateProduct(
  productId: string,
  listingId: string,
  input: ProductInput,
  revalidatePaths: string[],
  listingType: ProductListingType = "city_service"
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageProduct(listingId, listingType);

  const { error } = await supabase
    .from("products")
    .update({ ...toPayload(input, listingId, listingType), updated_at: new Date().toISOString() } as never)
    .eq("id", productId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}

export async function deleteProduct(
  productId: string,
  listingId: string,
  revalidatePaths: string[],
  listingType: ProductListingType = "city_service"
): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertCanManageProduct(listingId, listingType);

  const { error } = await supabase.from("products").delete().eq("id", productId);
  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) revalidatePath(path);
  return { ok: true };
}
