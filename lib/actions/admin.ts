"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TABLES = ["hotels", "restaurants", "cafes", "attractions", "events", "articles"] as const;
export type AllowedTable = (typeof ALLOWED_TABLES)[number];

const TABLES_WITH_UPDATED_AT = new Set(["hotels", "restaurants", "cafes", "attractions"]);

// Business owners may only ever touch these three tables — matches the
// "Owners manage their {hotels,restaurants,cafes}" RLS policies in
// supabase/schema.sql, which are UPDATE-only (no insert/delete) and
// scoped to rows where owner_id = auth.uid(). Attractions/events/articles
// and every table's create/delete stay owner-only.
const BUSINESS_OWNER_TABLES = new Set<AllowedTable>(["hotels", "restaurants", "cafes"]);

async function assertOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase
  .from("profiles")
  .select("role")
  .eq("id", user.id)
  .single();

const userProfile = profile as { role: string } | null;

if (userProfile?.role !== "owner") {
  throw new Error("Not authorized.");
}


  return supabase;
}

/**
 * Same door as assertOwner, but also lets a business_owner through for
 * the three tables they're allowed to edit. This only decides whether the
 * request is allowed to reach the database — RLS (owner_id = auth.uid())
 * is what actually stops a business_owner from touching a listing they
 * don't own, so it stays authoritative even if this check is ever wrong.
 */
async function assertOwnerOrBusinessOwner(table: AllowedTable) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  const role = (profile as { role: string } | null)?.role;

  if (role === "owner") return supabase;
  if (role === "business_owner" && BUSINESS_OWNER_TABLES.has(table)) return supabase;

  throw new Error("Not authorized.");
}

export async function deleteListing(
  table: AllowedTable,
  id: string,
  revalidate: string
) {
  if (!ALLOWED_TABLES.includes(table)) {
    throw new Error("Invalid table.");
  }

  const supabase = await assertOwner();

  let error = null;

  switch (table) {
    case "hotels":
      ({ error } = await supabase.from("hotels").delete().eq("id", id));
      break;
    case "restaurants":
      ({ error } = await supabase.from("restaurants").delete().eq("id", id));
      break;
    case "cafes":
      ({ error } = await supabase.from("cafes").delete().eq("id", id));
      break;
    case "attractions":
      ({ error } = await supabase.from("attractions").delete().eq("id", id));
      break;
    case "events":
      ({ error } = await supabase.from("events").delete().eq("id", id));
      break;
    case "articles":
      ({ error } = await supabase.from("articles").delete().eq("id", id));
      break;
  }

  if (error) return { ok: false, error: error.message };

  revalidatePath(revalidate);
  return { ok: true };
}

/**
 * Generic insert used by every admin "create" form. `data` must already be
 * in snake_case matching the table's columns (see supabase/schema.sql) —
 * each entity's action wrapper (createHotel, createRestaurant, ...) is
 * responsible for that mapping so this function stays table-agnostic.
 */
export async function createRecord(
  table: AllowedTable,
  data: Record<string, unknown>,
  revalidatePaths: string[],
  redirectTo: string
) {
  if (!ALLOWED_TABLES.includes(table)) {
    throw new Error("Invalid table.");
  }

  const supabase = await assertOwner();

  const payload = {
    ...data,
    status: "published",
  };

  let error = null;

  switch (table) {
    case "hotels":
      ({ error } = await supabase.from("hotels").insert(payload as never));
      break;
    case "restaurants":
      ({ error } = await supabase.from("restaurants").insert(payload as never));
      break;
    case "cafes":
      ({ error } = await supabase.from("cafes").insert(payload as never));
      break;
    case "attractions":
      ({ error } = await supabase.from("attractions").insert(payload as never));
      break;
    case "events":
      ({ error } = await supabase.from("events").insert(payload as never));
      break;
    case "articles":
      ({ error } = await supabase.from("articles").insert(payload as never));
      break;
  }

  if (error) return { ok: false, error: error.message };

  for (const path of revalidatePaths) {
    revalidatePath(path);
  }

  redirect(redirectTo);
}

/** Generic update used by every admin "edit" form — same contract as createRecord. */
export async function updateRecord(
  table: AllowedTable,
  id: string,
  data: Record<string, unknown>,
  revalidatePaths: string[],
  redirectTo: string
) {
  if (!ALLOWED_TABLES.includes(table)) {
    throw new Error("Invalid table.");
  }

  const supabase = await assertOwnerOrBusinessOwner(table);

  const payload = TABLES_WITH_UPDATED_AT.has(table)
    ? {
        ...data,
        updated_at: new Date().toISOString(),
      }
    : data;

  let error = null;

  switch (table) {
    case "hotels":
      ({ error } = await supabase.from("hotels").update(payload as never).eq("id", id));
      break;
    case "restaurants":
      ({ error } = await supabase.from("restaurants").update(payload as never).eq("id", id));
      break;
    case "cafes":
      ({ error } = await supabase.from("cafes").update(payload as never).eq("id", id));
      break;
    case "attractions":
      ({ error } = await supabase.from("attractions").update(payload as never).eq("id", id));
      break;
    case "events":
      ({ error } = await supabase.from("events").update(payload as never).eq("id", id));
      break;
    case "articles":
      ({ error } = await supabase.from("articles").update(payload as never).eq("id", id));
      break;
  }

  if (error) {
    return { ok: false, error: error.message };
  }

  for (const path of revalidatePaths) {
    revalidatePath(path);
  }

  redirect(redirectTo);
}
