"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Locale } from "@/lib/i18n/config";

/**
 * Owner-only loyalty admin writes. RLS ("Platform owner manages staff",
 * "Platform owner manages programs") independently enforces the same rule,
 * so the check here is belt-and-suspenders. Scoped to what Phase 8 needs:
 * loyalty-staff management + the program on/off switch. Rewards / tiers /
 * offers editing is the full Loyalty admin (Phase 9), not here.
 */

type Result = { ok: true } | { ok: false; error: string };

async function assertOwner() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not signed in.");
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if ((profile as { role?: string } | null)?.role !== "owner") throw new Error("Not authorized.");
  return { supabase, ownerId: user.id };
}

function adminPath(locale: Locale) {
  return `/${locale}/admin/loyalty`;
}

export async function addLoyaltyStaffAction(
  programId: string,
  userId: string,
  role: "staff" | "manager",
  locale: Locale
): Promise<Result> {
  try {
    const { supabase, ownerId } = await assertOwner();
    // Upsert on the (program_id, user_id) unique constraint — re-adding an
    // existing staff member just updates their role and reactivates them.
    const { error } = await supabase
      .from("loyalty_staff")
      .upsert(
        { program_id: programId, user_id: userId, role, active: true, created_by: ownerId },
        { onConflict: "program_id,user_id" }
      );
    if (error) return { ok: false, error: error.message };
    revalidatePath(adminPath(locale));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function setLoyaltyStaffActiveAction(
  staffId: string,
  active: boolean,
  locale: Locale
): Promise<Result> {
  try {
    const { supabase } = await assertOwner();
    const { error } = await supabase.from("loyalty_staff").update({ active }).eq("id", staffId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(adminPath(locale));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function removeLoyaltyStaffAction(staffId: string, locale: Locale): Promise<Result> {
  try {
    const { supabase } = await assertOwner();
    const { error } = await supabase.from("loyalty_staff").delete().eq("id", staffId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(adminPath(locale));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function setLoyaltyProgramEnabledAction(
  programId: string,
  enabled: boolean,
  locale: Locale
): Promise<Result> {
  try {
    const { supabase } = await assertOwner();
    const { error } = await supabase
      .from("loyalty_programs")
      .update({ enabled })
      .eq("id", programId);
    if (error) return { ok: false, error: error.message };
    revalidatePath(adminPath(locale));
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}
