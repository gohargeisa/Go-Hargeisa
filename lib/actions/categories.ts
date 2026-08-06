"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { CategoryTargetTable } from "@/types";
import { logActivity } from "./activity";

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

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function revalidateCategoryPaths(locale: string) {
  revalidatePath(`/${locale}/admin/categories`);
  revalidatePath(`/${locale}`);
  revalidatePath(`/${locale}/services`, "layout");
}

export interface CategoryInput {
  slug?: string;
  name: string;
  nameAr?: string;
  nameSo?: string;
  description?: string;
  descriptionAr?: string;
  descriptionSo?: string;
  icon: string;
  color?: string;
  targetTable: CategoryTargetTable;
  isActive: boolean;
  isPinned: boolean;
  sortOrder: number;
  searchKeywords: string[];
}

export async function createCategory(locale: string, input: CategoryInput): Promise<{ ok: boolean; error?: string; id?: string }> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Name is required." };
  const slug = slugify(input.slug || name);
  if (!slug) return { ok: false, error: "Slug is required." };

  const supabase = await assertOwner();

  const { data, error } = await supabase
    .from("categories")
    .insert({
      slug,
      name,
      name_ar: input.nameAr?.trim() || null,
      name_so: input.nameSo?.trim() || null,
      description: input.description?.trim() || null,
      description_ar: input.descriptionAr?.trim() || null,
      description_so: input.descriptionSo?.trim() || null,
      icon: input.icon.trim() || "Building2",
      color: input.color?.trim() || null,
      target_table: input.targetTable,
      is_active: input.isActive,
      is_pinned: input.isPinned,
      sort_order: input.sortOrder,
      search_keywords: input.searchKeywords,
    } as never)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return { ok: false, error: "A category with that slug already exists." };
    return { ok: false, error: error.message };
  }

  await logActivity("create", "category", data.id);
  revalidateCategoryPaths(locale);
  return { ok: true, id: data.id };
}

export async function updateCategory(locale: string, id: string, input: CategoryInput): Promise<{ ok: boolean; error?: string }> {
  const name = input.name.trim();
  if (!name) return { ok: false, error: "Name is required." };
  const slug = slugify(input.slug || name);
  if (!slug) return { ok: false, error: "Slug is required." };

  const supabase = await assertOwner();

  const { error } = await supabase
    .from("categories")
    .update({
      slug,
      name,
      name_ar: input.nameAr?.trim() || null,
      name_so: input.nameSo?.trim() || null,
      description: input.description?.trim() || null,
      description_ar: input.descriptionAr?.trim() || null,
      description_so: input.descriptionSo?.trim() || null,
      icon: input.icon.trim() || "Building2",
      color: input.color?.trim() || null,
      target_table: input.targetTable,
      is_active: input.isActive,
      is_pinned: input.isPinned,
      sort_order: input.sortOrder,
      search_keywords: input.searchKeywords,
      updated_at: new Date().toISOString(),
    } as never)
    .eq("id", id);

  if (error) {
    if (error.code === "23505") return { ok: false, error: "A category with that slug already exists." };
    return { ok: false, error: error.message };
  }

  await logActivity("update", "category", id);
  revalidateCategoryPaths(locale);
  return { ok: true };
}

export async function setCategoryActive(locale: string, id: string, isActive: boolean): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertOwner();
  const { error } = await supabase
    .from("categories")
    .update({ is_active: isActive, updated_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logActivity("update", "category", id, { is_active: isActive });
  revalidateCategoryPaths(locale);
  return { ok: true };
}

export async function setCategoryPinned(locale: string, id: string, isPinned: boolean): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertOwner();
  const { error } = await supabase
    .from("categories")
    .update({ is_pinned: isPinned, updated_at: new Date().toISOString() } as never)
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logActivity("update", "category", id, { is_pinned: isPinned });
  revalidateCategoryPaths(locale);
  return { ok: true };
}

/** Persists a full reordering in one round trip — `orderedIds` is the new
 * top-to-bottom order, so index becomes the new sort_order. */
export async function reorderCategories(locale: string, orderedIds: string[]): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertOwner();

  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from("categories")
        .update({ sort_order: index, updated_at: new Date().toISOString() } as never)
        .eq("id", id)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) return { ok: false, error: failed.error.message };

  revalidateCategoryPaths(locale);
  return { ok: true };
}

export async function deleteCategory(locale: string, id: string): Promise<{ ok: boolean; error?: string }> {
  const supabase = await assertOwner();

  const { data: category } = await supabase.from("categories").select("target_table").eq("id", id).single();
  if (category?.target_table === "services") {
    const { count } = await supabase.from("services").select("id", { count: "exact", head: true }).eq("category_id", id);
    if (count && count > 0) {
      return { ok: false, error: `Can't delete — ${count} service listing(s) still use this category. Reassign or delete them first.` };
    }
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  await logActivity("delete", "category", id);
  revalidateCategoryPaths(locale);
  return { ok: true };
}
