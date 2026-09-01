import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/is-configured";
import { mapLoyaltyProgram } from "@/lib/loyalty/mappers";
import type { LoyaltyProgram } from "@/lib/loyalty/types";

/**
 * Admin (platform-owner) read layer for loyalty. Every read here is gated by
 * the existing RLS ("Platform owner manages …") + the SECURITY DEFINER
 * `loyalty_program_metrics()` — this file adds no new authorization of its
 * own. The page still calls `requireOwner()` first.
 */

export interface LoyaltyProgramMetrics {
  total_members: number;
  active_members: number;
  points_issued: number;
  points_redeemed: number;
  rewards_redeemed: number;
  purchases_recorded: number;
  points_outstanding: number;
  top_members: { membership_number: string; name: string | null; current_points: number; lifetime_points: number }[];
  top_rewards: { name: string | null; redemptions: number }[];
}

export interface LoyaltyStaffRow {
  id: string;
  userId: string;
  name: string;
  role: "staff" | "manager";
  active: boolean;
  createdAt: string;
}

export interface LoyaltyAdminProgram {
  program: LoyaltyProgram;
  listing: { slug: string; name: string; logoUrl: string | null } | null;
  metrics: LoyaltyProgramMetrics | null;
  staff: LoyaltyStaffRow[];
}

const EMPTY_METRICS: LoyaltyProgramMetrics = {
  total_members: 0,
  active_members: 0,
  points_issued: 0,
  points_redeemed: 0,
  rewards_redeemed: 0,
  purchases_recorded: 0,
  points_outstanding: 0,
  top_members: [],
  top_rewards: [],
};

export async function getLoyaltyAdminOverview(): Promise<LoyaltyAdminProgram[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();

  const { data: programRows } = await supabase
    .from("loyalty_programs")
    .select("*")
    .order("created_at", { ascending: true });
  const programs = (programRows ?? []).map(mapLoyaltyProgram);
  if (programs.length === 0) return [];

  // Listing identities (city_service only today).
  const cityServiceIds = programs.filter((p) => p.listingType === "city_service").map((p) => p.listingId);
  const listingById = new Map<string, { slug: string; name: string; logoUrl: string | null }>();
  if (cityServiceIds.length > 0) {
    const { data: listings } = await supabase
      .from("city_services")
      .select("id, slug, name, logo_url")
      .in("id", cityServiceIds);
    for (const l of listings ?? []) {
      listingById.set(l.id as string, {
        slug: l.slug as string,
        name: l.name as string,
        logoUrl: (l.logo_url as string | null) ?? null,
      });
    }
  }

  const out: LoyaltyAdminProgram[] = [];
  for (const program of programs) {
    const [{ data: metrics }, { data: staffRows }] = await Promise.all([
      supabase.rpc("loyalty_program_metrics", { p_program_id: program.id }),
      supabase
        .from("loyalty_staff")
        .select("id, user_id, role, active, created_at")
        .eq("program_id", program.id)
        .order("created_at", { ascending: true }),
    ]);

    // Names looked up separately — loyalty_staff has two FKs to profiles
    // (user_id, created_by), so a PostgREST embed would need a fragile
    // constraint-name hint.
    const staffUserIds = [...new Set((staffRows ?? []).map((r) => r.user_id as string))];
    const nameById = new Map<string, string>();
    if (staffUserIds.length > 0) {
      const { data: names } = await supabase.from("profiles").select("id, full_name").in("id", staffUserIds);
      for (const n of names ?? []) nameById.set(n.id as string, (n.full_name as string) || "—");
    }

    const staff: LoyaltyStaffRow[] = (staffRows ?? []).map((r: Record<string, unknown>) => ({
      id: r.id as string,
      userId: r.user_id as string,
      name: nameById.get(r.user_id as string) ?? "—",
      role: (r.role as "staff" | "manager") ?? "staff",
      active: r.active === true,
      createdAt: r.created_at as string,
    }));

    out.push({
      program,
      listing: listingById.get(program.listingId) ?? null,
      metrics: (metrics as LoyaltyProgramMetrics | null) ?? EMPTY_METRICS,
      staff,
    });
  }
  return out;
}
